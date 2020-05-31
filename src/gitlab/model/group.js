var Project = require('./project.js');
function Group(options) {
  this.body = options

  this.getProjects = function () {
    return this.body.projects.map(project => new Project(project.name, project.http_url_to_repo))
  }

  this.getSharedProjects = function () {
    return this.body.shared_projects.map(project => new Project(project.name, project.http_url_to_repo))
  }
}

module.exports = Group;