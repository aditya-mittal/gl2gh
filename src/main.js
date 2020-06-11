var Migrate = require('./migrate.js');

var migrate = new Migrate()
// TODO replace gitlabGroupName(FOO) and githubOrgName(BAR) with program arguments
migrate.migrateToGithub('FOO', 'BAR')