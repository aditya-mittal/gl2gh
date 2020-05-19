var GitlabClient = require('./gitlab/client.js');
var GithubClient = require('./github/client.js');
var GitClient = require('./gitClient.js');
var config = require('./config.js');

function Migrate() {
  var gitClient = new GitClient()
  var gitlabClient = new GitlabClient(config.GITLAB_URL, config.GITLAB_TOKEN)
  var githubClient = new GithubClient(config.GITHUB_URL, config.GITHUB_TOKEN)

  this.migrateToGithub = function(gitlabGroupName, githubOrgName) {
    var projects = gitlabClient.getGroup(gitlabGroupName)
      .then(group => group.getProjects())
      .then(projects => projects.forEach(_migrateProjectToGithub));
  };

  var _migrateProjectToGithub = function(project, index) {
    githubClient.createRepo(project.name, true)
                          .then(githubRepository => {
                            var githubCloneUrl = githubRepository.clone_url
                            gitClient.clone(project.http_url_to_repo, project.name, (repository) => repository);
                          });

  };
};

module.exports = Migrate;