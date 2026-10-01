const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "botoff",
  version: "1.0.0",
  permission: 2, // 2 = Admin, Operator, or Owner
  credits: "SAKIB",
  description: "Turn the bot OFF",
  prefix: true,
  category: "system",
  cooldowns: 5
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, senderID } = event;
  const { ADMINBOT, OWNER, OPERATOR } = global.config;
  const logger = require("../../main/catalogs/SAKIBC.js");

  // botStatus.json এর পাথ
  const botStatusPath = path.resolve(__dirname, "../../data/botStatus.json");

  // ৩ ধাপ delay helper ফাংশন
  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // bot status লেখার ফাংশন
  async function writeBotStatus(status) {
    try {
      await delay(300); // ৩ ধাপ delay
      fs.writeFileSync(botStatusPath, JSON.stringify({ status: status }, null, 2));
    } catch (e) {
      logger.err("Failed to write bot status: " + e);
      return api.sendMessage("❌ Failed to update bot status due to an error.", threadID, messageID);
    }
  }

  // পারমিশন চেক
  if (!ADMINBOT.includes(senderID) && !OWNER.includes(senderID) && !OPERATOR.includes(senderID)) {
    logger.err(`Unauthorized attempt to use ${this.config.name} by user ${senderID} in thread ${threadID}`);
    return api.sendMessage(
      "❌ You don't have permission to use this command. Only Admins, Owners, or Operators can use it.",
      threadID,
      async (err, info) => {
        await new Promise(resolve => setTimeout(resolve, 5 * 1000));
        return api.unsendMessage(info.messageID);
      },
      messageID
    );
  }

  // বট অফ করা
  await writeBotStatus("off");
  return api.sendMessage("Bot is now OFF ❌", threadID, messageID);
};
