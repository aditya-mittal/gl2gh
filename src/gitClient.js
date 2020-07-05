const path = require('path')
const git = require('isomorphic-git')
const http = require('isomorphic-git/http/node')
const fs = require('fs')

function GitClient(gitlabUserName, gitlabToken, githubToken) {
  this.gitlabUserName = gitlabUserName;
  this.gitlabToken = gitlabToken;
  this.githubToken = githubToken;

  this.clone = function(https_url_to_repo, repo_name, path_to_clone_repo) {
    console.log('***********git clone called*****************')
    return git.clone({fs, http, path_to_clone_repo, url: https_url_to_repo})
  }

  this.addRemote = function(repo_path_on_local, remote_name, https_remote_url) {
    console.log('***********git addRemote called*****************')
    return git.addRemote({fs, dir: repo_path_on_local, remote: remote_name, url: https_remote_url})
  }

  this.push = function(repo_path_on_local, remote_name, branch_name) {
    console.log('***********git push called*****************')
    return git.push({fs, http, dir: repo_path_on_local, remote: remote_name,
                      ref: branch_name, onAuth: () => ({ username: this.githubToken })
                      })
  };
}

module.exports = GitClient;