const yaml = require('js-yaml');
const fs   = require('fs');

const BranchProtectionRule = require('../../../../src/github/model/branchProtectionRule.js');


describe('Branch Protection Rule', function() {
	it('must correctly set the respective rules for branch protection', function() {
		//given
		const branchProtectionRulesFile = './test/resources/github/branchProtectionRules.yml';
		const rules = yaml.safeLoad(fs.readFileSync(branchProtectionRulesFile, 'utf8'));
		//when
		const branchProtectionRule = new BranchProtectionRule(rules.branchProtectionRule);
		//then
		branchProtectionRule.should.be.a('object');
		branchProtectionRule.should.be.instanceof(BranchProtectionRule);
		branchProtectionRule.required_status_checks_contexts.should.deep.equal(['continuous-integration/jenkins/pr-merge','continuous-integration/jenkins/branch']);
		branchProtectionRule.required_approving_review_count.should.equal(1);
		branchProtectionRule.dismiss_stale_reviews.should.equal(true);
		branchProtectionRule.enforce_admins.should.equal(true);
	});
	it('must correctly set the default values for branch protection rules when any of the values are not specified', function() {
		//given
		const branchProtectionRulesFile = './test/resources/github/missingBranchProtectionRules.yml';
		const missingRules = yaml.safeLoad(fs.readFileSync(branchProtectionRulesFile, 'utf8'));
		//when
		const branchProtectionRule = new BranchProtectionRule(missingRules.branchProtectionRule);
		//then
		branchProtectionRule.should.be.a('object');
		branchProtectionRule.should.be.instanceof(BranchProtectionRule);
		branchProtectionRule.required_status_checks_contexts.should.deep.equal([]);
		branchProtectionRule.required_approving_review_count.should.equal(1);
		branchProtectionRule.dismiss_stale_reviews.should.equal(true);
		branchProtectionRule.enforce_admins.should.equal(true);
	});
});