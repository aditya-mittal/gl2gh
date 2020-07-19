const Subgroup = require('../../../../src/gitlab/model/subgroup.js');

describe('Subgroup', function() {
	it('must have name', function() {
		//given
		const name = 'subgroup-1';
		//when
		const subgroup = new Subgroup(name);
		//then
		subgroup.should.be.a('object');
		subgroup.should.be.instanceof(Subgroup);
		subgroup.should.have.property('name');
		subgroup.should.have.all.keys('name');
	});
});