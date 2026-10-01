/**
 * ============================================================
 * SAKIB BOT - GEMINI TTS (FULL CODE)
 * ============================================================
 * 
 * Trigger:
 *      😒
 * 
 * Result:
 *      Gemini Pre-built Bengali/Multi-lingual Voice (Kore)
 * ============================================================
 */

const fs = require("fs");
const path = require("path");
const { GoogleGenAI } = require("@google/genai");

// ============================================================
// CONFIG
// ============================================================

const TRIGGER = "😒";

const TEXT = "ওইভাবে তাকিয়ো না... প্রেমে পড়ে যাবো!";

const MODEL = "gemini-2.5-flash"; // অডিও আউটপুট সাপোর্টেড মডেল

// ============================================================
// PATHS
// ============================================================

const PROJECT_ROOT = path.join(__dirname, "../../..");

const TEMP_DIR = path.join(
    PROJECT_ROOT,
    "temp_voice"
);

// ============================================================
// GEMINI API KEY
// ============================================================

const API_KEY = "AQ.Ab8RN6JMKxHRVQbnzrne6vvBxygQxGE_6HrY9cjNiNjXW03JLg" ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY;

if (!API_KEY) {
    console.error(
        "============================================================"
    );
    console.error(
        "[SAKIB GEMINI TTS] ERROR: Gemini API key not found."
    );
    console.error(
        "============================================================"
    );
}

const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

// ============================================================
// CREATE REQUIRED DIRECTORIES
// ============================================================

function prepareDirectories() {
    try {
        if (!fs.existsSync(TEMP_DIR)) {
            fs.mkdirSync(
                TEMP_DIR,
                { recursive: true }
            );
        } else {
            const stat = fs.statSync(TEMP_DIR);
            if (!stat.isDirectory()) {
                console.error(
                    "[SAKIB GEMINI TTS] temp_voice is a FILE."
                );
                return false;
            }
        }
        return true;
    } catch (error) {
        console.error(
            "[SAKIB GEMINI TTS] Directory error:",
            error.message
        );
        return false;
    }
}

// ============================================================
// GENERATE AUDIO
// ============================================================

async function generateVoice(outputFile) {
    if (!ai) {
        throw new Error("Gemini API key is missing.");
    }

    console.log(
        "[SAKIB GEMINI TTS] Generating speech..."
    );

    const response = await ai.models.generateContent({
        model: MODEL,
        contents: [
            {
                role: "user",
                parts: [
                    {
                        text: `Say this naturally with a soft, warm and playful feminine tone in Bengali: "${TEXT}"`
                    }
                ]
            }
        ],
        config: {
            responseModalities: ["AUDIO"],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: {
                        voiceName: "Kore" // জেমিনির ডিফল্ট ভয়েস (Puck, Charon, Kore, Fenrir, Aoede এর মধ্যে Kore বেশ সুন্দর)
                    }
                }
            }
        }
    });

    // ========================================================
    // EXTRACT AUDIO
    // ========================================================

    const audioData =
        response
            ?.candidates?.[0]
            ?.content?.parts?.[0]
            ?.inlineData?.data;

    if (!audioData) {
        throw new Error("Gemini returned no audio data.");
    }

    // ========================================================
    // BASE64 -> WAV
    // ========================================================

    const audioBuffer = Buffer.from(
        audioData,
        "base64"
    );

    if (!audioBuffer.length) {
        throw new Error("Generated audio is empty.");
    }

    fs.writeFileSync(
        outputFile,
        audioBuffer
    );

    console.log(
        `[SAKIB GEMINI TTS] Audio created: ${audioBuffer.length} bytes`
    );

    return outputFile;
}

// ============================================================
// SEND MESSENGER AUDIO
// ============================================================

function sendVoice(
    api,
    threadID,
    filePath
) {
    return new Promise(
        (resolve, reject) => {
            api.sendMessage(
                {
                    body: "🙈❤️",
                    attachment: fs.createReadStream(
                        filePath
                    )
                },
                threadID,
                (error) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve();
                    }
                }
            );
        }
    );
}

// ============================================================
// MAIN HANDLER
// ============================================================

module.exports = function ({ api }) {
    prepareDirectories();

    return async function ({ event }) {
        try {
            if (!event || !event.threadID || !event.body) {
                return;
            }

            // Check trigger
            if (!String(event.body).includes(TRIGGER)) {
                return;
            }

            console.log(
                "============================================================"
            );
            console.log(
                "[SAKIB GEMINI TTS] 😒 TRIGGER DETECTED"
            );
            console.log(
                `[SAKIB GEMINI TTS] User: ${event.senderID}`
            );
            console.log(
                `[SAKIB GEMINI TTS] Text: ${event.body}`
            );
            console.log(
                "============================================================"
            );

            if (!ai) {
                console.error(
                    "[SAKIB GEMINI TTS] Gemini API key missing."
                );
                return;
            }

            if (
                !fs.existsSync(TEMP_DIR) ||
                !fs.statSync(TEMP_DIR).isDirectory()
            ) {
                console.error(
                    "[SAKIB GEMINI TTS] temp_voice folder is invalid."
                );
                return;
            }

            const fileName = `gemini_voice_${Date.now()}.wav`;
            const filePath = path.join(
                TEMP_DIR,
                fileName
            );

            // Generate Audio
            await generateVoice(filePath);

            // Send Audio
            await sendVoice(
                api,
                event.threadID,
                filePath
            );

            console.log(
                "[SAKIB GEMINI TTS] ✅ Voice sent successfully."
            );

            // Cleanup temporary file
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            } catch (cleanupError) {
                console.error(
                    "[SAKIB GEMINI TTS] Cleanup error:",
                    cleanupError.message
                );
            }

        } catch (error) {
            console.error(
                "============================================================"
            );
            console.error(
                "[SAKIB GEMINI TTS ERROR]"
            );
            console.error(
                error?.message || error
            );
            console.error(
                "============================================================"
            );
        }
    };
};
