var GitlabClient = require('./gitlab/client.js');
var GithubClient = require('./github/client.js');
var Project = require('./gitlab/model/project.js');
var GitClient = require('./gitClient.js');
var config = require('./config.js');

function Migrate() {
  var gitClient = new GitClient()
  var gitlabClient = new GitlabClient(config.GITLAB_URL, config.GITLAB_TOKEN)
  var githubClient = new GithubClient(config.GITHUB_URL, config.GITHUB_TOKEN)

  this.migrateToGithub = async function(gitlabGroupName, githubOrgName) {
    var projects = [];
    projects.push(... await _getProjectsWithinGroup(gitlabGroupName))
    projects.push(... await _getProjectsForAllSubgroups(gitlabGroupName))
    projects.push(... await _getProjectsSharedWithGroup(gitlabGroupName))
    return _migrateProjectsToGithub(projects);
  };

  var _migrateProjectsToGithub = async function(projects) {
    const promises = projects.map(_migrateProjectToGithub);
    return await Promise.all(promises);
  }

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

  var _getProjectsWithinGroup = async function(gitlabGroupName) {
    return gitlabClient.getGroup(gitlabGroupName)
      .then(group => group.getProjects())
  }

  var _getProjectsSharedWithGroup = async function(gitlabGroupName) {
      return gitlabClient.getGroup(gitlabGroupName)
        .then(group => group.getSharedProjects())
    }

  var _getProjectsForAllSubgroups = async function(gitlabGroupName) {
    var subgroups = await gitlabClient.getSubgroups(gitlabGroupName);
    const promises = subgroups.map((subgroup) => {
                      return _getProjectsForSubgroup(gitlabGroupName, subgroup.name)
                    });
    var projectsForEachSubgroup = await Promise.all(promises)
    return projectsForEachSubgroup.flat();
  }

  var _getProjectsForSubgroup = async function(gitlabGroupName, subgroupName) {
    return gitlabClient.getSubgroup(gitlabGroupName, subgroupName)
            .then(subgroupDetails => subgroupDetails.getProjects())
  }
};

module.exports = Migrate;