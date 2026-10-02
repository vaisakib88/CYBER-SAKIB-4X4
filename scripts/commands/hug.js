const fs = require("fs");
const path = require("path");
const os = require("os");
const axios = require("axios");


// ==========================================
// COMMAND CONFIG
// ==========================================

module.exports.config = {

  name: "hug",

  version: "2.0.0",

  permission: 0,

  credits: "SAKIB",

  description:
    "Send hug image to a mentioned person",

  prefix: false,

  category: "fun",

  usages: "hug @mention",

  cooldowns: 5,

  dependencies: {
    axios: ""
  }

};


// ==========================================
// HUG API CONFIG PATH
// ==========================================

const API_CONFIG_PATH = path.join(

  __dirname,

  "../../main/configs/hug_api.json"

);


// ==========================================
// READ HUG API
// ==========================================

function getHugAPI() {

  try {

    const data = JSON.parse(

      fs.readFileSync(
        API_CONFIG_PATH,
        "utf8"
      )

    );


    return String(
      data.hug || ""
    ).trim();


  } catch (error) {

    console.error(
      "[SAKIB HUG] Config error:",
      error.message
    );


    return null;

  }

}


// ==========================================
// COMMAND RUN
// ==========================================

module.exports.run = async ({
  api,
  event
}) => {


  const {
    threadID,
    messageID,
    senderID
  } = event;


  // ========================================
  // GET MENTIONS
  // ========================================

  const mentions =
    event.mentions || {};


  const mentionIDs =
    Object.keys(mentions);


  // ========================================
  // NO MENTION
  // ========================================

  if (
    mentionIDs.length === 0
  ) {

    return api.sendMessage(

      "🤗 Please mention someone to hug.",

      threadID,

      messageID

    );

  }


  // ========================================
  // TARGET UID
  // ========================================

  const targetID =
    String(
      mentionIDs[0]
    );


  // ========================================
  // TARGET NAME
  // ========================================

  const mentionData =
    mentions[targetID];


  let targetName =
    "your friend";


  if (

    mentionData &&

    typeof mentionData === "object" &&

    mentionData.tag

  ) {

    targetName =
      mentionData.tag;


  } else if (

    typeof mentionData === "string"

  ) {

    targetName =
      mentionData.replace(
        /^@/,
        ""
      );

  }


  // ========================================
  // LOAD API
  // ========================================

  const baseURL =
    getHugAPI();


  if (!baseURL) {

    return api.sendMessage(

      "❌ Hug API configuration পাওয়া যায়নি।",

      threadID,

      messageID

    );

  }


  // ========================================
  // CHECK PLACEHOLDER
  // ========================================

  if (
    baseURL.includes(
      "YOUR-RENDER-APP"
    )
  ) {

    return api.sendMessage(

      "❌ আগে main/configs/hug_api.json-এ তোমার Render Hug API URL বসাও।",

      threadID,

      messageID

    );

  }


  // ========================================
  // BUILD API URL
  // ========================================

  const separator =
    baseURL.includes("?")
      ? "&"
      : "?";


  const apiURL =

    `${baseURL}${separator}` +

    `one=${encodeURIComponent(
      senderID
    )}` +

    `&two=${encodeURIComponent(
      targetID
    )}`;


  // ========================================
  // LOG
  // ========================================

  console.log(
    "\n=============================="
  );


  console.log(
    "[SAKIB HUG]"
  );


  console.log(
    "Sender :",
    senderID
  );


  console.log(
    "Target :",
    targetID
  );


  console.log(
    "Name   :",
    targetName
  );


  console.log(
    "API    :",
    apiURL
  );


  console.log(
    "==============================\n"
  );


  let response;


  // ========================================
  // API REQUEST
  // ========================================

  try {

    response = await axios.get(

      apiURL,

      {

        responseType:
          "arraybuffer",

        timeout:
          30000,

        validateStatus:
          () => true,

        headers: {

          "User-Agent":
            "SAKIB-Messenger-Bot/2.0"

        }

      }

    );


  } catch (error) {

    console.error(

      "[SAKIB HUG] Request error:",

      error.message

    );


    return api.sendMessage(

      `❌ Hug API connection failed.\n\n${error.message}`,

      threadID,

      messageID

    );

  }


  // ========================================
  // HTTP ERROR
  // ========================================

  if (
    response.status !== 200
  ) {

    let errorText = "";


    try {

      errorText =

        Buffer
          .from(response.data)
          .toString("utf8")
          .slice(0, 500);


    } catch (_) {}


    return api.sendMessage(

      `❌ Hug API error: HTTP ${response.status}\n\n${errorText}`,

      threadID,

      messageID

    );

  }


  // ========================================
  // CONTENT TYPE
  // ========================================

  const contentType =

    String(
      response.headers[
        "content-type"
      ] || ""
    ).toLowerCase();


  // ========================================
  // CHECK IMAGE
  // ========================================

  if (
    !contentType.startsWith(
      "image/"
    )
  ) {

    const text =

      Buffer
        .from(response.data)
        .toString("utf8")
        .slice(0, 500);


    return api.sendMessage(

      `❌ API image দেয়নি.\n\n${text}`,

      threadID,

      messageID

    );

  }


  // ========================================
  // IMAGE EXTENSION
  // ========================================

  let extension =
    "png";


  if (
    contentType.includes(
      "jpeg"
    )
  ) {

    extension =
      "jpg";


  } else if (
    contentType.includes(
      "gif"
    )
  ) {

    extension =
      "gif";


  } else if (
    contentType.includes(
      "webp"
    )
  ) {

    extension =
      "webp";

  }


  // ========================================
  // TEMP FILE
  // ========================================

  const tempFile =

    path.join(

      os.tmpdir(),

      `sakib_hug_${Date.now()}.${extension}`

    );


  // ========================================
  // SAVE IMAGE
  // ========================================

  try {

    fs.writeFileSync(

      tempFile,

      Buffer.from(
        response.data
      )

    );


  } catch (error) {

    return api.sendMessage(

      "❌ Hug image save করা যায়নি।",

      threadID,

      messageID

    );

  }


  // ========================================
  // SEND IMAGE
  // ========================================

  return api.sendMessage(

    {

      body:
        `🤗 ${targetName}, you just got a hug! ❤️`,

      attachment:
        fs.createReadStream(
          tempFile
        )

    },

    threadID,

    (error) => {


      // Delete temp file

      try {

        fs.unlinkSync(
          tempFile
        );

      } catch (_) {}


      // Attachment error

      if (error) {

        console.error(

          "[SAKIB HUG] Send error:",

          error.message

        );

      }

    },

    messageID

  );

};
