const fs = require("fs");
const path = require("path");
const os = require("os");
const axios = require("axios");

// ==========================================
// COMMAND CONFIG
// ==========================================

module.exports.config = {
  name: "hug",
  version: "3.0.0",
  permission: 0,
  credits: "SAKIB",
  description: "Send hug image to a mentioned person",
  prefix: false,
  category: "fun",
  usages: "hug @mention",
  cooldowns: 5,

  dependencies: {
    axios: ""
  }
};

// ==========================================
// HUG API CONFIG
// ==========================================

const API_CONFIG_PATH = path.join(
  __dirname,
  "../../main/configs/hug_api.json"
);

// ==========================================
// GET HUG API
// ==========================================

function getHugAPI() {
  try {
    if (!fs.existsSync(API_CONFIG_PATH)) {
      console.error(
        "[SAKIB HUG] Config file not found:",
        API_CONFIG_PATH
      );
      return null;
    }

    const config = JSON.parse(
      fs.readFileSync(API_CONFIG_PATH, "utf8")
    );

    const url = String(config.hug || "").trim();

    if (!url) {
      console.error("[SAKIB HUG] hug API URL is empty.");
      return null;
    }

    return url;

  } catch (error) {
    console.error(
      "[SAKIB HUG] Config error:",
      error.message
    );

    return null;
  }
}

// ==========================================
// GET TARGET FROM MENTION
// ==========================================

function getMentionTarget(event) {
  const mentions = event.mentions || {};

  const ids = Object.keys(mentions);

  if (ids.length > 0) {
    const targetID = String(ids[0]);
    const data = mentions[targetID];

    let name = "your friend";

    if (
      data &&
      typeof data === "object" &&
      data.tag
    ) {
      name = String(data.tag).replace(/^@/, "").trim();
    } else if (typeof data === "string") {
      name = data.replace(/^@/, "").trim();
    }

    return {
      id: targetID,
      name
    };
  }

  return null;
}

// ==========================================
// COMMAND RUN
// ==========================================

module.exports.run = async function ({
  api,
  event
}) {

  try {

    const threadID = event.threadID;
    const messageID = event.messageID;
    const senderID = String(event.senderID);

    // ======================================
    // GET MENTION
    // ======================================

    const target = getMentionTarget(event);

    if (!target) {

      console.log(
        "[SAKIB HUG] No valid mention found."
      );

      return api.sendMessage(
        "🤗 Please mention someone to hug.\n\nExample: -hug @name",
        threadID,
        messageID
      );
    }

    const targetID = target.id;
    const targetName = target.name;

    // ======================================
    // GET API
    // ======================================

    const baseURL = getHugAPI();

    if (!baseURL) {

      return api.sendMessage(
        "❌ Hug API configuration পাওয়া যায়নি।",
        threadID,
        messageID
      );
    }

    // ======================================
    // REMOVE TRAILING SLASH
    // ======================================

    const cleanURL = baseURL.replace(/\/+$/, "");

    // ======================================
    // BUILD API URL
    // ======================================

    const apiURL =
      `${cleanURL}` +
      `?one=${encodeURIComponent(senderID)}` +
      `&two=${encodeURIComponent(targetID)}`;

    // ======================================
    // LOG
    // ======================================

    console.log("");
    console.log("================================");
    console.log("        SAKIB HUG");
    console.log("================================");
    console.log("Sender UID :", senderID);
    console.log("Target UID :", targetID);
    console.log("Target Name:", targetName);
    console.log("API URL    :", apiURL);
    console.log("================================");
    console.log("");

    // ======================================
    // REQUEST API
    // ======================================

    let response;

    try {

      response = await axios.get(
        apiURL,
        {
          responseType: "arraybuffer",

          timeout: 60000,

          validateStatus: () => true,

          headers: {
            "User-Agent":
              "Mozilla/5.0 SAKIB-HUG-BOT",
            "Accept":
              "image/png,image/jpeg,image/webp,*/*"
          }
        }
      );

    } catch (error) {

      console.error(
        "[SAKIB HUG] API connection error:",
        error.message
      );

      return api.sendMessage(
        "❌ Hug API-তে connection করা যায়নি.\n\n" +
        error.message,
        threadID,
        messageID
      );
    }

    // ======================================
    // HTTP ERROR
    // ======================================

    if (response.status !== 200) {

      let errorText = "";

      try {

        errorText = Buffer
          .from(response.data)
          .toString("utf8")
          .slice(0, 1000);

      } catch (_) {}

      console.error(
        "[SAKIB HUG] HTTP ERROR:",
        response.status,
        errorText
      );

      return api.sendMessage(
        `❌ Hug API error: HTTP ${response.status}\n\n${errorText}`,
        threadID,
        messageID
      );
    }

    // ======================================
    // CONTENT TYPE
    // ======================================

    const contentType = String(
      response.headers["content-type"] || ""
    ).toLowerCase();

    console.log(
      "[SAKIB HUG] Content-Type:",
      contentType
    );

    // ======================================
    // CHECK IMAGE
    // ======================================

    if (!contentType.startsWith("image/")) {

      let text = "";

      try {

        text = Buffer
          .from(response.data)
          .toString("utf8")
          .slice(0, 1000);

      } catch (_) {}

      console.error(
        "[SAKIB HUG] API did not return image:",
        text
      );

      return api.sendMessage(
        "❌ Hug API image দেয়নি.\n\n" +
        text,
        threadID,
        messageID
      );
    }

    // ======================================
    // IMAGE EXTENSION
    // ======================================

    let extension = "png";

    if (contentType.includes("jpeg")) {
      extension = "jpg";
    }

    if (contentType.includes("jpg")) {
      extension = "jpg";
    }

    if (contentType.includes("webp")) {
      extension = "webp";
    }

    if (contentType.includes("gif")) {
      extension = "gif";
    }

    // ======================================
    // TEMP FILE
    // ======================================

    const tempFile = path.join(
      os.tmpdir(),
      `SAKIB_HUG_${Date.now()}.${extension}`
    );

    // ======================================
    // SAVE IMAGE
    // ======================================

    try {

      fs.writeFileSync(
        tempFile,
        Buffer.from(response.data)
      );

    } catch (error) {

      console.error(
        "[SAKIB HUG] File save error:",
        error.message
      );

      return api.sendMessage(
        "❌ Hug image save করা যায়নি.",
        threadID,
        messageID
      );
    }

    console.log(
      "[SAKIB HUG] Image saved:",
      tempFile
    );

    // ======================================
    // SEND IMAGE
    // ======================================

    return api.sendMessage(
      {
        body:
          `🤗 ${targetName}, you just got a hug! ❤️`,

        attachment:
          fs.createReadStream(tempFile)
      },

      threadID,

      (error) => {

        // ================================
        // DELETE TEMP FILE
        // ================================

        try {

          if (fs.existsSync(tempFile)) {
            fs.unlinkSync(tempFile);
          }

        } catch (deleteError) {

          console.error(
            "[SAKIB HUG] Temp delete error:",
            deleteError.message
          );
        }

        // ================================
        // SEND ERROR
        // ================================

        if (error) {

          console.error(
            "[SAKIB HUG] Messenger send error:",
            error.message
          );

        } else {

          console.log(
            "[SAKIB HUG] Image sent successfully."
          );
        }
      },

      messageID
    );

  } catch (error) {

    console.error(
      "[SAKIB HUG] Unexpected error:",
      error
    );

    return api.sendMessage(
      "❌ Hug command error.\n\n" +
      (error.message || "Unknown error"),
      event.threadID,
      event.messageID
    );
  }
};
