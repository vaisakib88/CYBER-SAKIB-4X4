const axios = require("axios");
const fs = require("fs");
const path = require("path");
const os = require("os");

module.exports.config = {
  name: "hug",
  version: "1.1.0",
  permission: 0,
  credits: "SAKIB",
  description: "Send a hug image using Canvas API",
  prefix: true,
  category: "fun",
  usages: "hug @mention | reply",
  cooldowns: 5,
  dependencies: {
    axios: ""
  }
};

module.exports.run = async ({ api, event }) => {
  const {
    threadID,
    messageID,
    senderID,
    mentions = {},
    messageReply,
    type
  } = event;

  let targetUID = null;
  let targetName = "your friend";

  // =========================================================
  // 1. GET TARGET UID FROM REPLY
  // =========================================================
  if (type === "message_reply" && messageReply?.senderID) {
    targetUID = String(messageReply.senderID);

    try {
      if (typeof api.getUserInfo === "function") {
        const info = await api.getUserInfo(targetUID);

        if (info?.[targetUID]?.name) {
          targetName = info[targetUID].name;
        }
      }
    } catch (e) {
      // Name না পেলেও command চলবে
    }
  }

  // =========================================================
  // 2. GET TARGET UID FROM MENTION
  // =========================================================
  if (!targetUID && mentions && Object.keys(mentions).length > 0) {
    const mentionIDs = Object.keys(mentions);

    targetUID = String(mentionIDs[0]);

    const rawMention = mentions[targetUID];

    if (rawMention && typeof rawMention === "object" && rawMention.tag) {
      targetName = String(rawMention.tag).replace(/^@/, "");
    } else if (typeof rawMention === "string") {
      targetName = rawMention.replace(/^@/, "");
    }

    // যদি mention থেকে নাম না পাওয়া যায়
    if (!targetName || targetName === "your friend") {
      try {
        if (typeof api.getUserInfo === "function") {
          const info = await api.getUserInfo(targetUID);

          if (info?.[targetUID]?.name) {
            targetName = info[targetUID].name;
          }
        }
      } catch (e) {
        // Ignore
      }
    }
  }

  // =========================================================
  // 3. NO TARGET
  // =========================================================
  if (!targetUID) {
    return api.sendMessage(
      "❌ যাকে Hug দিতে চাও তাকে @mention করো অথবা তার message-এ reply করে লিখো:\n\n-hug",
      threadID,
      messageID
    );
  }

  // নিজের UID হলে
  if (String(targetUID) === String(senderID)) {
    return api.sendMessage(
      "🤗 নিজেকেই আবার Hug দিচ্ছো নাকি? 😂❤️",
      threadID,
      messageID
    );
  }

  // =========================================================
  // 4. CHECK CANVAS API
  // =========================================================
  const baseURL = global?.SAKIBapi?.canvas;

  if (!baseURL || !/^https?:\/\//i.test(String(baseURL))) {
    console.error("[HUG] Canvas API URL missing:", baseURL);

    return api.sendMessage(
      "❌ Hug API সেট করা নেই।\n\napi.json-এর canvas URL check করো।",
      threadID,
      messageID
    );
  }

  // শেষের / থাকলে remove
  const cleanBaseURL = String(baseURL).replace(/\/+$/, "");

  // =========================================================
  // 5. BUILD API URL
  // =========================================================
  const imgURL =
    `${cleanBaseURL}/hug` +
    `?one=${encodeURIComponent(String(senderID))}` +
    `&two=${encodeURIComponent(String(targetUID))}`;

  console.log("==========================================");
  console.log("[SAKIB HUG]");
  console.log("Sender UID :", senderID);
  console.log("Target UID :", targetUID);
  console.log("Target Name:", targetName);
  console.log("API URL    :", imgURL);
  console.log("==========================================");

  let tmpFile = null;

  try {
    // React
    try {
      api.setMessageReaction(
        "🤗",
        messageID,
        () => {},
        true
      );
    } catch (e) {}

    // =======================================================
    // 6. REQUEST IMAGE
    // =======================================================
    const response = await axios.get(imgURL, {
      responseType: "arraybuffer",
      timeout: 30000,
      maxContentLength: 15 * 1024 * 1024,
      maxBodyLength: 15 * 1024 * 1024,
      validateStatus: () => true,
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    const status = Number(response.status || 0);

    console.log("[SAKIB HUG] HTTP:", status);

    // =======================================================
    // 7. API ERROR
    // =======================================================
    if (status !== 200) {
      let errorPreview = "";

      try {
        errorPreview = Buffer
          .from(response.data || [])
          .toString("utf8")
          .slice(0, 300);
      } catch (e) {}

      console.error(
        "[SAKIB HUG API ERROR]",
        status,
        errorPreview
      );

      return api.sendMessage(
        `❌ Hug API কাজ করছে না।\nHTTP Status: ${status}`,
        threadID,
        messageID
      );
    }

    // =======================================================
    // 8. CHECK CONTENT TYPE
    // =======================================================
    const contentType = String(
      response.headers?.["content-type"] || ""
    ).toLowerCase();

    console.log("[SAKIB HUG] Content-Type:", contentType);

    if (!contentType.startsWith("image/")) {
      let preview = "";

      try {
        preview = Buffer
          .from(response.data || [])
          .toString("utf8")
          .slice(0, 300);
      } catch (e) {}

      console.error(
        "[SAKIB HUG] API did not return image:",
        contentType,
        preview
      );

      return api.sendMessage(
        `❌ Hug API image দেয়নি।\nContent-Type: ${contentType || "unknown"}`,
        threadID,
        messageID
      );
    }

    // =======================================================
    // 9. DETECT IMAGE EXTENSION
    // =======================================================
    let extension = "png";

    if (contentType.includes("jpeg") || contentType.includes("jpg")) {
      extension = "jpg";
    } else if (contentType.includes("gif")) {
      extension = "gif";
    } else if (contentType.includes("webp")) {
      extension = "webp";
    }

    // =======================================================
    // 10. SAVE TEMP FILE
    // =======================================================
    tmpFile = path.join(
      os.tmpdir(),
      `sakib_hug_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2)}.${extension}`
    );

    fs.writeFileSync(
      tmpFile,
      Buffer.from(response.data)
    );

    console.log("[SAKIB HUG] Saved:", tmpFile);

    // =======================================================
    // 11. SEND IMAGE
    // =======================================================
    return api.sendMessage(
      {
        body: `🤗 ${targetName}, তোমার জন্য একটা Hug! ❤️`,
        attachment: fs.createReadStream(tmpFile)
      },
      threadID,
      (err) => {
        // ===================================================
        // 12. CLEANUP
        // ===================================================
        if (tmpFile) {
          fs.unlink(tmpFile, () => {});
        }

        if (err) {
          console.error(
            "[SAKIB HUG SEND ERROR]",
            err
          );

          api.sendMessage(
            "❌ Hug image পাঠানো যায়নি।",
            threadID
          );
        }
      },
      messageID
    );

  } catch (error) {
    console.error(
      "[SAKIB HUG ERROR]",
      error?.response?.status || "",
      error?.message || error
    );

    if (tmpFile) {
      try {
        fs.unlinkSync(tmpFile);
      } catch (e) {}
    }

    return api.sendMessage(
      `❌ Hug image তৈরি করা যায়নি।\n\nError: ${
        error?.message || "Unknown error"
      }`,
      threadID,
      messageID
    );
  }
};
