module.exports.config = {
  name: "cummah",
  version: "1.0.3",
  permission: 0,
  credits: "Sakib Vai",
  description: "উম্মাহ বার্তা ও reply করলে মিষ্টি কথা",
  prefix: true,
  category: "fun",
  usages: "@mention অথবা কারো মেসেজে reply করে -cummah",
  cooldowns: 5,
};

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, mentions, messageReply } = event;

  let mentionID, mentionName;

  // ১. চেক করা হচ্ছে কেউ মেনশন করেছে কি না অথবা কারো মেসেজে রিপ্লাই করে কমান্ড দিয়েছে কি না
  if (Object.keys(mentions).length > 0) {
    mentionID = Object.keys(mentions)[0];
    mentionName = mentions[mentionID];
  } else if (messageReply) {
    mentionID = messageReply.senderID;
    // প্রেরকের নাম বের করার চেষ্টা
    try {
      const userInfo = await api.getUserInfo(mentionID);
      mentionName = userInfo[mentionID] ? userInfo[mentionID].name : "বন্ধੂ";
    } catch (e) {
      mentionName = "বন্ধু";
    }
  } else {
    return api.sendMessage("❌ কাউকে মেনশন করো অথবা কারো মেসেজে রিপ্লাই দিয়ে `-cummah` লেখো।", threadID, messageID);
  }

  const tag = { tag: mentionName, id: mentionID };

  const messages = [
    `${mentionName} শাকিব ভাইয়ের পক্ষ থেকে এতোগুলো উম্মাহ তুমার জন্য শুধু😽😻`,
    `${mentionName} তুমার গালে উম্মাহ 😘`,
    `${mentionName} তুমার ঠোঁটে উম্মাহ 😚`,
    `${mentionName} তুমার উপরে উম্মাহ 😍`,
    `${mentionName} তুমার কপালে উম্মাহ 🥰`,
    `${mentionName} তুমার গলায় উম্মাহ 😘`,
    `${mentionName} তুমার চোখে উম্মাহ 😌`,
    `${mentionName} তুমার হৃদয়ে উম্মাহ ❤️`,
    `${mentionName} তুমার নাকে উম্মাহ 💋`,
    `${mentionName} তুমার হাতের তালুতে উম্মাহ 🤲`,
    `${mentionName} তুমার কানে উম্মাহ 👂😘`,
    `${mentionName} তুমার গালের ডিম্পলে উম্মাহ 😳`,
    `${mentionName} তুমার চিনিতে উম্মাহ 😋`,
    `${mentionName} তুমার কোমরে উম্মাহ 🔥`,
    `${mentionName} তুমার পিঠে উম্মাহ 💞`,
    `${mentionName} তুমার ঘাড়ে উম্মাহ 😈`,
    `${mentionName} তুমার বুকের বামে উম্মাহ 💓`,
    `${mentionName} তুমার বুকের ডানে উম্মাহ 💗`,
    `${mentionName} তুমার পায়ের আঙুলে উম্মাহ 🦶💋`,
    `${mentionName} তুমার হৃদয়ের গভীরে উম্মাহ 🫀`,
    `${mentionName} তুমার আত্মায় উম্মাহ 👻❤️`,
    `${mentionName} তুমার শ্বাসে উম্মাহ 😮‍💨`,
    `${mentionName} তুমার কল্পনায় উম্মাহ 🤤`,
    `${mentionName} তুমার ছায়ায় উম্মাহ 🌑`,
    `${mentionName} তুমার সব কথায় উম্মাহ 🎤💋`,
    `${mentionName} শাকিব ভাই কে এখন পটাও🤭🤭`,
  ];

  // লুপ চালিয়ে মেসেজগুলো পাঠানো
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
};

// বটের দেওয়া শেষের মেসেজে যদি ওই ইউজার আবার রিপ্লাই করে, তবে এই অংশ কাজ করবে
module.exports.handleEvent = async function ({ api, event }) {
  const { senderID, threadID, messageReply } = event;

  if (messageReply) {
    try {
      const botID = await api.getCurrentUserID();
      // যদি বটের মেসেজে টার্গেটেড ইউজার রিপ্লাই করে
      if (messageReply.senderID === botID) {
        api.sendMessage(
          "🤫 কথা বইলোনা! শাকিব ভাই তুমাকে উম্মাহ দিতে বলছে তার পক্ষ থেকে 😘",
          threadID
        );
      }
    } catch (err) {
      console.error(err);
    }
  }
};
