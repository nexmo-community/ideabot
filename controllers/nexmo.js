if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const Nexmo = require("nexmo");

// Set up your Nexmo credentials
const nexmo = new Nexmo({
  apiKey: process.env.NEXMO_API_KEY,
  apiSecret: process.env.NEXMO_API_SECRET,
  applicationId: process.env.NEXMO_APPLICATION_ID,
  privateKey: process.env.NEXMO_PRIVATE_KEY
});

// Export function to send messages
const messageResponder = async (from, message) => {
  nexmo.channel.send(
    { type: "sms", number: from },
    { type: "sms", number: process.env.NEXMO_NUMBER },
    {
      content: {
        type: "text",
        text: message
      }
    },
    (err, data) => {
      if (err) {
        throw new Error(err.body.type);
      } else {
        console.log(
          `Replied to ${from} with '${message}' (ID: ${data.message_uuid})`
        );
      }
    }
  );
};

module.exports = messageResponder;
