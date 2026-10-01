/**
 * SAKIB BOT
 * 😒 -> Bengali Voice Reply
 */

const fs = require("fs");
const path = require("path");
const axios = require("axios");
const googleTTS = require("google-tts-api");

module.exports = function ({ api }) {

    const TRIGGER = "😒";
    const TEXT = "ওইভাবে তাকিয়ো না, প্রেমে পড়ে যাবো!";

    const TEMP_DIR = path.join(
        __dirname,
        "../../../temp_voice"
    );

    if (!fs.existsSync(TEMP_DIR)) {
        fs.mkdirSync(TEMP_DIR, { recursive: true });
    }

    return async function ({ event }) {

        if (!event) return;
        if (!event.threadID) return;
        if (!event.body) return;

        // 😒 থাকলেই trigger
        if (!String(event.body).includes(TRIGGER)) {
            return;
        }

        let filePath = null;

        try {

            const fileName =
                `voice_${Date.now()}.mp3`;

            filePath = path.join(
                TEMP_DIR,
                fileName
            );

            // Google Bengali TTS
            const audioUrl = googleTTS.getAudioUrl(
                TEXT,
                {
                    lang: "bn",
                    slow: false
                }
            );

            // MP3 download
            const response = await axios.get(
                audioUrl,
                {
                    responseType: "arraybuffer",
                    timeout: 15000
                }
            );

            fs.writeFileSync(
                filePath,
                response.data
            );

            // Messenger voice পাঠানো
            await new Promise((resolve, reject) => {

                api.sendMessage(
                    {
                        body: "🙈❤️",
                        attachment: fs.createReadStream(filePath)
                    },
                    event.threadID,
                    (error) => {

                        if (error) {
                            reject(error);
                        } else {
                            resolve();
                        }

                    }
                );

            });

            console.log(
                "[SAKIB EMOJI VOICE] Sent successfully."
            );

        } catch (error) {

            console.error(
                "[SAKIB EMOJI VOICE ERROR]",
                error.message || error
            );

        } finally {

            // Temporary MP3 delete
            try {
                if (
                    filePath &&
                    fs.existsSync(filePath)
                ) {
                    fs.unlinkSync(filePath);
                }
            } catch (e) {}

        }
    };
};
