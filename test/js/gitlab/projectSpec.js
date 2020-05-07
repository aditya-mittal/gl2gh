var assert = require('assert');
var should = require('chai').should();
var Group = require('../../../src/gitlab/group.js');
var Project = require('../../../src/gitlab/project.js');
var groupDetails = require('../../resources/groupDetails.json')
describe('Project', function() {
  describe('#getProjectDetail()', function() {
    it('should return project detail with name and ssh_url', function() {
      //given
      var group = new Group(groupDetails)
      var projectList = group.getAllProjects()
      var project = new Project(projectList[0])
      //when
      var projectDetails = project.getProjectDetails()
      //then
      projectDetails.should.be.a('object');
      projectDetails.should.have.property('ssh_url_to_repo')
      projectDetails.should.have.property('name')
    });
  });
});