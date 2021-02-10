function WebhookConfig(repoName, secret, events, payloadUrl){
	if(events === null || events === undefined || !Array.isArray(events) || events.length == 0) {
		throw new Error(`No events found for ${repoName}`);
	}
	if(payloadUrl === null || payloadUrl === undefined) {
		throw new Error(`No payloadUrl found for ${repoName}`);
	}
	this.repoName = repoName;
	this.secret = secret;
	this.events = events;
	this.payloadUrl = payloadUrl;
}

module.exports = WebhookConfig;