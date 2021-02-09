const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const yaml = require('js-yaml');
const fs   = require('fs');
const proxyquire =  require('proxyquire');

const Migrate = require('../../src/migrate.js');
const WebhookConfig = require('../../src/github/model/webhookConfig.js');

describe.skip('Tests for cli', () => {
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
			migrateStub.returns(Promise.resolve());
		});
		after(() => {
			sinon.restore();
		});
		it('should list projects for a specific GitLab group ordered alphabetically', async function () {
			//given
			const gitlabGroupName = 'FOO';
			const projectNameFilter = 'project';
			//when
			process.argv = `node ../../src/cli.js list --starts-with ${projectNameFilter} ${gitlabGroupName}`.split(' ');
			await proxyquire('../../src/cli.js', { './migrate': getListOfAllProjectsToMigrateStub });
			//then
			sinon.assert.calledWith(migrateStub, gitlabGroupName, projectNameFilter);
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
			migrateStub.returns(Promise.resolve());
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
	});
	describe('Configure branch protection rules for a specific branch', function() {
		let configureGithubBranchProtectionRuleStub;
		before(() => {
			migrateStub = sinon.stub(migrate, 'configureGithubBranchProtectionRule');
			configureGithubBranchProtectionRuleStub = function StubMigrate() {
				this.configureGithubBranchProtectionRule = migrateStub;
			};
			migrateStub.returns(Promise.resolve());
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
			migrateStub.returns(Promise.resolve());
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
			migrateStub.returns(Promise.resolve());
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
			migrateStub.returns(Promise.resolve());
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
	describe.skip('Create webhooks', function () {
		let createWebhookStub;
		before(() => {
			migrateStub = sinon.stub(migrate, 'createWebhook');
			createWebhookStub = function StubMigrate() {
				this.createWebhook = migrateStub;
			};
		});
		after(() => {
			sinon.restore();
		});

		beforeEach(() => {
			migrateStub.reset();
		});

		it('should create webhook for a single repo', async () => {
			//given
			const configFile = 'test/resources/github/webhookTemplate.yml';
			const events = [
				'push',
				'pull_request'
			];
			const secret = 'some-secret';
			const payloadUrl = 'https://github-webhook-proxy/webhook?targetUrl=https://jenkins.some-jenkins.com/github-webhook/';
			const orgName = 'some-org';
			const repoName = 'some-repo';
			const webhookConfig = new WebhookConfig(repoName, secret, events, payloadUrl);

			//when
			process.argv = `node ../../src/cli.js create-webhook -c ${configFile} ${orgName} ${repoName}`.split(' ');
			await proxyquire('../../src/cli.js', { './migrate': createWebhookStub });

			//then
			sinon.assert.callCount(migrateStub, 1);
			sinon.assert.calledWith(migrateStub, [webhookConfig], orgName);
		});

		it('should create webhook for two repos', async () => {
			//given
			const configFile = 'test/resources/github/webhookTemplate.yml';
			const events = [
				'push',
				'pull_request'
			];
			const secret1 = 'some-secret-1';
			const secret2 = 'some-secret-2';
			const payloadUrl = 'https://github-webhook-proxy/webhook?targetUrl=https://jenkins.some-jenkins.com/github-webhook/';
			const orgName = 'some-org';
			const repoName1 = 'some-repo-1';
			const repoName2 = 'some-repo-2';
			const webhookConfig1 = new WebhookConfig(repoName1, secret1, events, payloadUrl);
			const webhookConfig2 = new WebhookConfig(repoName2, secret2, events, payloadUrl);

			//when
			process.argv = `node ../../src/cli.js create-webhook -c ${configFile} ${orgName} ${repoName1} ${repoName2}`.split(' ');
			await proxyquire('../../src/cli.js', { './migrate': createWebhookStub });

			//then
			sinon.assert.callCount(migrateStub, 1);
			sinon.assert.calledWith(migrateStub, [webhookConfig1, webhookConfig2], orgName);
		});

		it('should throw error when creating webhook rejects requests', async () => {
			//given
			const configFile = 'test/resources/github/webhookTemplate.yml';
			const events = ['push', 'pull_request'];
			const secret = 'some-secret';
			const payloadUrl = 'https://github-webhook-proxy/webhook?targetUrl=https://jenkins.some-jenkins.com/github-webhook/';
			const orgName = 'some-org';
			const repoName = 'some-repo';
			const errorMessage = `Error creating webhook for repo ${repoName}`;

			const webhookConfig = new WebhookConfig(repoName, secret, events, payloadUrl);

			migrateStub.returns(Promise.reject(new Error(errorMessage)));

			//when
			process.argv = `node ../../src/cli.js create-webhook -c ${configFile} ${orgName} ${repoName}`.split(' ');
			await proxyquire('../../src/cli.js', { './migrate': createWebhookStub });

			//then
			sinon.assert.callCount(migrateStub, 1);
			sinon.assert.calledWith(migrateStub, [webhookConfig], orgName);
			expect(consoleError).to.eql([errorMessage]);
		});

		it('should throw error when webhook config missing for repo', async () => {
			//given
			const configFile = 'test/resources/github/webhookTemplate.yml';
			const orgName = 'some-org';
			const repoName = 'some-repo-3';			
			const errorMessage = 'No config found for some-repo-3';

			//when
			process.argv = `node ../../src/cli.js create-webhook -c ${configFile} ${orgName} ${repoName}`.split(' ');
			await proxyquire('../../src/cli.js', { './migrate': createWebhookStub });

			//then
			sinon.assert.notCalled(migrateStub);
			expect(consoleError).to.eql([errorMessage]);
		});

		it('should pick payloadUrl, events config from common when that webhook config missing for repo', async () => {
			//given
			const configFile = 'test/resources/github/webhookTemplate.yml';
			const orgName = 'some-org';
			const repoName = 'some-repo-4';
			const events = ['push_1', 'pull_request_1'];
			const secret = 'some-secret-4';
			const payloadUrl = 'https://other-github-webhook-proxy/webhook?targetUrl=https://jenkins.some-jenkins.com/github-webhook/';
			const webhookConfig = new WebhookConfig(repoName, secret, events, payloadUrl);

			//when
			process.argv = `node ../../src/cli.js create-webhook -c ${configFile} ${orgName} ${repoName}`.split(' ');
			await proxyquire('../../src/cli.js', { './migrate': createWebhookStub });

			//then
			sinon.assert.callCount(migrateStub, 1);
			sinon.assert.calledWith(migrateStub, [webhookConfig], orgName);
		});

		it('should throw error when events config cannot be found from either common or repo webhook config', async () => {
			//given
			const configFile = 'test/resources/github/webhookTemplateWithoutEvents.yml';
			const orgName = 'some-org';
			const repoName = 'some-repo-4';
			const errorMessage = 'No events found for some-repo-4';

			//when
			process.argv = `node ../../src/cli.js create-webhook -c ${configFile} ${orgName} ${repoName}`.split(' ');
			await proxyquire('../../src/cli.js', { './migrate': createWebhookStub });

			//then
			sinon.assert.notCalled(migrateStub);
			expect(consoleError).to.eql([errorMessage]);
		});

		it('should throw error when payloadUrl config cannot be found from either common or repo webhook config', async () => {
			//given
			const configFile = 'test/resources/github/webhookTemplateWithoutPayloadUrl.yml';
			const orgName = 'some-org';
			const repoName = 'some-repo-4';
			const errorMessage = 'No payloadUrl found for some-repo-4';

			//when
			process.argv = `node ../../src/cli.js create-webhook -c ${configFile} ${orgName} ${repoName}`.split(' ');
			await proxyquire('../../src/cli.js', { './migrate': createWebhookStub });

			//then
			sinon.assert.notCalled(migrateStub);
			expect(consoleError).to.eql([errorMessage]);
		});
	});
});