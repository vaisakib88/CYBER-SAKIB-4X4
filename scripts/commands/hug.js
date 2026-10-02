const fs = require("fs");
const path = require("path");
const os = require("os");
const axios = require("axios");

module.exports.config = {
    name: "hug",
    version: "4.1.0",
    permission: 0,
    credits: "SAKIB",
    description: "Hug someone by replying or mentioning",
    prefix: false,
    category: "fun",
    usages: "hug | hug @mention",
    cooldowns: 5,
    dependencies: {
        axios: ""
    }
};

/*
=========================================================
 HUG API CONFIG
=========================================================
*/

const API_CONFIG_PATH = path.join(
    __dirname,
    "../../main/configs/hug_api.json"
);

function getHugAPI() {
    try {
        if (!fs.existsSync(API_CONFIG_PATH)) {
            console.error(
                "[SAKIB HUG] Config file not found:",
                API_CONFIG_PATH
            );
            return null;
        }

        const config = JSON.parse(
            fs.readFileSync(API_CONFIG_PATH, "utf8")
        );

        const url = String(config.hug || "").trim();

        if (!url) {
            console.error(
                "[SAKIB HUG] hug URL is empty"
            );
            return null;
        }

        return url.replace(/\/+$/, "");

    } catch (error) {
        console.error(
            "[SAKIB HUG] Config error:",
            error.message
        );

        return null;
    }
}

/*
=========================================================
 GET REPLY TARGET UID
=========================================================
*/

function getReplyTarget(event) {

    if (!event || !event.messageReply) {
        return null;
    }

    const reply = event.messageReply;

    const possibleIDs = [
        reply.senderID,
        reply.author,
        reply.userID,
        reply.fromID,
        reply.uid
    ];

    for (const id of possibleIDs) {

        if (
            id !== undefined &&
            id !== null &&
            String(id).trim() !== ""
        ) {
            return String(id).trim();
        }
    }

    return null;
}

/*
=========================================================
 GET REPLY NAME
=========================================================
*/

function getReplyTargetName(event) {

    if (!event || !event.messageReply) {
        return "your friend";
    }

    const reply = event.messageReply;

    if (reply.senderName) {
        return String(reply.senderName);
    }

    if (reply.name) {
        return String(reply.name);
    }

    return "your friend";
}

/*
=========================================================
 GET MENTION TARGET
=========================================================
*/

function getMentionTarget(event) {

    if (!event || !event.mentions) {
        return null;
    }

    const mentionIDs = Object.keys(event.mentions);

    if (!mentionIDs.length) {
        return null;
    }

    return String(mentionIDs[0]);
}

/*
=========================================================
 GET MENTION NAME
=========================================================
*/

function getMentionName(event, targetID) {

    const mentions = event.mentions || {};
    const data = mentions[targetID];

    if (!data) {
        return "your friend";
    }

    if (
        typeof data === "object" &&
        data.tag
    ) {
        return String(data.tag)
            .replace(/^@/, "")
            .trim();
    }

    if (typeof data === "string") {
        return data
            .replace(/^@/, "")
            .trim();
    }

    return "your friend";
}

/*
=========================================================
 FETCH USER AVATAR URL VIA FB API
=========================================================
*/

async function getUserAvatar(api, userID) {
    try {
        return new Promise((resolve) => {
            api.getUserInfo(userID, (err, ret) => {
                if (err || !ret || !ret[userID]) {
                    // Fallback to graph profile picture URL if userInfo fails
                    return resolve(`https://graph.facebook.com/${userID}/picture?height=720&width=720&migration_overrides=%7Boctober_2012_classic%3Atrue%7D`);
                }
                const userInfo = ret[userID];
                const avatar = userInfo.thumbSrc || userInfo.profileUrl || `https://graph.facebook.com/${userID}/picture?height=720&width=720`;
                resolve(avatar);
            });
        });
    } catch (e) {
        return `https://graph.facebook.com/${userID}/picture?height=720&width=720`;
    }
}

/*
=========================================================
 COMMAND
=========================================================
*/

module.exports.run = async function ({ api, event }) {

    try {

        if (!event) {
            return;
        }

        const threadID = event.threadID;
        const messageID = event.messageID;
        const senderID = String(event.senderID || "");

        let targetID = null;
        let targetName = "your friend";

        if (event.messageReply) {
            targetID = getReplyTarget(event);
            if (targetID) {
                targetName = getReplyTargetName(event);
            }
        }

        if (!targetID) {
            targetID = getMentionTarget(event);
            if (targetID) {
                targetName = getMentionName(event, targetID);
            }
        }

        if (!targetID) {
            return api.sendMessage(
                "🤗 যাকে Hug দিতে চাও তার message-এ Reply করে `hug` লিখো।\n\nঅথবা:\n`hug @mention`",
                threadID,
                messageID
            );
        }

        let botID = null;
        try {
            if (typeof api.getCurrentUserID === "function") {
                botID = String(api.getCurrentUserID());
            }
        } catch (_) {}

        if (
            botID &&
            String(targetID) === String(botID)
        ) {
            return api.sendMessage(
                "😳 আমাকে আবার Hug দিচ্ছো নাকি? 🤭❤️",
                threadID,
                messageID
            );
        }

        const baseURL = getHugAPI();

        if (!baseURL) {
            return api.sendMessage(
                "❌ Hug API configuration পাওয়া যায়নি।",
                threadID,
                messageID
            );
        }

        // Fetch direct avatar URLs using bot api
        const senderAvatar = await getUserAvatar(api, senderID);
        const targetAvatar = await getUserAvatar(api, targetID);

        const separator = baseURL.includes("?") ? "&" : "?";

        const apiURL =
            `${baseURL}${separator}` +
            `img1=${encodeURIComponent(senderAvatar)}` +
            `&img2=${encodeURIComponent(targetAvatar)}`;

        let response;

        try {
            response = await axios.get(
                apiURL,
                {
                    responseType: "arraybuffer",
                    timeout: 30000,
                    maxRedirects: 5,
                    validateStatus: () => true,
                    headers: {
                        "User-Agent": "Mozilla/5.0 SAKIB-HUG-BOT/4.1",
                        "Accept": "image/png,image/jpeg,image/webp,image/*,*/*"
                    }
                }
            );
        } catch (error) {
            return api.sendMessage(
                `❌ Hug API connection failed.\n\n${error.message}`,
                threadID,
                messageID
            );
        }

        if (response.status !== 200) {
            let errorText = "";
            try {
                errorText = Buffer.from(response.data).toString("utf8").slice(0, 1500);
            } catch (_) {}

            return api.sendMessage(
                `❌ Hug API Error: HTTP ${response.status}\n\n${errorText}`,
                threadID,
                messageID
            );
        }

        const contentType = String(response.headers["content-type"] || "").toLowerCase();

        if (!contentType.startsWith("image/")) {
            let text = "";
            try {
                text = Buffer.from(response.data).toString("utf8").slice(0, 1500);
            } catch (_) {}

            return api.sendMessage(
                `❌ Hug API image দেয়নি।\n\nContent-Type: ${contentType}\n\n${text}`,
                threadID,
                messageID
            );
        }

        let extension = "png";
        if (contentType.includes("jpeg") || contentType.includes("jpg")) {
            extension = "jpg";
        } else if (contentType.includes("webp")) {
            extension = "webp";
        } else if (contentType.includes("gif")) {
            extension = "gif";
        }

        const tempFile = path.join(
            os.tmpdir(),
            `sakib_hug_${Date.now()}_${Math.random().toString(36).slice(2)}.${extension}`
        );

        try {
            fs.writeFileSync(tempFile, Buffer.from(response.data));
        } catch (error) {
            return api.sendMessage(
                "❌ Hug image save করা যায়নি।",
                threadID,
                messageID
            );
        }

        try {
            return api.sendMessage(
                {
                    body: `🤗 ${targetName}, তোমার জন্য একটা Hug! ❤️🫂\n— SAKIB BOT`,
                    attachment: fs.createReadStream(tempFile)
                },
                threadID,
                function (error) {
                    try {
                        if (fs.existsSync(tempFile)) {
                            fs.unlinkSync(tempFile);
                        }
                    } catch (_) {}
                },
                messageID
            );
        } catch (error) {
            try {
                if (fs.existsSync(tempFile)) {
                    fs.unlinkSync(tempFile);
                }
            } catch (_) {}
        }

    } catch (error) {
        return api.sendMessage(
            `❌ Hug command error.\n\n${error.message}`,
            event.threadID,
            event.messageID
        );
    }
};
