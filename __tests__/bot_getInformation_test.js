var expect = require("chai").expect;
var request = require("request");

const bot = require("../bot.js");
const Config = require("../const.js");

const witToken = Config.WIT_TOKEN;
const queryDate = "'" + new Date().toISOString().slice(0,10).replace(/-/g,"") + "'";
const witUrl = "https://api.wit.ai/message";
const minimumEntityConfidence = 0.65;
const minimumIntentConfidence = 0.65;
const getInformationIntent = "inquiry";

describe("bot.js system tests", () => {

 it("should process inquiry for \"sex\"", function(done) {

    const problem = "What is Sex?";

    request({url:witUrl, qs:{ v:queryDate, q:problem, access_token:witToken }}, function(err, response, body) {
    var info = JSON.parse(body);
    const searchQuery = info.entities.search_query[0];

    expect(info._text).to.equal(problem);
    expect(searchQuery.confidence).to.be.at.least(minimumEntityConfidence);
    expect(searchQuery.value).to.equal("Sex");
    expect(searchQuery.suggested).to.be.true;

    const intent = info.entities.intent[0];
    expect(intent.value).to.equal(getInformationIntent);
    expect(intent.confidence).to.be.at.least(minimumIntentConfidence);

    done();
    });
  });

  it("should process inquiry for \"LSD\"", function(done) {

    const problem = "Tell me what LSD is!";

    request({url:witUrl, qs:{ v:queryDate, q:problem, access_token:witToken }}, function(err, response, body) {
    var info = JSON.parse(body);
    const searchQuery = info.entities.search_query[0];

    expect(info._text).to.equal(problem);
    expect(searchQuery.confidence).to.be.at.least(minimumEntityConfidence);
    expect(searchQuery.value).to.equal("LSD");
    expect(searchQuery.suggested).to.be.true;

    const intent = info.entities.intent[0];
    expect(intent.value).to.equal(getInformationIntent);
    expect(intent.confidence).to.be.at.least(minimumIntentConfidence);

    done();
    });
  });

  it("should process inquiry for \"drugs\"", function(done) {

    const problem = "A friend wants to try drugs, what is this?";

    request({url:witUrl, qs:{ v:queryDate, q:problem, access_token:witToken }}, function(err, response, body) {
    var info = JSON.parse(body);
    const searchQuery = info.entities.search_query[0];

    expect(info._text).to.equal(problem);
    expect(searchQuery.confidence).to.be.at.least(minimumEntityConfidence);
    expect(searchQuery.value).to.equal("drugs");
    expect(searchQuery.suggested).to.be.true;

    const intent = info.entities.intent[0];
    expect(intent.value).to.equal(getInformationIntent);
    expect(intent.confidence).to.be.at.least(minimumIntentConfidence);

    done();
    });
  });

    it("should process inquiry for \"oral\"", function(done) {

    const problem = "My friend wants to try oral, what is this?";

    request({url:witUrl, qs:{ v:queryDate, q:problem, access_token:witToken }}, function(err, response, body) {
    var info = JSON.parse(body);
    const searchQuery = info.entities.search_query[0];

    expect(info._text).to.equal(problem);
    expect(searchQuery.confidence).to.be.at.least(minimumEntityConfidence);
    expect(searchQuery.value).to.equal("oral");
    expect(searchQuery.suggested).to.be.true;

    const intent = info.entities.intent[0];
    expect(intent.value).to.equal(getInformationIntent);
    expect(intent.confidence).to.be.at.least(minimumIntentConfidence);

    done();
    });
  });

  it("should process inquiry for \"porn\"", function(done) {

    const problem = "i read about porn, what is this?";

    request({url:witUrl, qs:{ v:queryDate, q:problem, access_token:witToken }}, function(err, response, body) {
    var info = JSON.parse(body);
    const searchQuery = info.entities.search_query[0];

    expect(info._text).to.equal(problem);
    expect(searchQuery.confidence).to.be.at.least(minimumEntityConfidence);
    expect(searchQuery.value).to.equal("porn");
    expect(searchQuery.suggested).to.be.true;

    const intent = info.entities.intent[0];
    expect(intent.value).to.equal(getInformationIntent);
    expect(intent.confidence).to.be.at.least(minimumIntentConfidence);

    done();
    });
  });

  it("should process inquiry for \"pimp\"", function(done) {

    const problem = "my mom called my dad a pimp, what does it mean?";

    request({url:witUrl, qs:{ v:queryDate, q:problem, access_token:witToken }}, function(err, response, body) {
    var info = JSON.parse(body);
    const searchQuery = info.entities.search_query[0];

    expect(info._text).to.equal(problem);
    expect(searchQuery.confidence).to.be.at.least(minimumEntityConfidence);
    expect(searchQuery.value).to.equal("pimp");
    expect(searchQuery.suggested).to.be.true;

    const intent = info.entities.intent[0];
    expect(intent.value).to.equal(getInformationIntent);
    expect(intent.confidence).to.be.at.least(minimumIntentConfidence);

    done();
    });
  });

});
