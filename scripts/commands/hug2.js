const axios = require("axios");

module.exports.config = {
  name: "hug2",
  version: "3.0.0",
  permission: 0,
  credits: "SAKIB",
  description: "Send hug using SAKIB Hug API",
  prefix: false,
  category: "fun",
  usages: "hug2 @mention | reply + hug2",
  cooldowns: 5,
  dependencies: {
    axios: ""
  }
};

// ==========================================
// SAKIB HUG API
// ==========================================

const HUG_API =
  "https://cyber-sakib-4x4-production.up.railway.app/hug";


// ==========================================
// GET REPLY TARGET
// ==========================================

function getReplyTarget(event) {
  if (!event.messageReply) {
    return null;
  }

  const reply = event.messageReply;

  const possibleIDs = [
    reply.senderID,
    reply.author,
    reply.userID,
    reply.fromID,
    reply.uid
  ];

  for (const id of possibleIDs) {
    if (id !== undefined && id !== null && String(id).trim()) {
      return String(id).trim();
    }
  }

  return null;
}


// ==========================================
// GET MENTION TARGET
// ==========================================

function getMentionTarget(event) {
  const mentions = event.mentions || {};
  const ids = Object.keys(mentions);

  if (ids.length === 0) {
    return null;
  }

  return String(ids[0]);
}


// ==========================================
// GET MENTION NAME
// ==========================================

function getMentionName(event, targetID) {
  const mentions = event.mentions || {};
  const data = mentions[targetID];

  if (!data) {
    return "your friend";
  }

  if (typeof data === "object" && data.tag) {
    return String(data.tag).replace(/^@/, "");
  }

  if (typeof data === "string") {
    return data.replace(/^@/, "");
  }

  return "your friend";
}


// ==========================================
// GET REPLY NAME
// ==========================================

function getReplyName(event) {
  const reply = event.messageReply;

  if (!reply) {
    return "your friend";
  }

  const names = [
    reply.senderName,
    reply.name
  ];

  for (const name of names) {
    if (name && String(name).trim()) {
      return String(name).trim();
    }
  }

  return "your friend";
}


// ==========================================
// COMMAND
// ==========================================

module.exports.run = async ({ api, event }) => {

  console.log("");
  console.log("======================================");
  console.log("🔥 SAKIB HUG2 RUN FUNCTION STARTED");
  console.log("======================================");

  const threadID = event.threadID;
  const messageID = event.messageID;
  const senderID = String(event.senderID || "");

  console.log("Sender UID :", senderID);
  console.log("Thread ID  :", threadID);
  console.log("Message ID :", messageID);
  console.log("Mentions   :", event.mentions || {});
  console.log(
    "Reply      :",
    event.messageReply
      ? "YES"
      : "NO"
  );

  // ======================================
  // FIND TARGET
  // ======================================

  let targetID = null;
  let targetName = "your friend";
  let targetType = null;


  // First priority: REPLY
  targetID = getReplyTarget(event);

  if (targetID) {

    targetType = "REPLY";
    targetName = getReplyName(event);

  } else {

    // Second priority: MENTION
    targetID = getMentionTarget(event);

    if (targetID) {

      targetType = "MENTION";
      targetName = getMentionName(
        event,
        targetID
      );
    }
  }


  // ======================================
  // NO TARGET
  // ======================================

  if (!targetID) {

    console.log("❌ No hug target found.");

    return api.sendMessage(
      "🤗 যাকে Hug দিতে চাও:\n\n" +
      "1️⃣ তার message-এ Reply করে `hug2` লিখো\n\n" +
      "অথবা\n\n" +
      "2️⃣ তাকে Mention করে `hug2 @mention` লিখো 🫂",
      threadID,
      messageID
    );
  }


  // ======================================
  // BOT SELF CHECK
  // ======================================

  let botID = null;

  try {

    if (
      typeof api.getCurrentUserID === "function"
    ) {

      botID = String(
        api.getCurrentUserID()
      );
    }

  } catch (error) {

    console.log(
      "[SAKIB HUG2] Bot ID detect failed:",
      error.message
    );
  }


  if (
    botID &&
    targetID === botID
  ) {

    return api.sendMessage(
      "😳 আমাকে আবার Hug দিচ্ছো নাকি? 🤭❤️🫂",
      threadID,
      messageID
    );
  }


  // ======================================
  // BUILD API URL
  // ======================================

  const apiURL =
    `${HUG_API}` +
    `?one=${encodeURIComponent(senderID)}` +
    `&two=${encodeURIComponent(targetID)}`;


  console.log("");
  console.log("========== SAKIB HUG2 ==========");
  console.log("Type       :", targetType);
  console.log("Sender UID :", senderID);
  console.log("Target UID :", targetID);
  console.log("Target Name:", targetName);
  console.log("API URL    :", apiURL);
  console.log("================================");
  console.log("");


  // ======================================
  // CALL HUG API
  // ======================================

  try {

    const response = await axios.get(
      apiURL,
      {
        responseType: "stream",

        timeout: 30000,

        maxRedirects: 5,

        validateStatus: () => true,

        headers: {
          "User-Agent":
            "Mozilla/5.0 SAKIB-HUG2"
        }
      }
    );


    console.log(
      "[SAKIB HUG2] HTTP Status:",
      response.status
    );

    console.log(
      "[SAKIB HUG2] Content-Type:",
      response.headers["content-type"]
    );


    // ====================================
    // API ERROR
    // ====================================

    if (response.status !== 200) {

      return api.sendMessage(
        `❌ Hug API Error!\n\n` +
        `HTTP Status: ${response.status}\n` +
        `Target UID: ${targetID}`,
        threadID,
        messageID
      );
    }


    // ====================================
    // CHECK IMAGE
    // ====================================

    const contentType =
      String(
        response.headers["content-type"] || ""
      ).toLowerCase();


    if (
      !contentType.startsWith("image/")
    ) {

      console.error(
        "[SAKIB HUG2] API did not return image."
      );

      return api.sendMessage(
        "❌ Hug API image দেয়নি।\n\n" +
        "API response image নয়।",
        threadID,
        messageID
      );
    }


    // ====================================
    // SEND IMAGE
    // ====================================

    console.log(
      "✅ Hug image received."
    );

    console.log(
      "📤 Sending Hug image..."
    );


    return api.sendMessage(
      {
        body:
          `🤗 ${targetName}, তোমার জন্য একটা Hug! ❤️🫂\n\n` +
          `— SAKIB BOT ❣️`,

        attachment:
          response.data
      },

      threadID,

      messageID
    );


  } catch (error) {

    console.error("");
    console.error(
      "❌❌❌ SAKIB HUG2 ERROR ❌❌❌"
    );

    console.error(
      error.message
    );

    console.error(
      "================================"
    );


    return api.sendMessage(
      "❌ Hug API connection failed.\n\n" +
      `Error: ${error.message}`,
      threadID,
      messageID
    );
  }
};
