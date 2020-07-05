const assert = require('assert');
const should = require('chai').should();
const Repository = require('../../../../src/github/model/repository.js');

describe('Repository', function() {
    it('must have name, clone_url & delete_branch_on_merge', function() {
      //given
      var name = "some-repo";
      var clone_url = "https://github.com/foo-user/some-repo.git";
      //when
      var repository = new Repository(name, clone_url, true)
      //then
      repository.should.be.a('object');
      repository.should.be.instanceof(Repository);
      repository.should.have.property('name')
      repository.should.have.property('clone_url')
      repository.should.have.all.keys('name', 'clone_url', 'delete_branch_on_merge');
      repository.name.should.equal(name)
      repository.clone_url.should.equal(clone_url)
      repository.delete_branch_on_merge.should.be.true
    });
});