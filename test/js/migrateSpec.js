var assert = require('assert');
var expect = require('chai').expect;
var should = require('chai').should();
var nock = require('nock');
var sinon = require('sinon');
const path = require('path')
const git = require('isomorphic-git')
const http = require('isomorphic-git/http/node')
const fs = require('fs')

var GitlabGroup = require('../../src/gitlab/model/group.js');
var GitlabSubgroup = require('../../src/gitlab/model/subgroup.js');
var GitlabProject = require('../../src/gitlab/model/project.js');
var GithubRepository = require('../../src/github/model/repository.js');
var Migrate = require('../../src/migrate.js');
var githubRepoDetails = require('../resources/github/repoDetails.json')
var gitlabGroupDetails = require('../resources/gitlab/groupDetails.json')
var gitlabSubgroupsList = require('../resources/gitlab/subgroupsList.json')
var gitlabSubgroup1Details = require('../resources/gitlab/subgroup1Details.json')
var gitlabSubgroup2Details = require('../resources/gitlab/subgroup2Details.json')

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
  var gitPushToRemoteStub
  describe('migrate gitlab repo(s) to github', function() {
    before(() => {
      gitCloneStub = sinon.stub(git, 'clone');
      gitCreateRemoteStub = sinon.stub(git, 'addRemote');
      gitPushToRemoteStub = sinon.stub(git, 'push');
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

    after(() => {
      sinon.restore();
      nock.cleanAll();
    });

    it('should migrate all repos under the gitlab group to github', async () =>  {
      //given
      var gitlabGroupName = "FOO"
      var githubOrgName = "BAR"
      gitlabApi.get('/api/v4/groups/' + gitlabGroupName).times(2).reply(200, gitlabGroupDetails);
      gitlabApi.get('/api/v4/groups/'+gitlabGroupName+'/subgroups').reply(200, gitlabSubgroupsList);
      gitlabApi.get('/api/v4/groups/'+gitlabGroupName+encodeURIComponent("/")+"subgroup1").reply(200, gitlabSubgroup1Details);
      gitlabApi.get('/api/v4/groups/'+gitlabGroupName+encodeURIComponent("/")+"subgroup2").reply(200, gitlabSubgroup2Details);
      githubApi.post('/user/repos/').times(8).reply(201, githubRepoDetails)
      gitCloneStub.returns(Promise.resolve());
      gitCreateRemoteStub.returns(Promise.resolve());
      gitPushToRemoteStub.returns(Promise.resolve());
      //when
      try {
        var result = await migrate.migrateToGithub(gitlabGroupName, githubOrgName)
        //then
        result.map(() => {
          sinon.assert.callCount(gitCloneStub, 8)
          sinon.assert.callCount(gitCreateRemoteStub, 8)
          sinon.assert.callCount(gitPushToRemoteStub, 8)
        });
      } catch (err) {
        throw err;
      }
    });

    it('should handle error gracefully when details for gitlab group not found', async () =>  {
      //given
      var gitlabGroupName = "FOO"
      var githubOrgName = "BAR"
      gitlabApi.get('/api/v4/groups/' + gitlabGroupName).reply(404);
      //when
      try {
        await migrate.migrateToGithub(gitlabGroupName, githubOrgName)
      } catch(err) {
        assert.deepEqual(err, { 'message': `No group found with name ${gitlabGroupName}` })
        return
      }
    });
  });
});
