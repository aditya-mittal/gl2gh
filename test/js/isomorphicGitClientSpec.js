var assert = require('chai').assert;
var should = require('chai').should();
var expect = require('chai').expect
var sinon = require('sinon');
const path = require('path')
const git = require('isomorphic-git')
const http = require('isomorphic-git/http/node')
const fs = require('fs')
var GitClient = require('../../src/isomorphicGitClient.js');

describe('Git', function() {
  var gitClient = new GitClient()
  describe('Clone', function() {
    var cloneStub
    before(() => {
      cloneStub = sinon.stub(git, 'clone');
    })

    after(() => {
      cloneStub.restore();
    })

    it('should clone the repo', async function() {
      //given
      var https_url_to_repo = "https://github.com/some-repo.git"
      var repo_name = "some-repo"
      const path_to_clone_repo = path.join(process.cwd(), '/tmp','migrate', repo_name)
      cloneStub.withArgs({fs, http, path_to_clone_repo, url: https_url_to_repo}).returns(Promise.resolve());
      //when
      await gitClient.clone(https_url_to_repo, repo_name, path_to_clone_repo)
      //then
      assert(git.clone.calledWithMatch({fs, http, path_to_clone_repo, url: https_url_to_repo}));
      expect(cloneStub.called).to.equal(true)
    });

    it.only('should handle error when cloning the repo', async function() {
      //given
      var https_url_to_repo = "https://github.com/some-repo.git"
      var repo_name = "some-repo"
      const path_to_clone_repo = path.join(process.cwd(), '/tmp','migrate', repo_name)
      var errorDetails = {"error": "Error occurred while cloning the repo"}
      cloneStub.withArgs({fs, http, path_to_clone_repo, url: https_url_to_repo}).returns(Promise.reject(errorDetails));
      //when
      try {
        await gitClient.clone(https_url_to_repo, repo_name, path_to_clone_repo)
      } catch(err) {
        //then
        assert(git.clone.calledWithMatch({fs, http, path_to_clone_repo, url: https_url_to_repo}));
        assert.deepEqual(err, errorDetails)
      }
    });
  });
  describe('Remote', function() {
      var addRemoteStub

      before(() => {
        addRemoteStub = sinon.stub(git, 'addRemote');
      })

      after(() => {
        addRemoteStub.restore();
      })

      it('should add the remote for repo', async function() {
        //given
        var https_remote_url = "https://github.com/new-repo.git"
        var remote_name = "new_origin"
        var repo_path_on_local = path.join(process.cwd(), 'tmp','migrate', "some_repo")
        addRemoteStub.withArgs({fs, dir: repo_path_on_local, remote: remote_name, url: https_remote_url}).returns(Promise.resolve());
        //when
        await gitClient.addRemote(repo_path_on_local, remote_name, https_remote_url)
        //then
        assert(git.addRemote.calledWithMatch({fs, dir: repo_path_on_local, remote: remote_name, url: https_remote_url}));
      });
      it('should handle error when cloning the repo', async function() {
        //given
        var https_remote_url = "https://github.com/new-repo.git"
        var remote_name = "new_origin"
        var repo_path_on_local = path.join(process.cwd(), 'tmp','migrate', "some_repo")
        var errorDetails = {"error": "Error occurred while adding remote the repo"}
        addRemoteStub.withArgs({fs, dir: repo_path_on_local, remote: remote_name, url: https_remote_url}).returns(Promise.reject(errorDetails));
        //when
        try {
          await gitClient.addRemote(repo_path_on_local, remote_name, https_remote_url)
        } catch(err) {
          //then
          assert(git.addRemote.calledWithMatch({fs, dir: repo_path_on_local, remote: remote_name, url: https_remote_url}));
          assert.deepEqual(err, errorDetails)
        }
      });
    });
  describe('#push()', function() {
      var pushStub

      before(() => {
        pushStub = sinon.stub(git, 'push');
      })
      after(() => {
        pushStub.restore();
      })
      it('should push to the remote for repo', async function() {
        //given
        var remote_name = "new_origin"
        var branch_name = "master"
        var repo_path_on_local = path.join(process.cwd(), 'tmp','migrate', "some_repo")
        pushStub.withArgs({fs, http, dir: repo_path_on_local, remote: remote_name, ref: branch_name, onAuth: sinon.match.func}).returns(Promise.resolve());
        //when
        await gitClient.push(repo_path_on_local, remote_name, branch_name)
        //then
        sinon.assert.calledWith(pushStub, {fs, http, dir: repo_path_on_local, remote: remote_name, ref: branch_name, onAuth: sinon.match.func});
      });
      it('should handle error when pushing to remote', async function() {
          //given
          var remote_name = "new_origin"
          var branch_name = "master"
          var repo_path_on_local = path.join(process.cwd(), 'tmp','migrate', "some_repo")
          var errorDetails = {"error": "Error occurred while pushing to remote"}
          pushStub.withArgs({fs, http, dir: repo_path_on_local, remote: remote_name, ref: branch_name, onAuth: sinon.match.func}).returns(Promise.reject(errorDetails));
          //when
          try {
            await gitClient.push(repo_path_on_local, remote_name, branch_name)
          } catch(err) {
            //then
            sinon.assert.calledWith(pushStub, {fs, http, dir: repo_path_on_local, remote: remote_name, ref: branch_name, onAuth: sinon.match.func});
            assert.deepEqual(err, errorDetails)
          }
      });
    });
});