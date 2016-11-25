var expect    = require("chai").expect;
var fs = require('fs');

process.env.WIT_TOKEN = 'wit_token';
const FB = require('../facebook.js');

describe("facebook.js unit tests", () => {

  it("should create post request for facebook page", () => {
    expect(FB.fbReq).to.not.be.null;
  });

  it("should build facebook message given recipient, message and cb", () => {
    var ret = FB.fbMessage('sung', 'hello', {});
    expect(ret).to.not.be.null;
  });

  it("should get first messaging entry from facebook message", () => {
    var payload = JSON.parse(fs.readFileSync('__tests__/msg.json', 'utf8'));
    var ret = FB.getFirstMessagingEntry(payload);
    expect(ret.message.text).to.equal("in Hong Kong?");
  });

});
