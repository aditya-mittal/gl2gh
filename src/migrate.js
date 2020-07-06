const path = require('path');
const _ = require('lodash');
const config = require('config');

const GitlabClient = require('./gitlab/client.js');
const GithubClient = require('./github/client.js');
const Project = require('./gitlab/model/project.js');
const GitClient = require('./gitClient.js');

function Migrate() {
  const gitClient = new GitClient(config.get('gl2h.gitlab.username'), config.get('gl2h.gitlab.token'), config.get('gl2h.github.token'));
  const gitlabClient = new GitlabClient(config.get('gl2h.gitlab.url'), config.get('gl2h.gitlab.token'))
  const githubClient = new GithubClient(config.get('gl2h.github.url'), config.get('gl2h.github.token'))

  this.migrateToGithub = async function(gitlabGroupName, githubOrgName) {
    let projects = [];
    try {
      projects.push(... await _getProjectsWithinGroup(gitlabGroupName))
      projects.push(... await _getProjectsForAllSubgroups(gitlabGroupName))
      projects.push(... await _getProjectsSharedWithGroup(gitlabGroupName))
      await _migrateProjectsToGithub(projects);
      return 0;
    } catch(error) {
      return -1;
    }
  };

  this.getListOfAllProjectsToMigrate = async function (gitlabGroupName, projectNameFilter) {
    let projects = [];
    try {
      projects.push(... await _getProjectsWithinGroup(gitlabGroupName))
      projects.push(... await _getProjectsForAllSubgroups(gitlabGroupName))
      projects.push(... await _getProjectsSharedWithGroup(gitlabGroupName))
      projects = _.sortBy(projects, "name");
      projects = _filterProjectsWithPrefix(projects, projectNameFilter)
      return projects;
    } catch (error) {
      throw error;
    }
  };

  var _filterProjectsWithPrefix = function (projects, prefix) {
    return projects.filter(project => project.startsWith(prefix))
  }

  var _getProjectsWithinGroup = async function(gitlabGroupName) {
    return gitlabClient.getGroup(gitlabGroupName)
      .then(group => group.getProjects())
  }

  var _getProjectsForAllSubgroups = async function(gitlabGroupName) {
    let subgroups = await gitlabClient.getSubgroups(gitlabGroupName);
    const promises = subgroups.map((subgroup) => {
                      return _getProjectsForSubgroup(gitlabGroupName, subgroup.name)
                    });
    let projectsForEachSubgroup = await Promise.all(promises)
    return [].concat(...projectsForEachSubgroup);
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
     return githubClient.createRepo(project.name, true)
                          .then(githubRepository => _cloneAndPushToNewRemote(githubRepository, project))
  };

  var _cloneAndPushToNewRemote = async function(githubRepository, project) {
    const sourceRemoteName = 'gitlab';
    const destinationRemoteName = 'github';
    const path_to_clone_repo = path.join(process.cwd(), '/tmp','migrate', project.name)
    await gitClient.clone(project.http_url_to_repo, path_to_clone_repo, sourceRemoteName)
    await gitClient.addRemote(path_to_clone_repo, destinationRemoteName, githubRepository.clone_url)
    const branches = await gitClient.listBranches(path_to_clone_repo, sourceRemoteName)
    const promises = branches.map((branch) => {
      return gitClient.push(path_to_clone_repo, destinationRemoteName, branch)
                        .catch((err) => {
                          let msg = `Error pushing branch ${branch} of ${project.name}: ${err.message}`;
                          console.warn(msg);
                        });
    });
    return Promise.all(promises);
  }
};

module.exports = Migrate;