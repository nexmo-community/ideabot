const dialogflowHandler = require("../controllers/dialogflow");
const messageResponder = require("../controllers/nexmo");
const MongoClient = require("mongodb").MongoClient;
require("dotenv").config();

const routes = {
  inbound: async ctx => {
    // Get the detail of who sent the message, and the message itself
    const message = ctx.request.body.text;
    const from = ctx.request.body.msisdn;
    console.log(from, message);

    const dialogflowResponse = await dialogflowHandler(message);

    if (
      dialogflowResponse.allRequiredParamsPresent &&
      dialogflowResponse.action == "idea.new"
    ) {
      const uri = process.env.MONGO_URI;
      const client = new MongoClient(uri, { useNewUrlParser: true });
      client.connect(function(err, client) {
        const db = client.db("ideabot");

        // Insert idea into document
        db.collection("ideas").insertOne(
          dialogflowResponse.parameters,
          function(err, r) {
            console.log("err: ", err);
          }
        );
      });
    }
    messageResponder(from, dialogflowResponse.fulfillmentText);
    ctx.status = 200;
  }
};

module.exports = routes;
