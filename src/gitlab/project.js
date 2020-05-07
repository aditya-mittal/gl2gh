function Project(options) {
  this.body = options

  this.getProjectDetails = function () {
    return {
      name: this.body.name,
      ssh_url_to_repo: this.body.ssh_url_to_repo
    }
  }
}

module.exports = Project;