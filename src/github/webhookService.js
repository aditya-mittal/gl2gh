const WebhookConfig = require('./model/webhookConfig.js');

function WebhookService() {}

WebhookService.getWebhookConfig = function (config, repoNames) {
	return repoNames.map((repoName) => {
		const configForRepo = config[repoName];
		if (configForRepo && configForRepo.secret) {
			const events = configForRepo.events || config['events'];
			const payloadUrl = configForRepo.payloadUrl || config['payloadUrl'];
			return new WebhookConfig(repoName, configForRepo.secret, events, payloadUrl);
		}
		console.error(`No config found for ${repoName}`);
		throw Error(`No config found for ${repoName}`);
	});
};

module.exports = WebhookService;