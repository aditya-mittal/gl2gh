var GitlabClient = require('./gitlab/client.js');
var GithubClient = require('./github/client.js');
var GitClient = require('./gitClient.js');
var config = require('./config.js');

function Migrate() {
  var gitClient = new GitClient()
  var gitlabClient = new GitlabClient(config.GITLAB_URL, config.GITLAB_TOKEN)
  var githubClient = new GithubClient(config.GITHUB_URL, config.GITHUB_TOKEN)

  this.migrateToGithub = function(gitlabGroupName, githubOrgName) {
    return gitlabClient.getGroup(gitlabGroupName)
      .then(group => group.getProjects())
      .then(projects => projects.forEach(_migrateProjectToGithub));
  };

  var _migrateProjectToGithub = async function(project, index) {
    var githubRepo = githubClient.createRepo(project.name, true)
                          .then(githubRepository => githubRepository);
    return gitClient.clone(project.http_url_to_repo, project.name, (repository) => {console.log('cloned succesfully')});

  };
};

module.exports = Migrate;