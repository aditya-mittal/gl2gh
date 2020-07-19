const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const yaml = require('js-yaml');
const fs   = require('fs');
const proxyquire =  require('proxyquire');

const Migrate = require('../../src/migrate.js');
const GitlabClient = require('../../src/gitlab/client');


describe('Tests for cli', () => {
	const migrate = new Migrate();
	let gitlabClientObj = new GitlabClient('any_url', 'any_private_token');
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
		let configureBranchProtectionRuleStub;
		before(() => {
			migrateStub = sinon.stub(migrate, 'configureBranchProtectionRule');
			configureBranchProtectionRuleStub = function StubMigrate() {
				this.configureBranchProtectionRule = migrateStub;
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
			process.argv = `node ../../src/cli.js protect-branch -c ${configFile} ${owner} ${repoName} ${branchName}`.split(' ');
			await proxyquire('../../src/cli.js', {'./migrate': configureBranchProtectionRuleStub});
			//then
			const config = yaml.safeLoad(fs.readFileSync(configFile, 'utf8'));
			sinon.assert.calledWith(migrateStub, owner, repoName, branchName, config.branchProtectionRule);
		});
		it('should handle error gracefully when configuring branch protection rule', async function() {
			//given
			const owner = 'someOwner';
			const repoName = 'someRepo';
			const branchName = 'master';
			const configFile = './config/templates/branchProtectionRuleTemplate.yml';
			var errorMessage = 'Some error occurred while configuring branch protection rules';
			migrateStub.returns(Promise.reject(new Error(errorMessage)));
			//when
			process.argv = `node ../../src/cli.js protect-branch -c ${configFile} ${owner} ${repoName} ${branchName}`.split(' ');
			await proxyquire('../../src/cli.js', {'./migrate': configureBranchProtectionRuleStub});
			//then
			const config = yaml.safeLoad(fs.readFileSync(configFile, 'utf8'));
			sinon.assert.calledWith(migrateStub, owner, repoName, branchName, config.branchProtectionRule);
			expect(consoleError).to.eql([errorMessage]);
		});
	});

	describe('Archive one or more repos', () => {
		let archiveRepoStubObj, archiveRepoStub;
		before(() => {
			archiveRepoStub = sinon.stub(gitlabClientObj, 'archiveRepo');
			archiveRepoStubObj = function StubArchiveRepo() {
				this.archiveRepo = archiveRepoStub;
			};
		});

		after(() => {
			sinon.restore();
		});

		it('should call gitlab client archive function for single repo', async () => {
			//given
			const repoName = 'repo1';
			const stubResponse = {
				name: repoName,
				archived: true
			};
			archiveRepoStub.returns(stubResponse);
	
			//when
			process.argv = `node ../../src/cli.js archive-repo ${repoName}`.split(' ');
			await proxyquire('../../src/cli.js', {'./gitlab/client': archiveRepoStubObj});
		
			//then
			sinon.assert.calledWith(archiveRepoStub, 'repo1');
			expect(consoleOutput).to.have.lengthOf(1);
			expect(consoleOutput).to.eql([
				`Project archived : ${repoName}`
			]);
		});
		it('should handle error when gitlab client archive throws error for single repo', async () => {
			//given
			const repoName = 'repo1';
			archiveRepoStub.withArgs(repoName).throws(new Error('Archived failed'));

			//when
			process.argv = `node ../../src/cli.js archive-repo ${repoName}`.split(' ');
			await proxyquire('../../src/cli.js', {'./gitlab/client': archiveRepoStubObj});

			//then
			sinon.assert.calledWith(archiveRepoStub, 'repo1');
			expect(consoleError).to.have.lengthOf(1);
			expect(consoleError[0]).to.eql(`Project archival failed for : ${repoName}`);
		});
		it('should call gitlab client archive function for multiple repo', async () => {
			//given
			const repoName1 = 'repo1';
			const repoName2 = 'repo2';
			const stubResponse1 = {
				name: repoName1,
				archived: true
			};
			const stubResponse2 = {
				name: repoName2,
				archived: true
			};
			archiveRepoStub.withArgs(repoName1).returns(stubResponse1);
			archiveRepoStub.withArgs(repoName2).returns(stubResponse2);

			//when
			process.argv = 'node ../../src/cli.js archive-repo repo1 repo2'.split(' ');
			await proxyquire('../../src/cli.js', {'./gitlab/client': archiveRepoStubObj});

			//then
			sinon.assert.calledWith(archiveRepoStub, 'repo1');
			sinon.assert.calledWith(archiveRepoStub, 'repo2');
			expect(consoleOutput).to.have.lengthOf(2);
			expect(consoleOutput[0]).to.eql(`Project archived : ${repoName1}`);
			expect(consoleOutput[1]).to.eql(`Project archived : ${repoName2}`);
		});
		it('should proceed for next repo if gitlab client archive function fail for one repo when multiple repos are passed', async () => {
			//given
			const repoName1 = 'repo1';
			const repoName2 = 'repo2';
			const stubResponse2 = {
				name: repoName2,
				archived: true
			};
			archiveRepoStub.withArgs(repoName1).throws(new Error('Archived failed'));
			archiveRepoStub.withArgs(repoName2).returns(stubResponse2);

			//when
			process.argv = 'node ../../src/cli.js archive-repo repo1 repo2'.split(' ');
			await proxyquire('../../src/cli.js', {'./gitlab/client': archiveRepoStubObj});

			//then
			sinon.assert.calledWith(archiveRepoStub, 'repo1');
			sinon.assert.calledWith(archiveRepoStub, 'repo2');
			expect(consoleOutput).to.have.lengthOf(1);
			expect(consoleError).to.have.lengthOf(1);
			expect(consoleError[0]).to.eql(`Project archival failed for : ${repoName1}`);
			expect(consoleOutput[0]).to.eql(`Project archived : ${repoName2}`);
		});
		it('should log failure if archive flag is not set in response from gitlab client for multiple repos', async () => {
			//given
			const repoName = 'repo1';
			const stubResponse = {
				name: repoName,
				archived: false
			};
			archiveRepoStub.returns(stubResponse);

			//when
			process.argv = `node ../../src/cli.js archive-repo ${repoName}`.split(' ');
			await proxyquire('../../src/cli.js', {'./gitlab/client': archiveRepoStubObj});

			//then
			sinon.assert.calledWith(archiveRepoStub, 'repo1');
			expect(consoleError).to.have.lengthOf(1);
			expect(consoleError).to.eql([
				`Project archival failed for : ${repoName}`
			]);
		});

		it('should proceed for next repo if gitlab client archive function fail for one repo when multiple repos are passed', async () => {
			//given
			const repoName1 = 'repo1';
			const repoName2 = 'repo2';
			const stubResponse1 = {
				name: repoName1,
				archived: false
			};
			const stubResponse2 = {
				name: repoName2,
				archived: true
			};
			archiveRepoStub.withArgs(repoName1).returns(stubResponse1);
			archiveRepoStub.withArgs(repoName2).returns(stubResponse2);

			//when
			process.argv = 'node ../../src/cli.js archive-repo repo1 repo2'.split(' ');
			await proxyquire('../../src/cli.js', {'./gitlab/client': archiveRepoStubObj});

			//then
			sinon.assert.calledWith(archiveRepoStub, 'repo1');
			sinon.assert.calledWith(archiveRepoStub, 'repo2');
			expect(consoleOutput).to.have.lengthOf(1);
			expect(consoleError).to.have.lengthOf(1);
			expect(consoleError[0]).to.eql(`Project archival failed for : ${repoName1}`);
			expect(consoleOutput[0]).to.eql(`Project archived : ${repoName2}`);
		});
	});
});