var assert = require('assert');
var should = require('chai').should();
var Project = require('../../../../src/gitlab/model/project.js');

describe('Project', function() {
    it('must have name and http_url', function() {
      //given
      var name = "repository-1";
      var http_url_to_repo = "https://gitlab.com/FOO/repository-1.git";
      //when
      var project = new Project(name, http_url_to_repo)
      //then
      project.should.be.a('object');
      project.should.be.instanceof(Project);
      project.should.have.property('name')
      project.should.have.property('http_url_to_repo')
      project.should.have.all.keys('name', 'http_url_to_repo')
    });
});