const chai = require('chai');
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised);
const assert = chai.assert;
const expect = chai.expect
const should = require('chai').should();
const nock = require('nock');
const sinon = require('sinon');
const path = require('path')
const git = require('isomorphic-git')
const http = require('isomorphic-git/http/node')
const fs = require('fs')
const config = require('config');

const GitlabGroup = require('../../src/gitlab/model/group.js');
const GitlabSubgroup = require('../../src/gitlab/model/subgroup.js');
const GitlabProject = require('../../src/gitlab/model/project.js');
const GithubRepository = require('../../src/github/model/repository.js');
const Migrate = require('../../src/migrate.js');
const githubRepoDetails = require('../resources/github/repoDetails.json')
const gitlabGroupDetails = require('../resources/gitlab/groupDetails.json')
const gitlabSubgroupsList = require('../resources/gitlab/subgroupsList.json')
const gitlabSubgroup1Details = require('../resources/gitlab/subgroup1Details.json')
const gitlabSubgroup2Details = require('../resources/gitlab/subgroup2Details.json')

describe('migrate', function() {
  const migrate = new Migrate()
  const GITLAB_URL = config.get('gl2h.gitlab.url')
  const GITLAB_PRIVATE_TOKEN = config.get('gl2h.gitlab.token')

  const GITHUB_API_URL = config.get('gl2h.github.url')
  const GITHUB_PRIVATE_TOKEN = config.get('gl2h.github.token')

  let gitlabApi
  let githubApi
  let gitCloneStub
  let gitCreateRemoteStub
  let gitPushToRemoteStub
  let gitListBranchesStub
  let gitCheckoutStub
  beforeEach(() => {
    gitCloneStub = sinon.stub(git, 'clone');
    gitCreateRemoteStub = sinon.stub(git, 'addRemote');
    gitListBranchesStub = sinon.stub(git, 'listBranches');
    gitCheckoutStub = sinon.stub(git, 'checkout');
    gitPushToRemoteStub = sinon.stub(git, 'push');
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
    it('should migrate all repos under the gitlab group to github', async () =>  {
      //given
      const gitlabGroupName = "FOO"
      const githubOrgName = "BAR"
      gitlabApi.get('/api/v4/groups/' + gitlabGroupName).times(2).reply(200, gitlabGroupDetails);
      gitlabApi.get('/api/v4/groups/'+gitlabGroupName+'/subgroups').reply(200, gitlabSubgroupsList);
      gitlabApi.get('/api/v4/groups/'+gitlabGroupName+encodeURIComponent("/")+"subgroup1").reply(200, gitlabSubgroup1Details);
      gitlabApi.get('/api/v4/groups/'+gitlabGroupName+encodeURIComponent("/")+"subgroup2").reply(200, gitlabSubgroup2Details);
      githubApi.post('/user/repos/').times(8).reply(201, githubRepoDetails)
      gitCloneStub.returns(Promise.resolve());
      gitCreateRemoteStub.returns(Promise.resolve());
      gitListBranchesStub.returns(Promise.resolve(["master", "extra-branch"]));
      gitCheckoutStub.returns(Promise.resolve());
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
    });
    it('should handle error gracefully when details for gitlab group not found', async () =>  {
      //given
      const gitlabGroupName = "FOO"
      const githubOrgName = "BAR"
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
  describe('list gitlab repo(s) to migrate', function () {
    it('should list all projects under the gitlab group', async () => {
      //given
      const gitlabGroupName = "FOO";
      const projectNameFilter = '';
      gitlabApi.get('/api/v4/groups/' + gitlabGroupName).times(2).reply(200, gitlabGroupDetails);
      gitlabApi.get('/api/v4/groups/' + gitlabGroupName + '/subgroups').reply(200, gitlabSubgroupsList);
      gitlabApi.get('/api/v4/groups/' + gitlabGroupName + encodeURIComponent("/") + 'subgroup1').reply(200, gitlabSubgroup1Details);
      gitlabApi.get('/api/v4/groups/' + gitlabGroupName + encodeURIComponent("/") + 'subgroup2').reply(200, gitlabSubgroup2Details);

      //when
      const projectList = await migrate.getListOfAllProjectsToMigrate(gitlabGroupName, projectNameFilter);

      //then
      projectList.should.have.lengthOf(8);
      projectList[0].should.be.a('object');
      projectList[0].should.be.instanceof(GitlabProject);
      projectList[0].should.have.property('name')
      projectList[0].should.have.property('http_url_to_repo')
      const projectsName = projectList.map((project) => project.name);
      projectsName.should.deep.equal([ 'project1', 'project1', 'project2', 'project2', 'repository-1', 'repository-2', 'repository-3', 'shared-project1' ])
    });
    it('should list all projects under the gitlab group and filter them based on prefix', async () => {
      //given
      const gitlabGroupName = "FOO";
      let projectNameFilter = "repository-"
      gitlabApi.get('/api/v4/groups/' + gitlabGroupName).times(2).reply(200, gitlabGroupDetails);
      gitlabApi.get('/api/v4/groups/' + gitlabGroupName + '/subgroups').reply(200, gitlabSubgroupsList);
      gitlabApi.get('/api/v4/groups/' + gitlabGroupName + encodeURIComponent("/") + 'subgroup1').reply(200, gitlabSubgroup1Details);
      gitlabApi.get('/api/v4/groups/' + gitlabGroupName + encodeURIComponent("/") + 'subgroup2').reply(200, gitlabSubgroup2Details);

      //when
      const projectList = await migrate.getListOfAllProjectsToMigrate(gitlabGroupName, projectNameFilter);

      //then
      projectList.should.have.lengthOf(3);
      let projectsName = projectList.map((project) => project.name);
      projectsName.should.deep.equal(['repository-1', 'repository-2', 'repository-3'])
    });
    it('should handle error gracefully when trying to fetch list of all projects under gitlab group', async () => {
      //given
      const gitlabGroupName = "FOO";
      const projectNameFilter = '';
      gitlabApi.get('/api/v4/groups/' + gitlabGroupName).reply(404);

      return assert.isRejected(
        migrate.getListOfAllProjectsToMigrate(gitlabGroupName, projectNameFilter),
        Error,
        `No group found with name ${gitlabGroupName}`);
    });
  });
});
