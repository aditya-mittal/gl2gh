class WebhookError extends Error{
	constructor(errorCode, errorMsg) {
		super(errorMsg);
		this.errorCode = errorCode;
		this.errorMsg = errorMsg;
		Error.captureStackTrace(this, this.constructor);
	}
}

module.exports = WebhookError;