#!/usr/bin/env node

const { Command } = require('commander');
const yaml = require('js-yaml');
const fs   = require('fs');

const Migrate = require('./migrate.js');

const migrate = new Migrate();
const program = new Command();

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
		await migrate.configureGithubBranchProtectionRule(githubOrgName, repoName, branchName, cmdObj.config.branchProtectionRule)
			.catch((err) => console.error(err.message));
	});

program
	.command('archive-project <project-path...>')
	.description('Archive project(s) on GitLab')
	.action(async (projectPaths) => {
		await migrate.archiveGitlabProject(projectPaths)
			.catch((err) => console.error(err.message));
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