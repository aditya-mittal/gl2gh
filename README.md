# Migrate GitLab repo(s) to GitHub

Migrate one or more projects from GitLab to GitHub. 
- For developer instructions, see the [developer README](DEVELOP.md)

##### Pre-requisites

- Obtain a GitLab private token as prescribed [here](./README.md#creating-a-private-token-for-gitlab)
- Obtain a GitHub private token as prescribed [here](./README.md#creating-a-private-token-for-github)
- Configure tokens, URLs, etc. for GitLab and Github [here](config/default.yml)

```bash
# Example current versions, also known to work with earlier versions
$ node --version
v14.4.0

$ npm --version
6.14.4

# Install dependencies
$ npm install

# Link binary
$ npm link

# See usage
$ gl2h -h
```

### List all projects under GitLab

```bash
$ gl2h list my-foo-group
$ gl2h list --starts-with my-foo-repo my-foo-group
$ gl2h list -n 10 my-foo-group # n is defaulted to 50
$ gl2h list --output text my-foo-group # output is defaulted to json
```