function WebhookConfig(repoName, secret, events, payloadUrl){
	this.repoName = repoName;
	this.secret = secret;
	this.events = events;
	this.payloadUrl = payloadUrl;
}

module.exports = WebhookConfig;