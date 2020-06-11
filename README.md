# Migrate Gitlab repo(s) to Github

Migrate all the projects within a specific group on Gitlab to repositories 
under specific organisation on Github. 

### Install node dependencies
```bash
    $ npm install
```

### Run the tests
```bash
    $ npm test
```

### Run the program
```bash
    $ npm start
```

### Build the docker image
```bash
    $ docker build -t migration/migrate-gitlab-to-github .
```

### Run the docker image
```bash
    $ docker run --name migrate migration/migrate-gitlab-to-github
```

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

### Steps to migrate

- [ ] Create list of all gitlab repos to be migrated
    - [x] get list of all projects
    - [x] get list of all subgroups and then each project within that subgroup
    - [x] get list of shared projects
    - [ ] exclude any specific project
- [ ] create organisation on github
- [ ] for every gitlab repo
    - [x] clone the repo on local & change directory to it
    - [x] create its equivalent bare repo on github
    - [x] add the git-remote for github repo
    - [x] push to new remote
    - [ ] delete the repo from local (?)
    - [ ] archive the repository on gitlab (?)



