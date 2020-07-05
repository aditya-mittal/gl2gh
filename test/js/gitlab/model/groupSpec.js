const should = require('chai').should();
const Group = require('../../../../src/gitlab/model/group.js');
const Project = require('../../../../src/gitlab/model/project.js');
const groupDetails = require('../../../resources/gitlab/groupDetails.json')

describe('Group', function() {
  describe('#getProjects()', function() {
    it('should return list of all projects', function() {
      //given
      const group = new Group(groupDetails)
      //when
      const projectList = group.getProjects()
      //then
      projectList.should.be.an('array');
      projectList.should.have.lengthOf(3);
      projectList[0].should.be.a('object');
      projectList[0].should.be.instanceof(Project);
      projectList[0].should.have.property('name')
      projectList[0].should.have.property('http_url_to_repo')
      projectList[0].should.have.property('description')
    });
    it('should return list of all shared projects', function() {
      //given
      const group = new Group(groupDetails)
      //when
      const projectList = group.getSharedProjects()
      //then
      projectList.should.be.an('array');
      projectList.should.have.lengthOf(1);
      projectList[0].should.be.a('object');
      projectList[0].should.be.instanceof(Project);
      projectList[0].should.have.property('name')
      projectList[0].should.have.property('http_url_to_repo')
      projectList[0].should.have.property('description')
    });
  });
});