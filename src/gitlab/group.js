var Project = require('./project.js');
function Group(options) {
  this.body = options

  this.getAllProjects = function () {
    return this.body.projects.map(project => new Project({name: project.name, ssh_url_to_repo: project.ssh_url_to_repo}))
  }
}

module.exports = Group;