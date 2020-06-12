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