### Some feature requests

- [ ] migration: "lock" the "source" repo, once migration is complete
- [ ] migration: mirror configuration on branches that are "locked" to prevent direct pushes
- [ ] migration: mirror configuration for MR workflows in GitLab into PR workflows in Github (include constraints on pipeline status, approvers, resolution of MR comments, etc.)
- [ ] migration: mirror configuration for GitLab integrations (such as Jenkins). Note that the particular scenario of interest is _not_ using a webhook, but the URL to a job in Jenkins
- [ ] usage: provide a task that publishes lists of repositories, statuses (not/migrated), etc. that may be used interactively at a command line
- [ ] usage: externalise configuration, including base URLs for remotes, any credentials or API tokens, etc.
- [ ] usage: package as a container and provide instructions to run, including how to supply configuration information from the environment
- [ ] usage: run for a specific repository or a few repositories (say, when specified interactively at the command line, or in a file)
- [ ] usage: error handling and recovery when run for a large number of repositories (such as all within a group). Repeated runs may skip certain repositories that are already migrated. 
- [ ] usage: cleanup between runs, as well as when migrating multiple repositories to not require growing amount of disk space
- [ ] usage: dry-run option
- packaging tool to package the application