#!/usr/bin/env node

const { Command } = require('commander');
const yaml = require('js-yaml');
const config = require('config');
const fs   = require('fs');

const Migrate = require('./migrate.js');
const GitlabClient = require('./gitlab/client');


const migrate = new Migrate();
const program = new Command();
const gitlabClient = new GitlabClient(config.get('gl2gh.gitlab.url'), config.get('gl2gh.gitlab.token'));

program
	.command('list <gitlab-group-name>')
	.description('List all projects under the GitLab group')
	.option('-n, --number <integer>', 'List projects in group of n', 10)
	.option('--starts-with <prefix>', 'List of projects starting with specified prefix', '')
	.option('--output <type>', 'Specify output type like text or json', 'json')
	.description('List projects under GitLab group')
	.action(async (gitlabGroupName, cmdObj) => {
		await listProjects(gitlabGroupName, cmdObj.number, cmdObj.startsWith, cmdObj.output);
	});

program.command('copy-content <gitlab-group-name>')
	.description('Copy content of repositories from GitLab to GitHub')
	.option('--github-org <org_name>', 'GitHub Organisation Name')
	.option('--starts-with <prefix>', 'Filter projects starting with specified prefix', '')
	.action( async (gitlabGroupName, cmdObj) => {
		await migrate.copyContentFromGitlabToGithub(gitlabGroupName, cmdObj.githubOrg, cmdObj.startsWith)
			.catch((err) => console.error(err.message));
	});

program
	.command('protect-branch <github-org-name> <repo-name> <branch-name>')
	.description('Configure to protect branch of GitHub repo from direct pushes, rather expecting a pull request review')
	.option('-c, --config <branch_protection_config>', 'Config for branch protection rule on github', readYamlFile, readYamlFile('./config/templates/branchProtectionRuleTemplate.yml'))
	.action(async (githubOrgName, repoName, branchName, cmdObj) => {
		await migrate.configureBranchProtectionRule(githubOrgName, repoName, branchName, cmdObj.config.branchProtectionRule)
			.catch((err) => console.error(err.message));
	});

program
	.command('archive-repo <repo-path...>')
	.description('Archive project(s) on Gitlab.')
	.action(async (repoPaths) => {
		Promise.all(repoPaths.map((repoPath) => archiveGitlabRepo(repoPath)));
	});

program.parse(process.argv);

async function listProjects(gitlabGroupName, numberOfProjects, projectNameFilter, outputType) {
	try {
		let projects = await migrate.getListOfAllProjectsToMigrate(gitlabGroupName, projectNameFilter);
		printProjectsOnConsole(projects, numberOfProjects, outputType);
	} catch(error) {
		console.error(error.message);
	}
}

async function archiveGitlabRepo(repoPath) {
	try {
		const response = await gitlabClient.archiveRepo(repoPath);
		if (response.archived) {
			console.info(`Project archived : ${repoPath}`);
		} else {
			console.error(`Project archival failed for : ${repoPath}`);
		}
	}
	catch (error) {
		console.error(`Project archival failed for : ${repoPath}`);
	}
}

function printProjectsOnConsole(projects, numberOfProjectsPerResult, outputType) {
	projects.forEach((project, index) => {
		if(outputType === 'text') {
			if(index!==0 && index%numberOfProjectsPerResult === 0)
				console.info('-----------------------------Next Results-----------------------------------');
			console.info(project.toString());
		} else {
			console.info(JSON.stringify(project));
		}
	});
}

function readYamlFile(yamlFile) {
	return yaml.safeLoad(fs.readFileSync(yamlFile, 'utf8'));
}