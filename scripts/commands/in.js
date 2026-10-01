module.exports.config = {
  name: "in",
  version: "1.0.0",
  permission: 0,
  credits: "sakib",
  description: "Send profile preview card",
  prefix: true,
  category: "fun",
  usages: "in [@mention]",
  cooldowns: 3,
};

module.exports.run = async function ({ api, event, args }) {
  let targetID;

  // যদি মেনশন থাকে
  if (Object.keys(event.mentions).length > 0) {
    targetID = Object.keys(event.mentions)[0];
  } 
  // মেনশন নাই, শুধু in লিখছে → তার নিজের আইডি
  else {
    targetID = event.senderID;
  }

  // প্রোফাইল লিংক বানাও
  const profileLink = `https://m.facebook.com/profile.php?id=${targetID}`;

  // এখন প্রোফাইল লিংক পাঠাও (Messenger অটো কার্ড বানাবে)
  return api.sendMessage(profileLink, event.threadID, event.messageID);
};
