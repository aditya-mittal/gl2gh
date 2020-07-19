const axios = require('axios').default;
const Group = require('./model/group.js');
const Subgroup = require('./model/subgroup.js');

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
					console.error('No GitLab group found with name %s: %s', groupName, error.message);
					throw new Error(`No group found with name ${groupName}`);
				}
				console.error('Error while fetching GitLab group %s: %s', groupName, error.message);
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
				console.error(error);
				if(error.response && error.response.status === 404){
					console.error('No subgroup found with name %s: %s', subgroupName, error.message);
					throw new Error(`No subgroup found with name ${subgroupName}`);
				}
				console.error('Error while fetching subgroup %s: %s', subgroupName, error.message);
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
					console.error('No group found with name %s, cant fetch subgroups: %s',groupName, error.message);
					throw new Error(`No group found with name ${groupName}, cant fetch subgroups`);
				}
				console.error('Error while fetching subgroups for GitLab group %s: %s',groupName, error.message);
				throw new Error(`Error while fetching subgroups for GitLab group ${groupName}`);
			});
	};

	this.archiveRepo = function (projectPath) {
		const path = 'projects/' + encodeURIComponent(projectPath) + '/archive';
		const params = this._getParams('POST', path);
		console.log(path);

		return axios(params)
			.then(response => {
				console.log('Archived project %s with status %s', projectPath, response.status);
				return response.data;
			})   
			.catch((error) => {
				if(error.response && error.response.status === 404) {
					console.error('No project repo found in the path %s for archiving: %s',projectPath, error.message);
					throw new Error(`No project repo found in the path ${projectPath}, for archiving`);
				}
				console.error('Error while archiving project repo %s: %s', projectPath, error.message);
				throw new Error(`Error while archiving project repo ${projectPath}`);
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