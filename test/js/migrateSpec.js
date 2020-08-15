const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const assert = chai.assert;
const expect = chai.expect;
const nock = require('nock');
const sinon = require('sinon');
const git = require('isomorphic-git');
const fs = require('fs');
const config = require('config');

const GitlabProject = require('../../src/gitlab/model/project.js');
const GithubRepository = require('../../src/github/model/repository.js');
const WebhookConfig = require('../../src/github/model/webhookConfig.js');
const Migrate = require('../../src/migrate.js');
const gitlabGroupDetails = require('../resources/gitlab/groupDetails.json');
const gitlabSubgroupsList = require('../resources/gitlab/subgroupsList.json');
const gitlabSubgroup1Details = require('../resources/gitlab/subgroup1Details.json');
const gitlabSubgroup2Details = require('../resources/gitlab/subgroup2Details.json');
const gitlabArchiveResponse = require('../resources/gitlab/archiveResponse.json');
const githubRepoDetails = require('../resources/github/repoDetails.json');
const githubUpdateBranchProtectionResponse = require('../resources/github/updateBranchProtectionResponse.json');
const createWebhookResponse = require('../resources/github/createWebhookResponse.json');

describe('migrate', function() {
	const migrate = new Migrate();
	const GITLAB_URL = config.get('gl2gh.gitlab.url');
	const GITLAB_PRIVATE_TOKEN = config.get('gl2gh.gitlab.token');

	const GITHUB_API_URL = config.get('gl2gh.github.url');
	const GITHUB_PRIVATE_TOKEN = config.get('gl2gh.github.token');

	let gitlabApi;
	let githubApi;
	let gitCloneStub;
	let gitCreateRemoteStub;
	let gitPushToRemoteStub;
	let gitListBranchesStub;
	let gitListTagsStub;
	let gitCheckoutStub;
	let rmdirStub;
	beforeEach(() => {
		gitCloneStub = sinon.stub(git, 'clone');
		gitCreateRemoteStub = sinon.stub(git, 'addRemote');
		gitListBranchesStub = sinon.stub(git, 'listBranches');
		gitListTagsStub = sinon.stub(git, 'listTags');
		gitCheckoutStub = sinon.stub(git, 'checkout');
		gitPushToRemoteStub = sinon.stub(git, 'push');
		rmdirStub = sinon.stub(fs, 'rmdirSync');
		gitlabApi = nock(
			'https://' + GITLAB_URL, {
				reqHeaders: {
					'Content-Type': 'application/json',
					'Private-Token': GITLAB_PRIVATE_TOKEN
				}
			}
		);
		githubApi = nock(
			'https://' + GITHUB_API_URL, {
				reqHeaders: {
					'Content-Type': 'application/json',
					'Authorization': 'token ' + GITHUB_PRIVATE_TOKEN
				}
			}
		);
	});
	afterEach(() => {
		sinon.restore();
		nock.cleanAll();
	});
	describe('migrate gitlab repo(s) to github', function() {
		it('should migrate all repos under the gitlab group to specified github org', async () =>  {
			//given
			const gitlabGroupName = 'FOO';
			const githubOrgName = 'BAR';
			gitlabApi.get('/api/v4/groups/' + gitlabGroupName).times(2).reply(200, gitlabGroupDetails);
			gitlabApi.get('/api/v4/groups/'+gitlabGroupName+'/subgroups').reply(200, gitlabSubgroupsList);
			gitlabApi.get('/api/v4/groups/'+gitlabGroupName+encodeURIComponent('/')+'subgroup1').reply(200, gitlabSubgroup1Details);
			gitlabApi.get('/api/v4/groups/'+gitlabGroupName+encodeURIComponent('/')+'subgroup2').reply(200, gitlabSubgroup2Details);
			githubApi.post(`/orgs/${githubOrgName}/repos`).times(8).reply(201, githubRepoDetails);
			githubApi.patch(RegExp('/repos\\/' + githubOrgName + '\\/[^\\/]+$')).times(8).reply(200, githubRepoDetails);
			gitCloneStub.returns(Promise.resolve());
			gitCreateRemoteStub.returns(Promise.resolve());
			gitListBranchesStub.returns(Promise.resolve(['master', 'extra-branch']));
			gitCheckoutStub.returns(Promise.resolve());
			gitListTagsStub.returns(Promise.resolve([]));
			gitPushToRemoteStub.returns(Promise.resolve());
			//when
			const result = await migrate.migrateToGithub(gitlabGroupName, githubOrgName);
			//then
			expect(result).to.equal(0);
			sinon.assert.callCount(gitCloneStub, 8);
			sinon.assert.callCount(gitCreateRemoteStub, 8);
			sinon.assert.callCount(gitListBranchesStub, 8);
			sinon.assert.callCount(gitCheckoutStub, 16);
			sinon.assert.callCount(gitPushToRemoteStub, 16);
			sinon.assert.callCount(rmdirStub, 8);
			sinon.assert.calledWith(rmdirStub, sinon.match.string, sinon.match({recursive: true}));
		});
		it('should migrate all repos under the gitlab group to github user root when github org is not specified', async () =>  {
			//given
			const gitlabGroupName = 'FOO';
			const githubUserName = config.get('gl2gh.github.username');
			gitlabApi.get('/api/v4/groups/' + gitlabGroupName).times(2).reply(200, gitlabGroupDetails);
			gitlabApi.get('/api/v4/groups/'+gitlabGroupName+'/subgroups').reply(200, gitlabSubgroupsList);
			gitlabApi.get('/api/v4/groups/'+gitlabGroupName+encodeURIComponent('/')+'subgroup1').reply(200, gitlabSubgroup1Details);
			gitlabApi.get('/api/v4/groups/'+gitlabGroupName+encodeURIComponent('/')+'subgroup2').reply(200, gitlabSubgroup2Details);
			githubApi.post('/user/repos').times(8).reply(201, githubRepoDetails);
			githubApi.patch(RegExp('/repos\\/' + githubUserName + '\\/[^\\/]+$')).times(8).reply(200, githubRepoDetails);
			gitCloneStub.returns(Promise.resolve());
			gitCreateRemoteStub.returns(Promise.resolve());
			gitListBranchesStub.returns(Promise.resolve(['master', 'extra-branch']));
			gitCheckoutStub.returns(Promise.resolve());
			gitListTagsStub.returns(Promise.resolve([]));
			gitPushToRemoteStub.returns(Promise.resolve());
			//when
			const result = await migrate.migrateToGithub(gitlabGroupName);
			//then
			expect(result).to.equal(0);
			sinon.assert.callCount(gitCloneStub, 8);
			sinon.assert.callCount(gitCreateRemoteStub, 8);
			sinon.assert.callCount(gitListBranchesStub, 8);
			sinon.assert.callCount(gitCheckoutStub, 16);
			sinon.assert.callCount(gitPushToRemoteStub, 16);
			sinon.assert.callCount(rmdirStub, 8);
			sinon.assert.calledWith(rmdirStub, sinon.match.string, sinon.match({recursive: true}));
		});
		it('should handle error gracefully when details for gitlab group not found', async () =>  {
			//given
			const gitlabGroupName = 'FOO';
			const githubOrgName = 'BAR';
			gitlabApi.get('/api/v4/groups/' + gitlabGroupName).reply(404);
			//when
			const result = await migrate.migrateToGithub(gitlabGroupName, githubOrgName);
			//then
			expect(result).to.equal(1);
		});
	});
	describe('list gitlab repo(s) to migrate', function () {
		it('should list all projects under the gitlab group', async () => {
			//given
			const gitlabGroupName = 'FOO';
			const projectNameFilter = '';
			gitlabApi.get('/api/v4/groups/' + gitlabGroupName).times(2).reply(200, gitlabGroupDetails);
			gitlabApi.get('/api/v4/groups/' + gitlabGroupName + '/subgroups').reply(200, gitlabSubgroupsList);
			gitlabApi.get('/api/v4/groups/' + gitlabGroupName + encodeURIComponent('/') + 'subgroup1').reply(200, gitlabSubgroup1Details);
			gitlabApi.get('/api/v4/groups/' + gitlabGroupName + encodeURIComponent('/') + 'subgroup2').reply(200, gitlabSubgroup2Details);

			//when
			const projectList = await migrate.getListOfAllProjectsToMigrate(gitlabGroupName, projectNameFilter);

			//then
			projectList.should.have.lengthOf(8);
			projectList[0].should.be.a('object');
			projectList[0].should.be.instanceof(GitlabProject);
			projectList[0].should.have.property('name');
			projectList[0].should.have.property('http_url_to_repo');
			const projectsName = projectList.map((project) => project.name);
			projectsName.should.deep.equal([ 'project1', 'project1', 'project2', 'project2', 'repository-1', 'repository-2', 'repository-3', 'shared-project1' ]);
		});
		it('should list all projects under the gitlab group and filter them based on prefix', async () => {
			//given
			const gitlabGroupName = 'FOO';
			let projectNameFilter = 'repository-';
			gitlabApi.get('/api/v4/groups/' + gitlabGroupName).times(2).reply(200, gitlabGroupDetails);
			gitlabApi.get('/api/v4/groups/' + gitlabGroupName + '/subgroups').reply(200, gitlabSubgroupsList);
			gitlabApi.get('/api/v4/groups/' + gitlabGroupName + encodeURIComponent('/') + 'subgroup1').reply(200, gitlabSubgroup1Details);
			gitlabApi.get('/api/v4/groups/' + gitlabGroupName + encodeURIComponent('/') + 'subgroup2').reply(200, gitlabSubgroup2Details);

			//when
			const projectList = await migrate.getListOfAllProjectsToMigrate(gitlabGroupName, projectNameFilter);

			//then
			projectList.should.have.lengthOf(3);
			let projectsName = projectList.map((project) => project.name);
			projectsName.should.deep.equal(['repository-1', 'repository-2', 'repository-3']);
		});
		it('should handle error gracefully when trying to fetch list of all projects under gitlab group', async () => {
			//given
			const gitlabGroupName = 'FOO';
			const projectNameFilter = '';
			gitlabApi.get('/api/v4/groups/' + gitlabGroupName).reply(404);

			return assert.isRejected(
				migrate.getListOfAllProjectsToMigrate(gitlabGroupName, projectNameFilter),
				Error,
				`No group found with name ${gitlabGroupName}`);
		});
	});
	describe('copyContent', function () {
		it('should copy content of all repos from gitlab to github under specified github org', async () => {
			//given
			const gitlabGroupName = 'FOO';
			const githubOrgName = 'BAR';
			gitlabApi.get('/api/v4/groups/' + gitlabGroupName).times(2).reply(200, gitlabGroupDetails);
			gitlabApi.get('/api/v4/groups/'+gitlabGroupName+'/subgroups').reply(200, gitlabSubgroupsList);
			gitlabApi.get('/api/v4/groups/'+gitlabGroupName+encodeURIComponent('/')+'subgroup1').reply(200, gitlabSubgroup1Details);
			gitlabApi.get('/api/v4/groups/'+gitlabGroupName+encodeURIComponent('/')+'subgroup2').reply(200, gitlabSubgroup2Details);
			githubApi.post(`/orgs/${githubOrgName}/repos`).times(8).reply(201, githubRepoDetails);
			githubApi.patch(RegExp('/repos\\/' + githubOrgName + '\\/[^\\/]+$')).times(8).reply(200, githubRepoDetails);
			gitCloneStub.returns(Promise.resolve());
			gitCreateRemoteStub.returns(Promise.resolve());
			gitListBranchesStub.returns(Promise.resolve(['master']));
			gitCheckoutStub.returns(Promise.resolve());
			gitListTagsStub.returns(Promise.resolve([]));
			gitPushToRemoteStub.returns(Promise.resolve());

			//when
			const result = await migrate.copyContentFromGitlabToGithub(gitlabGroupName, githubOrgName);

			//then
			expect(result).to.equal(0);
			sinon.assert.callCount(gitCloneStub, 8);
			sinon.assert.callCount(gitCreateRemoteStub, 8);
			sinon.assert.callCount(gitListBranchesStub, 8);
			sinon.assert.callCount(gitCheckoutStub, 8);
			sinon.assert.callCount(gitPushToRemoteStub, 8);
			sinon.assert.callCount(rmdirStub, 8);
			sinon.assert.calledWith(rmdirStub, sinon.match.string, sinon.match({recursive: true}));
		});
		it('should copy all branches of all repos from gitlab to github under specified github org', async () => {
			//given
			const gitlabGroupName = 'FOO';
			const githubOrgName = 'BAR';
			gitlabApi.get('/api/v4/groups/' + gitlabGroupName).times(2).reply(200, gitlabGroupDetails);
			gitlabApi.get('/api/v4/groups/'+gitlabGroupName+'/subgroups').reply(200, gitlabSubgroupsList);
			gitlabApi.get('/api/v4/groups/'+gitlabGroupName+encodeURIComponent('/')+'subgroup1').reply(200, gitlabSubgroup1Details);
			gitlabApi.get('/api/v4/groups/'+gitlabGroupName+encodeURIComponent('/')+'subgroup2').reply(200, gitlabSubgroup2Details);
			githubApi.post(`/orgs/${githubOrgName}/repos`).times(8).reply(201, githubRepoDetails);
			githubApi.patch(RegExp('/repos\\/' + githubOrgName + '\\/[^\\/]+$')).times(8).reply(200, githubRepoDetails);
			gitCloneStub.returns(Promise.resolve());
			gitCreateRemoteStub.returns(Promise.resolve());
			gitListBranchesStub.returns(Promise.resolve(['master', 'extra-branch']));
			gitCheckoutStub.returns(Promise.resolve());
			gitListTagsStub.returns(Promise.resolve([]));
			gitPushToRemoteStub.returns(Promise.resolve());

			//when
			const result = await migrate.copyContentFromGitlabToGithub(gitlabGroupName, githubOrgName);

			//then
			expect(result).to.equal(0);
			sinon.assert.callCount(gitCloneStub, 8);
			sinon.assert.callCount(gitCreateRemoteStub, 8);
			sinon.assert.callCount(gitListBranchesStub, 8);
			sinon.assert.callCount(gitCheckoutStub, 16);
			sinon.assert.callCount(gitPushToRemoteStub, 16);
			sinon.assert.callCount(rmdirStub, 8);
			sinon.assert.calledWith(rmdirStub, sinon.match.string, sinon.match({recursive: true}));
		});
		it('should copy all tags of all repos from gitlab to github under specified github org', async () => {
			//given
			const gitlabGroupName = 'FOO';
			const githubOrgName = 'BAR';
			gitlabApi.get('/api/v4/groups/' + gitlabGroupName).times(2).reply(200, gitlabGroupDetails);
			gitlabApi.get('/api/v4/groups/'+gitlabGroupName+'/subgroups').reply(200, gitlabSubgroupsList);
			gitlabApi.get('/api/v4/groups/'+gitlabGroupName+encodeURIComponent('/')+'subgroup1').reply(200, gitlabSubgroup1Details);
			gitlabApi.get('/api/v4/groups/'+gitlabGroupName+encodeURIComponent('/')+'subgroup2').reply(200, gitlabSubgroup2Details);
			githubApi.post(`/orgs/${githubOrgName}/repos`).times(8).reply(201, githubRepoDetails);
			githubApi.patch(RegExp('/repos\\/' + githubOrgName + '\\/[^\\/]+$')).times(8).reply(200, githubRepoDetails);
			gitCloneStub.returns(Promise.resolve());
			gitCreateRemoteStub.returns(Promise.resolve());
			gitListBranchesStub.returns(Promise.resolve(['master', 'extra-branch']));
			gitListTagsStub.returns(Promise.resolve(['foo-tag', 'bar-tag']));
			gitCheckoutStub.returns(Promise.resolve());
			gitPushToRemoteStub.returns(Promise.resolve());

			//when
			const result = await migrate.copyContentFromGitlabToGithub(gitlabGroupName, githubOrgName);

			//then
			expect(result).to.equal(0);
			sinon.assert.callCount(gitCloneStub, 8);
			sinon.assert.callCount(gitCreateRemoteStub, 8);
			sinon.assert.callCount(gitListBranchesStub, 8);
			sinon.assert.callCount(gitCheckoutStub, 16);
			sinon.assert.callCount(gitListTagsStub, 8);
			sinon.assert.callCount(gitPushToRemoteStub, 32);
			sinon.assert.callCount(rmdirStub, 8);
			sinon.assert.calledWith(rmdirStub, sinon.match.string, sinon.match({recursive: true}));
		});
		it('should copy content of all repos from gitlab to github under user root when github org is not specified', async () => {
			//given
			const gitlabGroupName = 'FOO';
			const githubUserName = config.get('gl2gh.github.username');
			gitlabApi.get('/api/v4/groups/' + gitlabGroupName).times(2).reply(200, gitlabGroupDetails);
			gitlabApi.get('/api/v4/groups/'+gitlabGroupName+'/subgroups').reply(200, gitlabSubgroupsList);
			gitlabApi.get('/api/v4/groups/'+gitlabGroupName+encodeURIComponent('/')+'subgroup1').reply(200, gitlabSubgroup1Details);
			gitlabApi.get('/api/v4/groups/'+gitlabGroupName+encodeURIComponent('/')+'subgroup2').reply(200, gitlabSubgroup2Details);
			githubApi.post('/user/repos').times(8).reply(201, githubRepoDetails);
			githubApi.patch(RegExp('/repos\\/' + githubUserName + '\\/[^\\/]+$')).times(8).reply(200, githubRepoDetails);
			gitCloneStub.returns(Promise.resolve());
			gitCreateRemoteStub.returns(Promise.resolve());
			gitListBranchesStub.returns(Promise.resolve(['master']));
			gitCheckoutStub.returns(Promise.resolve());
			gitListTagsStub.returns(Promise.resolve([]));
			gitPushToRemoteStub.returns(Promise.resolve());

			//when
			const result = await migrate.copyContentFromGitlabToGithub(gitlabGroupName);

			//then
			expect(result).to.equal(0);
			sinon.assert.callCount(gitCloneStub, 8);
			sinon.assert.callCount(gitCreateRemoteStub, 8);
			sinon.assert.callCount(gitListBranchesStub, 8);
			sinon.assert.callCount(gitCheckoutStub, 8);
			sinon.assert.callCount(gitPushToRemoteStub, 8);
			sinon.assert.callCount(rmdirStub, 8);
			sinon.assert.calledWith(rmdirStub, sinon.match.string, sinon.match({recursive: true}));
		});
		it('should copy content of only those repos matching the filter', async () => {
			//given
			const gitlabGroupName = 'FOO';
			const githubOrgName = 'BAR';
			const projectNameFilter = 'repository-';
			gitlabApi.get('/api/v4/groups/' + gitlabGroupName).times(2).reply(200, gitlabGroupDetails);
			gitlabApi.get('/api/v4/groups/' + gitlabGroupName + '/subgroups').reply(200, gitlabSubgroupsList);
			gitlabApi.get('/api/v4/groups/' + gitlabGroupName + encodeURIComponent('/') + 'subgroup1').reply(200, gitlabSubgroup1Details);
			gitlabApi.get('/api/v4/groups/' + gitlabGroupName + encodeURIComponent('/') + 'subgroup2').reply(200, gitlabSubgroup2Details);
			githubApi.post(`/orgs/${githubOrgName}/repos`).times(3).reply(201, githubRepoDetails);
			githubApi.patch(RegExp('/repos\\/' + githubOrgName + '\\/[^\\/]+$')).times(3).reply(200, githubRepoDetails);
			gitCloneStub.returns(Promise.resolve());
			gitCreateRemoteStub.returns(Promise.resolve());
			gitListBranchesStub.returns(Promise.resolve(['master']));
			gitCheckoutStub.returns(Promise.resolve());
			gitListTagsStub.returns(Promise.resolve([]));
			gitPushToRemoteStub.returns(Promise.resolve());

			//when
			const result = await migrate.copyContentFromGitlabToGithub(gitlabGroupName, githubOrgName, projectNameFilter);

			//then
			expect(result).to.equal(0);
			sinon.assert.callCount(gitCloneStub, 3);
			sinon.assert.callCount(gitCreateRemoteStub, 3);
			sinon.assert.callCount(gitListBranchesStub, 3);
			sinon.assert.callCount(gitCheckoutStub, 3);
			sinon.assert.callCount(gitPushToRemoteStub, 3);
			sinon.assert.callCount(rmdirStub, 3);
			sinon.assert.calledWith(rmdirStub, sinon.match.string, sinon.match({recursive: true}));
		});
	});
	describe('configure github branch protection rules for github repo', function () {
		it('should configure branch protection rule for given github repo', async () => {
			//given
			const owner = 'some-org';
			const repoName = 'some-repo';
			const branchName = 'master';
			const required_status_checks_contexts = [
				'continuous-integration/jenkins/pr-merge',
				'continuous-integration/jenkins/branch'
			];
			const required_approving_review_count = 1;
			const dismiss_stale_reviews = true;
			const enforce_admins = true;
			const rules = {
				'required_status_checks_contexts': required_status_checks_contexts,
				'required_approving_review_count': required_approving_review_count,
				'dismiss_stale_reviews': dismiss_stale_reviews,
				'enforce_admins': enforce_admins
			};
			githubApi.put(`/repos/${owner}/${repoName}/branches/${branchName}/protection`).reply(200, githubUpdateBranchProtectionResponse);
			//when
			const res = await migrate.configureGithubBranchProtectionRule(owner, [repoName], branchName, rules);
			//then
			expect(res[0].status).to.equal(200);
			expect(res[0].data.required_status_checks.contexts).to.deep.equal(required_status_checks_contexts);
			expect(res[0].data.required_pull_request_reviews.required_approving_review_count).to.equal(required_approving_review_count);
			expect(res[0].data.required_pull_request_reviews.dismiss_stale_reviews).to.equal(dismiss_stale_reviews);
			expect(res[0].data.enforce_admins.enabled).to.equal(enforce_admins);
		});
		it('should configure branch protection rules for multiple github repos', async () => {
			//given
			const owner = 'some-org';
			const repoName1 = 'some-repo-1';
			const repoName2 = 'some-repo-2';
			const branchName = 'master';
			const required_status_checks_contexts = [
				'continuous-integration/jenkins/pr-merge',
				'continuous-integration/jenkins/branch'
			];
			const required_approving_review_count = 1;
			const dismiss_stale_reviews = true;
			const enforce_admins = true;
			const rules = {
				'required_status_checks_contexts': required_status_checks_contexts,
				'required_approving_review_count': required_approving_review_count,
				'dismiss_stale_reviews': dismiss_stale_reviews,
				'enforce_admins': enforce_admins
			};
			githubApi.put(`/repos/${owner}/${repoName1}/branches/${branchName}/protection`).reply(200, githubUpdateBranchProtectionResponse);
			githubApi.put(`/repos/${owner}/${repoName2}/branches/${branchName}/protection`).reply(200, githubUpdateBranchProtectionResponse);
			//when
			const res = await migrate.configureGithubBranchProtectionRule(owner, [repoName1, repoName2], branchName, rules);
			//then
			expect(res[0].status).to.equal(200);
			expect(res[0].data.required_status_checks.contexts).to.deep.equal(required_status_checks_contexts);
			expect(res[0].data.required_pull_request_reviews.required_approving_review_count).to.equal(required_approving_review_count);
			expect(res[0].data.required_pull_request_reviews.dismiss_stale_reviews).to.equal(dismiss_stale_reviews);
			expect(res[0].data.enforce_admins.enabled).to.equal(enforce_admins);
			expect(res[1].status).to.equal(200);
			expect(res[1].data.required_status_checks.contexts).to.deep.equal(required_status_checks_contexts);
			expect(res[1].data.required_pull_request_reviews.required_approving_review_count).to.equal(required_approving_review_count);
			expect(res[1].data.required_pull_request_reviews.dismiss_stale_reviews).to.equal(dismiss_stale_reviews);
			expect(res[1].data.enforce_admins.enabled).to.equal(enforce_admins);
		});
		it('should proceed for configuring branch protection rules for other github repos when error received for one', async () => {
			//given
			const owner = 'some-org';
			const repoName1 = 'some-repo-1';
			const repoName2 = 'some-repo-2';
			const branchName = 'master';
			const required_status_checks_contexts = [
				'continuous-integration/jenkins/pr-merge',
				'continuous-integration/jenkins/branch'
			];
			const required_approving_review_count = 1;
			const dismiss_stale_reviews = true;
			const enforce_admins = true;
			const rules = {
				'required_status_checks_contexts': required_status_checks_contexts,
				'required_approving_review_count': required_approving_review_count,
				'dismiss_stale_reviews': dismiss_stale_reviews,
				'enforce_admins': enforce_admins
			};
			githubApi.put(`/repos/${owner}/${repoName1}/branches/${branchName}/protection`).reply(415);
			githubApi.put(`/repos/${owner}/${repoName2}/branches/${branchName}/protection`).reply(200, githubUpdateBranchProtectionResponse);
			//when
			const res = await migrate.configureGithubBranchProtectionRule(owner, [repoName1, repoName2], branchName, rules);
			//then
			expect(res[1].status).to.equal(200);
			expect(res[1].data.required_status_checks.contexts).to.deep.equal(required_status_checks_contexts);
			expect(res[1].data.required_pull_request_reviews.required_approving_review_count).to.equal(required_approving_review_count);
			expect(res[1].data.required_pull_request_reviews.dismiss_stale_reviews).to.equal(dismiss_stale_reviews);
			expect(res[1].data.enforce_admins.enabled).to.equal(enforce_admins);
		});
	});
	describe('archive gitlab project', function () {
		it('should archive gitlab project for given project path', async () => {
			//given
			const projectPath = 'foo/sample-project-site';
			gitlabApi.post('/api/v4/projects/' + encodeURIComponent(projectPath) + '/archive').reply(200, gitlabArchiveResponse);
			//when
			const res = await migrate.archiveGitlabProject([projectPath]);
			//then
			expect(res[0].status).to.equal(200);
			expect(res[0].data.path_with_namespace).to.equal(projectPath);
			expect(res[0].data.archived).to.be.true;
		});
		it('should archive multiple gitlab projects', async () => {
			//given
			const projectPath1 = 'foo/sample-project-site';
			const projectPath2 = 'foo/sample-project-site-2';
			gitlabApi.post('/api/v4/projects/' + encodeURIComponent(projectPath1) + '/archive').reply(200, gitlabArchiveResponse);
			gitlabApi.post('/api/v4/projects/' + encodeURIComponent(projectPath2) + '/archive').reply(200, gitlabArchiveResponse);
			//when
			const res = await migrate.archiveGitlabProject([projectPath1, projectPath2]);
			//then
			expect(res[0].status).to.equal(200);
			expect(res[0].data.path_with_namespace).to.equal(projectPath1);
			expect(res[0].data.archived).to.be.true;
			expect(res[1].status).to.equal(200);
			expect(res[1].data.archived).to.be.true;
		});
		it('should proceed for archiving other gitlab project(s) when error received for anyone', async () => {
			//given
			const nonExistingProjectPath = 'foo/non-existing-project';
			const existingProjectPath = 'foo/sample-project-site';
			gitlabApi.post('/api/v4/projects/' + encodeURIComponent(nonExistingProjectPath) + '/archive').reply(404);
			gitlabApi.post('/api/v4/projects/' + encodeURIComponent(existingProjectPath) + '/archive').reply(200, gitlabArchiveResponse);
			//when
			const res = await migrate.archiveGitlabProject([nonExistingProjectPath, existingProjectPath]);
			//then
			expect(res[1].status).to.equal(200);
			expect(res[1].data.path_with_namespace).to.equal(existingProjectPath);
			expect(res[1].data.archived).to.be.true;
		});
	});
	describe('update auto delete head branches on github', function () {
		it('should update auto delete head branches for the given repo', async () => {
			//given
			const owner = 'some-org';
			const repoName = 'some-repo';
			githubApi.patch(`/repos/${owner}/${repoName}`).reply(200, githubRepoDetails);
			//when
			const repositoryList = await migrate.updateAutoDeleteHeadBranchesOnGithub(owner, [repoName]);
			//then
			repositoryList.should.be.an('array');
			repositoryList.should.have.lengthOf(1);
			repositoryList[0].should.be.a('object');
			repositoryList[0].should.be.instanceof(GithubRepository);
			repositoryList[0].should.have.property('name');
			repositoryList[0].should.have.property('clone_url');
			repositoryList[0].should.have.property('delete_branch_on_merge');
			repositoryList[0]['name'].should.equal(repoName);
			repositoryList[0]['delete_branch_on_merge'].should.be.true;
		});
		it('should update auto delete head branches for multiple github repos', async () => {
			//given
			const owner = 'some-org';
			const repoName1 = 'some-repo-1';
			const repoName2 = 'some-repo-2';
			githubApi.patch(`/repos/${owner}/${repoName1}`).reply(200, githubRepoDetails);
			githubApi.patch(`/repos/${owner}/${repoName2}`).reply(200, githubRepoDetails);
			//when
			const repositoryList = await migrate.updateAutoDeleteHeadBranchesOnGithub(owner, [repoName1, repoName2]);
			//then
			repositoryList.should.be.an('array');
			repositoryList.should.have.lengthOf(2);
			repositoryList[0].should.be.a('object');
			repositoryList[0].should.be.instanceof(GithubRepository);
			repositoryList[0].should.have.property('name');
			repositoryList[0].should.have.property('clone_url');
			repositoryList[0].should.have.property('delete_branch_on_merge');
			repositoryList[0]['delete_branch_on_merge'].should.be.true;
			repositoryList[1]['delete_branch_on_merge'].should.be.true;
		});
		it('should proceed for updating auto delete head branches for other repo(s) when error received for anyone', async () => {
			//given
			const owner = 'some-org';
			const repoName1 = 'some-repo-1';
			const repoName2 = 'some-repo-2';
			githubApi.patch(`/repos/${owner}/${repoName1}`).reply(404);
			githubApi.patch(`/repos/${owner}/${repoName2}`).reply(200, githubRepoDetails);
			//when
			const repositoryList = await migrate.updateAutoDeleteHeadBranchesOnGithub(owner, [repoName1, repoName2]);
			//then
			repositoryList.should.be.an('array');
			repositoryList.should.have.lengthOf(2);
			repositoryList[1].should.be.a('object');
			repositoryList[1].should.be.instanceof(GithubRepository);
			repositoryList[1].should.have.property('name');
			repositoryList[1].should.have.property('clone_url');
			repositoryList[1].should.have.property('delete_branch_on_merge');
			repositoryList[1]['delete_branch_on_merge'].should.be.true;
		});
	});
	describe('update default branch on github', function () {
		it('should update default branch for the given repo', async () => {
			//given
			const owner = 'some-org';
			const repoName = 'some-repo';
			const defaultBranchName = 'master';
			githubApi.patch(`/repos/${owner}/${repoName}`).reply(200, githubRepoDetails);
			//when
			const repositoryList = await migrate.updateDefaultBranchOnGithub(owner, [repoName], defaultBranchName);
			//then
			repositoryList.should.be.an('array');
			repositoryList.should.have.lengthOf(1);
			repositoryList[0].should.be.a('object');
			repositoryList[0].should.be.instanceof(GithubRepository);
			repositoryList[0].should.have.property('name');
			repositoryList[0].should.have.property('clone_url');
			repositoryList[0].should.have.property('delete_branch_on_merge');
			repositoryList[0].should.have.property('default_branch');
			repositoryList[0]['name'].should.equal(repoName);
			repositoryList[0]['default_branch'].should.equal(defaultBranchName);
		});
		it('should update default branches for multiple github repos', async () => {
			//given
			const owner = 'some-org';
			const repoName1 = 'some-repo-1';
			const repoName2 = 'some-repo-2';
			const defaultBranchName = 'master';
			githubApi.patch(`/repos/${owner}/${repoName1}`).reply(200, githubRepoDetails);
			githubApi.patch(`/repos/${owner}/${repoName2}`).reply(200, githubRepoDetails);
			//when
			const repositoryList = await migrate.updateDefaultBranchOnGithub(owner, [repoName1, repoName2], defaultBranchName);
			//then
			repositoryList.should.be.an('array');
			repositoryList.should.have.lengthOf(2);
			repositoryList[0].should.be.a('object');
			repositoryList[0].should.be.instanceof(GithubRepository);
			repositoryList[0].should.have.property('name');
			repositoryList[0].should.have.property('default_branch');
			repositoryList[0]['default_branch'].should.equal(defaultBranchName);
			repositoryList[1]['default_branch'].should.equal(defaultBranchName);
		});
		it('should proceed for updating default branch for other repo(s) when error received for anyone', async () => {
			//given
			const owner = 'some-org';
			const repoName1 = 'some-repo-1';
			const repoName2 = 'some-repo-2';
			const defaultBranchName = 'master';
			githubApi.patch(`/repos/${owner}/${repoName1}`).reply(404);
			githubApi.patch(`/repos/${owner}/${repoName2}`).reply(200, githubRepoDetails);
			//when
			const repositoryList = await migrate.updateAutoDeleteHeadBranchesOnGithub(owner, [repoName1, repoName2], defaultBranchName);
			//then
			repositoryList.should.be.an('array');
			repositoryList.should.have.lengthOf(2);
			repositoryList[1].should.be.a('object');
			repositoryList[1].should.be.instanceof(GithubRepository);
			repositoryList[1].should.have.property('name');
			repositoryList[1].should.have.property('default_branch');
			repositoryList[1]['default_branch'].should.equal(defaultBranchName);
		});
	});

	describe('create github webhooks', function () {

		it('should create webhook for a single repo', async() => {
			//given
			const repoName = 'some-repo';
			const secret = 'webhook-secret';
			const payloadUrl = 'https://github-webhook-proxy/webhook?targetUrl=https://jenkins.some-jenkins.com/github-webhook/';
			const events = [
				'push',
				'pull_request'
			];
			const orgName = 'some-org';
			const webhookConfig = new WebhookConfig(repoName, secret, events, payloadUrl);

			githubApi.post(
				`/repos/${orgName}/${repoName}/hooks`,
				_getWebhooksPayloadFor(events, payloadUrl, secret)
			).reply(201, createWebhookResponse);
	
			//when
			const res = await migrate.createWebhook([webhookConfig], orgName);
	
			//then
			expect(res[0].status).to.equal(201);
		});

		it('should create webhook for multiple repos', async() => {
			//given
			const repoName1 = 'some-repo-1';
			const repoName2 = 'some-repo-2';
			const secret1 = 'webhook-secret-1';
			const secret2 = 'webhook-secret-2';
			const payloadUrl = 'https://github-webhook-proxy/webhook?targetUrl=https://jenkins.some-jenkins.com/github-webhook/';
			const events = [
				'push',
				'pull_request'
			];
			const orgName = 'some-org';
			const webhookConfig1 = new WebhookConfig(repoName1, secret1, events, payloadUrl);
			const webhookConfig2 = new WebhookConfig(repoName2, secret2, events, payloadUrl);

			githubApi.post(
				`/repos/${orgName}/${repoName1}/hooks`,
				_getWebhooksPayloadFor(events, payloadUrl, secret1)
			).reply(201, createWebhookResponse);
	
			githubApi.post(
				`/repos/${orgName}/${repoName2}/hooks`,
				_getWebhooksPayloadFor(events, payloadUrl, secret2)
			).reply(201, createWebhookResponse);

			//when
			const res = await migrate.createWebhook([webhookConfig1, webhookConfig2], orgName);
	
			//then
			expect(res[0].status).to.equal(201);
			expect(res[1].status).to.equal(201);
		});

		it('should create webhook for other repo(s) when error received for anyone', async() => {
			//given
			const repoName1 = 'some-repo-1';
			const repoName2 = 'some-repo-2';
			const secret1 = 'webhook-secret-1';
			const secret2 = 'webhook-secret-2';
			const payloadUrl = 'https://github-webhook-proxy/webhook?targetUrl=https://jenkins.some-jenkins.com/github-webhook/';
			const events = [
				'push',
				'pull_request'
			];
			const orgName = 'some-org';
			const webhookConfig1 = new WebhookConfig(repoName1, secret1, events, payloadUrl);
			const webhookConfig2 = new WebhookConfig(repoName2, secret2, events, payloadUrl);

			githubApi.post(
				`/repos/${orgName}/${repoName1}/hooks`,
				_getWebhooksPayloadFor(events, payloadUrl, secret1)
			).reply(201, createWebhookResponse);
	
			githubApi.post(
				`/repos/${orgName}/${repoName2}/hooks`,
				_getWebhooksPayloadFor(events, payloadUrl, secret2)
			).reply(401);

			//when
			const res = await migrate.createWebhook([webhookConfig1, webhookConfig2], orgName);
	
			//then
			expect(res[0].status).to.equal(201);
			assert.isNotOk(res[1]);
		});
	
		it('should throw error while creating webhook', async() => {
			//given
			const repoName = 'second-repo';
			const secret = 'webhook-secret-2';
			const payloadUrl = 'https://github-webhook-proxy/webhook?targetUrl=https://jenkins.some-jenkins.com/github-webhook/';
			const events = [
				'push',
				'pull_request'
			];
			const orgName = 'some-org';
			const webhookConfig = new WebhookConfig(repoName, secret, events, payloadUrl);

			githubApi.post(
				`/repos/${orgName}/${repoName}/hooks`,
				_getWebhooksPayloadFor(events, payloadUrl, secret))
				.reply(500, createWebhookResponse);
	
			//when
			const res = await migrate.createWebhook([webhookConfig], orgName);

			//then
			assert.isNotOk(res[0]);
		});

		let _getWebhooksPayloadFor = function (events, payloadUrl, secret) {
			return {
				'events': events,
				'config': {
					'url': payloadUrl,
					'content_type': 'json',
					'insecure_ssl': '0',
					'secret': secret
				}
			};
		};
	});
});
