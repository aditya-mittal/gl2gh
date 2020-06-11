var Migrate = require('./migrate.js');

var migrate = new Migrate()
// TODO replace gitlabGroupName(FOO) and githubOrgName(BAR) with program arguments
var result = migrate.migrateToGithub('FOO', 'BAR')
if(result === 0) {
  console.log("Migration successful")
} else {
  console.log("Some error occurred while migrating from Gitlab to Github")
}
