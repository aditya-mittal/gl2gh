# Migrate GitLab repo(s) to GitHub

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

### Run the tests in watch mode
```bash
$ npm run test-watch
```

### Run the tests with Mocha Jenkins Reporter
```bash
$ npm run test-jenkins
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



