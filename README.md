# Migrate Gitlab repo(s) to Github

### Run the tests
```bash
    npm test
```

### Steps to migrate

- [ ] Create list of all gitlab repos to be migrated
    - [x] get list of all projects

    - [ ] get list of all subgroups and then each project within that subgroup
    - [ ] get list of shared projects
    - [ ] exclude any specific project
- [ ] create organisation on github
- [ ] for every gitlab repo
    - [x] clone the repo on local & change directory to it
    - [ ] create its equivalent bare repo on github
    - [ ] add the git-remote for github repo
    - [ ] push to new remote
    - [ ] delete the repo from local (?)



