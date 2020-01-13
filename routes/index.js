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
    const uri = process.env.MONGO_URI;
    const client = new MongoClient(uri, { useNewUrlParser: true });

    if (dialogflowResponse.allRequiredParamsPresent) {
      switch (dialogflowResponse.action) {
        case "idea.new":
          client.connect(function(err, client) {
            const db = client.db("ideabot");

            // Insert idea into document
            db.collection("ideas").insertOne(
              dialogflowResponse.parameters.fields,
              function(err, r) {
                console.log("err: ", err);
              }
            );
          });
          messageResponder(from, dialogflowResponse.fulfillmentText);
          break;
        case "idea.search":
          console.log("SEARCHING IN MONGO", dialogflowResponse.parameters);
          (async function() {
            try {
              await client.connect();
              const db = client.db("ideabot");

              // Get the collection
              const col = db.collection("ideas");

              // Get the cursor
              // .find not working:
              const cursor = col.find({
                "category.stringValue": {
                  $regex:
                    ".*" +
                    dialogflowResponse.parameters.fields.searchString
                      .stringValue +
                    ".*",
                  $options: "$i"
                }
              });

              // Iterate over the cursor
              while (await cursor.hasNext()) {
                const doc = await cursor.next();
                console.log("doc: ", doc);
              }
            } catch (err) {
              console.log(err.stack);
            }

            // Close connection
            client.close();
          })();
          break;
        default:
          console.log("I don't understand that.");
      }
    } else {
      messageResponder(from, dialogflowResponse.fulfillmentText);
    }

    ctx.status = 200;
  }
};

module.exports = routes;
