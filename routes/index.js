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
          (async function() {
            try {
              await client.connect();
              const db = client.db("ideabot");

              // Get the collection
              const coll = db.collection("ideas");

              const agg = [
                {
                  $searchBeta: {
                    search: {
                      query:
                        dialogflowResponse.parameters.fields.searchString
                          .stringValue,
                      path: [
                        "description.stringValue",
                        "title.stringValue",
                        "category.stringValue"
                      ]
                    }
                  }
                },
                {
                  $sort: {
                    title: 1
                  }
                },
                {
                  $project: {
                    title: "$title.stringValue",
                    description: "$description.stringValue",
                    category: "$category.stringValue"
                  }
                }
              ];

              coll.aggregate(agg, (cmdErr, result) => {
                result.toArray(function(err, documents) {
                  if (documents.length > 0) {
                    console.log("in statement");
                    var reply = `I've found ${documents.length} ideas! Here are your ideas: `;
                    for (let [index, val] of documents.entries()) {
                      reply =
                        reply +
                        `\n ${index + 1}. ${val.title} \n ${
                          val.description
                        } \n ${val.category} \n ------`;
                    }
                  } else {
                    var reply = "No ideas found.";
                  }
                  messageResponder(from, reply);
                });
              });
            } catch (err) {
              console.log(err);
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
