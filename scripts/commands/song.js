const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
  name: "song",
  version: "1.0.0",
  permission: 0,
  credits: "SAKIB",
  description: "Download and send YouTube songs in MP3 format",
  prefix: false,
  category: "media",
  usages: "song [music name]",
  cooldowns: 5,
  dependencies: {
    "axios": "",
    "fs-extra": ""
  }
};

module.exports.run = async ({ api, event, args }) => {
  const query = args.join(' ');
  if (!query) {
    return api.sendMessage('❌ Please provide a song name.\n📌 Example: song Let Me Love You', event.threadID, event.messageID);
  }

  try {
    const searchingMessage = await api.sendMessage(`🔍 Searching for "${query}"...\n⏳ Please wait...`, event.threadID);

    const searchResponse = await axios.get(`https://betadash-search-download.vercel.app/yt?search=${encodeURIComponent(query)}`);
    const songData = searchResponse.data[0];

    if (!songData || !songData.url) {
      return api.sendMessage('⚠️ No results found. Try another song.', event.threadID, event.messageID);
    }

    const ytUrl = songData.url;
    const channelName = songData.channelName;
    const title = songData.title;

    await api.editMessage(`🎶 Found: ${title}\n⬇️ Downloading...`, searchingMessage.messageID);

    const apiConfig = await axios.get('https://raw.githubusercontent.com/MOHAMMAD-NAYAN-07/Nayan/main/api.json');
    const apiBase = apiConfig.data.down_stream;

    const downloadResponse = await axios.get(`${apiBase}/nayan/yt?url=${encodeURIComponent(ytUrl)}`);
    const audioUrl = downloadResponse.data.data.audio_down;

    if (!audioUrl) {
      return api.sendMessage('⚠️ Failed to fetch download link. Try again.', event.threadID, event.messageID);
    }

    const fileName = `${title}.mp3`;
    const filePath = path.join(__dirname, 'cache', fileName);

    const audioStream = await axios({
      method: 'get',
      url: audioUrl,
      responseType: 'stream'
    });

    const writer = fs.createWriteStream(filePath);
    audioStream.data.pipe(writer);

    writer.on('finish', async () => {
      await api.sendMessage({
        body: `✅ Download Complete!\n🎧 Title: ${title}\n🎤 Channel: ${channelName}\n📥 Enjoy your song!`,
        attachment: fs.createReadStream(filePath)
      }, event.threadID, () => fs.unlinkSync(filePath), event.messageID);
    });

    writer.on('error', () => {
      api.sendMessage('❌ Error downloading song. Please try again.', event.threadID, event.messageID);
    });

  } catch (err) {
    console.error('❌ Error:', err);
    api.sendMessage('⚠️ Unexpected error occurred. Try again later.', event.threadID, event.messageID);
  }
};
