var assert = require('assert');
var should = require('chai').should();
var nock = require('nock');
var GitlabClient = require('../../../src/gitlab/client.js');
var Group = require('../../../src/gitlab/model/group.js');
var Project = require('../../../src/gitlab/model/project.js');
var groupDetails = require('../../resources/groupDetails.json')

describe('Gitlab client', function() {
  var GITLAB_URL = "gitlab.com"
  var GITLAB_PRIVATE_TOKEN = "some_private_token"

  var gitlabClient = new GitlabClient(GITLAB_URL, GITLAB_PRIVATE_TOKEN)
  describe('#getGroupDetails', function() {
    beforeEach(() => {
      nock('https://gitlab.com', {
        reqHeaders: {
          'Content-Type': 'application/json',
          'Private-Token': GITLAB_PRIVATE_TOKEN
        }
      }).get('/api/v4/groups/FOO')
      .reply(200, groupDetails);
    });

    it('should return details for the group with name FOO', async() => {
      //given
      var groupName = "FOO"
      //when
      var group = await gitlabClient.getGroupDetails(groupName)
      //then
      var projectList = group.getProjects()
      projectList.should.be.an('array');
      projectList.should.have.lengthOf(3);
      projectList[0].should.be.a('object');
      projectList[0].should.be.instanceof(Project);
      projectList[0].should.have.property('name')
      projectList[0].should.have.property('ssh_url_to_repo')
    });

    it('should throw error when group not found', async() => {
      //given
      var groupName = "non-existing-group"
      //when
      try {
        var group = await gitlabClient.getGroupDetails(groupName)
        // a failing assert here is a bad idea, since it would lead into the catch clause…
      } catch (err) {
        // optional, check for specific error (or error.type, error. message to contain …)
        assert.deepEqual(err, { 'message': `No group found with name ${groupName}` })
        return  // this is important
      }
      assert.isOk(false, 'timeOut must throw')
    });
  });
});