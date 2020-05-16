var assert = require('assert');
var should = require('chai').should();
var Repository = require('../../../../src/github/model/repository.js');

describe('Repository', function() {
    it('must have name and clone_url', function() {
      //given
      var name = "some-repo";
      var clone_url = "https://github.com/foo-user/some-repo.git";
      //when
      var repository = new Repository(name, clone_url)
      //then
      repository.should.be.a('object');
      repository.should.be.instanceof(Repository);
      repository.should.have.property('name')
      repository.should.have.property('clone_url')
      repository.should.have.all.keys('name', 'clone_url')
      repository['name'].should.equal(name)
      repository['clone_url'].should.equal(clone_url)
    });
});