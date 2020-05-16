var assert = require('assert');
var should = require('chai').should();
var nock = require('nock');
var GithubClient = require('../../../src/github/client.js');
var Repository = require('../../../src/github/model/repository.js');
var repoDetails = require('../../resources/github/repoDetails.json')

describe('Github client', function() {
  var GITHUB_API_URL = "api.github.com"
  var GITHUB_PRIVATE_TOKEN = "some_private_token"
  var api
  var githubClient = new GithubClient(GITHUB_API_URL, GITHUB_PRIVATE_TOKEN)
  describe('#createRepo', function() {
    beforeEach(() => {
      api = nock(
              'https://api.github.com', {
                reqHeaders: {
                  'Content-Type': 'application/json',
                  'Private-Token': GITHUB_PRIVATE_TOKEN
                }
              }
            )
    });

    afterEach(() => {
      nock.cleanAll()
    });

    it('should create new repo', async() => {
      //given
      var repoName = "some-repo"
      var isPrivate = true
      api.post('/user/repos/').reply(201, repoDetails);
      //when
      var repository = await githubClient.createRepo(repoName, isPrivate)
      //then
      try {
        repository.should.be.a('object');
        repository.should.be.instanceof(Repository);
        repository.should.have.property('name')
        repository.should.have.property('clone_url')
        repository['name'].should.equal(repoName)
      } catch(err) {
        return
      }
    });
    it('should throw error when non 201 status received while creating repo', async() => {
      //given
      var repoName = "errored-repo"
      var isPrivate = true
      api.post('/user/repos/').reply(404);
      //when
      try {
        await githubClient.createRepo(repoName, isPrivate)
        // a failing assert here is a bad idea, since it would lead into the catch clause…
      } catch (err) {
        // optional, check for specific error (or error.type, error. message to contain …)
        assert.deepEqual(err, { 'message': `Unable to create repo with name ${repoName}` })
        return  // this is important
      }
    });
    it('should throw error when error obtained while creating repo', async() => {
      //given
      var repoName = "error"
      var isPrivate = true
      api.post('/user/repos/').replyWithError('some error occurred while creating repo');
      //when
      try {
        await githubClient.createRepo(repoName, isPrivate)
        // a failing assert here is a bad idea, since it would lead into the catch clause…
      } catch (err) {
        // optional, check for specific error (or error.type, error. message to contain …)
        assert.deepEqual(err, { 'message': 'Error while creating repo' })
        return  // this is important
      }
    });
  });
});