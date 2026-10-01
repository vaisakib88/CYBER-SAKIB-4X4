const axios = require("axios");

module.exports.config = {
  name: "dp",
  version: "1.0.6",
  permission: 0,
  credits: "SAKIB",
  description: "Get stylish profile picture (dp1 to dp5)",
  prefix: true,
  category: "image",
  usages: "dp [1|2|3|4|5] [@mention]",
  cooldowns: 5,
};

module.exports.run = async ({ api, event, args }) => {
  const { threadID, senderID, messageID, mentions } = event;

  // ✅ React to the command message
  api.setMessageReaction("📷", messageID, () => {}, true);

  // Determine dp version
  const versionArg = ["1", "2", "3", "4", "5"].includes(args[0]) ? args[0] : "1";
  const dpVersion = `dp${versionArg}`;

  // Determine target user
  const isMentioned = Object.keys(mentions).length > 0;
  const targetID = isMentioned ? Object.keys(mentions)[0] : senderID;
  const targetName = isMentioned ? mentions[targetID].replace("@", "") : "you";

  // API URL
  const imageUrl = `${global.SAKIBapi.api1}/${dpVersion}?uid=${targetID}`;

  // Unique styled message per version
  const styleMessage = {
    dp1: `💖 Here's the Love Style DP of ${targetName}!`,
    dp2: `🎨 Art Style DP for ${targetName} — looking great!`,
    dp3: `✨ Fantasy Glow DP of ${targetName}!`,
    dp4: `🔥 Fire Frame DP of ${targetName}! Looking hot!`,
    dp5: `🌌 Galaxy Vibe DP of ${targetName} — just WOW!`
  };

  try {
    const response = await axios({
      method: "GET",
      url: imageUrl,
      responseType: "stream"
    });

    api.sendMessage({
      body: styleMessage[dpVersion] || `📸 DP of ${targetName}`,
      attachment: response.data
    }, threadID, messageID);
  } catch (error) {
    console.error("❌ Error fetching DP:", error.message);
    api.sendMessage("❌ Couldn't fetch profile picture.", threadID, messageID);
  }
};
