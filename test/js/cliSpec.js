const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const fs   = require('fs');
const proxyquire =  require('proxyquire');

const Migrate = require('../../src/migrate.js');
const GitlabClient = require('../../src/gitlab/client');

describe('Tests for cli', () => {
  const migrate = new Migrate();
  const gitlabClient = new GitlabClient('any_url', 'any_private_token');
  let migrateStub;
  const originalLog = console.info
  const originalErrorConsole = console.error
  let consoleOutput = []
  let consoleError = []
  const mockedLog = output => consoleOutput.push(output)
  const mockedErrorLog = error => consoleError.push(error)
  beforeEach(() => {
    console.info = mockedLog
    console.error = mockedErrorLog
  })
  afterEach(() => {
    consoleOutput = []
    consoleError = []
    console.info = originalLog
    console.error = originalErrorConsole
  })
  describe('List all repositories for a specific group in order', function () {
    var getListOfAllProjectsToMigrateStub;
    before(() => {
      migrateStub = sinon.stub(migrate, 'getListOfAllProjectsToMigrate')
      getListOfAllProjectsToMigrateStub = function StubMigrate() {
        this.getListOfAllProjectsToMigrate = migrateStub;
      }
    })
    after(() => {
      sinon.restore();
    });
    it('should list projects for a specific GitLab group ordered alphabetically', async function () {
      //given
      var gitlabGroupName = 'FOO'
      var projectNameFilter = 'project'
      //when
      process.argv = `node ../../src/cli.js list --starts-with ${projectNameFilter} ${gitlabGroupName}`.split(' ');
      await proxyquire('../../src/cli.js', { './migrate': getListOfAllProjectsToMigrateStub });
      //then
      sinon.assert.calledWith(migrateStub, gitlabGroupName, projectNameFilter)
    })
    it('should handle error gracefully when listing projects for specific group', async function () {
      //given
      var gitlabGroupName = 'FOO'
      var errorMessage = 'Some error occurred while fetching list of projects'
      migrateStub.throws(new Error(errorMessage))
      //when
      process.argv = `node ../../src/cli.js list ${gitlabGroupName}`.split(' ');
      await proxyquire('../../src/cli.js', { './migrate': getListOfAllProjectsToMigrateStub });
      //then
      sinon.assert.calledWith(migrateStub, gitlabGroupName)
      expect(consoleError).to.eql([errorMessage]);
    })
  });
});