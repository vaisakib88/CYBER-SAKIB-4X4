/**
 * SAKIB BOT
 * 😒 Emoji -> Bengali Voice Reply
 *
 * Trigger:
 * 😒
 *
 * Reply:
 * "ওইভাবে তাকিয়ো না, প্রেমে পড়ে যাবো!"
 */

const fs = require("fs");
const path = require("path");
const gTTS = require("gtts");

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

        // শুধু 😒 থাকলেই trigger
        if (!String(event.body).includes(TRIGGER)) {
            return;
        }

        try {

            const fileName =
                `voice_${Date.now()}_${Math.random()
                    .toString(36)
                    .substring(2, 8)}.mp3`;

            const filePath = path.join(
                TEMP_DIR,
                fileName
            );

            // Bengali TTS
            const tts = new gTTS(
                TEXT,
                "bn"
            );

            await new Promise((resolve, reject) => {

                tts.save(filePath, (error) => {

                    if (error) {
                        reject(error);
                    } else {
                        resolve();
                    }

                });

            });

            // Messenger-এ voice পাঠানো
            await new Promise((resolve, reject) => {

                api.sendMessage(
                    {
                        body: "🙈❤️",
                        attachment: fs.createReadStream(filePath)
                    },
                    event.threadID,
                    (error) => {

                        // File delete
                        try {
                            if (fs.existsSync(filePath)) {
                                fs.unlinkSync(filePath);
                            }
                        } catch (e) {}

                        if (error) {
                            reject(error);
                        } else {
                            resolve();
                        }

                    },
                    event.messageID
                );

            });

        } catch (error) {

            console.error(
                "[SAKIB EMOJI VOICE ERROR]",
                error
            );

        }

    };
};
