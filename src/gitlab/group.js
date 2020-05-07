function Group(options) {
  this.body = options

  this.getAllProjects = function () {
    return this.body.projects
  }
}

module.exports = Group;