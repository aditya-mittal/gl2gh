var Git = require("nodegit");

function GitClient() {

  this.clone = function(https_url_to_repo, local_path, success_callback) {
    return Git.Clone(https_url_to_repo, local_path)
        .then((repository) => success_callback(repository))
        .catch((err) => {
          return {"message": `Cloning of repository ${https_url_to_repo} failed`, "error": err};
        });
  }
}

module.exports = GitClient;