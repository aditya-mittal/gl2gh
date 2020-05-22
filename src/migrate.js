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
                          .then(githubRepository => {
                            console.log(githubRepository)
                            _cloneRepoToLocal(project.http_url_to_repo, project.name, githubRepository.clone_url)
                          })
//                          .then(gitClient.clone(project.http_url_to_repo, project.name, (repository) => {repository}));
  };

  var _cloneRepoToLocal = async function(http_url_to_repo, local_path, githubCloneUrl) {
    await gitClient.clone(http_url_to_repo, local_path, (clonedRepo) => {
      _createNewRemoteForRepo(clonedRepo, githubCloneUrl)
    })
  }

  var _createNewRemoteForRepo = async function(repo, clone_url) {
    var remote_name = "github"
    await gitClient.createRemote(repo, remote_name, clone_url, (remote) => {_pushToRemote(remote)})
  }

  var _pushToRemote = async function(remote) {
      var ref_specs = ['refs/heads/*:refs/heads/*']
      await gitClient.pushToRemote(remote, ref_specs, () => {console.log('pushed to github')});
    }
};

module.exports = Migrate;