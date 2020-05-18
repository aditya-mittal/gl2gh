var should = require('chai').should();
var Group = require('../../../../src/gitlab/model/group.js');
var Project = require('../../../../src/gitlab/model/project.js');
var groupDetails = require('../../../resources/gitlab/groupDetails.json')

describe('Group', function() {
  describe('#getProjects()', function() {
    it('should return list of all projects', function() {
      //given
      var group = new Group(groupDetails)
      //when
      var projectList = group.getProjects()
      //then
      projectList.should.be.an('array');
      projectList.should.have.lengthOf(3);
      projectList[0].should.be.a('object');
      projectList[0].should.be.instanceof(Project);
      projectList[0].should.have.property('name')
      projectList[0].should.have.property('http_url_to_repo')
    });
  });
});