const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
const sinon = require('sinon');
const path = require('path');
const fs = require('fs');
const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');
const config = require('config');

const GitClient = require('../../src/gitClient.js');

describe('Git', function() {
	const gitClient = new GitClient(config.get('gl2gh.gitlab.username'), config.get('gl2gh.gitlab.token'), config.get('gl2gh.github.token'));
	describe('Clone', function() {
		let cloneStub;
		before(() => {
			cloneStub = sinon.stub(git, 'clone');
		});
		after(() => {
			cloneStub.restore();
		});
		it('should clone the repo', async function() {
			//given
			const httpsRemoteUrl = 'https://github.com/some-repo.git';
			const repoName = 'some-repo';
			const pathToCloneRepo = path.join(process.cwd(), '/tmp','migrate', repoName);
			const remoteName = 'gitlab';
			cloneStub.withArgs({fs, http, pathToCloneRepo, url: httpsRemoteUrl, remote: remoteName}).returns(Promise.resolve());
			//when
			await gitClient.clone(httpsRemoteUrl, pathToCloneRepo, remoteName);
			//then
			sinon.assert.calledWith(cloneStub, {fs, http, dir: pathToCloneRepo, url: httpsRemoteUrl, remote: remoteName,
				onAuth: sinon.match.func, onAuthFailure: sinon.match.func});
			expect(cloneStub.called).to.equal(true);
		});
		it('should handle error when cloning the repo', async function() {
			//given
			const httpsRemoteUrl = 'https://github.com/some-repo.git';
			const repoName = 'some-repo';
			const pathToCloneRepo = path.join(process.cwd(), '/tmp','migrate', repoName);
			const remoteName = 'gitlab';
			const error = new Error('Error occurred while cloning the repo');
			cloneStub.withArgs({fs, http, pathToCloneRepo, url: httpsRemoteUrl, remote: remoteName}).returns(Promise.reject(error));
			//when
			try {
				await gitClient.clone(httpsRemoteUrl, pathToCloneRepo, remoteName);
			} catch(err) {
				//then
				sinon.assert.calledWith(cloneStub, { fs, http, dir: pathToCloneRepo, url: httpsRemoteUrl, remote: remoteName,
					onAuth: sinon.match.func, onAuthFailure: sinon.match.func });
				assert.deepEqual(err, error);
			}
		});
	});
	describe('Remote', function() {
		let addRemoteStub;
		before(() => {
			addRemoteStub = sinon.stub(git, 'addRemote');
		});
		after(() => {
			addRemoteStub.restore();
		});

		it('should add the remote for repo', async function() {
			//given
			const httpsRemoteUrl = 'https://github.com/new-repo.git';
			const remoteName = 'new_origin';
			const repoPathOnLocal = path.join(process.cwd(), 'tmp','migrate', 'some_repo');
			addRemoteStub.withArgs({fs, dir: repoPathOnLocal, remote: remoteName, url: httpsRemoteUrl}).returns(Promise.resolve());
			//when
			await gitClient.addRemote(repoPathOnLocal, remoteName, httpsRemoteUrl);
			//then
			assert(git.addRemote.calledWithMatch({fs, dir: repoPathOnLocal, remote: remoteName, url: httpsRemoteUrl}));
		});
		it('should handle error when adding the remote', async function() {
			//given
			const httpsRemoteUrl = 'https://github.com/new-repo.git';
			const remoteName = 'new_origin';
			const repoPathOnLocal = path.join(process.cwd(), 'tmp','migrate', 'some_repo');
			const error = new Error('Error occurred while adding remote the repo');
			addRemoteStub.withArgs({fs, dir: repoPathOnLocal, remote: remoteName, url: httpsRemoteUrl}).returns(Promise.reject(error));
			//when
			try {
				await gitClient.addRemote(repoPathOnLocal, remoteName, httpsRemoteUrl);
			} catch(err) {
				//then
				assert(git.addRemote.calledWithMatch({fs, dir: repoPathOnLocal, remote: remoteName, url: httpsRemoteUrl}));
				assert.deepEqual(err, error);
			}
		});
	});
	describe('#push()', function() {
		let pushStub;
		before(() => {
			pushStub = sinon.stub(git, 'push');
		});
		after(() => {
			pushStub.restore();
		});
		it('should push to the remote for repo', async function() {
			//given
			const remoteName = 'new_origin';
			const branchName = 'master';
			const repoPathOnLocal = path.join(process.cwd(), 'tmp','migrate', 'some_repo');
			pushStub.withArgs({ fs, http, dir: repoPathOnLocal, remote: remoteName, ref: branchName,
				onAuth: sinon.match.func, onAuthFailure: sinon.match.func
			})
				.returns(Promise.resolve());
			//when
			await gitClient.push(repoPathOnLocal, remoteName, branchName);
			//then
			sinon.assert.calledWith(pushStub, {fs, http, dir: repoPathOnLocal, remote: remoteName, ref: branchName,
				onAuth: sinon.match.func, onAuthFailure: sinon.match.func });
		});
		it('should handle error when pushing to remote', async function() {
			//given
			const remote_name = 'new_origin';
			const branch_name = 'master';
			const repo_path_on_local = path.join(process.cwd(), 'tmp','migrate', 'some_repo');
			const error = new Error('Error occurred while pushing to remote');
			pushStub.withArgs({fs, http, dir: repo_path_on_local, remote: remote_name, ref: branch_name}).returns(Promise.reject(error));
			//when
			try {
				await gitClient.push(repo_path_on_local, remote_name, branch_name);
			} catch(err) {
				//then
				sinon.assert.calledWith(pushStub, {fs, http, dir: repo_path_on_local, remote: remote_name, ref: branch_name, onAuth: sinon.match.func});
				assert.deepEqual(err, error);
			}
		});
	});
	describe('#list', function() {
		let listBranchesStub;
		let checkoutStub;
		before(() => {
			listBranchesStub = sinon.stub(git, 'listBranches');
			checkoutStub = sinon.stub(git, 'checkout');
		});
		after(() => {
			listBranchesStub.restore();
			checkoutStub.restore();
		});
		it('should list the branches for an already cloned repo', async function() {
			//given
			const repoPathOnLocal = path.join(process.cwd(), 'tmp','migrate', 'some_repo');
			const remoteName = 'origin';
			listBranchesStub.withArgs({fs, dir: repoPathOnLocal, remote: remoteName}).returns(Promise.resolve(['master', 'extra-branch']));

			//when
			const returnedBranchesList = await gitClient.listBranches(repoPathOnLocal, remoteName);

			//then
			sinon.assert.calledWith(listBranchesStub, {fs, dir: repoPathOnLocal, remote: remoteName});
			assert.deepEqual(returnedBranchesList, ['master', 'extra-branch']);
		});
		it('should checkout the branches and list', async function() {
			//given
			const repoPathOnLocal = path.join(process.cwd(), 'tmp','migrate', 'some_repo');
			const remoteName = 'origin';
			listBranchesStub.withArgs({fs, dir: repoPathOnLocal, remote: remoteName}).returns(Promise.resolve(['master', 'extra-branch']));

			//when
			const returnedBranchesList = await gitClient.listBranches(repoPathOnLocal, remoteName);

			//then
			sinon.assert.calledWith(listBranchesStub, {fs, dir: repoPathOnLocal, remote: remoteName});
			sinon.assert.calledWith(checkoutStub, {fs, dir: repoPathOnLocal, ref: 'master', remote: remoteName});
			sinon.assert.calledWith(checkoutStub, {fs, dir: repoPathOnLocal, ref: 'extra-branch', remote: remoteName});
			assert.deepEqual(returnedBranchesList, ['master', 'extra-branch']);
		});
		it('should not attempt to checkout or list HEAD branch', async function() {
			//given
			const repoPathOnLocal = path.join(process.cwd(), 'tmp','migrate', 'some_repo');
			const remoteName = 'origin';
			listBranchesStub.withArgs({fs, dir: repoPathOnLocal, remote: remoteName}).returns(Promise.resolve(['HEAD', 'master', 'extra-branch']));

			//when
			const returnedBranchesList = await gitClient.listBranches(repoPathOnLocal, remoteName);

			//then
			sinon.assert.calledWith(listBranchesStub, {fs, dir: repoPathOnLocal, remote: remoteName});
			sinon.assert.calledWith(checkoutStub, {fs, dir: repoPathOnLocal, ref: 'master', remote: remoteName});
			sinon.assert.calledWith(checkoutStub, {fs, dir: repoPathOnLocal, ref: 'extra-branch', remote: remoteName});
			sinon.assert.neverCalledWith(checkoutStub, {fs, dir: repoPathOnLocal, ref: 'HEAD', remote: remoteName});
			assert.deepEqual(returnedBranchesList, ['master', 'extra-branch']);
		});
	});
	describe('#listTags', function() {
		let listTagsStub;
		before(() => {
			listTagsStub = sinon.stub(git, 'listTags');
		});
		after(() => {
			listTagsStub.restore();
		});
		it('should list the tags for an already cloned repo', async function() {
			//given
			const repo_path_on_local = path.join(process.cwd(), 'tmp','migrate', 'some_repo');
			listTagsStub.withArgs({fs, dir: repo_path_on_local}).returns(Promise.resolve(['foo-tag', 'bar-tag']));

			//when
			const returnedTagsList = await gitClient.listTags(repo_path_on_local);

			//then
			sinon.assert.calledWith(listTagsStub, {fs, dir: repo_path_on_local});
			assert.deepEqual(returnedTagsList, ['foo-tag', 'bar-tag']);
		});
	});
});