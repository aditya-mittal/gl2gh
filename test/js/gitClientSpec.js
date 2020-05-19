var assert = require('chai').assert;
var should = require('chai').should();
var expect = require('chai').expect
var sinon = require('sinon');
var GitClient = require('../../src/gitClient.js');
var Git = require("nodegit");

describe('Git', function() {
  var gitClient = new GitClient()
  describe('Clone', function() {
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
      expect(cloneStub.called).to.equal(true)
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
  describe('Remote', function() {
    var createRemoteStub

    before(() => {
      createRemoteStub = sinon.stub(Git.Remote, 'create');
    })

    after(() => {
      createRemoteStub.restore();
    })

    it('should create the remote for repo', async function() {
      //given
      var https_remote_url = "https://github.com/new-repo.git"
      var remote_name = "new_origin"
      var expectedRemote = Git.Remote
      var repo = Git.Repository.prototype
      createRemoteStub.withArgs(repo, remote_name, https_remote_url).returns(Promise.resolve(expectedRemote));
      //when
      var createdRemote = await gitClient.createRemote(repo, remote_name, https_remote_url, (remote) => remote)
      //then
      assert(Git.Remote.create.calledWithMatch(repo, remote_name, https_remote_url));
      assert(createdRemote, expectedRemote)
    });
  });

  describe('#push()', function() {
    var pushStub

    before(() => {
      pushStub = sinon.stub(Git.Remote.prototype, 'push').returns(Promise.resolve(0));
    })

    after(() => {
      pushStub.restore();
    })

    it('should push to the remote for repo', async function() {
      //given
      var remote = Git.Remote.prototype
      var ref_specs = ['refs/heads/*:refs/heads/*']
      //when
      var pushed = await gitClient.pushToRemote(remote, ref_specs, () => {})
      //then
      assert(remote.push.calledWithMatch(ref_specs));
    });
      it.skip('should push the repo', function() {
        //given
        var https_url_to_repo = "https://github.com/aditya-mittal/test-npm-git-clone.git"
        var local_path = "test-npm-git-clone"
        var expectedRepo = Git.Repository
        //when
        /*Git.Clone(https_url_to_repo, local_path)
            .then(function(repo) {
              console.log('cloned remote repo')
              return Git.Remote.create(repo, 'github', 'https://github.com/aditya-mittal/foo.git')
            }).catch((err) => {
              console.log("error: "+err);
            });*/



        var getAuthCredentials = function() {
          var username = "aditya-mittal"
          var token = "fb29e1e3033b11af00b7ab53eed646872903da6a"
          return Git.Cred.userpassPlaintextNew(username, token);
        }
        var pushToRemote = function(remote) {
          var pushOptions = {
                                ignoreCertErrors: 1,
                                callbacks: {
                                  certificateCheck: () => 1,
                                  credentials: getAuthCredentials,
                                  transferProgress: {
                                    throttle: 100
                                  },
                                },
                              };
          return remote.push(['refs/heads/master:refs/heads/master'], pushOptions, () => {});
        };

        Git.Repository.open(local_path)
          .then(function(repository) {
            console.log('getting remote')
            console.log(repository)
            return repository.getRemote('github', () => {});
          })
          .then(pushToRemote)
          .catch((err) => {
             console.log("error: "+err);
           });;


        /*var clonedRepo = await gitClient.clone(https_url_to_repo, local_path, (repo) => function(repo) {
          Git.Remote.delete(repo, 'origin')
        })*/
        //then
        //assert(Git.Clone.calledWithMatch(https_url_to_repo, local_path));
        //assert(clonedRepo, expectedRepo)
      });
      it.skip('actual - should update the remote for the repo', function() {
        //given
        var https_url_to_repo = "https://github.com/aditya-mittal/test-npm-git-clone.git"
        var local_path = "test-npm-git-clone"
        var expectedRepo = Git.Repository
        //when
        Git.Clone(https_url_to_repo, local_path)
            .then(function(repo) {
              console.log('cloned remote repo')
              console.log(repo)
              setTimeout(function() {
                Git.Remote.delete(repo, 'origin')
                  .then(() => {
                    console.log('Remote deleted successfully')
                  })
                  .catch((err) => {
                    console.log("errorError while deleting remote: "+err);
                  })
              }, 1000);
              setTimeout(function() {
                Git.Remote.create(repo, 'origin', 'https://github.com/aditya-mittal/foo.git')
                  .then(() => {
                    console.log('Remote created successfully')
                  })
                  .catch((err) => {
                    console.log("error: Error while creating remote: "+err);
                  })
              }, 3000);
            }).catch((err) => {
              console.log("error: " + err);
            });
        /*var clonedRepo = await gitClient.clone(https_url_to_repo, local_path, (repo) => function(repo) {
          Git.Remote.delete(repo, 'origin')
        })*/
        //then
        //assert(Git.Clone.calledWithMatch(https_url_to_repo, local_path));
        //assert(clonedRepo, expectedRepo)
      });
    });
});