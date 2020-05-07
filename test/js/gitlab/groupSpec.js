var assert = require('assert');
var should = require('chai').should();
var Group = require('../../../src/gitlab/group.js');
var groupDetails = require('../../resources/groupDetails.json')
describe('Group', function() {
  describe('#getAllProjects()', function() {
    it('should return list of all projects', function() {
      //given
      var group = new Group(groupDetails)
      //when
      var projectList = group.getAllProjects()
      //then
      projectList.should.be.a('array');
      projectList.should.have.lengthOf(3);
    });
  });
});