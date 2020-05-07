var assert = require('assert');
var should = require('chai').should();
var Group = require('../../../src/gitlab/group.js');
var Project = require('../../../src/gitlab/project.js');
var groupDetails = require('../../resources/groupDetails.json')

describe('Group', function() {
  describe('#getAllProjects()', function() {
    it('should return list of all projects', function() {
      //given
      var group = new Group(groupDetails)
      //when
      var projectList = group.getAllProjects()
      //then
      projectList.should.be.an('array');
      projectList.should.have.lengthOf(3);
      projectList[0].should.be.a('object');
      projectList[0].should.be.instanceof(Project);
      projectList[0].should.have.property('name')
      projectList[0].should.have.property('ssh_url_to_repo')
    });
  });
});