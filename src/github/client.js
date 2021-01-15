const axios = require('axios').default;
const Repository = require('./model/repository.js');
const logger = require('log4js').configure('./config/log4js.json').getLogger('GithubClient');

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
					logger.error(error);
					throw new Error(`Unable to create repo: ${repoName}`);
				} else if(error.response.status === 422) {
					logger.warn(`Repository already exists with name: ${repoName}`);
					return this.getRepo(owner, repoName);
				} else {
					logger.error(`Unable to create repo: ${repoName}, error: ${error.message}`);
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
				logger.error(error);
				throw new Error(`Unable to get repo with name ${repoName}`);
			});
	};

	this.configureBranchProtectionRule = function (owner, repoName, branchName, rules) {
		logger.info('Configuring branch protection rule on %s', repoName);
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
		logger.debug(`Path : ${path}`);
		logger.debug(`Request Data : ${JSON.stringify(params)}`);

		return axios(params)
			.then(response => {
				logger.debug('Configured branch protection rule on %s', repoName);
				return response;
			})
			.catch((error) => {
				logger.error('Error configuring branch protection rule on %s of %s: %s', branchName, repoName, error.message);
				throw new Error(`Error configuring branch protection rule on ${branchName} of ${repoName}`);
			});
	};

	this.updateAutoDeleteHeadBranches = function (owner, repoName) {
		logger.info('Configuring auto delete head branches on merge on %s', repoName);
		const path = `repos/${owner}/${repoName}`;
		const data = {
			'delete_branch_on_merge': true
		};
		let params = this._getParams('PATCH', path);
		params.data = data;
		logger.debug(`Path : ${path}`);
		logger.debug(`Request Data : ${JSON.stringify(params)}`);

		return axios(params)
			.then(response => {
				return new Repository(response.data.name, response.data.clone_url,
					response.data.delete_branch_on_merge, response.data.default_branch);
			}).catch((error) => {
				logger.error('Error updating auto delete head branches on %s: %s', repoName, error.message);
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
				logger.info(`Default branch set to ${defaultBranchName}`);
				return new Repository(response.data.name, response.data.clone_url,
					response.data.delete_branch_on_merge, response.data.default_branch);
			}).catch((error) => {
				logger.error(error);
				throw new Error(`Unable to set default branch to ${defaultBranchName} for ${repoName}`);
			});
	};

	this.createWebhook = function (webhookConfig, orgName) {
		let path = `repos/${orgName}/${webhookConfig.repoName}/hooks`;
		const data = {
			'events': webhookConfig.events,
			'config': {
				'url': webhookConfig.payloadUrl,
				'content_type': 'json',
				'insecure_ssl': '0',
				'secret': webhookConfig.secret
			}
		};

		const params = this._getParams('POST', path);
		params.data = data;
		return axios(params)
			.then(response => {
				logger.info('Created webhook for %s', webhookConfig.repoName);
				return response;
			})
			.catch((error) => {
				logger.error(error);
				throw new Error(`Error creating webhook for repo ${webhookConfig.repoName}: ${error}`);
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