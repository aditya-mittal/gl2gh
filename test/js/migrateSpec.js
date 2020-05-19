var assert = require('assert');
var expect = require('chai').expect;
var should = require('chai').should();
var nock = require('nock');
var sinon = require('sinon');
var Git = require("nodegit");

var GitlabGroup = require('../../src/gitlab/model/group.js');
var GitlabProject = require('../../src/gitlab/model/project.js');
var GithubRepository = require('../../src/github/model/repository.js');
var Migrate = require('../../src/migrate.js');
var githubRepoDetails = require('../resources/github/repoDetails.json')
var gitlabGroupDetails = require('../resources/gitlab/groupDetails.json')

describe('migrate', function() {
  var migrate = new Migrate()
  var GITLAB_URL = "https://gitlab.com"
  var GITLAB_PRIVATE_TOKEN = "some_private_token"

  var GITHUB_API_URL = "https://api.github.com"
  var GITHUB_PRIVATE_TOKEN = "some_private_token"

  var gitlabApi
  var gitCloneStub
  describe('migrate gitlab repo(s) to github', function() {
    before(() => {
      gitlabApi = nock(
                    GITLAB_URL, {
                      reqHeaders: {
                        'Content-Type': 'application/json',
                        'Private-Token': GITLAB_PRIVATE_TOKEN
                      }
                    }
                  )
      nock(
        GITHUB_API_URL, {
          reqHeaders: {
            'Content-Type': 'application/json',
            'Authorization': 'token ' + GITHUB_PRIVATE_TOKEN
          }
        }
      ).post('/user/repos/').reply(201, githubRepoDetails)
      nock(
        GITHUB_API_URL, {
          reqHeaders: {
            'Content-Type': 'application/json',
            'Authorization': 'token ' + GITHUB_PRIVATE_TOKEN
          }
        }
      ).post('/user/repos/').reply(201, githubRepoDetails)
      nock(
        GITHUB_API_URL, {
          reqHeaders: {
            'Content-Type': 'application/json',
            'Authorization': 'token ' + GITHUB_PRIVATE_TOKEN
          }
        }
      ).post('/user/repos/').reply(201, githubRepoDetails)
      gitCloneStub = sinon.stub(Git, 'Clone');
    });

    after(() => {
      nock.cleanAll()
      sinon.restore();
    });

    it('should migrate all repos under the gitlab group to github', function(done) {
      //given
      var gitlabGroupName = "FOO"
      var githubOrgName = "BAR"
      gitlabApi.get('/api/v4/groups/' + gitlabGroupName).reply(200, gitlabGroupDetails);
      var expectedRepo = Git.Repository
      gitCloneStub.returns(Promise.resolve(expectedRepo));
      //when
      migrate.migrateToGithub(gitlabGroupName, githubOrgName);
      done();
      //then
      assert(Git.Clone.called());
      expect(gitCloneStub.called).to.equal(true)
    });
  });
});
