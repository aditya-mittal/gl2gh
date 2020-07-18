const chai = require('chai');
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised);
const assert = chai.assert;
const expect = chai.expect
const should = require('chai').should();
const nock = require('nock');
const config = require('config');

const GithubClient = require('../../../src/github/client.js');
const Repository = require('../../../src/github/model/repository.js');
const BranchProtectionRule = require('../../../src/github/model/branchProtectionRule.js');
const repoDetails = require('../../resources/github/repoDetails.json')
const updateBranchProtectionResponse = require('../../resources/github/updateBranchProtectionResponse.json')

describe('Github client', function() {
  const GITHUB_API_URL = config.get('gl2gh.github.url')
  const GITHUB_PRIVATE_TOKEN = config.get('gl2gh.github.token')
  const githubClient = new GithubClient(GITHUB_API_URL, GITHUB_PRIVATE_TOKEN)
  let api
  beforeEach(() => {
    api = nock(
            'https://' + GITHUB_API_URL, {
              reqHeaders: {
                'Content-Type': 'application/json',
                'User-Agent': 'gl2h',
                'Authorization': 'token ' + GITHUB_PRIVATE_TOKEN
              }
            }
          )
  });
  afterEach(() => {
    nock.cleanAll()
  });
  describe('#createRepo', function() {
    it('should create new repo', async() => {
      //given
      const repoName = "some-repo"
      const isPrivate = true
      api.post('/user/repos').reply(201, repoDetails);
      //when
      const repository = await githubClient.createRepo(repoName, isPrivate)
      //then
      try {
        repository.should.be.a('object');
        repository.should.be.instanceof(Repository);
        repository.should.have.property('name');
        repository.should.have.property('clone_url');
        repository.should.have.property('delete_branch_on_merge');
        repository['name'].should.equal(repoName)
      } catch(err) {
        throw err
      }
    });
    it('should throw error when non 201 status received while creating repo', async() => {
      //given
      const repoName = "errored-repo"
      const isPrivate = true
      api.post('/user/repos/').reply(404);
      //when & then
      return assert.isRejected(
                      githubClient.createRepo(repoName, isPrivate),
                      Error,
                      'Unable to create repo: error'
                    );
    });
    it('should throw error when error obtained while creating repo', async() => {
      //given
      const repoName = "error"
      const isPrivate = true
      api.post('/user/repos/').replyWithError('some error occurred while creating repo');
      //when & then
      return assert.isRejected(
                            githubClient.createRepo(repoName, isPrivate),
                            Error,
                            'Unable to create repo: error'
                          );
    });
  });
  describe('#configureBranchProtectionRule', function () {
    beforeEach(() => {
      api = nock(
              'https://' + GITHUB_API_URL, {
                reqHeaders: {
                  'Content-Type': 'application/json',
                  'Authorization': 'token ' + GITHUB_PRIVATE_TOKEN
                }
              }
            )
    });

    afterEach(() => {
      nock.cleanAll()
    });
    it('should configure branch protection rule for the repo', async () => {
      //given
      const owner = 'some-org'
      const repoName = 'some-repo'
      const branchName = 'master'
      const required_status_checks_contexts = [
        "continuous-integration/jenkins/pr-merge",
        "continuous-integration/jenkins/branch"
      ];
      const required_approving_review_count = 1
      const dismiss_stale_reviews = true;
      const enforce_admins = true;
      const rules = {
                      "required_status_checks_contexts": required_status_checks_contexts,
                      "required_approving_review_count": required_approving_review_count,
                      "dismiss_stale_reviews": dismiss_stale_reviews,
                      "enforce_admins": enforce_admins
                    };
      api.put(`/repos/${owner}/${repoName}/branches/${branchName}/protection`).reply(200, updateBranchProtectionResponse);
      //when
      const res = await githubClient.configureBranchProtectionRule(owner, repoName, branchName, new BranchProtectionRule(rules))
      //then
      expect(res.status).to.equal(200)
      expect(res.data.required_status_checks.contexts).to.deep.equal(required_status_checks_contexts)
      expect(res.data.required_pull_request_reviews.required_approving_review_count).to.equal(required_approving_review_count)
      expect(res.data.required_pull_request_reviews.dismiss_stale_reviews).to.equal(dismiss_stale_reviews)
      expect(res.data.enforce_admins.enabled).to.equal(enforce_admins);
    });
    it('should throw error when non 200 response obtained while configure branch protection rule for the repo', async () => {
      //given
      const owner = 'some-org'
      const repoName = 'some-repo'
      const branchName = 'master'
      const required_status_checks_contexts = [
        "continuous-integration/jenkins/pr-merge",
        "continuous-integration/jenkins/branch"
      ];
      const required_approving_review_count = 1
      const dismiss_stale_reviews = true;
      const enforce_admins = true;
      const rules = {
                      "required_status_checks_contexts": required_status_checks_contexts,
                      "required_approving_review_count": required_approving_review_count,
                      "dismiss_stale_reviews": dismiss_stale_reviews,
                      "enforce_admins": enforce_admins
                    };
      api.put(`/repos/${owner}/${repoName}/branches/${branchName}/protection`).reply(415);
      //when & then
      return assert.isRejected(
                  githubClient.configureBranchProtectionRule(owner, repoName, branchName, new BranchProtectionRule(rules)),
                  Error,
                  "Error configuring branch protection rule on " +branchName+ " of " +repoName);
    });
  });
});