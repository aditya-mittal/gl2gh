var assert = require('chai').assert;
var should = require('chai').should();
var expect = require('chai').expect
var sinon = require('sinon');
var GitClient = require('../../src/gitClient.js');
var Git = require("nodegit");

describe('Git', function() {
  var gitClient = new GitClient()
  describe('#clone()', function() {
    var cloneStub
    before(() => {
      cloneStub = sinon.stub(Git, 'Clone');
    })

    after(() => {
      cloneStub.restore();
    })

    it('should clone the repo', async function() {
      //given
      var https_url_to_repo = "https://github.com/some-repo.git"
      var local_path = "some-repo"
      var expectedRepo = Git.Repository
      cloneStub.withArgs(https_url_to_repo, local_path).returns(Promise.resolve(expectedRepo));
      //when
      var clonedRepo = await gitClient.clone(https_url_to_repo, local_path, (repo) => repo)
      //then
      assert(Git.Clone.calledWithMatch(https_url_to_repo, local_path));
      assert(clonedRepo, expectedRepo)
    });

    it('should handle error when cloning the repo', async function() {
      //given
      var https_url_to_repo = "https://github.com/some-repo.git"
      var local_path = "some-repo"
      var errorDetails = 'Error occurred'
      cloneStub.withArgs(https_url_to_repo, local_path).returns(Promise.reject(errorDetails));
      //when
      var error = await gitClient.clone(https_url_to_repo, local_path, (repo) => repo)
      //then
      assert(Git.Clone.calledWithMatch(https_url_to_repo, local_path));
      assert.deepEqual(error, {"message": `Cloning of repository ${https_url_to_repo} failed`, "error": errorDetails})
    });
  });
});