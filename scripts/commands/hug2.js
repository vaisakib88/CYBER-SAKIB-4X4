const axios = require("axios");

module.exports.config = {
  name: "hug2",
  version: "2.0.0",
  permission: 0,
  credits: "SAKIB",
  description: "Send hug using SAKIB Hug API",
  prefix: false,
  category: "fun",
  usages: "hug2 @mention",
  cooldowns: 5,
  dependencies: {
    axios: ""
  }
};

// তোমার Railway Hug API
const HUG_API =
  "https://cyber-sakib-4x4-production.up.railway.app/hug";

module.exports.run = async ({ api, event }) => {
  const {
    threadID,
    messageID,
    senderID,
    mentions = {}
  } = event;

  const mentionIDs = Object.keys(mentions);

  if (mentionIDs.length === 0) {
    return api.sendMessage(
      "🤗 Please mention someone to hug.\n\nExample: hug2 @mention",
      threadID,
      messageID
    );
  }

  const targetID = String(mentionIDs[0]);

  let targetName = mentions[targetID];

  if (typeof targetName === "object" && targetName?.tag) {
    targetName = targetName.tag;
  }

  targetName = String(targetName || "your friend")
    .replace(/^@/, "");

  const imgURL =
    `${HUG_API}` +
    `?one=${encodeURIComponent(String(senderID))}` +
    `&two=${encodeURIComponent(targetID)}`;

  console.log("");
  console.log("========== SAKIB HUG2 ==========");
  console.log("Sender UID :", senderID);
  console.log("Target UID :", targetID);
  console.log("Target Name:", targetName);
  console.log("API URL    :", imgURL);
  console.log("================================");

  try {
    const response = await axios.get(imgURL, {
      responseType: "stream",
      timeout: 30000,
      maxRedirects: 5,
      validateStatus: () => true,
      headers: {
        "User-Agent": "SAKIB-Messenger-Bot/2.0"
      }
    });

    if (response.status !== 200) {
      return api.sendMessage(
        `❌ Hug API Error: HTTP ${response.status}`,
        threadID,
        messageID
      );
    }

    const contentType = String(
      response.headers["content-type"] || ""
    ).toLowerCase();

    if (!contentType.startsWith("image/")) {
      return api.sendMessage(
        "❌ Hug API থেকে image পাওয়া যায়নি।",
        threadID,
        messageID
      );
    }

    return api.sendMessage(
      {
        body:
          `🤗 ${targetName}, তুমি একটা Hug পেয়েছো! ❤️\n` +
          `— SAKIB BOT 🫂`,
        attachment: response.data
      },
      threadID,
      messageID
    );

  } catch (error) {
    console.error(
      "[SAKIB HUG2 ERROR]",
      error.message
    );

    return api.sendMessage(
      `❌ Hug API connection failed.\n\n${error.message}`,
      threadID,
      messageID
    );
  }
};
