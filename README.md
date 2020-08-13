# Migrate GitLab repo(s) to GitHub

![Build Status](https://github.com/aditya-mittal/gl2gh/workflows/build/badge.svg)
[![codecov](https://codecov.io/gh/aditya-mittal/gl2gh/branch/master/graph/badge.svg)](https://codecov.io/gh/aditya-mittal/gl2gh)

Migrate one or more projects from GitLab to GitHub. 
- For developer instructions, see the [developer README](DEVELOP.md)

##### Pre-requisites

- Obtain a GitLab private token as prescribed [here](./README.md#creating-a-private-token-for-gitlab)
- Obtain a GitHub private token as prescribed [here](./README.md#creating-a-private-token-for-github)

```bash
# Example current versions, also known to work with earlier versions
$ node --version
v14.4.0

$ npm --version
6.14.4
```

### Installation

```bash
$ npm run build
```

### Setup config

```bash
# set config
$ cp config/example.yml /path/to/my/config.yml
# update the config with appropriate values

# Set config directory path
$ export NODE_CONFIG_DIR="path-to-directory-containing-config"
# set appropriate config environment
$ export NODE_CONFIG_ENV="your_config_file_name"
```

### Help

```bash
$ gl2gh -h
```

### List all projects under GitLab

```bash
$ gl2gh list my-foo-group
$ gl2gh list --starts-with my-foo-repo my-foo-group
$ gl2gh list -n 10 my-foo-group # n is defaulted to 50
$ gl2gh list --output text my-foo-group # output is defaulted to json
```

### Copy content from GitLab to GitHub

```bash
# copy repo to specific organisation under github
$ gl2gh copy-content my-foo-group --github-org my-bar-org

# copy repo to user root on github
$ gl2gh copy-content my-foo-group

# copy only matching repo(s)
$ gl2gh copy-content --starts-with my-repo my-foo-group
```

### Configure branch protection on GitHub

```bash
# copy example template as a starter
$ cp config/templates/branchProtectionTemplate.yml /path/to/my/branchProtectionTemplate.yml

# execute to configure branch protection rules
$ gl2h protect-branch -c /path/to/my/branchProtectionTemplate.yml my-foo-org my-foo-branch my-bar-repo 
$ gl2h protect-branch -c /path/to/my/branchProtectionTemplate.yml my-foo-org my-foo-branch my-bar-repo-1 my-bar-repo-2 ... 
```

### Enable automatically delete head branches on GitHub  

```bash
$ gl2h auto-delete-head-branches my-foo-org my-bar-repo
$ gl2h auto-delete-head-branches my-foo-org my-bar-repo-1 my-bar-repo-2 ...
```

### Set default branch on GitHub

```bash
$ gl2h set-default-branch my-foo-org my-foo-branch my-bar-repo
$ gl2h set-default-branch my-foo-org my-foo-branch my-bar-repo-1 my-bar-repo-2
```

### Archive project on GitLab

```bash
$ gl2h archive-repo my-project-path
$ gl2h archive-repo my-project-path-1 my-project-path-2 ...  
```

### Clean up

Clean up any installed binary for migration

```bash
$ npm run clean
```

### Creating a private token for GitHub
- Navigate to your [GitHub Personal access tokens](https://github.com/settings/tokens)
- Click `Generate new token`
- Enter some text for `Note` and choose scopes: 
  - `admin:repo_hook` (to configure webhooks on repositories)
  - `repo` (to configure repositories)
- Copy the generated token

### Creating a private token for GitLab
- Navigate to your [GitLab Personal access tokens](https://gitlab.com/profile/personal_access_tokens)
- Choose a name and expiry date, and choose scope: `api`
- Copy the generated token