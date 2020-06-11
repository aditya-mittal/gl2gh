const path = require('path');
var GitlabClient = require('./gitlab/client.js');
var GithubClient = require('./github/client.js');
var Project = require('./gitlab/model/project.js');
var GitClient = require('./isomorphicGitClient.js');
var config = require('./config.js');

function Migrate() {
  var gitClient = new GitClient()
  var gitlabClient = new GitlabClient(config.GITLAB_URL, config.GITLAB_TOKEN)
  var githubClient = new GithubClient(config.GITHUB_URL, config.GITHUB_TOKEN)

  this.migrateToGithub = async function(gitlabGroupName, githubOrgName) {
    var projects = [];
    try {
      projects.push(... await _getProjectsWithinGroup(gitlabGroupName))
      projects.push(... await _getProjectsForAllSubgroups(gitlabGroupName))
      projects.push(... await _getProjectsSharedWithGroup(gitlabGroupName))
      _migrateProjectsToGithub(projects);
      return 0;
    } catch(error) {
      return -1;
    }
  };

  var _getProjectsWithinGroup = async function(gitlabGroupName) {
    return gitlabClient.getGroup(gitlabGroupName)
      .then(group => group.getProjects())
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

  var _getProjectsSharedWithGroup = async function(gitlabGroupName) {
    return gitlabClient.getGroup(gitlabGroupName)
      .then(group => group.getSharedProjects())
  }

  var _migrateProjectsToGithub = async function(projects) {
    const promises = projects.map(_migrateProjectToGithub);
    return await Promise.all(promises);
  }

  var _migrateProjectToGithub = async function(project, index) {
       await githubClient.createRepo(project.name, true)
                            .then(githubRepository => _cloneAndPushToNewRemote(githubRepository, project))
  };

  var _cloneAndPushToNewRemote = async function(githubRepository, project) {
    const path_to_clone_repo = path.join(process.cwd(), '/tmp','migrate', project.name)
    await gitClient.clone(project.http_url_to_repo, project.name, path_to_clone_repo)
          .then(() => gitClient.addRemote(path_to_clone_repo, 'github', githubRepository.clone_url))
          .then(() => gitClient.push(path_to_clone_repo, 'github', 'master'));
  }
};

module.exports = Migrate;