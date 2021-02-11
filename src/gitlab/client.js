const axios = require('axios').default;
const Group = require('./model/group.js');
const Subgroup = require('./model/subgroup.js');
const logger = require('log4js').configure('./config/log4js.json').getLogger('GitlabClient');

function GitlabClient(url, privateToken) {
	this.url = url;
	this.privateToken = privateToken;

	this.getGroup = function(groupName) {
		const path = 'groups/' + groupName;
		const params = this._getParams('GET', path);

		return axios(params)
			.then(response => {
				return new Group(response.data);
			})
			.catch((error) => {
				if(error.response && error.response.status === 404) {
					logger.error('No group found with name:', groupName, error.message);
					throw new Error(`No group found with name ${groupName}`);
				}
				logger.error('Error while fetching GitLab group %s: %s', groupName, error.message);
				throw new Error(`Error while fetching GitLab group: ${groupName}`);
			});
	};

	this.getSubgroup = function(groupName, subgroupName) {
		const path = `groups/${groupName}${encodeURIComponent('/')}${subgroupName}`;
		const params = this._getParams('GET', path);

		return axios(params)
			.then(response => {
				return new Group(response.data);
			})
			.catch((error) => {
				logger.error(error);
				if(error.response && error.response.status === 404){
					logger.error('No subgroup found with name %s: %s', subgroupName, error.message);
					throw new Error(`No subgroup found with name ${subgroupName}`);
				}
				logger.error('Error while fetching subgroup %s: %s', subgroupName, error.message);
				throw new Error(`Error while fetching subgroup ${subgroupName}`);
			});
	};

	this.getSubgroups = function(groupName) {
		const path = `groups/${groupName}/subgroups`;
		const params = this._getParams('GET', path);

		return axios(params)
			.then(response => {
				let subgroups = [];
				response.data.forEach(function(subgroup) {
					subgroups.push(new Subgroup(subgroup.name));
				});
				return subgroups;
			})
			.catch((error) => {
				if(error.response && error.response.status === 404){
					logger.error('No group found with name %s, cant fetch subgroups: %s',groupName, error.message);
					throw new Error(`No group found with name ${groupName}, cant fetch subgroups`);
				}
				logger.error('Error while fetching subgroups for GitLab group %s: %s',groupName, error.message);
				throw new Error(`Error while fetching subgroups for GitLab group ${groupName}`);
			});
	};

	this.archiveProject = function (projectPath) {
		const path = 'projects/' + encodeURIComponent(projectPath) + '/archive';
		const params = this._getParams('POST', path);

		return axios(params)
			.then(response => {
				logger.info('Archived project %s with status %s', projectPath, response.status);
				return response;
			})
			.catch((error) => {
				if(error.response && error.response.status === 404) {
					logger.error('No project found in the path %s for archiving: %s',projectPath, error.message);
					throw new Error(`No project found in the path ${projectPath}, for archiving`);
				}
				logger.error('Error while archiving project %s: %s', projectPath, error.message);
				throw new Error(`Error while archiving project ${projectPath}`);
			});
	};

	this._getParams = function (method, path) {
		return {
			url: `https://${this.url}/api/v4/${path}`,
			method: method,
			headers: {
				'Content-Type': 'application/json',
				'User-Agent': 'gl2gh',
				'Private-Token': this.privateToken
			}
		};
	};
}

module.exports = GitlabClient;