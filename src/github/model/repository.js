function Repository(name, clone_url, delete_branch_on_merge, default_branch) {
	this.name = name;
	this.clone_url = clone_url;
	this.delete_branch_on_merge = delete_branch_on_merge;
	this.default_branch = default_branch;
}

module.exports = Repository;