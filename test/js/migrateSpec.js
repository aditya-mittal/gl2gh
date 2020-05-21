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
  var githubApi
  var gitCloneStub
  var gitCreateRemoteStub
  describe('migrate gitlab repo(s) to github', function() {
    beforeEach(() => {
      gitCloneStub = sinon.stub(Git, 'Clone');
      gitCreateRemoteStub = sinon.stub(Git.Remote, 'create');
      gitlabApi = nock(
                    GITLAB_URL, {
                      reqHeaders: {
                        'Content-Type': 'application/json',
                        'Private-Token': GITLAB_PRIVATE_TOKEN
                      }
                    }
                  )
      githubApi = nock(
                    GITHUB_API_URL, {
                      reqHeaders: {
                        'Content-Type': 'application/json',
                        'Authorization': 'token ' + GITHUB_PRIVATE_TOKEN
                      }
                    }
                  )
    });

    afterEach(() => {
      sinon.restore();
      nock.cleanAll();
    });

    it.only('should migrate all repos under the gitlab group to github', async function() {
      //given
      var gitlabGroupName = "FOO"
      var githubOrgName = "BAR"
      gitlabApi.get('/api/v4/groups/' + gitlabGroupName).reply(200, gitlabGroupDetails);
      githubApi.post('/user/repos/').thrice().reply(201, githubRepoDetails)
      gitCloneStub.returns(Promise.resolve(Git.Repository));
      gitCreateRemoteStub.returns(Promise.resolve(Git.Remote));
      var expectedRemote = Git.Remote
      gitCreateRemoteStub.returns(Promise.resolve(expectedRemote));
      //when
      await migrate.migrateToGithub(gitlabGroupName, githubOrgName)
      //then
      expect(gitCloneStub.calledThrice).to.equal(true);
      assert(gitCloneStub.calledWithMatch("https://gitlab.com/FOO/repository-1.git", "repository-1"));
      assert(gitCloneStub.calledWithMatch("https://gitlab.com/FOO/repository-2.git", "repository-2"));
      assert(gitCloneStub.calledWithMatch("https://gitlab.com/FOO/repository-3.git", "repository-3"));
//      expect(gitCreateRemoteStub.calledThrice).to.equal(true);
    });
  });
});
