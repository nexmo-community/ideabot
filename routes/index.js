const dialogflowHandler = require("../controllers/dialogflow");
const messageResponder = require("../controllers/nexmo");

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
      console.log("MONGO TIME");
    }
    messageResponder(from, dialogflowResponse.fulfillmentText);
    ctx.status = 200;
  }
};

module.exports = routes;
