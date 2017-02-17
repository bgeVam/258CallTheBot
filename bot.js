'use strict';

// Facebook Messenger API integration

const bodyParser = require("body-parser");
const crypto = require("crypto");
const express = require("express");
const fetch = require("node-fetch");
const request = require("request");

const FB = require("./facebook.js");
const Config = require("./const.js");

let Wit = null;
let log = null;
try {
  // if running from repo
  Wit = require("../").Wit;
  log = require("../").log;
} catch (e) {
  Wit = require("node-wit").Wit;
  log = require("node-wit").log;
}

// Webserver parameter
const PORT = process.env.PORT || 8445;

// Wit.ai parameters
const WIT_TOKEN = Config.WIT_TOKEN;
if (!WIT_TOKEN) { throw new Error("missing WIT_TOKEN"); }

// Messenger API parameters
const FB_PAGE_TOKEN = Config.FB_PAGE_TOKEN;
if (!FB_PAGE_TOKEN) { throw new Error("missing FB_PAGE_TOKEN"); }
const FB_APP_SECRET = Config.FB_APP_SECRET;
if (!FB_APP_SECRET) { throw new Error("missing FB_APP_SECRET"); }
const FB_VERIFY_TOKEN = Config.FB_VERIFY_TOKEN;
if (!FB_VERIFY_TOKEN) { throw new Error("missing FB_VERIFY_TOKEN"); }

// ----------------------------------------------------------------------------
// Messenger API specific code

// See the Send API reference
// https://developers.facebook.com/docs/messenger-platform/send-api-reference
const firstEntityValue = (entities, entity) => {
  const val = entities && entities[entity] &&
    Array.isArray(entities[entity]) &&
    entities[entity].length > 0 &&
    entities[entity][0].value;
  if (!val) {
    return null;
  }
  return typeof val === 'object' ? val.value : val;
};

//formats the given message
function formatmsg(msg) {
    msg = msg.substr(0, 320);
    if (msg.lastIndexOf(".") === -1) {
        return msg;
    }
    return msg.substr(0, msg.lastIndexOf(".") + 1);
}

const fbMessage = (id, text) => {
  const body = JSON.stringify({
    recipient: { id },
    message: { text },
  });
  const qs = "access_token=" + encodeURIComponent(FB_PAGE_TOKEN);
  return fetch("https://graph.facebook.com/me/messages?" + qs, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body,
  })
  .then((rsp) => rsp.json())
  .then((json) => {
    if (json.error && json.error.message) {
      throw new Error(json.error.message);
    }
    return json;
  });
};

// ----------------------------------------------------------------------------
// Wit.ai bot specific code

//Global Variables
var searchQuery;
var botAnswer;

// This will contain all user sessions.
// Each session has an entry:
// sessionId -> {fbid: facebookUserId, context: sessionState}
const sessions = {};

const findOrCreateSession = (fbid) => {
  let sessionId;
  // Let's see if we already have a session for the user fbid
  Object.keys(sessions).forEach((k) => {
    if (sessions[k].fbid === fbid) {
      // Yep, got it!
      sessionId = k;
    }
  });
  if (!sessionId) {
    // No session found for user fbid, let's create a new one
    sessionId = new Date().toISOString();
    sessions[sessionId] = {fbid: fbid, context: {}};
  }
  return sessionId;
};

// Our bot actions
const actions = {
  send({sessionId}, {text}) {
    // Our bot has something to say!
    // Let's retrieve the Facebook user whose session belongs to
    const recipientId = sessions[sessionId].fbid;
    if (recipientId) {
      // Yay, we found our recipient!
      // Let's forward our bot response to her.
      // We return a promise to let our bot know when we're done sending
      return fbMessage(recipientId, text)
      .then(() => null)
      .catch((err) => {
        console.error(
          'Oops! An error occurred while forwarding the response to',
          recipientId,
          ':',
          err.stack || err
        );
      });
    } else {
      console.error("Oops! Couldn\'t find user for session:", sessionId);
      // Giving the wheel back to our bot
      return Promise.resolve();
    }
  },
    // getInformation bot executes
    getInformation({context,entities}) {
        return new Promise(function(resolve,reject){

            searchQuery = firstEntityValue(entities,"search_query");
            if (searchQuery){
                var queryUrl = "https://en.wikipedia.org/w/api.php?format=json&action=query&generator=search&gsrnamespace=0&gsrlimit=1&prop=extracts&exintro&explaintext&exsentences=5&exlimit=max&gsrsearch=" + searchQuery;

                var request = require("request");
                request(queryUrl, function (error, response, body) {
                    //statusCode 200 = "OK"
                    if (!error && response.statusCode === 200) {
                        try {
                            body = JSON.parse(body);
                            var pages = body.query.pages;
                            var pageId = Object.keys(pages)[0];
                            var text = pages[pageId].extract;
                            context.information = formatmsg(text);
                        }
                        catch (err) {
                            context.information = "Sorry I didn't get that, can you modify your question?";
                        }
                    } else {
                        context.information = "Connection Error: "+ response.statusCode;
                    }
                    botAnswer = context.information;
                    return resolve(context);
                });
            } else {
              context.information = "searchQuery not found";
            }
        });
    },
    // documentInquiryInterventionNeeded bot executes
    documentInquiryInterventionNeeded({context,entities}) {
        return new Promise(function(resolve,reject){
          Config.docWriteIssue(
            "getInformation: " + searchQuery,
            "## The user asked about: _" + searchQuery +"_\n\n :confused: :question: \n\n ## The bot was unable to provide an answer. :pensive:",
            [ "getInformation", "intervention needed" ]);
          return resolve(context);
        });
    },
    // documentInquiryClosed bot executes
    documentInquiryClosed({context,entities}) {
        return new Promise(function(resolve,reject){
          Config.docWriteIssue(
            "getInformation: " + searchQuery,
            "## The user asked about: _" + searchQuery +"_\n\n :confused: :question: \n\n ## This is the answer of the bot:\n\n" + botAnswer +":smile:",
            [ "getInformation", "closed" ]);
          return resolve(context);
        });
    }
};

// Setting up our bot
const wit = new Wit({
  accessToken: WIT_TOKEN,
  actions,
  logger: new log.Logger(log.INFO)
});

// Starting our webserver and putting it all together
const app = express();
app.use(({method, url}, rsp, next) => {
  rsp.on("finish", () => {
    console.log(`${rsp.statusCode} ${method} ${url}`);
  });
  next();
});
app.use(bodyParser.json({ verify: verifyRequestSignature }));

// Webhook verify setup using FB_VERIFY_TOKEN
app.get("/webhook", (req, res) => {
  if (!FB_VERIFY_TOKEN) {
    throw new Error("missing FB_VERIFY_TOKEN");
  }
  if (req.query["hub.mode"] === "subscribe" &&
    req.query["hub.verify_token"] === FB_VERIFY_TOKEN) {
    res.send(req.query["hub.challenge"]);
  } else {
    res.sendStatus(400);
  }
});

// The main message handler
app.post("/webhook", (req, res) => {
  // Parsing the Messenger API response
  const messaging = FB.getFirstMessagingEntry(req.body);
  if (messaging && messaging.message) {

    // Yay! We got a new message!

    // We retrieve the Facebook user ID of the sender
    const sender = messaging.sender.id;

    // We retrieve the user's current session, or create one if it doesn't exist
    // This is needed for our bot to figure out the conversation history
    const sessionId = findOrCreateSession(sender);

    // We retrieve the message content
    const msg = messaging.message.text;
    const atts = messaging.message.attachments;

    if (atts) {
      // We received an attachment

      // Let's reply with an automatic message
      FB.fbMessage(
        sender,
        "Sorry I can only process text messages for now."
      );
    } else if (msg) {
      // We received a text message

      // Let's forward the message to the Wit.ai Bot Engine
      // This will run all actions until our bot has nothing left to do
      wit.runActions(
        sessionId, // the user's current session
        msg, // the user's message 
        sessions[sessionId].context, // the user's current session state
        (error, context) => {
          if (error) {
            console.log("Oops! Got an error from Wit:", error);
          } else {
            // Our bot did everything it has to do.
            // Now it's waiting for further messages to proceed.
            console.log("Waiting for futher messages.");

            // Based on the session state, you might want to reset the session.
            // This depends heavily on the business logic of your bot.
            // Example:
            // if (context['done']) {
            //   delete sessions[sessionId];
            // }

            // Updating the user's current session state
            sessions[sessionId].context = context;
          }
        }
      );
    }
  }
  res.sendStatus(200);
});

/*
 * Verify that the callback came from Facebook. Using the App Secret from
 * the App Dashboard, we can verify the signature that is sent with each
 * callback in the x-hub-signature field, located in the header.
 *
 * https://developers.facebook.com/docs/graph-api/webhooks#setup
 *
 */
function verifyRequestSignature(req, res, buf) {
  var signature = req.headers["x-hub-signature"];

  if (!signature) {
    // For testing, let's log an error. In production, you should throw an
    // error.
    console.error("Couldn't validate the signature.");
  } else {
    var elements = signature.split("=");
    var method = elements[0];
    var signatureHash = elements[1];

    var expectedHash = crypto.createHmac("sha1", FB_APP_SECRET)
                        .update(buf)
                        .digest("hex");

    if (signatureHash !== expectedHash) {
      throw new Error("Couldn't validate the request signature.");
    }
  }
}

app.listen(PORT);
console.log("Listening on :" + PORT + "...");
