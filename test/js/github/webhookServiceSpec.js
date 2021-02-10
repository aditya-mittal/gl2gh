const chai = require('chai');
const assert = chai.assert;
const should = require('chai').should();

const yaml = require('js-yaml');
const fs   = require('fs');

const WebhookService = require('../../../src/github/webhookService.js');
const WebhookConfig = require('../../../src/github/model/webhookConfig.js');

describe('Webhook Service', function() {
	describe('#getWebhookConfig', function () {
		it('should return webhook config for specified repos', () => {
			//given
			const webhookTemplateConfigFile = 'test/resources/github/webhookTemplate.yml';
			const webhookTemplateConfig = yaml.safeLoad(fs.readFileSync(webhookTemplateConfigFile, 'utf8'));
			const repoNames = ['some-repo'];
			//when
			const webhookConfigs = WebhookService.getWebhookConfig(webhookTemplateConfig, repoNames);
			//then
			webhookConfigs.should.be.a('array');
			webhookConfigs.should.be.of.length(1);
			webhookConfigs[0].should.be.instanceof(WebhookConfig);
			webhookConfigs[0].repoName.should.equal('some-repo');
			webhookConfigs[0].secret.should.equal(webhookTemplateConfig['some-repo']['secret']);
			webhookConfigs[0].payloadUrl.should.equal(webhookTemplateConfig['some-repo']['payloadUrl']);
			webhookConfigs[0].events.should.deep.equal(webhookTemplateConfig['some-repo']['events']);
		});
		it('should return webhook config for specified repos', () => {
			//given
			const webhookTemplateConfigFile = 'test/resources/github/webhookTemplate.yml';
			const webhookTemplateConfig = yaml.safeLoad(fs.readFileSync(webhookTemplateConfigFile, 'utf8'));
			const repoNames = ['some-repo'];
			//when
			const webhookConfigs = WebhookService.getWebhookConfig(webhookTemplateConfig, repoNames);
			//then
			webhookConfigs.should.be.a('array');
			webhookConfigs.should.be.of.length(1);
			webhookConfigs[0].should.be.instanceof(WebhookConfig);
			webhookConfigs[0].repoName.should.equal('some-repo');
			webhookConfigs[0].secret.should.equal(webhookTemplateConfig['some-repo']['secret']);
			webhookConfigs[0].payloadUrl.should.equal(webhookTemplateConfig['some-repo']['payloadUrl']);
			webhookConfigs[0].events.should.deep.equal(webhookTemplateConfig['some-repo']['events']);
		});
		it('should pick payloadUrl, events config from common when webhook config missing for specified repo', () => {
			//given
			const webhookTemplateConfigFile = 'test/resources/github/webhookTemplate.yml';
			const webhookTemplateConfig = yaml.safeLoad(fs.readFileSync(webhookTemplateConfigFile, 'utf8'));
			const repoNames = ['some-repo-4'];
			//when
			const webhookConfigs = WebhookService.getWebhookConfig(webhookTemplateConfig, repoNames);
			//then
			webhookConfigs.should.be.a('array');
			webhookConfigs.should.be.of.length(1);
			webhookConfigs[0].should.be.instanceof(WebhookConfig);
			webhookConfigs[0].repoName.should.equal('some-repo-4');
			webhookConfigs[0].secret.should.equal(webhookTemplateConfig['some-repo-4']['secret']);
			webhookConfigs[0].payloadUrl.should.equal(webhookTemplateConfig['payloadUrl']);
			webhookConfigs[0].events.should.deep.equal(webhookTemplateConfig['events']);
		});
		it('should throw error when webhook config missing for repo', () => {
			//given
			const webhookTemplateConfigFile = 'test/resources/github/webhookTemplate.yml';
			const webhookTemplateConfig = yaml.safeLoad(fs.readFileSync(webhookTemplateConfigFile, 'utf8'));
			const repoNames = ['some-repo-3'];
			//when & then
			assert.throws(() => WebhookService.getWebhookConfig(webhookTemplateConfig, repoNames),
				`No config found for ${repoNames[0]}`);
		});
		it('should throw error when events config cannot be found from either common or repo webhook config', () => {
			//given
			const webhookTemplateConfigFile = 'test/resources/github/webhookTemplateWithoutEvents.yml';
			const webhookTemplateConfig = yaml.safeLoad(fs.readFileSync(webhookTemplateConfigFile, 'utf8'));
			const repoNames = ['some-repo-4'];
			//when & then
			assert.throws(() => WebhookService.getWebhookConfig(webhookTemplateConfig, repoNames),
				`No events found for ${repoNames[0]}`);
		});
		it('should throw error when payloadUrl config cannot be found from either common or repo webhook config', () => {
			//given
			const webhookTemplateConfigFile = 'test/resources/github/webhookTemplateWithoutPayloadUrl.yml';
			const webhookTemplateConfig = yaml.safeLoad(fs.readFileSync(webhookTemplateConfigFile, 'utf8'));
			const repoNames = ['some-repo-4'];
			//when & then
			assert.throws(() => WebhookService.getWebhookConfig(webhookTemplateConfig, repoNames),
				`No payloadUrl found for ${repoNames[0]}`);
		});
	});
});

