const uuid = require("uuid");
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const projectId = process.env.DIALOGFLOW_PROJECT_ID;
const languageCode = process.env.DIALOGFLOW_LANGUAGE_CODE;
const sessionId = uuid.v4();

// Instantiate a DialogFlow client.
const dialogflow = require("dialogflow");
const sessionClient = new dialogflow.SessionsClient();

// Define session path
const sessionPath = sessionClient.sessionPath(projectId, sessionId);

const dialogflowHandler = async query => {
  // Create a text query request object
  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: query,
        languageCode: languageCode
      }
    }
  };

  // Send the text query over to Dialogflow and await the result
  // using .catch to throw any errors
  const result = await sessionClient
    .detectIntent(request)
    .catch(err => console.error("ERROR:", err));

  // Pick out the response text from the returned array of objects
  // const reply = await result[0].queryResult.fulfillmentText;
  console.log("result", result);
  console.log(
    "allRequiredParamsPresent",
    result[0].queryResult.allRequiredParamsPresent
  );
  console.log("parameters", result[0].queryResult.parameters);
  console.log("intent", result[0].queryResult.intent);

  // Return the reply
  return result[0].queryResult;
};

module.exports = dialogflowHandler;
