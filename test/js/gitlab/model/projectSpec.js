const chai = require('chai');
const expect = chai.expect;
const Project = require('../../../../src/gitlab/model/project.js');

describe('Project', function() {
	it('must have name and http_url', function() {
		//given
		const name = 'repository-1';
		const http_url_to_repo = 'https://gitlab.com/FOO/repository-1.git';
		//when
		const project = new Project(name, http_url_to_repo);
		//then
		project.should.be.a('object');
		project.should.be.instanceof(Project);
		project.should.have.property('name');
		project.should.have.property('http_url_to_repo');
		project.should.have.property('description');
		project.should.have.all.keys('name', 'description', 'http_url_to_repo');
	});

	it('should check if project starts with specific prefix', function() {
		//given
		let name = 'xyz-repository-1';
		const http_url_to_repo = 'https://gitlab.com/FOO/repository-1.git';
		let project = new Project(name, http_url_to_repo);
		//when
		let doesStartsWithXyz = project.startsWith('xyz');
		//then
		expect(doesStartsWithXyz).to.be.true;
		//given
		name = 'abc-repository-1';
		project = new Project(name, http_url_to_repo);
		//when
		doesStartsWithXyz = project.startsWith('xyz');
		//then
		expect(doesStartsWithXyz).to.be.false;
	});
});