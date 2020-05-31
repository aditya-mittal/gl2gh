var assert = require('assert');
var expect = require('chai').expect
var should = require('chai').should();
var nock = require('nock');
var GitlabClient = require('../../../src/gitlab/client.js');
var Group = require('../../../src/gitlab/model/group.js');
var Project = require('../../../src/gitlab/model/project.js');
var Subgroup = require('../../../src/gitlab/model/subgroup.js');
var groupDetails = require('../../resources/gitlab/groupDetails.json')
var subgroupsList = require('../../resources/gitlab/subgroupsList.json')
var subgroupDetails = require('../../resources/gitlab/subgroup1Details.json')

describe('Gitlab client', function() {
  var GITLAB_URL = "gitlab.com"
  var GITLAB_PRIVATE_TOKEN = "some_private_token"
  var api
  var gitlabClient = new GitlabClient(GITLAB_URL, GITLAB_PRIVATE_TOKEN)
  describe('#getGroup', function() {
    beforeEach(() => {
      api = nock(
              'https://gitlab.com', {
                reqHeaders: {
                  'Content-Type': 'application/json',
                  'Private-Token': GITLAB_PRIVATE_TOKEN
                }
              }
            )
    });

    afterEach(() => {
      nock.cleanAll()
    });

    it('should return details for the group with name FOO', async() => {
      //given
      var groupName = "FOO"
      api.get('/api/v4/groups/'+groupName).reply(200, groupDetails);
      //when
      var group = await gitlabClient.getGroup(groupName)
      //then
      try {
        var projectList = group.getProjects()
        projectList.should.be.an('array');
        projectList.should.have.lengthOf(3);
        projectList[0].should.be.a('object');
        projectList[0].should.be.instanceof(Project);
        projectList[0].should.have.property('name')
        projectList[0].should.have.property('http_url_to_repo')
      } catch(err) {
        throw err;
      }
    });

    it('should return shared-projects for the group with name FOO', async() => {
      //given
      var groupName = "FOO"
      api.get('/api/v4/groups/'+groupName).reply(200, groupDetails);
      //when
      var group = await gitlabClient.getGroup(groupName)
      //then
      try {
        var projectList = group.getSharedProjects()
        projectList.should.be.an('array');
        projectList.should.have.lengthOf(1);
        projectList[0].should.be.a('object');
        projectList[0].should.be.instanceof(Project);
        projectList[0].should.have.property('name')
        projectList[0].should.have.property('http_url_to_repo')
      } catch(err) {
        throw err;
      }
    });

    it('should throw error when group not found', async() => {
      //given
      var groupName = "non-existing-group"
      api.get('/api/v4/groups/'+groupName).reply(404);
      //when
      try {
        await gitlabClient.getGroup(groupName)
        // a failing assert here is a bad idea, since it would lead into the catch clause…
      } catch (err) {
        // optional, check for specific error (or error.type, error. message to contain …)
        assert.deepEqual(err, { 'message': `No group found with name ${groupName}` })
        return  // this is important
      }
    });

    it('should throw error when error obtained while fetching group', async() => {
      //given
      var groupName = "error"
      api.get('/api/v4/groups/'+groupName).replyWithError('some error occurred while fetching group');
      //when
      try {
        await gitlabClient.getGroup(groupName)
        // a failing assert here is a bad idea, since it would lead into the catch clause…
      } catch (err) {
        // optional, check for specific error (or error.type, error. message to contain …)
        assert.deepEqual(err, { 'message': 'Error while fetching group details' })
        return  // this is important
      }
    });
  });

  describe('#getSubgroups', function() {
      beforeEach(() => {
        api = nock(
                'https://gitlab.com', {
                  reqHeaders: {
                    'Content-Type': 'application/json',
                    'Private-Token': GITLAB_PRIVATE_TOKEN
                  }
                }
              )
      });

      afterEach(() => {
        nock.cleanAll()
      });

      it('should return list of subgroups within the group', async() => {
        //given
        var groupName = "FOO"
        api.get('/api/v4/groups/'+groupName+'/subgroups').reply(200, subgroupsList);
        //when
        var subgroups = await gitlabClient.getSubgroups(groupName)
        //then
        try {
          subgroups.should.be.an('array');
          subgroups.should.have.lengthOf(2);
          subgroups[0].should.be.a('object');
          subgroups[0].should.be.instanceof(Subgroup);
          subgroups[0].should.have.property('name')
        } catch(err) {
          throw err
        }
      });

      it('should throw error when fetching subgroups and group not found', async() => {
        //given
        var groupName = "non-existing-group"
        api.get('/api/v4/groups/'+groupName+'/subgroups').reply(404);
        //when
        try {
          await gitlabClient.getSubgroups(groupName)
          // a failing assert here is a bad idea, since it would lead into the catch clause…
        } catch (err) {
          // optional, check for specific error (or error.type, error. message to contain …)
          assert.deepEqual(err, { 'message': `No group found with name ${groupName}, cant fetch subgroups` })
          return  // this is important
        }
      });

      it('should throw error when error obtained while fetching subgroups', async() => {
        //given
        var groupName = "error"
        api.get('/api/v4/groups/'+groupName+'/subgroups').replyWithError('some error occurred while fetching group');
        //when
        try {
          await gitlabClient.getSubgroups(groupName)
          // a failing assert here is a bad idea, since it would lead into the catch clause…
        } catch (err) {
          // optional, check for specific error (or error.type, error. message to contain …)
          assert.deepEqual(err, { 'message': 'Error while fetching subgroups' })
          return  // this is important
        }
      });
    });

  describe('#getSubgroup', function() {
      beforeEach(() => {
        api = nock(
                'https://gitlab.com', {
                  reqHeaders: {
                    'Content-Type': 'application/json',
                    'Private-Token': GITLAB_PRIVATE_TOKEN
                  }
                }
              )
      });

      afterEach(() => {
        nock.cleanAll()
      });

      it('should return details for the subgroup with name subgroup1', async() => {
        //given
        var groupName = "FOO"
        var subgroupName = "subgroup1"
        api.get('/api/v4/groups/'+groupName+encodeURIComponent("/")+subgroupName).reply(200, subgroupDetails);
        //when
        var subgroup = await gitlabClient.getSubgroup(groupName, subgroupName)
        //then
        try {
          var projectList = subgroup.getProjects()
          projectList.should.be.an('array');
          projectList.should.have.lengthOf(2);
          projectList[0].should.be.a('object');
          projectList[0].should.be.instanceof(Project);
          projectList[0].should.have.property('name')
          projectList[0].should.have.property('http_url_to_repo')
        } catch(err) {
          throw err;
        }
      });

      it('should throw error when subgroup not found', async() => {
        //given
        var groupName = "FOO"
        var subgroupName = "non-existing-group"
        api.get('/api/v4/groups/'+groupName+encodeURIComponent("/")+subgroupName).reply(404);
        //when
        try {
          await gitlabClient.getSubgroup(groupName, subgroupName)
          // a failing assert here is a bad idea, since it would lead into the catch clause…
        } catch (err) {
          // optional, check for specific error (or error.type, error. message to contain …)
          assert.deepEqual(err, { 'message': `No subgroup found with name ${subgroupName}` })
          return  // this is important
        }
      });

      it('should throw error when error obtained while fetching subgroup', async() => {
        //given
        var groupName = "FOO"
        var subgroupName = "error"
        api.get('/api/v4/groups/'+groupName+encodeURIComponent("/")+subgroupName).replyWithError('some error occurred while fetching subgroup');
        //when
        try {
          await gitlabClient.getSubgroup(groupName, subgroupName)
          // a failing assert here is a bad idea, since it would lead into the catch clause…
        } catch (err) {
          // optional, check for specific error (or error.type, error. message to contain …)
          assert.deepEqual(err, { 'message': 'Error while fetching subgroup details' })
          return  // this is important
        }
      });
    });
});