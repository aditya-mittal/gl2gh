const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const yaml = require('js-yaml');
const fs   = require('fs');
const proxyquire =  require('proxyquire');

const GitlabProject = require('../../src/gitlab/model/project.js');
const Migrate = require('../../src/migrate.js');

describe('Tests for cli', () => {
	const migrate = new Migrate();
	let migrateStub;
	const originalLog = console.info;
	const originalErrorConsole = console.error;
	let consoleOutput = [];
	let consoleError = [];
	const mockedLog = output => consoleOutput.push(output);
	const mockedErrorLog = error => consoleError.push(error);
	beforeEach(() => {
		console.info = mockedLog;
		console.error = mockedErrorLog;
	});
	afterEach(() => {
		consoleOutput = [];
		consoleError = [];
		console.info = originalLog;
		console.error = originalErrorConsole;
	});
	describe('List all repositories for a specific group in order', function () {
		let getListOfAllProjectsToMigrateStub;
		before(() => {
			migrateStub = sinon.stub(migrate, 'getListOfAllProjectsToMigrate');
			getListOfAllProjectsToMigrateStub = function StubMigrate() {
				this.getListOfAllProjectsToMigrate = migrateStub;
			};
		});
		after(() => {
			sinon.restore();
		});
		it('should list projects in json format for a specific GitLab group ordered alphabetically', async function () {
			//given
			const gitlabGroupName = 'FOO';
			const projectNameFilter = 'project';
			const project1 = new GitlabProject('project-1', 'description', 'https://gitlab.com/FOO/project-1.git');
			const project2 = new GitlabProject('project-2', 'description', 'https://gitlab.com/FOO/project-2.git');
			const project3 = new GitlabProject('project-3', 'description', 'https://gitlab.com/FOO/project-3.git');
			migrateStub.returns([project1, project2, project3]);
			//when
			process.argv = `node ../../src/cli.js list --starts-with ${projectNameFilter} ${gitlabGroupName}`.split(' ');
			await proxyquire('../../src/cli.js', { './migrate': getListOfAllProjectsToMigrateStub });
			//then
			sinon.assert.calledWith(migrateStub, gitlabGroupName, projectNameFilter);
			expect(consoleOutput).to.eql([JSON.stringify(project1), JSON.stringify(project2), JSON.stringify(project3)]);
		});
		it('should list projects in text format for a specific GitLab group ordered alphabetically', async function () {
			//given
			const gitlabGroupName = 'FOO';
			const projectNameFilter = 'project';
			const outputType = 'text';
			const project1 = new GitlabProject('project-1', 'description', 'https://gitlab.com/FOO/project-1.git');
			const project2 = new GitlabProject('project-2', 'description', 'https://gitlab.com/FOO/project-2.git');
			const project3 = new GitlabProject('project-3', 'description', 'https://gitlab.com/FOO/project-3.git');
			migrateStub.returns([project1, project2, project3]);
			//when
			process.argv = `node ../../src/cli.js list --output ${outputType} --starts-with ${projectNameFilter} ${gitlabGroupName}`.split(' ');
			await proxyquire('../../src/cli.js', { './migrate': getListOfAllProjectsToMigrateStub });
			//then
			sinon.assert.calledWith(migrateStub, gitlabGroupName, projectNameFilter);
			expect(consoleOutput).to.eql([project1.toString(), project2.toString(), project3.toString()]);
		});
		it('should handle error gracefully when listing projects for specific group', async function () {
			//given
			const gitlabGroupName = 'FOO';
			const errorMessage = 'Some error occurred while fetching list of projects';
			migrateStub.throws(new Error(errorMessage));
			//when
			process.argv = `node ../../src/cli.js list ${gitlabGroupName}`.split(' ');
			await proxyquire('../../src/cli.js', { './migrate': getListOfAllProjectsToMigrateStub });
			//then
			sinon.assert.calledWith(migrateStub, gitlabGroupName);
			expect(consoleError).to.eql([errorMessage]);
		});
	});
	describe('Copy content of repos', () => {
		let copyContentFromGitlabToGithubStub;
		beforeEach(() => {
			migrateStub = sinon.stub(migrate, 'copyContentFromGitlabToGithub');
			copyContentFromGitlabToGithubStub = function StubMigrate() {
				this.copyContentFromGitlabToGithub = migrateStub;
			};
		});
		afterEach(() => {
			sinon.restore();
		});
		it('should copy contents of all repos to github org when github org is specified', async function () {
			//given
			const gitlabGroupName = 'FOO';
			const githubOrgName = 'BAR';
			//when
			process.argv = `node ../../src/cli.js copy-content ${gitlabGroupName} --github-org ${githubOrgName}`.split(' ');
			await proxyquire('../../src/cli.js', { './migrate': copyContentFromGitlabToGithubStub });
			//then
			sinon.assert.callCount(migrateStub, 1);
			sinon.assert.calledWithExactly(migrateStub, gitlabGroupName, githubOrgName, '');
		});
		it('should copy contents of all repos to user root when github org is not specified', async function () {
			//given
			const gitlabGroupName = 'FOO';
			//when
			process.argv = `node ../../src/cli.js copy-content ${gitlabGroupName} `.split(' ');
			await proxyquire('../../src/cli.js', { './migrate': copyContentFromGitlabToGithubStub });
			//then
			sinon.assert.callCount(migrateStub, 1);
			sinon.assert.calledWithExactly(migrateStub, gitlabGroupName, undefined, '');
		});
		it('should copy contents of repos filtered on specified prefix', async function () {
			//given
			const gitlabGroupName = 'FOO';
			const githubOrgName = 'BAR';
			const projectNameFilter = 'project';
			//when
			process.argv = `node ../../src/cli.js copy-content --starts-with ${projectNameFilter} ${gitlabGroupName} --github-org ${githubOrgName}`.split(' ');
			await proxyquire('../../src/cli.js', { './migrate': copyContentFromGitlabToGithubStub });
			//then
			sinon.assert.callCount(migrateStub, 1);
			sinon.assert.calledWithExactly(migrateStub, gitlabGroupName, githubOrgName, projectNameFilter);
		});
		it('should handle error gracefully when copying content', async function() {
			//given
			const gitlabGroupName = 'FOO';
			const githubOrgName = 'BAR';
			const errorMessage = 'Some error occurred while copying content of projects';
			migrateStub.returns(Promise.reject(new Error(errorMessage)));
			//when
			process.argv = `node ../../src/cli.js copy-content ${gitlabGroupName} --github-org ${githubOrgName}`.split(' ');
			await proxyquire('../../src/cli.js', { './migrate': copyContentFromGitlabToGithubStub });
			//then
			sinon.assert.callCount(migrateStub, 1);
			sinon.assert.calledWithExactly(migrateStub, gitlabGroupName, githubOrgName, '');
			expect(consoleError).to.eql([errorMessage]);
		});
	});
	describe('Configure branch protection rules for a specific branch', function() {
		let configureGithubBranchProtectionRuleStub;
		before(() => {
			migrateStub = sinon.stub(migrate, 'configureGithubBranchProtectionRule');
			configureGithubBranchProtectionRuleStub = function StubMigrate() {
				this.configureGithubBranchProtectionRule = migrateStub;
			};
		});
		after(() => {
			sinon.restore();
		});
		it('should configure branch protection rule for given github repo', async function() {
			//given
			const owner = 'someOwner';
			const repoName = 'someRepo';
			const branchName = 'master';
			const configFile = './config/templates/branchProtectionRuleTemplate.yml';
			//when
			process.argv = `node ../../src/cli.js protect-branch -c ${configFile} ${owner} ${branchName} ${repoName}`.split(' ');
			await proxyquire('../../src/cli.js', {'./migrate': configureGithubBranchProtectionRuleStub});
			//then
			const config = yaml.safeLoad(fs.readFileSync(configFile, 'utf8'));
			sinon.assert.calledWith(migrateStub, owner, [repoName], branchName, config.branchProtectionRule);
		});
		it('should configure branch protection rule for multiple github repos', async function() {
			//given
			const owner = 'someOwner';
			const branchName = 'master';
			const repoName1 = 'someRepo1';
			const repoName2 = 'someRepo2';
			const configFile = './config/templates/branchProtectionRuleTemplate.yml';
			//when
			process.argv = `node ../../src/cli.js protect-branch -c ${configFile} ${owner} ${branchName} ${repoName1} ${repoName2}`.split(' ');
			await proxyquire('../../src/cli.js', {'./migrate': configureGithubBranchProtectionRuleStub});
			//then
			const config = yaml.safeLoad(fs.readFileSync(configFile, 'utf8'));
			sinon.assert.calledWith(migrateStub, owner, [repoName1, repoName2], branchName, config.branchProtectionRule);
		});
		it('should handle error gracefully when configuring branch protection rule', async function() {
			//given
			const owner = 'someOwner';
			const repoName = 'someRepo';
			const branchName = 'master';
			const configFile = './config/templates/branchProtectionRuleTemplate.yml';
			const errorMessage = 'Some error occurred while configuring branch protection rules';
			migrateStub.returns(Promise.reject(new Error(errorMessage)));
			//when
			process.argv = `node ../../src/cli.js protect-branch -c ${configFile} ${owner} ${branchName} ${repoName}`.split(' ');
			await proxyquire('../../src/cli.js', {'./migrate': configureGithubBranchProtectionRuleStub});
			//then
			const config = yaml.safeLoad(fs.readFileSync(configFile, 'utf8'));
			sinon.assert.calledWith(migrateStub, owner, [repoName], branchName, config.branchProtectionRule);
			expect(consoleError).to.eql([errorMessage]);
		});
	});
	describe('Update auto delete head branches on GitHub after pull requests are being merged', function() {
		let updateAutoDeleteHeadBranchesOnGithubStub;
		before(() => {
			migrateStub = sinon.stub(migrate, 'updateAutoDeleteHeadBranchesOnGithub');
			updateAutoDeleteHeadBranchesOnGithubStub = function StubMigrate() {
				this.updateAutoDeleteHeadBranchesOnGithub = migrateStub;
			};
		});
		after(() => {
			sinon.restore();
		});
		it('should update auto delete head branches for given repoName', async function() {
			//given
			const owner = 'some-org';
			const repoName = 'some-repo';
			//when
			process.argv = `node ../../src/cli.js auto-delete-head-branches ${owner} ${repoName}`.split(' ');
			await proxyquire('../../src/cli.js', {'./migrate': updateAutoDeleteHeadBranchesOnGithubStub});
			//then
			sinon.assert.calledWith(migrateStub, owner, [repoName]);
		});
		it('should update auto delete head branches for multiple repos', async function() {
			//given
			const owner = 'some-org';
			const repoName1 = 'some-repo-1';
			const repoName2 = 'some-repo-2';
			//when
			process.argv = `node ../../src/cli.js auto-delete-head-branches ${owner} ${repoName1} ${repoName2}`.split(' ');
			await proxyquire('../../src/cli.js', {'./migrate': updateAutoDeleteHeadBranchesOnGithubStub});
			//then
			sinon.assert.calledWith(migrateStub, owner, [repoName1, repoName2]);
		});
		it('should handle error gracefully when updating auto delete head branches', async function() {
			//given
			const owner = 'some-org';
			const repoName = 'some-repo';
			const errorMessage = 'Some error occurred while updating auto delete head branches for repo';
			migrateStub.returns(Promise.reject(new Error(errorMessage)));
			//when
			process.argv = `node ../../src/cli.js auto-delete-head-branches ${owner} ${repoName}`.split(' ');
			await proxyquire('../../src/cli.js', {'./migrate': updateAutoDeleteHeadBranchesOnGithubStub});
			//then
			sinon.assert.calledWith(migrateStub, owner, [repoName]);
			expect(consoleError).to.eql([errorMessage]);
		});
	});
	describe('Update default branch on GitHub', function() {
		let updateDefaultBranchOnGithubStub;
		before(() => {
			migrateStub = sinon.stub(migrate, 'updateDefaultBranchOnGithub');
			updateDefaultBranchOnGithubStub = function StubMigrate() {
				this.updateDefaultBranchOnGithub = migrateStub;
			};
		});
		after(() => {
			sinon.restore();
		});
		it('should update default branch for given repoName', async function() {
			//given
			const owner = 'some-org';
			const repoName = 'some-repo';
			const defaultBranchName = 'master';
			//when
			process.argv = `node ../../src/cli.js set-default-branch ${owner} ${defaultBranchName} ${repoName}`.split(' ');
			await proxyquire('../../src/cli.js', {'./migrate': updateDefaultBranchOnGithubStub});
			//then
			sinon.assert.calledWith(migrateStub, owner, [repoName], defaultBranchName);
		});
		it('should update default branch for multiple repos', async function() {
			//given
			const owner = 'some-org';
			const repoName1 = 'some-repo-1';
			const repoName2 = 'some-repo-2';
			const defaultBranchName = 'master';
			//when
			process.argv = `node ../../src/cli.js set-default-branch ${owner} ${defaultBranchName} ${repoName1} ${repoName2}`.split(' ');
			await proxyquire('../../src/cli.js', {'./migrate': updateDefaultBranchOnGithubStub});
			//then
			sinon.assert.calledWith(migrateStub, owner, [repoName1, repoName2], defaultBranchName);
		});
		it('should handle error gracefully when updating default branch', async function() {
			//given
			const owner = 'some-org';
			const repoName = 'some-repo';
			const defaultBranchName = 'master';
			const errorMessage = 'Some error occurred while updating default branch for repo';
			migrateStub.returns(Promise.reject(new Error(errorMessage)));
			//when
			process.argv = `node ../../src/cli.js set-default-branch ${owner} ${defaultBranchName} ${repoName}`.split(' ');
			await proxyquire('../../src/cli.js', {'./migrate': updateDefaultBranchOnGithubStub});
			//then
			sinon.assert.calledWith(migrateStub, owner, [repoName], defaultBranchName);
			expect(consoleError).to.eql([errorMessage]);
		});
	});
	describe('Archive GitLab project', function() {
		let archiveGitlabProjectStub;
		before(() => {
			migrateStub = sinon.stub(migrate, 'archiveGitlabProject');
			archiveGitlabProjectStub = function StubMigrate() {
				this.archiveGitlabProject = migrateStub;
			};
		});
		after(() => {
			sinon.restore();
		});
		it('should archive gitlab project for given project path', async function() {
			//given
			const projectPath = 'project1';
			//when
			process.argv = `node ../../src/cli.js archive-project ${projectPath}`.split(' ');
			await proxyquire('../../src/cli.js', {'./migrate': archiveGitlabProjectStub});
			//then
			sinon.assert.calledWith(migrateStub, [projectPath]);
		});
		it('should archive multiple gitlab projects', async function() {
			//given
			const projectPath1 = 'project1';
			const projectPath2 = 'project2';
			//when
			process.argv = `node ../../src/cli.js archive-project ${projectPath1} ${projectPath2}`.split(' ');
			await proxyquire('../../src/cli.js', {'./migrate': archiveGitlabProjectStub});
			//then
			sinon.assert.calledWith(migrateStub, [projectPath1, projectPath2]);
		});
		it('should handle error gracefully when archiving project', async function() {
			//given
			const projectPath = 'project1';
			const errorMessage = 'Some error occurred while archiving project';
			migrateStub.returns(Promise.reject(new Error(errorMessage)));
			//when
			process.argv = `node ../../src/cli.js archive-project ${projectPath}`.split(' ');
			await proxyquire('../../src/cli.js', {'./migrate': archiveGitlabProjectStub});
			//then
			sinon.assert.calledWith(migrateStub, [projectPath]);
			expect(consoleError).to.eql([errorMessage]);
		});
	});
});