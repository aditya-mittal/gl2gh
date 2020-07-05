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

### Clean up

After successful migration, this will clean up installed binary for migration.

```bash
$ npm unlink
```

### Creating a private token for GitHub
- Navigate to your [GitHub Personal access tokens](https://github.com/settings/tokens)
- Click `Generate new token`
- Enter some text for `Note` and choose scopes: 
  - `admin:repo_hook` (to configure webhooks on repositories)
  - `repo` (to configure repositories)
- Copy the generated token

### Creating a private token for GitLab
- Navigate to your [GitLab Personal access tokens](https://gitlab.et-scm.com/profile/personal_access_tokens)
- Choose a name and expiry date, and choose scope: `api`
- Copy the generated token