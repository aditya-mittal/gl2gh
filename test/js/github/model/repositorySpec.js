const Repository = require('../../../../src/github/model/repository.js');

describe('Repository', function() {
	it('must have name, clone_url & delete_branch_on_merge', function() {
		//given
		const name = 'some-repo';
		const clone_url = 'https://github.com/foo-user/some-repo.git';
		const default_branch = 'master';
		//when
		const repository = new Repository(name, clone_url, true, default_branch);
		//then
		repository.should.be.a('object');
		repository.should.be.instanceof(Repository);
		repository.should.have.property('name');
		repository.should.have.property('clone_url');
		repository.should.have.all.keys('name', 'clone_url', 'delete_branch_on_merge', 'default_branch');
		repository.name.should.equal(name);
		repository.clone_url.should.equal(clone_url);
		repository.delete_branch_on_merge.should.be.true;
		repository.default_branch.should.equal(default_branch);
	});
});