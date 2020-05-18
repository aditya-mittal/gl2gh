var assert = require('assert');
var should = require('chai').should();
var nock = require('nock');
var GitlabClient = require('../../../src/gitlab/client.js');
var Group = require('../../../src/gitlab/model/group.js');
var Project = require('../../../src/gitlab/model/project.js');
var groupDetails = require('../../resources/gitlab/groupDetails.json')

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
        projectList[0].should.have.property('ssh_url_to_repo')
      } catch(err) {
        return
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
});