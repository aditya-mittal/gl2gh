#!/usr/bin/env node

const { Command } = require('commander');
const config = require('config');
const Migrate = require('./migrate.js');

const migrate = new Migrate();

program = new Command();

program
  .command('list <gitlab-group-name>')
  .description('List all projects under the GitLab group')
  .option('-n, --number <integer>', 'List projects in group of n', 10)
  .option('--starts-with <prefix>', 'List of projects starting with specified prefix', '')
  .option('--output <type>', 'Specify output type like text or json', 'json')
  .description('List projects under GitLab group')
  .action(async (gitlabGroupName, cmdObj) => {
    await listProjects(gitlabGroupName, cmdObj.number, cmdObj.startsWith, cmdObj.output)
  });

program.command('copy-content <gitlab-group-name> <github-org-name>')
  .description('Copy content of repositories from GitLab to GitHub')
  .option('--starts-with <prefix>', 'Filter projects starting with specified prefix', '')
  .action( async (gitlabGroupName, githubOrgName, cmdObj) => {
    await copyContent(gitlabGroupName, githubOrgName, cmdObj.startsWith);
  });

program.parse(process.argv);

async function listProjects(gitlabGroupName, numberOfProjects, projectNameFilter, outputType) {
  try {
    let projects = await migrate.getListOfAllProjectsToMigrate(gitlabGroupName, projectNameFilter);
    printProjectsOnConsole(projects, numberOfProjects, outputType);
  } catch(error) {
    console.error(error.message)
  }
}

async function copyContent(gitlabGroupName, githubOrgName, projectNameFilter) {
  migrate.copyContentFromGitlabToGithub(gitlabGroupName, githubOrgName, projectNameFilter)
        .catch((err) => console.error(err.message))
}

function printProjectsOnConsole(projects, numberOfProjectsPerResult, outputType) {
  projects.forEach((project, index) => {
    if(outputType === 'text') {
      if(index!==0 && index%numberOfProjectsPerResult === 0)
        console.info('-----------------------------Next Results-----------------------------------')
      console.info(project.toString())
    } else {
      console.info(JSON.stringify(project))
    }
  });
}