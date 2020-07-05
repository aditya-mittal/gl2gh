const chai = require('chai');
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised);
const assert = chai.assert;
const expect = chai.expect
const should = require('chai').should();
const nock = require('nock');
const GithubClient = require('../../../src/github/client.js');
const Repository = require('../../../src/github/model/repository.js');
const repoDetails = require('../../resources/github/repoDetails.json')

describe('Github client', function() {
  const GITHUB_API_URL = "api.github.com"
  const GITHUB_PRIVATE_TOKEN = "some_private_token"
  const githubClient = new GithubClient(GITHUB_API_URL, GITHUB_PRIVATE_TOKEN)
  let api
  describe('#createRepo', function() {
    beforeEach(() => {
      api = nock(
              'https://' + GITHUB_API_URL, {
                reqHeaders: {
                  'Content-Type': 'application/json',
                  'User-Agent': 'gl2h',
                  'Authorization': 'token ' + GITHUB_PRIVATE_TOKEN
                }
              }
            )
    });

    afterEach(() => {
      nock.cleanAll()
    });

    it('should create new repo', async() => {
      //given
      const repoName = "some-repo"
      const isPrivate = true
      api.post('/user/repos/').reply(201, repoDetails);
      //when
      const repository = await githubClient.createRepo(repoName, isPrivate)
      //then
      try {
        repository.should.be.a('object');
        repository.should.be.instanceof(Repository);
        repository.should.have.property('name');
        repository.should.have.property('clone_url');
        repository.should.have.property('delete_branch_on_merge');
        repository['name'].should.equal(repoName)
      } catch(err) {
        throw err
      }
    });
    it('should throw error when non 201 status received while creating repo', async() => {
      //given
      const repoName = "errored-repo"
      const isPrivate = true
      api.post('/user/repos/').reply(404);
      //when & then
      return assert.isRejected(
                      githubClient.createRepo(repoName, isPrivate),
                      Error,
                      'Unable to create repo: error'
                    );
    });
    it('should throw error when error obtained while creating repo', async() => {
      //given
      const repoName = "error"
      const isPrivate = true
      api.post('/user/repos/').replyWithError('some error occurred while creating repo');
      //when & then
      return assert.isRejected(
                            githubClient.createRepo(repoName, isPrivate),
                            Error,
                            'Unable to create repo: error'
                          );
    });
  });
});