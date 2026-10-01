const axios = require("axios");
const fs = require("fs");
const path = require("path");

const cacheFile = path.join(__dirname, "cache", "cache.json");
if (!fs.existsSync(cacheFile)) fs.writeFileSync(cacheFile, JSON.stringify({}));

module.exports.config = {
  name: "needgf",
  version: "2.3.0",
  permission: 0,
  credits: "SAKIB",
  description: "সিঙ্গেলদের শেষ ভরসা — র‍্যান্ডম GF ছবি পাঠায় 😅 (axios + cache)",
  prefix: true,
  category: "fun",
  usages: "-needgf",
  cooldowns: 10,
};

module.exports.run = async function ({ api, event }) {
  try {
    const userID = event.senderID;
    let cache = JSON.parse(fs.readFileSync(cacheFile));

    // প্রতিবার নতুন ছবি ফেচ
    const res = await axios.get("https://nekos.best/api/v2/neko");
    const imageUrl = res.data.results[0].url;

    // cache আপডেট (সর্বশেষ ব্যবহৃত ছবি)
    cache[userID] = imageUrl;
    fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2));

    // ডাউনলোড path
    const imgPath = path.join(__dirname, "cache", `${userID}_gf.jpg`);

    // ডাউনলোড
    const imgResponse = await axios.get(imageUrl, { responseType: "arraybuffer" });
    fs.writeFileSync(imgPath, imgResponse.data);

    // পাঠানো
    api.sendMessage({
      body: "তোমার নতুন GF হাজির 😘💖",
      attachment: fs.createReadStream(imgPath)
    }, event.threadID, () => fs.unlinkSync(imgPath), event.messageID);

  } catch (err) {
    console.error("❌ Full Error:", err);
    api.sendMessage("দুঃখিত ভাই 😅, এখন একটু সমস্যা হচ্ছে!", event.threadID, event.messageID);
  }
};
