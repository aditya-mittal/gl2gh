var GitlabClient = require('./gitlab/client.js');
var GithubClient = require('./github/client.js');
var GitClient = require('./gitClient.js');
var config = require('./config.js');

function Migrate() {
  var gitClient = new GitClient()
  var gitlabClient = new GitlabClient(config.GITLAB_URL, config.GITLAB_TOKEN)
  var githubClient = new GithubClient(config.GITHUB_URL, config.GITHUB_TOKEN)

  this.migrateToGithub = async function(gitlabGroupName, githubOrgName) {
    return await gitlabClient.getGroup(gitlabGroupName)
      .then(group => group.getProjects())
      .then(projects => projects.forEach(_migrateProjectToGithub));
  };

  var _migrateProjectToGithub = async function(project, index) {
    await githubClient.createRepo(project.name, true)
                          .then(githubRepository => githubRepository)
                          .then(gitClient.clone(project.http_url_to_repo, project.name, (repository) => {repository}))
  };

  var _cloneRepoToLocal = async function(http_url_to_repo, local_path) {
    gitClient.clone(http_url_to_repo, local_path, (repository) => {_createNewRemoteForRepo, githubRepo.clone_url})
  }

  var _createNewRemoteForRepo = async function(repo, clone_url) {
    console.log('******************')
    var remote_name = "github"
    await gitClient.createRemote(repo, remote_name, clone_url, (remote) => remote)
  }
};

module.exports = Migrate;