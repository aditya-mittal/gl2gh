const chai = require('chai');
const assert = chai.assert;

const WebhookConfig = require('../../../../src/github/model/webhookConfig.js');

describe('Webhook Config', function() {
	it('must be correctly initialised when all the values are passed appropriately', function() {
		//given
		const repoName = 'someRepo';
		const secret = 'someSecret';
		const events = ['event1', 'event2'];
		const payloadUrl = 'someUrl';
		//when
		const webhookConfig = new WebhookConfig(repoName, secret, events, payloadUrl);
		//then
		webhookConfig.should.be.a('object');
		webhookConfig.should.be.instanceof(WebhookConfig);
		webhookConfig.repoName.should.equal(repoName);
		webhookConfig.secret.should.equal(secret);
		webhookConfig.events.should.deep.equal(events);
		webhookConfig.payloadUrl.should.equal(payloadUrl);
	});
	it('must throw error when payloadUrl is missing', function() {
		//given
		const repoName = 'someRepo';
		const secret = 'someSecret';
		const events = ['event1', 'event2'];
		let payloadUrl;
		//when & then
		assert.throws(() => new WebhookConfig(repoName, secret, events, payloadUrl),
			`No payloadUrl found for ${repoName}`);
	});
	it('must throw error when events is missing', function() {
		//given
		const repoName = 'someRepo';
		const secret = 'someSecret';
		let events;
		const payloadUrl = 'someUrl';
		//when & then
		assert.throws(() => { new WebhookConfig(repoName, secret, events, payloadUrl);},
			`No events found for ${repoName}`);
	});
	it('must throw error when events is blank array', function() {
		//given
		const repoName = 'someRepo';
		const secret = 'someSecret';
		let events = [];
		const payloadUrl = 'someUrl';
		//when & then
		assert.throws(() => { new WebhookConfig(repoName, secret, events, payloadUrl);},
			`No events found for ${repoName}`);
	});
	it('must throw error when events is not an array', function() {
		//given
		const repoName = 'someRepo';
		const secret = 'someSecret';
		let events = 'notAnArray';
		const payloadUrl = 'someUrl';
		//when & then
		assert.throws(() => { new WebhookConfig(repoName, secret, events, payloadUrl);},
			`No events found for ${repoName}`);
	});
});