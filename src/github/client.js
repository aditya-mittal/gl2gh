const axios = require('axios').default;
const Repository = require('./model/repository.js');

function GithubClient(url, privateToken) {
	this.url = url;
	this.privateToken = privateToken;

	this.createRepo = function (repoName, isPrivate) {
		const path = 'user/repos';
		const data = {
			'name': repoName,
			'private': isPrivate
		};
		let params = this._getParams('POST', path);
		params.data = data;

		return axios(params)
			.then(response => {
				return new Repository(response.data.name, response.data.clone_url, response.data.delete_branch_on_merge);
			})
			.catch((error) => {
				console.error(error);
				throw new Error(`Unable to create repo: ${repoName}`);
			});
	};

	this.configureBranchProtectionRule = function (owner, repoName, branchName, rules) {
		console.info('Configuring branch protection rule on %s', repoName);
		const path = `repos/${owner}/${repoName}/branches/${branchName}/protection`;
		const data = {
			'required_status_checks': {
				'strict': true,
				'contexts': rules.required_status_checks_contexts
			},
			'required_pull_request_reviews': {
				'required_approving_review_count': rules.required_approving_review_count,
				'dismiss_stale_reviews': rules.dismiss_stale_reviews
			},
			'enforce_admins': rules.enforce_admins,
			'restrictions': null
		};
		let params = this._getParams('PUT', path);
		params.data = data;
		// Using a custom media header for Accept. For details, check here https://developer.github.com/changes/2018-03-16-protected-branches-required-approving-reviews/
		params.headers.Accept = 'application/vnd.github.luke-cage-preview+json';
		console.debug(`Path : ${path}`);
		console.debug(`Request Data : ${JSON.stringify(params)}`);

		return axios(params)
			.then(response => {
				console.debug('Configured branch protection rule on %s', repoName);
				return response;
			})
			.catch((error) => {
				console.error('Error configuring branch protection rule on %s of %s: %s', branchName, repoName, error.message);
				throw new Error(`Error configuring branch protection rule on ${branchName} of ${repoName}`);
			});
	};

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
	};
}

module.exports = GithubClient;