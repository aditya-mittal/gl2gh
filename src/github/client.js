const axios = require('axios').default;
const Repository = require('./model/repository.js');
const WebhookError = require('./error/webhookError.js');

function GithubClient(url, username, privateToken) {
	this.url = url;
	this.username = username;
	this.privateToken = privateToken;

	this.createRepo = function (repoName, isPrivate, orgName) {
		let path;
		let owner;
		if(orgName !== undefined) {
			path = `orgs/${orgName}/repos`;
			owner = orgName;
		} else {
			path = 'user/repos';
			owner = this.username;
		}
		const data = {
			'name': repoName,
			'private': isPrivate
		};
		let params = this._getParams('POST', path);
		params.data = data;

		return axios(params)
			.then(response => {
				return new Repository(response.data.name, response.data.clone_url,
					response.data.delete_branch_on_merge, response.data.default_branch);
			})
			.catch((error) => {
				if(error.response === undefined) {
					console.error(error);
					throw new Error(`Unable to create repo: ${repoName}`);
				} else if(error.response.status === 422) {
					console.warn(`Repository already exists with name: ${repoName}`);
					return this.getRepo(owner, repoName);
				} else {
					console.error(`Unable to create repo: ${repoName}, error: ${error.message}`);
					throw new Error(`Unable to create repo: ${repoName}, error: ${error.message}`);
				}
			});
	};

	this.getRepo = function(owner, repoName) {
		const path = `repos/${owner}/${repoName}`;
		const data = {
			'name': repoName
		};
		let params = this._getParams('GET', path);
		params.data = data;

		return axios(params)
			.then(response => {
				return new Repository(response.data.name, response.data.clone_url,
					response.data.delete_branch_on_merge, response.data.default_branch);
			}).catch((error) => {
				console.error(error);
				throw new Error(`Unable to get repo with name ${repoName}`);
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

	this.updateAutoDeleteHeadBranches = function (owner, repoName) {
		console.info('Configuring auto delete head branches on merge on %s', repoName);
		const path = `repos/${owner}/${repoName}`;
		const data = {
			'delete_branch_on_merge': true
		};
		let params = this._getParams('PATCH', path);
		params.data = data;
		console.debug(`Path : ${path}`);
		console.debug(`Request Data : ${JSON.stringify(params)}`);

		return axios(params)
			.then(response => {
				return new Repository(response.data.name, response.data.clone_url,
					response.data.delete_branch_on_merge, response.data.default_branch);
			}).catch((error) => {
				console.error('Error updating auto delete head branches on %s: %s', repoName, error.message);
				throw new Error(`Unable to update auto delete head branches on ${repoName}`);
			});
	};

	this.updateDefaultBranch = function(owner, repoName, defaultBranchName) {
		const path = `repos/${owner}/${repoName}`;
		const data = {
			'default_branch': defaultBranchName
		};
		let params = this._getParams('PATCH', path);
		params.data = data;

		return axios(params)
			.then(response => {
				console.info(`Default branch set to ${defaultBranchName}`);
				return new Repository(response.data.name, response.data.clone_url,
					response.data.delete_branch_on_merge, response.data.default_branch);
			}).catch((error) => {
				console.error(error);
				throw new Error(`Unable to set default branch to ${defaultBranchName} for ${repoName}`);
			});
	};

	this.createWebhook = function (repoName, secret, events, payloadUrl, orgName) {
		var path = `repos/${orgName}/${repoName}/hooks`;
		var data = {
			'events': events,
			'config': {
				'url': payloadUrl,
				'content_type': 'json',
				'insecure_ssl': '0',
				'secret': secret
			}
		};

		var params = this._getParams('POST', path);
		params.data = data;

		return axios(params)
			.then(response => {
				console.info('Created webhook for %s', repoName);
				return response;
			})
			.catch((error) => {
				console.error(error);
				if (error.response.status === 422) {
					throw new WebhookError(error.response.status, `Webhook already exists for repo ${repoName}`);
				} else {
					console.error(error);
					throw new Error(`Error creating webhook for repo ${repoName}: ${error}`);
				}
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