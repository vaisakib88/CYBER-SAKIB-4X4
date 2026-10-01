module.exports.config = {
  name: "kiss",
  version: "1.0.0",
  permission: 0,
  credits: "SAKIB",
  description: "Send a cute kiss using canvas API (stream version)",
  prefix: false,
  category: "fun",
  usages: "kiss @mention",
  cooldowns: 5,
  dependencies: {
    "axios": ""
  }
};

const axios = require("axios");

module.exports.run = async ({ api, event }) => {
  const { threadID, messageID, senderID, mentions } = event;

  if (Object.keys(mentions).length === 0) {
    return api.sendMessage("Please mention someone to kiss.", threadID, messageID);
  }

  const mentionID = Object.keys(mentions)[0];
  const mentionName = mentions[mentionID];

  const imgURL = `${global.SAKIBapi.canvas}/kiss?userid1=${mentionID}&userid2=${senderID}`;

  // Fixed cute message
  const message = `💋 Sending a sweet and cute kiss to you, ${mentionName} ~ ❤️`;

  try {
    const response = await axios({
      url: imgURL,
      method: 'GET',
      responseType: 'stream'
    });

    api.sendMessage({
      body: message,
      attachment: response.data
    }, threadID, messageID);

  } catch (err) {
    console.error(err);
    api.sendMessage("Something went wrong. Please try again later.", threadID, messageID);
  }
};
