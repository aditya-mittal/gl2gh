const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const assert = chai.assert;
const expect = chai.expect;
const should = require('chai').should();
const nock = require('nock');
const config = require('config');

const GithubClient = require('../../../src/github/client.js');
const Repository = require('../../../src/github/model/repository.js');
const BranchProtectionRule = require('../../../src/github/model/branchProtectionRule.js');
const WebhookError = require('../../../src/github/error/webhookError.js');
const repoDetails = require('../../resources/github/repoDetails.json');
const updateBranchProtectionResponse = require('../../resources/github/updateBranchProtectionResponse.json');
const createWebhookResponse = require('../../resources/github/createWebhookResponse.json');

describe('Github client', function() {
	const GITHUB_API_URL = config.get('gl2gh.github.url');
	const GITHUB_PRIVATE_TOKEN = config.get('gl2gh.github.token');
	const GITHUB_USERNAME = config.get('gl2gh.github.username');
	const githubClient = new GithubClient(GITHUB_API_URL, GITHUB_USERNAME, GITHUB_PRIVATE_TOKEN);
	let api;
	beforeEach(() => {
		api = nock(
			'https://' + GITHUB_API_URL, {
				reqHeaders: {
					'Content-Type': 'application/json',
					'User-Agent': 'gl2h',
					'Authorization': 'token ' + GITHUB_PRIVATE_TOKEN
				}
			}
		);
	});
	afterEach(() => {
		nock.cleanAll();
	});
	describe('#createRepo', function() {
		it('should create new repo under specified github org', async() => {
			//given
			const repoName = 'some-repo';
			const isPrivate = true;
			const orgName = 'some-org';
			api.post(`/orgs/${orgName}/repos`).reply(201, repoDetails);
			//when
			const repository = await githubClient.createRepo(repoName, isPrivate, orgName);
			//then
			repository.should.be.a('object');
			repository.should.be.instanceof(Repository);
			repository.should.have.property('name');
			repository.should.have.property('clone_url');
			repository.should.have.property('delete_branch_on_merge');
			repository['name'].should.equal(repoName);
		});
		it('should create new repo under user root when github org is not specified', async() => {
			//given
			const repoName = 'some-repo';
			const isPrivate = true;
			api.post('/user/repos').reply(201, repoDetails);
			//when
			const repository = await githubClient.createRepo(repoName, isPrivate);
			//then
			repository.should.be.a('object');
			repository.should.be.instanceof(Repository);
			repository.should.have.property('name');
			repository.should.have.property('clone_url');
			repository.should.have.property('delete_branch_on_merge');
			repository['name'].should.equal(repoName);
		});
		it('should return already existing repo under github org', async() => {
			//given
			const alreadyExistingRepoName = 'some-repo';
			const isPrivate = true;
			const orgName = 'some-org';
			const owner = orgName;
			api.post(`/orgs/${orgName}/repos`).reply(422);
			api.get(`/repos/${owner}/${alreadyExistingRepoName}`).reply(201, repoDetails);
			//when
			const repository = await githubClient.createRepo(alreadyExistingRepoName, isPrivate, orgName);
			//then
			repository.should.be.a('object');
			repository.should.be.instanceof(Repository);
			repository.should.have.property('name');
			repository.should.have.property('clone_url');
			repository.should.have.property('delete_branch_on_merge');
			repository['name'].should.equal(alreadyExistingRepoName);
		});
		it('should return already existing repo under user root when github org is not specified', async() => {
			//given
			const alreadyExistingRepoName = 'some-repo';
			const isPrivate = true;
			const owner = GITHUB_USERNAME;
			api.post('/user/repos').reply(422);
			api.get(`/repos/${owner}/${alreadyExistingRepoName}`).reply(201, repoDetails);
			//when
			const repository = await githubClient.createRepo(alreadyExistingRepoName, isPrivate);
			//then
			repository.should.be.a('object');
			repository.should.be.instanceof(Repository);
			repository.should.have.property('name');
			repository.should.have.property('clone_url');
			repository.should.have.property('delete_branch_on_merge');
			repository['name'].should.equal(alreadyExistingRepoName);
		});
		it('should not fail when 422 status received while creating repo - that is repository already exists', async() => {
			//given
			const alreadyExistingRepoName = 'some-already-existing-repo';
			const isPrivate = true;
			const owner = GITHUB_USERNAME;
			api.post('/user/repos').reply(422);
			api.get(`/repos/${owner}/${alreadyExistingRepoName}`).reply(201, repoDetails);
			//when
			const promise = githubClient.createRepo(alreadyExistingRepoName, isPrivate);
			//then
			return promise.should.be.fulfilled;
		});
		it('should throw error when non 201 status received while creating repo', async() => {
			//given
			const repoName = 'errored-repo';
			const isPrivate = true;
			api.post('/user/repos').reply(404);
			//when & then
			return assert.isRejected(
				githubClient.createRepo(repoName, isPrivate),
				Error,
				'Unable to create repo: error'
			);
		});
		it('should throw error when error obtained while creating repo', async() => {
			//given
			const repoName = 'error';
			const isPrivate = true;
			api.post('/user/repos').replyWithError('some error occurred while creating repo');
			//when & then
			return assert.isRejected(
				githubClient.createRepo(repoName, isPrivate),
				Error,
				'Unable to create repo: error'
			);
		});
	});
	describe('#getRepo', function() {
		it('should get the repo based on name provided', async () => {
			//given
			const owner = 'foo-user';
			const repoName = 'some-repo';
			api.get(`/repos/${owner}/${repoName}`).reply(201, repoDetails);
			//when
			const repository = await githubClient.getRepo(owner, repoName);
			//then
			repository.name.should.equal(repoName);
			repository.clone_url.should.equal('https://github.com/foo-user/some-repo.git');
		});
		it('should throw error when github returns 404 on get repo', async () => {
			//given
			const owner = 'foo-user';
			const repoName = 'some-repo';
			api.get(`/repos/${owner}/${repoName}`).reply(404);
			//when
			return assert.isRejected(
				githubClient.getRepo(owner, repoName),
				Error,
				`Unable to get repo with name ${repoName}`);
		});
	});
	describe('#configureBranchProtectionRule', function () {
		it('should configure branch protection rule for the repo', async () => {
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
			api.put(`/repos/${owner}/${repoName}/branches/${branchName}/protection`).reply(200, updateBranchProtectionResponse);
			//when
			const res = await githubClient.configureBranchProtectionRule(owner, repoName, branchName, new BranchProtectionRule(rules));
			//then
			expect(res.status).to.equal(200);
			expect(res.data.required_status_checks.contexts).to.deep.equal(required_status_checks_contexts);
			expect(res.data.required_pull_request_reviews.required_approving_review_count).to.equal(required_approving_review_count);
			expect(res.data.required_pull_request_reviews.dismiss_stale_reviews).to.equal(dismiss_stale_reviews);
			expect(res.data.enforce_admins.enabled).to.equal(enforce_admins);
		});
		it('should throw error when non 200 response obtained while configure branch protection rule for the repo', async () => {
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
			api.put(`/repos/${owner}/${repoName}/branches/${branchName}/protection`).reply(415);
			//when & then
			return assert.isRejected(
				githubClient.configureBranchProtectionRule(owner, repoName, branchName, new BranchProtectionRule(rules)),
				Error,
				'Error configuring branch protection rule on ' +branchName+ ' of ' +repoName);
		});
	});
	describe('#updateAutoDeleteHeadBranches', function () {
		it('should update auto delete head branches for the repo', async () => {
			//given
			const owner = 'some-org';
			const repoName = 'some-repo';
			api.patch(`/repos/${owner}/${repoName}`).reply(200, repoDetails);
			//when
			const repository = await githubClient.updateAutoDeleteHeadBranches(owner, repoName);
			//then
			repository.should.be.a('object');
			repository.should.be.instanceof(Repository);
			repository.should.have.property('name');
			repository.should.have.property('clone_url');
			repository.should.have.property('delete_branch_on_merge');
			repository['name'].should.equal(repoName);
			repository['delete_branch_on_merge'].should.be.true;
		});
		it('should throw error when non 200 response obtained while updating auto delete head branches for the repo', async () => {
			//given
			const owner = 'some-org';
			const repoName = 'some-repo';
			api.patch(`/repos/${owner}/${repoName}`).reply(404);
			//when & then
			return assert.isRejected(
				githubClient.updateAutoDeleteHeadBranches(owner, repoName),
				Error,
				'Unable to update auto delete head branches on ' + repoName);
		});
	});
	describe('#updateDefaultBranch', function () {
		it('should update default branch for the repo', async () => {
			//given
			const owner = 'some-org';
			const repoName = 'some-repo';
			const defaultBranch = 'master';
			api.patch(`/repos/${owner}/${repoName}`).reply(200, repoDetails);
			//when
			const repository = await githubClient.updateDefaultBranch(owner, repoName, defaultBranch);
			//then
			repository.should.be.a('object');
			repository.should.be.instanceof(Repository);
			repository.should.have.property('name');
			repository.should.have.property('clone_url');
			repository.should.have.property('delete_branch_on_merge');
			repository.should.have.property('default_branch');
			repository['name'].should.equal(repoName);
			repository['default_branch'].should.equal(defaultBranch);
		});
		it('should throw error when non 200 response obtained while updating auto delete head branches for the repo', async () => {
			//given
			const owner = 'some-org';
			const repoName = 'some-repo';
			const defaultBranch = 'master';
			api.patch(`/repos/${owner}/${repoName}`).reply(404);
			//when & then
			return assert.isRejected(
				githubClient.updateDefaultBranch(owner, repoName, defaultBranch),
				Error,
				`Unable to set default branch to ${defaultBranch} for ${repoName}`);
		});
	});

	describe('#create webhooks', () => {
		api = nock(
			`https:// ${GITHUB_API_URL}`, {
				reqHeaders: {
					'Content-Type': 'application/json',
					'Authorization': `token ${GITHUB_PRIVATE_TOKEN}`
				}
			});

		afterEach(() => {
			nock.cleanAll();
		});

		it('should create webhook', async() => {
			//given
			const repoName = 'test-webhooks';
			const secret = 'webhooks-secret';
			const payloadUrl = 'https://github-webhook-proxy/webhook?targetUrl=https://jenkins.some-jenkins.com/github-webhook/';
			const events = [
				'push',
				'pull_request'
			];
			const orgName = 'some-org';
			api.post(`/repos/${orgName}/${repoName}/hooks`).reply(201, createWebhookResponse);
		
			//when
			const res = await githubClient.createWebhook(repoName, secret, events, payloadUrl, orgName);
		
			//then
			expect(res.status).to.equal(201);
			expect(res.data.events).to.eql(['pull_request','push']);
		});

		it('should throw WebhookError when creating a webhook returns 422', async() => {
			//given
			const repoName = 'test-webhooks';
			const secret = 'webhooks-secret';
			const payloadUrl = 'https://github-webhook-proxy/webhook?targetUrl=https://jenkins.some-jenkins.com/github-webhook/';
			const events = [
				'push',
				'pull_request'
			];
			const orgName = 'some-org';
			api.post(`/repos/${orgName}/${repoName}/hooks`).reply(422, createWebhookResponse);
			
			//when
			//then
			return assert.isRejected(
				githubClient.createWebhook(repoName, secret, events, payloadUrl, orgName),
				WebhookError, `Webhook already exists for repo ${repoName}`
			);
		});
	});
});