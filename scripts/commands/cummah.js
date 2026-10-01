module.exports.config = {
  name: "cummah",
  version: "1.0.2",
  permission: 0,
  credits: "Sakib Vai",
  description: "উম্মাহ বার্তা ও reply করলে মিষ্টি কথা",
  prefix: true,
  category: "fun",
  usages: "@mention",
  cooldowns: 5,
};

const repliedUsers = new Map();

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, mentions } = event;

  if (!Object.keys(mentions).length) {
    return api.sendMessage("❌ আগে কাউকে মেনশন করো।", threadID, messageID);
  }

  const mentionID = Object.keys(mentions)[0];
  const mentionName = mentions[mentionID];
  const tag = { tag: mentionName, id: mentionID };

  const messages = [
    `${mentionName} শাকিব ভাইয়ের পক্ষ থেকে এতোগুলো উম্মাহ তুমার জন্য শুধু😽😻`,
    `${mentionName} তুমার গালে উম্মাহ 😘`,
    `${mentionName} তুমার ঠোঁটে উম্মাহ 😚`,
    `${mentionName} তুমার উপরে উম্মাহ 😍`,
    `${mentionName} তুমার কপালে উম্মাহ 🥰`,
    `${mentionName} তুমার গলায় উম্মাহ 😘`,
    `${mentionName} তুমার চোখে উম্মাহ 😌`,
    `${mentionName} তুমার হৃদয়ে উম্মাহ ❤️`,
    `${mentionName} তুমার নাকে উম্মাহ 💋`,
    `${mentionName} তুমার হাতের তালুতে উম্মাহ 🤲`,
    `${mentionName} তুমার কানে উম্মাহ 👂😘`,
    `${mentionName} তুমার গালের ডিম্পলে উম্মাহ 😳`,
    `${mentionName} তুমার চিনিতে উম্মাহ 😋`,
    `${mentionName} তুমার কোমরে উম্মাহ 🔥`,
    `${mentionName} তুমার পিঠে উম্মাহ 💞`,
    `${mentionName} তুমার ঘাড়ে উম্মাহ 😈`,
    `${mentionName} তুমার বুকের বামে উম্মাহ 💓`,
    `${mentionName} তুমার বুকের ডানে উম্মাহ 💗`,
    `${mentionName} তুমার পায়ের আঙুলে উম্মাহ 🦶💋`,
    `${mentionName} তুমার হৃদয়ের গভীরে উম্মাহ 🫀`,
    `${mentionName} তুমার আত্মায় উম্মাহ 👻❤️`,
    `${mentionName} তুমার শ্বাসে উম্মাহ 😮‍💨`,
    `${mentionName} তুমার কল্পনায় উম্মাহ 🤤`,
    `${mentionName} তুমার ছায়ায় উম্মাহ 🌑`,
    `${mentionName} তুমার সব কথায় উম্মাহ 🎤💋`,
    `${mentionName} শাকিব ভাই কে এখন পটাও🤭🤭`,
  ];

  for (let i = 0; i < messages.length; i++) {
    await new Promise(resolve => setTimeout(resolve, 1500));
    await api.sendMessage(
      {
        body: messages[i],
        mentions: [tag],
      },
      threadID
    );
  }

  const botID = await api.getCurrentUserID();
  repliedUsers.set(threadID, {
    userID: mentionID,
    botID: botID,
  });

  if (!global._cummahReplyHandlerSet) {
    global._cummahReplyHandlerSet = true;

    api.listenMqtt((callbackEvent) => {
      const { senderID, threadID: cbThreadID, messageReply } = callbackEvent;

      if (repliedUsers.has(cbThreadID)) {
        const { userID, botID } = repliedUsers.get(cbThreadID);

        if (
          senderID === userID &&
          messageReply &&
          messageReply.senderID &&
          messageReply.senderID === botID
        ) {
          api.sendMessage(
            "🤫 কথা বইলোনা! শাকিব ভাই তুমাকে উম্মাহ দিতে বলছে তার পক্ষ থেকে 😘",
            cbThreadID
          );

          repliedUsers.delete(cbThreadID);
        }
      }
    });
  }
};
