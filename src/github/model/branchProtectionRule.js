function BranchProtectionRule(rules) {
  if(rules === null || rules === undefined) {
    console.warn('Branch Protection Rule missing, would adapt to default values');
    rules = {};
  }
  //TODO: validate - like approve count should be between 1 and 6 etc
  this.required_status_checks_contexts = rules.required_status_checks_contexts || [];
  this.required_approving_review_count = rules.required_approving_review_count || 1;
  this.dismiss_stale_reviews = rules.dismiss_stale_reviews || true;
  this.enforce_admins = rules.enforce_admins || true;
}

module.exports = BranchProtectionRule;