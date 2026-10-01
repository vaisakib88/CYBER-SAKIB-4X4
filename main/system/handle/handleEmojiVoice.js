/**
 * ============================================================
 * SAKIB BOT
 * GEMINI 3.8 FLASH TTS + CUSTOM VOICE DESIGN
 * ============================================================
 *
 * Trigger:
 *     😒
 *
 * Result:
 *     Gemini custom Bengali female-style voice
 *
 * First run:
 *     Automatically creates a custom Voice Design persona
 *
 * Later runs:
 *     Reuses the same saved voice ID
 * ============================================================
 */

const fs = require("fs");
const path = require("path");
const { GoogleGenAI } = require("@google/genai");


// ============================================================
// CONFIG
// ============================================================

const TRIGGER = "😒";

const TEXT =
      "ওইভাবে তাকিয়ো না... প্রেমে পড়ে যাবো!";

const MODEL =
      "gemini-3.8-flash-tts";


// ============================================================
// PATHS
// ============================================================

const PROJECT_ROOT =
      path.join(__dirname, "../../..");

const TEMP_DIR =
      path.join(
          PROJECT_ROOT,
          "temp_voice"
      );

const DATA_DIR =
      path.join(
          PROJECT_ROOT,
          "data"
      );

const VOICE_FILE =
      path.join(
          DATA_DIR,
          "sakib_voice.json"
      );


// ============================================================
// GEMINI API KEY
// ============================================================

const API_KEY =
      "AQ.Ab8RN6JMKxHRVQbnzrne6vvBxygQxGE_6HrY9cjNiNjXW03JLg" ||
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
          "[SAKIB GEMINI TTS] Set GEMINI_API_KEY in GitHub Secrets."
      );

      console.error(
          "============================================================"
      );
}


const ai =
      API_KEY
          ? new GoogleGenAI({
              apiKey: API_KEY
          })
          : null;


// ============================================================
// CUSTOM VOICE PERSONA
// ============================================================

const VOICE_PERSONA = `
A young adult Bangladeshi Bengali woman with a naturally soft,
warm and feminine conversational voice.

She sounds like a real young woman from Bangladesh speaking
casually to someone she feels comfortable with.

Voice characteristics:

- Soft and naturally feminine
- Warm and sweet
- Natural Bangladeshi Bengali pronunciation
- Slightly shy
- Playful and affectionate
- Gentle and emotionally expressive
- Cute but mature
- Natural conversational pitch
- Realistic pauses
- Subtle changes in emphasis
- Smooth and pleasant delivery
- Slightly intimate conversational feeling
- Clear Bengali pronunciation
- Natural emotional expression
- Never sounds like a news reader
- Never sounds like an audiobook narrator

The voice should feel spontaneous and human rather than
synthetic or robotic.

For romantic or playful sentences, use a subtle shy smile
in the voice and a gentle emotional lift near the end.

Avoid:

- Childlike voice
- Cartoon voice
- Anime voice
- Excessive sweetness
- Overacting
- Dramatic theatrical acting
- Robotic delivery
- Monotone delivery
- Extremely high pitch
- Strong foreign accent
`;


// ============================================================
// CREATE REQUIRED DIRECTORIES
// ============================================================

function prepareDirectories() {

      try {

          // -------------------------------
          // DATA DIRECTORY
          // -------------------------------

          if (!fs.existsSync(DATA_DIR)) {

              fs.mkdirSync(
                  DATA_DIR,
                  {
                      recursive: true
                  }
              );

          }


          // -------------------------------
          // TEMP VOICE DIRECTORY
          // -------------------------------

          if (!fs.existsSync(TEMP_DIR)) {

              fs.mkdirSync(
                  TEMP_DIR,
                  {
                      recursive: true
                  }
              );

          } else {

              const stat =
                  fs.statSync(TEMP_DIR);

              if (!stat.isDirectory()) {

                  console.error(
                      "[SAKIB GEMINI TTS] temp_voice is a FILE."
                  );

                  console.error(
                      "[SAKIB GEMINI TTS] Delete the temp_voice file from GitHub."
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
// LOAD SAVED VOICE
// ============================================================

function loadSavedVoice() {

      try {

          if (!fs.existsSync(VOICE_FILE)) {

              return null;

          }


          const raw =
              fs.readFileSync(
                  VOICE_FILE,
                  "utf8"
              );


          const data =
              JSON.parse(raw);


          if (
              data &&
              data.voiceId
          ) {

              console.log(
                  `[SAKIB GEMINI TTS] Saved voice found: ${data.voiceId}`
              );

              return data.voiceId;

          }


          return null;

      } catch (error) {

          console.error(
              "[SAKIB GEMINI TTS] Could not read saved voice:",
              error.message
          );

          return null;
      }
}


// ============================================================
// SAVE VOICE ID
// ============================================================

function saveVoice(
      voiceId,
      voiceInfo = {}
) {

      try {

          const data = {

              voiceId: voiceId,

              displayName:
                  voiceInfo.displayName ||
                  "SAKIB PAKHI - Soft Bengali",

              model:
                  MODEL,

              language:
                  "bn-BD",

              createdAt:
                  new Date().toISOString()

          };


          fs.writeFileSync(

              VOICE_FILE,

              JSON.stringify(
                  data,
                  null,
                  2
              ),

              "utf8"

          );


          console.log(
              `[SAKIB GEMINI TTS] Voice ID saved: ${voiceId}`
          );


          return true;

      } catch (error) {

          console.error(
              "[SAKIB GEMINI TTS] Could not save voice:",
              error.message
          );

          return false;
      }
}


// ============================================================
// CREATE CUSTOM GEMINI VOICE
// ============================================================

async function createCustomVoice() {

      if (!ai) {

          throw new Error(
              "Gemini API key is missing."
          );

      }


      console.log(
          "============================================================"
      );

      console.log(
          "[SAKIB GEMINI TTS] Creating custom Voice Design..."
      );

      console.log(
          "[SAKIB GEMINI TTS] This normally happens only once."
      );

      console.log(
          "============================================================"
      );


      const createdVoice =
          await ai.voices.create({

              store: true,

              voice: {

                  model:
                      MODEL,

                  type:
                      "prompted",

                  display_name:
                      "SAKIB PAKHI - Soft Bengali",

                  gender:
                      "female",

                  language_code:
                      "bn-BD",

                  prompted: {

                      input:
                          VOICE_PERSONA

                  }

              }

          });


      if (
          !createdVoice ||
          !createdVoice.id
      ) {

          throw new Error(
              "Gemini did not return a custom voice ID."
          );

      }


      console.log(
          "============================================================"
      );

      console.log(
          "[SAKIB GEMINI TTS] CUSTOM VOICE CREATED!"
      );

      console.log(
          `[SAKIB GEMINI TTS] Voice ID: ${createdVoice.id}`
      );

      console.log(
          "============================================================"
      );


      // Save voice ID permanently
      saveVoice(
          createdVoice.id,
          {
              displayName:
                  "SAKIB PAKHI - Soft Bengali"
          }
      );


      // Save preview if Gemini returns one
      if (
          createdVoice.sample_audio &&
          createdVoice.sample_audio.data
      ) {

          try {

              const previewPath =
                  path.join(
                      DATA_DIR,
                      "sakib_voice_preview.wav"
                  );


              fs.writeFileSync(

                  previewPath,

                  Buffer.from(
                      createdVoice
                          .sample_audio
                          .data,
                      "base64"
                  )

              );


              console.log(
                  `[SAKIB GEMINI TTS] Voice preview saved: ${previewPath}`
              );

          } catch (error) {

              console.error(
                  "[SAKIB GEMINI TTS] Preview save error:",
                  error.message
              );

          }

      }


      return createdVoice.id;
}


// ============================================================
// GET CUSTOM VOICE
// ============================================================

async function getVoiceId() {

      // ----------------------------------------
      // First try saved voice
      // ----------------------------------------

      const savedVoice =
          loadSavedVoice();


      if (savedVoice) {

          return savedVoice;

      }


      // ----------------------------------------
      // No saved voice -> create one
      // ----------------------------------------

      return await createCustomVoice();
}


// ============================================================
// GENERATE AUDIO
// ============================================================

async function generateVoice(
      voiceId,
      outputFile
) {

      if (!ai) {

          throw new Error(
              "Gemini API key is missing."
          );

      }


      console.log(
          "[SAKIB GEMINI TTS] Generating Bengali speech..."
      );


      const response =
          await ai.models.generateContent({

              model:
                  MODEL,

              contents: [

                  {

                      role:
                          "user",

                      parts: [

                          {

                              text:
                                  TEXT,

                              speechMetadata: {

                                  style:
                                      "Speak naturally in Bangladeshi Bengali. " +
                                      "Soft, warm, feminine, slightly shy and playful. " +
                                      "Sound like a real young adult woman speaking casually. " +
                                      "Use a natural pause after 'তাকিয়ো না'. " +
                                      "Say 'প্রেমে পড়ে যাবো' with a subtle shy and affectionate tone. " +
                                      "Do not overact. Keep the emotion realistic and conversational."

                              }

                          }

                      ]

                  }

              ],

              config: {

                  responseModalities: [

                      "AUDIO"

                  ],

                  speechConfig: {

                      voiceConfig: {

                          voice:
                              voiceId

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

          throw new Error(
              "Gemini returned no audio data."
          );

      }


      // ========================================================
      // BASE64 -> WAV
      // ========================================================

      const audioBuffer =
          Buffer.from(
              audioData,
              "base64"
          );


      if (!audioBuffer.length) {

          throw new Error(
              "Generated audio is empty."
          );

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

                      body:
                          "🙈❤️",

                      attachment:
                          fs.createReadStream(
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


      // Prepare directories
      prepareDirectories();


      // ----------------------------------------
      // Event handler
      // ----------------------------------------

      return async function ({ event }) {

          try {

              if (!event) {
                  return;
              }


              if (!event.threadID) {
                  return;
              }


              if (!event.body) {
                  return;
              }


              // --------------------------------
              // Check trigger
              // --------------------------------

              if (
                  !String(event.body)
                      .includes(TRIGGER)
              ) {

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


              // --------------------------------
              // API key
              // --------------------------------

              if (!ai) {

                  console.error(
                      "[SAKIB GEMINI TTS] Gemini API key missing."
                  );

                  return;

              }


              // --------------------------------
              // Check temp folder
              // --------------------------------

              if (
                  !fs.existsSync(TEMP_DIR) ||
                  !fs.statSync(TEMP_DIR).isDirectory()
              ) {

                  console.error(
                      "[SAKIB GEMINI TTS] temp_voice folder is invalid."
                  );

                  return;

              }


              // --------------------------------
              // Get custom voice
              // --------------------------------

              const voiceId =
                  await getVoiceId();


              console.log(
                  `[SAKIB GEMINI TTS] Using voice: ${voiceId}`
              );


              // --------------------------------
              // File
              // --------------------------------

              const fileName =
                  `gemini_voice_${Date.now()}.wav`;


              const filePath =
                  path.join(
                      TEMP_DIR,
                      fileName
                  );


              // --------------------------------
              // Generate
              // --------------------------------

              await generateVoice(
                  voiceId,
                  filePath
              );


              // --------------------------------
              // Send
              // --------------------------------

              await sendVoice(
                  api,
                  event.threadID,
                  filePath
              );


              console.log(
                  "[SAKIB GEMINI TTS] ✅ Voice sent successfully."
              );


              // --------------------------------
              // Delete temporary file
              // --------------------------------

              try {

                  if (
                      fs.existsSync(filePath)
                  ) {

                      fs.unlinkSync(
                          filePath
                      );

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
                  error?.message ||
                  error
              );

              console.error(
                  "============================================================"
              );

          }

      };

};
