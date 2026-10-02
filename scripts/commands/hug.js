const fs = require("fs");
const path = require("path");
const os = require("os");
const axios = require("axios");

module.exports.config = {
    name: "hug",
    version: "4.0.0",
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

        /*
        =================================================
        TARGET SELECTION
        =================================================

        Priority:

        1. Reply
        2. Mention
        */

        let targetID = null;
        let targetName = "your friend";
        let targetType = null;

        /*
        -----------------------------------------------
        1. REPLY
        -----------------------------------------------
        */

        if (event.messageReply) {

            targetID = getReplyTarget(event);

            if (targetID) {

                targetName =
                    getReplyTargetName(event);

                targetType = "REPLY";
            }
        }

        /*
        -----------------------------------------------
        2. MENTION
        -----------------------------------------------
        */

        if (!targetID) {

            targetID =
                getMentionTarget(event);

            if (targetID) {

                targetName =
                    getMentionName(
                        event,
                        targetID
                    );

                targetType = "MENTION";
            }
        }

        /*
        =================================================
        NO TARGET
        =================================================
        */

        if (!targetID) {

            return api.sendMessage(
                "🤗 যাকে Hug দিতে চাও তার message-এ Reply করে `hug` লিখো।\n\nঅথবা:\n`hug @mention`",
                threadID,
                messageID
            );
        }

        /*
        =================================================
        BOT UID
        =================================================
        */

        let botID = null;

        try {

            if (
                typeof api.getCurrentUserID ===
                "function"
            ) {
                botID =
                    String(
                        api.getCurrentUserID()
                    );
            }

        } catch (_) {}

        /*
        =================================================
        PREVENT SELF HUG
        =================================================
        */

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

        /*
        =================================================
        LOAD HUG API
        =================================================
        */

        const baseURL = getHugAPI();

        if (!baseURL) {

            return api.sendMessage(
                "❌ Hug API configuration পাওয়া যায়নি।",
                threadID,
                messageID
            );
        }

        /*
        =================================================
        BLOCK OLD/BROKEN API
        =================================================
        */

        if (
            baseURL.includes("noobs-api.rf.gd")
        ) {

            console.error(
                "[SAKIB HUG] OLD API DETECTED:",
                baseURL
            );

            return api.sendMessage(
                "❌ পুরোনো Hug API detect হয়েছে।\n\nmain/configs/hug_api.json ঠিক করো।",
                threadID,
                messageID
            );
        }

        /*
        =================================================
        BUILD URL
        =================================================
        */

        const separator =
            baseURL.includes("?")
                ? "&"
                : "?";

        const apiURL =
            `${baseURL}${separator}` +
            `one=${encodeURIComponent(senderID)}` +
            `&two=${encodeURIComponent(targetID)}`;

        /*
        =================================================
        DEBUG LOG
        =================================================
        */

        console.log("");
        console.log(
            "=========================================="
        );
        console.log(
            "           SAKIB HUG COMMAND"
        );
        console.log(
            "=========================================="
        );

        console.log(
            "Type       :",
            targetType
        );

        console.log(
            "Sender UID :",
            senderID
        );

        console.log(
            "Target UID :",
            targetID
        );

        console.log(
            "Target Name:",
            targetName
        );

        console.log(
            "API        :",
            baseURL
        );

        console.log(
            "API URL    :",
            apiURL
        );

        console.log(
            "=========================================="
        );
        console.log("");

        /*
        =================================================
        REQUEST HUG API
        =================================================
        */

        let response;

        try {

            response = await axios.get(
                apiURL,
                {
                    responseType:
                        "arraybuffer",

                    timeout:
                        30000,

                    maxRedirects:
                        5,

                    validateStatus:
                        () => true,

                    headers: {
                        "User-Agent":
                            "Mozilla/5.0 SAKIB-HUG-BOT/4.0",
                        "Accept":
                            "image/png,image/jpeg,image/webp,image/*,*/*"
                    }
                }
            );

        } catch (error) {

            console.error(
                "[SAKIB HUG] API connection error:",
                error.message
            );

            return api.sendMessage(
                `❌ Hug API connection failed.\n\n${error.message}`,
                threadID,
                messageID
            );
        }

        /*
        =================================================
        HTTP ERROR
        =================================================
        */

        if (response.status !== 200) {

            let errorText = "";

            try {

                errorText =
                    Buffer
                        .from(response.data)
                        .toString("utf8")
                        .slice(0, 1500);

            } catch (_) {}

            console.error(
                "[SAKIB HUG] HTTP ERROR:",
                response.status
            );

            console.error(
                "[SAKIB HUG] RESPONSE:",
                errorText
            );

            return api.sendMessage(
                `❌ Hug API Error: HTTP ${response.status}\n\n${errorText}`,
                threadID,
                messageID
            );
        }

        /*
        =================================================
        CONTENT TYPE
        =================================================
        */

        const contentType =
            String(
                response.headers[
                    "content-type"
                ] || ""
            ).toLowerCase();

        /*
        =================================================
        MAKE SURE RESPONSE IS IMAGE
        =================================================
        */

        if (
            !contentType.startsWith("image/")
        ) {

            let text = "";

            try {

                text =
                    Buffer
                        .from(response.data)
                        .toString("utf8")
                        .slice(0, 1500);

            } catch (_) {}

            console.error(
                "[SAKIB HUG] Invalid response type:",
                contentType
            );

            return api.sendMessage(
                `❌ Hug API image দেয়নি।\n\nContent-Type: ${contentType}\n\n${text}`,
                threadID,
                messageID
            );
        }

        /*
        =================================================
        FILE EXTENSION
        =================================================
        */

        let extension = "png";

        if (
            contentType.includes("jpeg") ||
            contentType.includes("jpg")
        ) {
            extension = "jpg";

        } else if (
            contentType.includes("webp")
        ) {
            extension = "webp";

        } else if (
            contentType.includes("gif")
        ) {
            extension = "gif";
        }

        /*
        =================================================
        TEMP FILE
        =================================================
        */

        const tempFile = path.join(
            os.tmpdir(),
            `sakib_hug_${Date.now()}_${Math.random()
                .toString(36)
                .slice(2)}.${extension}`
        );

        /*
        =================================================
        SAVE IMAGE
        =================================================
        */

        try {

            fs.writeFileSync(
                tempFile,
                Buffer.from(response.data)
            );

        } catch (error) {

            console.error(
                "[SAKIB HUG] Save error:",
                error.message
            );

            return api.sendMessage(
                "❌ Hug image save করা যায়নি।",
                threadID,
                messageID
            );
        }

        /*
        =================================================
        SEND IMAGE
        =================================================
        */

        try {

            return api.sendMessage(
                {
                    body:
                        `🤗 ${targetName}, তোমার জন্য একটা Hug! ❤️🫂\n` +
                        `— SAKIB BOT`,

                    attachment:
                        fs.createReadStream(
                            tempFile
                        )
                },

                threadID,

                function (error) {

                    /*
                    -------------------------------------
                    DELETE TEMP FILE
                    -------------------------------------
                    */

                    try {

                        if (
                            fs.existsSync(
                                tempFile
                            )
                        ) {
                            fs.unlinkSync(
                                tempFile
                            );
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

            /*
            ---------------------------------------------
            CLEANUP
            ---------------------------------------------
            */

            try {

                if (
                    fs.existsSync(
                        tempFile
                    )
                ) {
                    fs.unlinkSync(
                        tempFile
                    );
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

    } catch (error) {

        console.error(
            "[SAKIB HUG] Fatal error:",
            error
        );

        return api.sendMessage(
            `❌ Hug command error.\n\n${error.message}`,
            event.threadID,
            event.messageID
        );
    }
};
