const axios = require('axios').default;
const Repository = require('./model/repository.js');

function GithubClient(url, privateToken) {
  this.url = url
  this.privateToken = privateToken

  this.createRepo = function (repoName, isPrivate) {
    const path = 'user/repos';
    const data = {
      "name": repoName,
      "private": isPrivate
    }
    let params = this._getParams('POST', path);
    params.data = data;

    return axios(params)
      .then(response => {
        return new Repository(response.data.name, response.data.clone_url, response.data.delete_branch_on_merge);
      })
      .catch((error) => {
        console.error(error)
        throw new Error(`Unable to create repo: ${repoName}`);
      });
  }

  this._getParams = function (method, path) {
    return {
      url: `https://${this.url}/${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'gl2gh',
        'Authorization': 'token ' + this.privateToken
      }
    };
  }
}

module.exports = GithubClient;