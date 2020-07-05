function Project(name, description, http_url_to_repo) {
  this.name = name
  this.description = description
  this.http_url_to_repo = http_url_to_repo
}

Project.prototype.startsWith = function(namePrefix) {
  return this.name.startsWith(namePrefix)
}

Project.prototype.toString = function() {
  return `${this.name}, ${this.description}, ${this.http_url_to_repo}`;
}

module.exports = Project;