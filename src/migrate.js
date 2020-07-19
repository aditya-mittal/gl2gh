const path = require('path');
const _ = require('lodash');
const config = require('config');

const GitlabClient = require('./gitlab/client.js');
const GithubClient = require('./github/client.js');
const GitClient = require('./gitClient.js');
const GithubBranchProtectionRule = require('./github/model/branchProtectionRule.js');

function Migrate() {
	const gitClient = new GitClient(config.get('gl2gh.gitlab.username'), config.get('gl2gh.gitlab.token'), config.get('gl2gh.github.token'));
	const gitlabClient = new GitlabClient(config.get('gl2gh.gitlab.url'), config.get('gl2gh.gitlab.token'));
	const githubClient = new GithubClient(config.get('gl2gh.github.url'), config.get('gl2gh.github.token'));

	this.migrateToGithub = async function(gitlabGroupName) {
		let projects = [];
		try {
			projects.push(... await _getProjectsWithinGroup(gitlabGroupName));
			projects.push(... await _getProjectsForAllSubgroups(gitlabGroupName));
			projects.push(... await _getProjectsSharedWithGroup(gitlabGroupName));
			await _migrateProjectsToGithub(projects);
			return 0;
		} catch(error) {
			return 1;
		}
	};

	this.copyContentFromGitlabToGithub = async function(gitlabGroupName, githubOrgName, projectNameFilter = '') {
		try {
			let projects = await this.getListOfAllProjectsToMigrate(gitlabGroupName, projectNameFilter);
			await _copyContentForProjects(projects, githubOrgName);
			return 0;
		} catch (error) {
			console.error(error);
			return 1;
		}
	};

	this.getListOfAllProjectsToMigrate = async function (gitlabGroupName, projectNameFilter) {
		let projects = [];
		try {
			projects.push(... await _getProjectsWithinGroup(gitlabGroupName));
			projects.push(... await _getProjectsForAllSubgroups(gitlabGroupName));
			projects.push(... await _getProjectsSharedWithGroup(gitlabGroupName));
			projects = _.sortBy(projects, 'name');
			projects = _filterProjectsWithPrefix(projects, projectNameFilter);
			return projects;
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	this.configureGithubBranchProtectionRule = function(owner, repoNames, branchName, rules) {
		return Promise.all(repoNames.map((repoName) => {
			return githubClient.configureBranchProtectionRule(owner, repoName, branchName, new GithubBranchProtectionRule(rules))
				.catch((error) => {
					console.error(error.message);
				});
		}));
	};

	this.archiveGitlabProject = function(projectPaths) {
		return Promise.all(projectPaths.map((projectPath) => {
			return gitlabClient.archiveProject(projectPath)
				.catch((error) => {
					console.error(error.message);
				});
		}));
	};

	var _migrateProjectsToGithub = function(projects, githubOrgName) {
		return _copyContentForProjects(projects, githubOrgName);
	};
	var _copyContentForProjects = async function(projects, githubOrgName) {
		const promises = projects.map(project => _copyContent(project, githubOrgName));
		return await Promise.all(promises)
			.catch((err) => console.error(err.message));
	};

	var _copyContent = function(project, githubOrgName) {
		return githubClient.createRepo(project.name, true, githubOrgName)
			.then((githubRepository) => _cloneAndPushToNewRemote(githubRepository, project));
	};

	var _getProjectsWithinGroup = async function(gitlabGroupName) {
		return gitlabClient.getGroup(gitlabGroupName)
			.then(group => group.getProjects());
	};

	var _getProjectsForAllSubgroups = async function(gitlabGroupName) {
		let subgroups = await gitlabClient.getSubgroups(gitlabGroupName);
		const promises = subgroups.map((subgroup) => {
			return _getProjectsForSubgroup(gitlabGroupName, subgroup.name);
		});
		let projectsForEachSubgroup = await Promise.all(promises);
		return [].concat(...projectsForEachSubgroup);
	};

	var _getProjectsForSubgroup = async function(gitlabGroupName, subgroupName) {
		return gitlabClient.getSubgroup(gitlabGroupName, subgroupName)
			.then(subgroupDetails => subgroupDetails.getProjects());
	};

	var _getProjectsSharedWithGroup = async function(gitlabGroupName) {
		return gitlabClient.getGroup(gitlabGroupName)
			.then(group => group.getSharedProjects());
	};

	var _cloneAndPushToNewRemote = async function(githubRepository, project) {
		const sourceRemoteName = 'gitlab';
		const destinationRemoteName = 'github';
		const pathToCloneRepo = path.join(process.cwd(), '/tmp','migrate', project.name);
		await gitClient.clone(project.http_url_to_repo, pathToCloneRepo, sourceRemoteName);
		await gitClient.addRemote(pathToCloneRepo, destinationRemoteName, githubRepository.clone_url);
		const branches = await gitClient.listBranches(pathToCloneRepo, sourceRemoteName);
		const promises = branches.map((branch) => {
			return gitClient.push(pathToCloneRepo, destinationRemoteName, branch)
				.catch((err) => {
					let msg = `Error pushing branch ${branch} of ${project.name}: ${err.message}`;
					console.warn(msg);
				});
		});
		return Promise.all(promises);
	};

	var _filterProjectsWithPrefix = function (projects, prefix) {
		return projects.filter(project => project.startsWith(prefix));
	};
}

module.exports = Migrate;