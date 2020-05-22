var Git = require("nodegit");
var config = require("./config.js");

function GitClient() {

  this.clone = function(https_url_to_repo, local_path, success_callback) {
    console.log('***********git clone called*****************')
    return Git.Clone(https_url_to_repo, local_path)
        .then((repository) => success_callback(repository))
        .catch((err) => {
          return {"message": `Cloning of repository ${https_url_to_repo} failed`, "error": err};
        });
  }

  this.createRemote = function(repo, remote_name, https_remote_url, success_callback) {
    console.log('***********git createRemote called*****************')
    return Git.Remote.create(repo, remote_name, https_remote_url)
        .then((remote) => success_callback(remote))
        .catch((err) => {
          return {"message": `Creation of remote ${remote_name} for ${https_remote_url} failed`, "error": err};
        });
  }

  this.pushToRemote = function(remote, ref_specs, success_callback) {
    var pushOptions = {
                        ignoreCertErrors: 1,
                        callbacks: {
                          certificateCheck: () => 1,
                          credentials: _getAuthCredentials,
                          transferProgress: {
                            throttle: 100
                          },
                        },
                      };
    return remote.push(ref_specs, pushOptions, success_callback)
  };

  var _getAuthCredentials = function() {
    var username = config.GITHUB_USERNAME
    var token = config.GITHUB_TOKEN
    return Git.Cred.userpassPlaintextNew(username, token);
  }
}

module.exports = GitClient;