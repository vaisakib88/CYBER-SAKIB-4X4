const axios = require("axios");
const fs = require("fs");
const path = require("path");

const cacheFile = path.join(__dirname, "cache", "cache.json");
if (!fs.existsSync(cacheFile)) fs.writeFileSync(cacheFile, JSON.stringify({}));

module.exports.config = {
  name: "needbf",
  version: "3.0.0",
  permission: 0,
  credits: "SAKIB",
  description: "সিঙ্গেলদের জন্য র‍্যান্ডম কার্টুন/Anime BF 😎💞",
  prefix: true,
  category: "fun",
  usages: "-needbf",
  cooldowns: 10,
};

module.exports.run = async function ({ api, event }) {
  try {
    const userID = event.senderID;
    let cache = JSON.parse(fs.readFileSync(cacheFile));

    // ✅ Random Anime Boy picture (Unsplash)
    const imageUrl = "https://source.unsplash.com/600x800/?anime,boy";

    // cache আপডেট
    cache[userID] = imageUrl;
    fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2));

    // ডাউনলোড path
    const imgPath = path.join(__dirname, "cache", `${userID}_bf.jpg`);

    // ডাউনলোড
    const imgResponse = await axios.get(imageUrl, { responseType: "arraybuffer" });
    fs.writeFileSync(imgPath, imgResponse.data);

    // পাঠানো
    api.sendMessage({
      body: "তোমার নতুন কার্টুন BF হাজির 😎💞",
      attachment: fs.createReadStream(imgPath)
    }, event.threadID, () => fs.unlinkSync(imgPath), event.messageID);

  } catch (err) {
    console.error("❌ Full Error:", err);
    api.sendMessage("দুঃখিত ভাই 😅, এখন একটু সমস্যা হচ্ছে!", event.threadID, event.messageID);
  }
};
