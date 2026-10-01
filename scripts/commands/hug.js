module.exports.config = {
  name: "hug",
  version: "1.0.1",
  permission: 0,
  credits: "SAKIB",
  description: "Send hug using canvas API (stable)",
  prefix: false,
  category: "fun",
  usages: "hug @mention",
  cooldowns: 5,
  dependencies: { "axios": "" }
};

const axios = require("axios");
const fs = require("fs");
const path = require("path");
const os = require("os");

module.exports.run = async ({ api, event }) => {
  const { threadID, messageID, senderID } = event;
  const mentions = event.mentions || {};

  // 0) mention check
  const mentionIDs = Object.keys(mentions);
  if (mentionIDs.length === 0) {
    return api.sendMessage("Please mention someone to hug.", threadID, messageID);
  }

  // 1) base URL check
  if (!global?.SAKIBapi?.canvas || !/^https?:\/\//.test(global.SAKIBapi.canvas)) {
    return api.sendMessage(
      "❌ Canvas API base URL সঠিকভাবে সেট করা নেই। global.SAKIBapi.canvas-এ http/https সহ দিন।",
      threadID,
      messageID
    );
  }

  // 2) mention info
  const mentionID = mentionIDs[0];
  const rawMention = mentions[mentionID];
  const mentionName =
    (rawMention && typeof rawMention === "object" && rawMention.tag) ?
      rawMention.tag :
      (typeof rawMention === "string" ? rawMention.replace(/^@/, "") : "your friend");

  // 3) build URL
  const imgURL = `${global.SAKIBapi.canvas}/hug?one=${encodeURIComponent(senderID)}&two=${encodeURIComponent(mentionID)}`;

  try {
    // 4) fetch image
    const resp = await axios.get(imgURL, {
      responseType: "arraybuffer",
      timeout: 20000,
      validateStatus: () => true
    });

    if (resp.status !== 200) {
      return api.sendMessage(`❌ Hug API error: HTTP ${resp.status}.`, threadID, messageID);
    }

    const ctype = String(resp.headers["content-type"] || "").toLowerCase();
    if (!ctype.startsWith("image/")) {
      const preview = Buffer.from(resp.data).toString("utf8").slice(0, 120);
      return api.sendMessage(
        `❌ Hug API ইমেজ দেয়নি (Content-Type: ${ctype || "unknown"}).\n${preview}`,
        threadID,
        messageID
      );
    }

    // 5) temp file write
    const ext =
      ctype.includes("png") ? "png" :
      ctype.includes("jpeg") || ctype.includes("jpg") ? "jpg" :
      ctype.includes("gif") ? "gif" :
      ctype.includes("webp") ? "webp" : "png";

    const tmpFile = path.join(os.tmpdir(), `hug_${Date.now()}.${ext}`);
    fs.writeFileSync(tmpFile, Buffer.from(resp.data));

    // 6) send attachment
    api.sendMessage({
      body: `🤗 ${mentionName}, you just got a hug!`,
      attachment: fs.createReadStream(tmpFile)
    }, threadID, (err) => {
      // cleanup
      fs.unlink(tmpFile, () => {});
      if (err) {
        api.sendMessage("❌ ছবি পাঠানো যায়নি (attachment error).", threadID);
      }
    }, messageID);

  } catch (err) {
    console.error("hug command error:", err?.message);
    return api.sendMessage(`Something went wrong.\n${err?.message || ""}`, threadID, messageID);
  }
};
