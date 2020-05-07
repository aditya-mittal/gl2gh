var assert = require('assert');
var should = require('chai').should();
var Project = require('../../../src/gitlab/project.js');

describe('Project', function() {
    it('must have name and ssh_url', function() {
      //given
      var name = "repository-1";
      var ssh_url_to_repo = "git@gitlab.com:FOO/repository-1.git";
      //when
      var project = new Project(name, ssh_url_to_repo)
      //then
      project.should.be.a('object');
      project.should.be.instanceof(Project);
      project.should.have.property('name')
      project.should.have.property('ssh_url_to_repo')
      project.should.have.all.keys('name', 'ssh_url_to_repo')
    });
});