var expect = require("chai").expect;
var request = require("request");

process.env.WIT_TOKEN = 'wit_token';

const bot = require('../bot.js');
const witToken = "YTTNUWDR3IXFVAOPWPCRHLKZWQHT2RI5";
const queryDate = "'" + new Date().toISOString().slice(0,10).replace(/-/g,"") + "'";
const witUrl = "https://api.wit.ai/message";
const minimumConfidence = 0.5;

describe("bot.js unit tests", () => {

  it("should create bot", () => {
    const client = bot.getWit();
    expect(client).to.not.be.null;
  });

 it("should return explanation for \"sex\"", function(done) {

  const problem = "What is Sex?";

	request({url:witUrl, qs:{ v:queryDate, q:problem, access_token:witToken }}, function(err, response, body) {
    var info = JSON.parse(body);
    const searchQuery = info.entities.search_query[0];

    expect(info._text).to.equal(problem);
    expect(searchQuery.confidence).to.be.at.least(minimumConfidence);
    expect(searchQuery.value).to.equal("Sex");
    expect(searchQuery.suggested).to.be.true;

    done();
    });
  });
 
});
