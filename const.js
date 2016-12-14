'use strict';

// Wit.ai parameters
const WIT_TOKEN = process.env.WIT_TOKEN;

// Messenger API parameters
const FB_PAGE_TOKEN = process.env.FB_PAGE_TOKEN;

var FB_VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN;
if (!FB_VERIFY_TOKEN) {
  FB_VERIFY_TOKEN = "just_do_it";
}

const FB_APP_SECRET = process.env.FB_APP_SECRET;

var GITHUB_AUTH_TOKEN = process.env.GITHUB_AUTH_TOKEN;

function docWriteIssue(docTitle, docBody, docLabels) {

	const GitHubApi = require("github");
 
	const github = new GitHubApi({
		// optional 
		debug: true,
		protocol: "https",
		host: "api.github.com",
		pathPrefix: "",
		headers: {
			"user-agent": "258CallTheBot"
		},
		Promise: require("bluebird"),
		followRedirects: false,
		timeout: 5000
	});
	
	github.authenticate({
		type: "oauth",
		token: GITHUB_AUTH_TOKEN
	});
	
	github.issues.create({
		owner: "258callthebot",
		repo: "258callthebot-dashboard",
		title: docTitle,
		labels: docLabels,
		body: docBody
	});
}

module.exports = {
  WIT_TOKEN: WIT_TOKEN,
  FB_PAGE_TOKEN: FB_PAGE_TOKEN,
  FB_VERIFY_TOKEN: FB_VERIFY_TOKEN,
  FB_APP_SECRET: FB_APP_SECRET,
  GITHUB_AUTH_TOKEN,
  docWriteIssue,
};