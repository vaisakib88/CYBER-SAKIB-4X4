module.exports.config = {
  name: "hack", 
  version: "1.0.1", 
  permission: 1,
  credits: "Nayan",
  description: "example",
  prefix: true,
  category: "Fun", 
  usages: "user", 
  cooldowns: 5,
  dependencies: {
        "axios": "",
        "fs-extra": "",
        "canvas": ""
  }
};

module.exports.wrapText = (ctx, text, maxWidth) => {
  // সাদাসাপ্টা শব্দভাগ করা wrapper — এখানে আমরা এখন আর নতুন লাইনের জন্য '\n' ব্যবহার করব না,
  // কারণ আমরা পরে প্রতিটি লাইনের জন্য আলাদা করে draw করবো।
  return new Promise(resolve => {
    if (!text) return resolve([]);
    if (ctx.measureText(text).width < maxWidth) return resolve([text]);
    if (ctx.measureText('W').width > maxWidth) return resolve(null);
    const words = text.split(' ');
    const lines = [];
    let line = '';
    while (words.length > 0) {
      let split = false;
      while (ctx.measureText(words[0]).width >= maxWidth) {
        const temp = words[0];
        words[0] = temp.slice(0, -1);
        if (split) words[1] = `${temp.slice(-1)}${words[1]}`;
        else {
          split = true;
          words.splice(1, 0, temp.slice(-1));
        }
      }
      if (ctx.measureText(`${line}${words[0]}`).width < maxWidth) line += `${words.shift()} `;
      else {
        lines.push(line.trim());
        line = '';
      }
      if (words.length === 0) lines.push(line.trim());
    }
    return resolve(lines);
  });
}

module.exports.run = async function ({ args, Users, Threads, api, event, Currencies }) {
  const { loadImage, createCanvas } = require("canvas");
  const fs = global.nodemodule["fs-extra"];
  const axios = global.nodemodule["axios"];

  const cacheDir = __dirname + "/cache";
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

  let pathImg = cacheDir + "/background.png";
  let pathAvt1 = cacheDir + "/Avtmot.png";

  try {
    // mentions safe handling
    const mentionKeys = event.mentions ? Object.keys(event.mentions) : [];
    const id = mentionKeys.length ? mentionKeys[0] : event.senderID;
    const name = await Users.getNameUser(id);
    // pick a background (random)
    const backgrounds = [
      "https://drive.google.com/uc?id=1RwJnJTzUmwOmP3N_mZzxtp63wbvt9bLZ"
    ];
    const rd = backgrounds[Math.floor(Math.random() * backgrounds.length)];

    // get avatar image (binary)
    const avatarUrl = `https://graph.facebook.com/${id}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
    const getAvtmot = await axios.get(avatarUrl, { responseType: "arraybuffer" });
    fs.writeFileSync(pathAvt1, Buffer.from(getAvtmot.data)); // write raw buffer

    // get background image (binary)
    const getbackground = await axios.get(rd, { responseType: "arraybuffer" });
    fs.writeFileSync(pathImg, Buffer.from(getbackground.data));

    // load images
    let baseImage = await loadImage(pathImg);
    let baseAvt1 = await loadImage(pathAvt1);

    // create canvas
    let canvas = createCanvas(baseImage.width, baseImage.height);
    let ctx = canvas.getContext("2d");

    // draw background
    ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);

    // set font BEFORE measuring/wrapping
    ctx.font = "23px Arial";
    ctx.fillStyle = "#1878F3";
    ctx.textAlign = "start";
    ctx.textBaseline = "top";

    // wrap text and draw each line with lineHeight
    const lines = await this.wrapText(ctx, name, 1160) || [];
    const startX = 200;
    let startY = 497;
    const lineHeight = 26; // adjust as needed

    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], startX, startY + i * lineHeight);
    }

    // draw avatar
    ctx.beginPath();
    // if you want rounded avatar, you can clip here (optional)
    ctx.drawImage(baseAvt1, 83, 437, 100, 101);

    // save final
    const imageBuffer = canvas.toBuffer("image/png");
    fs.writeFileSync(pathImg, imageBuffer);

    // send message
    return api.sendMessage(
      { body: ` `, attachment: fs.createReadStream(pathImg) },
      event.threadID,
      () => {
        try { fs.unlinkSync(pathImg); } catch (e) {}
        try { fs.unlinkSync(pathAvt1); } catch (e) {}
      },
      event.messageID
    );

  } catch (err) {
    // লগ বা ইউজারকে জানিয়ে দেওয়া — যাতে তুমি কেন রেসপন্স পাচ্ছ না বুঝতে পারো
    console.error("Error in hack command:", err);
    try {
      return api.sendMessage(`Error: ${err.message}`, event.threadID, event.messageID);
    } catch (e) {
      // যদি sending-ও fail করে, নীরব থাকবি না — কনসোলে দেখা যাবে
      console.error("Also failed to send error message:", e);
    }
  }
}
