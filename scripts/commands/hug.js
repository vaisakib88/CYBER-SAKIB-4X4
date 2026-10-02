const fs = require("fs");
const path = require("path");
const os = require("os");
const axios = require("axios");

module.exports.config = {
    name: "hug",
    version: "3.0.0",
    permission: 0,
    credits: "SAKIB",
    description: "Send a hug image to a mentioned or replied person",
    prefix: false,
    category: "fun",
    usages: "hug | hug @mention",
    cooldowns: 5,
    dependencies: {
        axios: ""
    }
};

const API_CONFIG_PATH = path.join(
    __dirname,
    "../../main/configs/hug_api.json"
);

/**
 * Load Hug API URL
 */
function getHugAPI() {
    try {
        if (!fs.existsSync(API_CONFIG_PATH)) {
            console.error("[SAKIB HUG] hug_api.json not found");
            return null;
        }

        const data = JSON.parse(
            fs.readFileSync(API_CONFIG_PATH, "utf8")
        );

        return String(data.hug || "").trim();
    } catch (error) {
        console.error(
            "[SAKIB HUG] Config error:",
            error.message
        );

        return null;
    }
}

/**
 * Get target UID from reply
 */
function getReplyTarget(event) {
    if (!event.messageReply) {
        return null;
    }

    const reply = event.messageReply;

    // Messenger reply normally contains senderID
    if (reply.senderID) {
        return String(reply.senderID);
    }

    // Some versions may use author
    if (reply.author) {
        return String(reply.author);
    }

    // Some versions may provide userID
    if (reply.userID) {
        return String(reply.userID);
    }

    return null;
}

/**
 * Get target name from reply
 */
function getReplyTargetName(event) {
    if (!event.messageReply) {
        return "your friend";
    }

    const reply = event.messageReply;

    if (reply.body) {
        return "your friend";
    }

    return "your friend";
}

/**
 * Get target from mention
 */
function getMentionTarget(event) {
    const mentions = event.mentions || {};
    const ids = Object.keys(mentions);

    if (ids.length === 0) {
        return null;
    }

    return String(ids[0]);
}

/**
 * Get mention name
 */
function getMentionName(event, targetID) {
    const mentions = event.mentions || {};
    const data = mentions[targetID];

    if (!data) {
        return "your friend";
    }

    if (typeof data === "object" && data.tag) {
        return String(data.tag).replace(/^@/, "");
    }

    if (typeof data === "string") {
        return data.replace(/^@/, "");
    }

    return "your friend";
}

module.exports.run = async ({ api, event }) => {

    const threadID = event.threadID;
    const messageID = event.messageID;
    const senderID = String(event.senderID);

    /*
     * =========================================================
     * 1. FIRST PRIORITY: REPLY
     * =========================================================
     *
     * User:
     * Reply to someone's message
     * hug
     *
     * Then that person's UID becomes target.
     */

    let targetID = getReplyTarget(event);
    let targetName = getReplyTargetName(event);

    let targetType = "REPLY";

    /*
     * =========================================================
     * 2. SECOND PRIORITY: MENTION
     * =========================================================
     *
     * User:
     * hug @someone
     */

    if (!targetID) {
        targetID = getMentionTarget(event);

        if (targetID) {
            targetName = getMentionName(
                event,
                targetID
            );

            targetType = "MENTION";
        }
    }

    /*
     * =========================================================
     * 3. NO TARGET
     * =========================================================
     */

    if (!targetID) {
        return api.sendMessage(
            "🤗 যাকে Hug দিতে চাও তার message-এ Reply করে `hug` লিখো।\n\nঅথবা:\n`hug @mention`",
            threadID,
            messageID
        );
    }

    /*
     * Prevent hugging the bot itself
     */

    let botID = null;

    try {
        if (typeof api.getCurrentUserID === "function") {
            botID = String(api.getCurrentUserID());
        }
    } catch (_) {}

    if (botID && targetID === botID) {
        return api.sendMessage(
            "😳 আমাকে আবার Hug দিচ্ছো নাকি? 🤭❤️",
            threadID,
            messageID
        );
    }

    /*
     * =========================================================
     * LOAD API
     * =========================================================
     */

    const baseURL = getHugAPI();

    if (!baseURL) {
        return api.sendMessage(
            "❌ Hug API configuration পাওয়া যায়নি।",
            threadID,
            messageID
        );
    }

    if (
        baseURL.includes("YOUR-RENDER-APP") ||
        baseURL.includes("YOUR-RAILWAY-APP") ||
        baseURL.includes("YOUR-HUG-API")
    ) {
        return api.sendMessage(
            "❌ main/configs/hug_api.json-এ তোমার Hug API URL বসাও।",
            threadID,
            messageID
        );
    }

    /*
     * =========================================================
     * BUILD API URL
     * =========================================================
     */

    const separator = baseURL.includes("?")
        ? "&"
        : "?";

    const apiURL =
        `${baseURL}${separator}` +
        `one=${encodeURIComponent(senderID)}` +
        `&two=${encodeURIComponent(targetID)}`;

    /*
     * =========================================================
     * LOG
     * =========================================================
     */

    console.log("");
    console.log("======================================");
    console.log("          SAKIB HUG COMMAND");
    console.log("======================================");
    console.log("Type       :", targetType);
    console.log("Sender UID :", senderID);
    console.log("Target UID :", targetID);
    console.log("Target Name:", targetName);
    console.log("API URL    :", apiURL);
    console.log("======================================");
    console.log("");

    /*
     * =========================================================
     * REQUEST API
     * =========================================================
     */

    let response;

    try {
        response = await axios.get(apiURL, {
            responseType: "arraybuffer",
            timeout: 30000,
            maxRedirects: 5,
            validateStatus: () => true,
            headers: {
                "User-Agent":
                    "Mozilla/5.0 SAKIB-Messenger-Bot/3.0"
            }
        });
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

    /*
     * =========================================================
     * API ERROR
     * =========================================================
     */

    if (response.status !== 200) {

        let errorText = "";

        try {
            errorText = Buffer
                .from(response.data)
                .toString("utf8")
                .slice(0, 1000);
        } catch (_) {}

        console.error(
            "[SAKIB HUG API ERROR]",
            response.status,
            errorText
        );

        return api.sendMessage(
            `❌ Hug API Error: HTTP ${response.status}\n\n${errorText}`,
            threadID,
            messageID
        );
    }

    /*
     * =========================================================
     * CHECK IMAGE
     * =========================================================
     */

    const contentType = String(
        response.headers["content-type"] || ""
    ).toLowerCase();

    if (!contentType.startsWith("image/")) {

        let text = "";

        try {
            text = Buffer
                .from(response.data)
                .toString("utf8")
                .slice(0, 1000);
        } catch (_) {}

        return api.sendMessage(
            `❌ Hug API image দেয়নি।\n\n${text}`,
            threadID,
            messageID
        );
    }

    /*
     * =========================================================
     * FILE EXTENSION
     * =========================================================
     */

    let extension = "png";

    if (contentType.includes("jpeg")) {
        extension = "jpg";
    } else if (contentType.includes("gif")) {
        extension = "gif";
    } else if (contentType.includes("webp")) {
        extension = "webp";
    }

    /*
     * =========================================================
     * SAVE TEMP IMAGE
     * =========================================================
     */

    const tempFile = path.join(
        os.tmpdir(),
        `sakib_hug_${Date.now()}.${extension}`
    );

    try {

        fs.writeFileSync(
            tempFile,
            Buffer.from(response.data)
        );

    } catch (error) {

        console.error(
            "[SAKIB HUG] File save error:",
            error.message
        );

        return api.sendMessage(
            "❌ Hug image save করা যায়নি।",
            threadID,
            messageID
        );
    }

    /*
     * =========================================================
     * SEND IMAGE
     * =========================================================
     */

    try {

        return api.sendMessage(
            {
                body:
                    `🤗 ${targetName}, তোমার জন্য একটা Hug! ❤️\n` +
                    `— SAKIB BOT 🫂`,

                attachment:
                    fs.createReadStream(tempFile)
            },

            threadID,

            (error) => {

                try {
                    if (fs.existsSync(tempFile)) {
                        fs.unlinkSync(tempFile);
                    }
                } catch (_) {}

                if (error) {
                    console.error(
                        "[SAKIB HUG] Send error:",
                        error.message
                    );
                }
            },

            messageID
        );

    } catch (error) {

        try {
            if (fs.existsSync(tempFile)) {
                fs.unlinkSync(tempFile);
            }
        } catch (_) {}

        console.error(
            "[SAKIB HUG] Send exception:",
            error.message
        );

        return api.sendMessage(
            `❌ Hug image send করা যায়নি.\n\n${error.message}`,
            threadID,
            messageID
        );
    }
};
