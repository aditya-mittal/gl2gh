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
    let getListOfAllProjectsToMigrateStub;
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
      const gitlabGroupName = 'FOO'
      const projectNameFilter = 'project'
      //when
      process.argv = `node ../../src/cli.js list --starts-with ${projectNameFilter} ${gitlabGroupName}`.split(' ');
      await proxyquire('../../src/cli.js', { './migrate': getListOfAllProjectsToMigrateStub });
      //then
      sinon.assert.calledWith(migrateStub, gitlabGroupName, projectNameFilter)
    })
    it('should handle error gracefully when listing projects for specific group', async function () {
      //given
      const gitlabGroupName = 'FOO'
      const errorMessage = 'Some error occurred while fetching list of projects'
      migrateStub.throws(new Error(errorMessage))
      //when
      process.argv = `node ../../src/cli.js list ${gitlabGroupName}`.split(' ');
      await proxyquire('../../src/cli.js', { './migrate': getListOfAllProjectsToMigrateStub });
      //then
      sinon.assert.calledWith(migrateStub, gitlabGroupName)
      expect(consoleError).to.eql([errorMessage]);
    })
  });
  describe('Copy content of repos', () => {
      let copyContentFromGitlabToGithubStub;
      beforeEach(() => {
        migrateStub = sinon.stub(migrate, 'copyContentFromGitlabToGithub')
        copyContentFromGitlabToGithubStub = function StubMigrate() {
          this.copyContentFromGitlabToGithub = migrateStub;
        }
      })
      afterEach(() => {
        sinon.restore();
      });
      it('should copy contents of all repos', async function () {
        //given
        const gitlabGroupName = 'FOO'
        const githubOrgName = 'BAR'
        //when
        process.argv = `node ../../src/cli.js copy-content ${gitlabGroupName} ${githubOrgName}`.split(' ');
        await proxyquire('../../src/cli.js', { './migrate': copyContentFromGitlabToGithubStub });
        //then
        sinon.assert.callCount(migrateStub, 1);
        sinon.assert.calledWithExactly(migrateStub, gitlabGroupName, githubOrgName, '')
      });
      it('should copy contents of repos filtered on specified prefix', async function () {
        //given
        const gitlabGroupName = 'FOO'
        const githubOrgName = 'BAR'
        const projectNameFilter = 'project'
        //when
        process.argv = `node ../../src/cli.js copy-content --starts-with ${projectNameFilter} ${gitlabGroupName} ${githubOrgName}`.split(' ');
        await proxyquire('../../src/cli.js', { './migrate': copyContentFromGitlabToGithubStub });
        //then
        sinon.assert.callCount(migrateStub, 1);
        sinon.assert.calledWithExactly(migrateStub, gitlabGroupName, githubOrgName, projectNameFilter)
      });
    });
});