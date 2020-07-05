function Repository(name, clone_url, delete_branch_on_merge) {
  this.name = name;
  this.clone_url = clone_url;
  this.delete_branch_on_merge = delete_branch_on_merge;
}

module.exports = Repository;