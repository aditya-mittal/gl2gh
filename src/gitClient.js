const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');
const fs = require('fs');

function GitClient(gitlabUserName, gitlabToken, githubToken) {
	this.gitlabUserName = gitlabUserName;
	this.gitlabToken = gitlabToken;
	this.githubToken = githubToken;

	this.clone = function(httpsRemoteUrl, pathToCloneRepo, remoteName) {
		return git.clone({ fs, http, dir: pathToCloneRepo, url: httpsRemoteUrl, remote: remoteName,
			onAuth: () => ({ username: this.gitlabUserName, password: this.gitlabToken }),
			onAuthFailure: () => {console.error('Cant authenticate with GitLab');}
		});
	};

	this.addRemote = function(repoPathOnLocal, remoteName, httpsRemoteUrl) {
		return git.addRemote({fs, dir: repoPathOnLocal, remote: remoteName, url: httpsRemoteUrl});
	};

	this.listBranches = async function(repoPathOnLocal, remoteName) {
		const branches = await git.listBranches({fs, dir: repoPathOnLocal, remote: remoteName});
		const filteredBranches = branches.filter(branch => branch !== 'HEAD');
		for (const branch of filteredBranches) {
			await git.checkout({fs, dir: repoPathOnLocal, ref: branch});
		}
		return filteredBranches;
	};

	this.push = function(repoPathOnLocal, remoteName, branchName) {
		return git.push({fs, http, dir: repoPathOnLocal, remote: remoteName,
			ref: branchName, onAuth: () => ({ username: this.githubToken }),
			onAuthFailure: () => {console.error('Cant authenticate with GitHub');}
		});
	};
}

module.exports = GitClient;