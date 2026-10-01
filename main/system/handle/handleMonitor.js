/**
 * ============================================================
 * SAKIB BOT - GROUP MONITOR
 * ============================================================
 *
 * Monitors group messages and sends:
 *
 * ✅ Normal text containing links
 * ✅ Photos
 * ✅ Videos
 * ✅ Message information
 * ✅ Unsent message information
 * ✅ Cached original text when available
 * ✅ Cached photo/video when URL is still available
 *
 * Targets:
 *   Config.json -> OPERATOR
 *   Config.json -> ADMINBOT
 *
 * IMPORTANT:
 * Unsend content can only be recovered if the message was
 * received and cached BEFORE it was unsent.
 * ============================================================
 */

const fs = require("fs");
const path = require("path");

module.exports = function ({ api }) {

    const config = global.config || {};

    // =========================================================
    // SETTINGS
    // =========================================================

    const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
    const MAX_CACHE = 3000;

    /*
     * messageID -> cached message
     */
    const messageCache = new Map();

    // =========================================================
    // TARGET USERS
    // =========================================================

    function getTargets() {

        const targets = [
            ...(Array.isArray(config.OPERATOR)
                ? config.OPERATOR
                : []),

            ...(Array.isArray(config.ADMINBOT)
                ? config.ADMINBOT
                : [])
        ];

        return [
            ...new Set(
                targets
                    .filter(Boolean)
                    .map(String)
                    .filter(uid => uid.trim() !== "")
            )
        ];
    }

    // =========================================================
    // BOT UID
    // =========================================================

    function getBotID() {

        try {

            if (
                typeof api.getCurrentUserID === "function"
            ) {

                const id = api.getCurrentUserID();

                if (id) {
                    return String(id);
                }
            }

        } catch (error) {

            console.error(
                "[SAKIB MONITOR] Cannot get bot UID:",
                error.message
            );
        }

        return null;
    }

    // =========================================================
    // SEND MESSAGE TO ALL TARGETS
    // =========================================================

    async function sendToAdmins(message) {

        const targets = getTargets();

        if (targets.length === 0) {

            console.log(
                "[SAKIB MONITOR] No OPERATOR/ADMINBOT UID found."
            );

            return;
        }

        for (const uid of targets) {

            try {

                await api.sendMessage(
                    message,
                    uid
                );

            } catch (error) {

                console.error(
                    `[SAKIB MONITOR] Failed to send to ${uid}:`,
                    error.message
                );
            }
        }
    }

    // =========================================================
    // SEND ATTACHMENT TO ALL TARGETS
    // =========================================================

    async function sendAttachmentToAdmins(
        message,
        url
    ) {

        const targets = getTargets();

        if (!url) {
            return false;
        }

        if (
            !global.utils ||
            typeof global.utils.getStreamFromURL !== "function"
        ) {

            console.error(
                "[SAKIB MONITOR] global.utils.getStreamFromURL is unavailable."
            );

            return false;
        }

        for (const uid of targets) {

            try {

                const stream =
                    await global.utils.getStreamFromURL(url);

                if (!stream) {

                    console.error(
                        `[SAKIB MONITOR] Empty stream for ${uid}`
                    );

                    continue;
                }

                await api.sendMessage(
                    {
                        body: message,
                        attachment: stream
                    },
                    uid
                );

            } catch (error) {

                console.error(
                    `[SAKIB MONITOR] Attachment forward failed to ${uid}:`,
                    error.message
                );
            }
        }

        return true;
    }

    // =========================================================
    // LINK EXTRACTOR
    // =========================================================

    function extractLinks(text) {

        if (!text) {
            return [];
        }

        const regex =
            /https?:\/\/[^\s<>"']+/gi;

        return text.match(regex) || [];
    }

    // =========================================================
    // ATTACHMENT TYPE
    // =========================================================

    function getAttachmentType(attachment) {

        if (!attachment) {
            return "unknown";
        }

        const type =
            String(
                attachment.type ||
                attachment.mimeType ||
                ""
            ).toLowerCase();

        if (
            type === "photo" ||
            type === "image" ||
            type.includes("image")
        ) {

            return "photo";
        }

        if (
            type === "video" ||
            type.includes("video")
        ) {

            return "video";
        }

        if (
            type === "audio" ||
            type.includes("audio")
        ) {

            return "audio";
        }

        return type || "unknown";
    }

    // =========================================================
    // ATTACHMENT URL
    // =========================================================

    function getAttachmentURL(attachment) {

        if (!attachment) {
            return null;
        }

        return (
            attachment.url ||
            attachment.previewUrl ||
            attachment.largePreviewUrl ||
            attachment.videoUrl ||
            attachment.downloadUrl ||
            null
        );
    }

    // =========================================================
    // CACHE CLEANUP
    // =========================================================

    function cleanupCache() {

        const now = Date.now();

        for (const [messageID, cached] of messageCache) {

            if (
                !cached ||
                !cached.time ||
                now - cached.time > CACHE_TTL
            ) {

                messageCache.delete(messageID);
            }
        }

        /*
         * Keep memory usage under control.
         */
        if (messageCache.size > MAX_CACHE) {

            const entries =
                [...messageCache.entries()]
                    .sort(
                        (a, b) =>
                            (a[1].time || 0) -
                            (b[1].time || 0)
                    );

            const removeCount =
                messageCache.size - MAX_CACHE;

            for (let i = 0; i < removeCount; i++) {

                messageCache.delete(
                    entries[i][0]
                );
            }
        }
    }

    // Cleanup every 10 minutes
    const cleanupTimer = setInterval(
        cleanupCache,
        10 * 60 * 1000
    );

    if (
        cleanupTimer &&
        typeof cleanupTimer.unref === "function"
    ) {

        cleanupTimer.unref();
    }

    // =========================================================
    // CACHE MESSAGE
    // =========================================================

    function cacheMessage(event) {

        if (!event) {
            return;
        }

        const messageID =
            event.messageID ||
            event.messageId;

        if (!messageID) {
            return;
        }

        const attachments = [];

        if (
            Array.isArray(event.attachments) &&
            event.attachments.length > 0
        ) {

            for (
                const attachment
                of event.attachments
            ) {

                if (!attachment) {
                    continue;
                }

                const type =
                    getAttachmentType(
                        attachment
                    );

                const url =
                    getAttachmentURL(
                        attachment
                    );

                attachments.push({

                    type,

                    url,

                    name:
                        attachment.name ||
                        attachment.filename ||
                        null,

                    ID:
                        attachment.ID ||
                        attachment.id ||
                        null
                });
            }
        }

        messageCache.set(
            String(messageID),
            {

                time: Date.now(),

                messageID:
                    String(messageID),

                senderID:
                    event.senderID
                        ? String(event.senderID)
                        : "Unknown",

                threadID:
                    event.threadID
                        ? String(event.threadID)
                        : "Unknown",

                body:
                    event.body ||
                    "",

                attachments

            }
        );

        cleanupCache();
    }

    // =========================================================
    // CREATE MESSAGE HEADER
    // =========================================================

    function makeHeader(
        title,
        event
    ) {

        return (
            `${title}\n\n` +

            `👤 Sender UID: ${
                event.senderID ||
                "Unknown"
            }\n` +

            `🆔 Group ID: ${
                event.threadID ||
                "Unknown"
            }\n` +

            `🆔 Message ID: ${
                event.messageID ||
                "Unknown"
            }`
        );
    }

    // =========================================================
    // NORMAL MESSAGE
    // =========================================================

    async function handleNormalMessage(event) {

        /*
         * FIRST:
         * Cache the message BEFORE doing anything else.
         *
         * This is important for unsend recovery.
         */
        cacheMessage(event);

        const body =
            String(event.body || "");

        const links =
            extractLinks(body);

        // =====================================================
        // LINKS
        // =====================================================

        if (links.length > 0) {

            const message =
                `🔗 SAKIB GROUP MONITOR\n\n` +

                `📌 New link/message received\n\n` +

                `👤 Sender UID: ${
                    event.senderID ||
                    "Unknown"
                }\n` +

                `🆔 Group ID: ${
                    event.threadID ||
                    "Unknown"
                }\n\n` +

                `💬 Message:\n` +

                `${body}\n\n` +

                `🔗 Links:\n` +

                `${links.join("\n")}`;

            await sendToAdmins(message);
        }

        // =====================================================
        // ATTACHMENTS
        // =====================================================

        if (
            !Array.isArray(event.attachments) ||
            event.attachments.length === 0
        ) {

            return;
        }

        for (
            const attachment
            of event.attachments
        ) {

            if (!attachment) {
                continue;
            }

            const type =
                getAttachmentType(
                    attachment
                );

            const url =
                getAttachmentURL(
                    attachment
                );

            // =================================================
            // PHOTO
            // =================================================

            if (type === "photo") {

                const message =
                    `🖼️ SAKIB GROUP MONITOR\n\n` +

                    `📸 New photo received\n\n` +

                    `👤 Sender UID: ${
                        event.senderID ||
                        "Unknown"
                    }\n` +

                    `🆔 Group ID: ${
                        event.threadID ||
                        "Unknown"
                    }\n` +

                    `🆔 Message ID: ${
                        event.messageID ||
                        "Unknown"
                    }`;

                /*
                 * If URL exists:
                 * send the ACTUAL PHOTO.
                 */
                if (url) {

                    await sendAttachmentToAdmins(
                        message,
                        url
                    );

                } else {

                    /*
                     * Fallback notification
                     */
                    await sendToAdmins(
                        message +
                        `\n\n⚠️ Photo URL পাওয়া যায়নি।`
                    );
                }
            }

            // =================================================
            // VIDEO
            // =================================================

            else if (type === "video") {

                const message =
                    `🎥 SAKIB GROUP MONITOR\n\n` +

                    `🎬 New video received\n\n` +

                    `👤 Sender UID: ${
                        event.senderID ||
                        "Unknown"
                    }\n` +

                    `🆔 Group ID: ${
                        event.threadID ||
                        "Unknown"
                    }\n` +

                    `🆔 Message ID: ${
                        event.messageID ||
                        "Unknown"
                    }`;

                /*
                 * Send ACTUAL VIDEO
                 */
                if (url) {

                    await sendAttachmentToAdmins(
                        message,
                        url
                    );

                } else {

                    await sendToAdmins(
                        message +
                        `\n\n⚠️ Video URL পাওয়া যায়নি।`
                    );
                }
            }

            // =================================================
            // OTHER ATTACHMENT
            // =================================================

            else {

                /*
                 * Cache করা হয়েছে।
                 * Unknown attachment হলে অন্তত notification.
                 */

                const message =
                    `📎 SAKIB GROUP MONITOR\n\n` +

                    `New attachment received\n\n` +

                    `📂 Type: ${type}\n` +

                    `👤 Sender UID: ${
                        event.senderID ||
                        "Unknown"
                    }\n` +

                    `🆔 Group ID: ${
                        event.threadID ||
                        "Unknown"
                    }\n` +

                    `🆔 Message ID: ${
                        event.messageID ||
                        "Unknown"
                    }`;

                await sendToAdmins(message);
            }
        }
    }

    // =========================================================
    // UNSEND MESSAGE
    // =========================================================

    async function handleUnsend(event) {

        const messageID =
            event.messageID ||
            event.messageId;

        const key =
            messageID
                ? String(messageID)
                : null;

        /*
         * Find original cached message.
         */
        const cached =
            key
                ? messageCache.get(key)
                : null;

        // =====================================================
        // CACHE FOUND
        // =====================================================

        if (cached) {

            let message =
                `🗑️ SAKIB GROUP MONITOR\n\n` +

                `⚠️ A message was unsent.\n\n` +

                `👤 Sender UID: ${
                    cached.senderID
                }\n` +

                `🆔 Group ID: ${
                    cached.threadID
                }\n` +

                `🆔 Message ID: ${
                    cached.messageID
                }\n\n`;

            // -------------------------------------------------
            // ORIGINAL TEXT
            // -------------------------------------------------

            if (cached.body) {

                message +=
                    `💬 Original Message:\n` +
                    `${cached.body}\n\n`;
            }

            // -------------------------------------------------
            // ORIGINAL ATTACHMENT INFO
            // -------------------------------------------------

            if (
                Array.isArray(
                    cached.attachments
                ) &&
                cached.attachments.length > 0
            ) {

                message +=
                    `📎 Attachments: ` +
                    `${cached.attachments.length}\n\n`;
            }

            /*
             * First send text information.
             */
            await sendToAdmins(message);

            // -------------------------------------------------
            // TRY TO SEND ORIGINAL ATTACHMENTS
            // -------------------------------------------------

            if (
                Array.isArray(
                    cached.attachments
                )
            ) {

                for (
                    const attachment
                    of cached.attachments
                ) {

                    if (!attachment.url) {
                        continue;
                    }

                    let title;

                    if (
                        attachment.type ===
                        "photo"
                    ) {

                        title =
                            `🗑️ SAKIB GROUP MONITOR\n\n` +
                            `📸 Unsent photo\n\n` +
                            `👤 Sender UID: ${
                                cached.senderID
                            }\n` +
                            `🆔 Group ID: ${
                                cached.threadID
                            }\n` +
                            `🆔 Message ID: ${
                                cached.messageID
                            }`;

                    } else if (
                        attachment.type ===
                        "video"
                    ) {

                        title =
                            `🗑️ SAKIB GROUP MONITOR\n\n` +
                            `🎥 Unsent video\n\n` +
                            `👤 Sender UID: ${
                                cached.senderID
                            }\n` +
                            `🆔 Group ID: ${
                                cached.threadID
                            }\n` +
                            `🆔 Message ID: ${
                                cached.messageID
                            }`;

                    } else {

                        title =
                            `🗑️ SAKIB GROUP MONITOR\n\n` +
                            `📎 Unsent attachment\n\n` +
                            `👤 Sender UID: ${
                                cached.senderID
                            }\n` +
                            `🆔 Group ID: ${
                                cached.threadID
                            }\n` +
                            `🆔 Message ID: ${
                                cached.messageID
                            }`;
                    }

                    /*
                     * Try sending original attachment.
                     *
                     * Note:
                     * Facebook attachment URLs can expire.
                     * If expired, this will fail gracefully.
                     */
                    await sendAttachmentToAdmins(
                        title,
                        attachment.url
                    );
                }
            }

            /*
             * Delete from cache after processing.
             */
            messageCache.delete(key);

            return;
        }

        // =====================================================
        // CACHE NOT FOUND
        // =====================================================

        /*
         * We cannot recover the original content if it was
         * never cached.
         */

        const message =
            `🗑️ SAKIB GROUP MONITOR\n\n` +

            `⚠️ A message was unsent.\n\n` +

            `❌ Original message was not found in cache.\n\n` +

            `👤 Sender UID: ${
                event.senderID ||
                "Unknown"
            }\n` +

            `🆔 Group ID: ${
                event.threadID ||
                "Unknown"
            }\n` +

            `🆔 Message ID: ${
                messageID ||
                "Unknown"
            }\n\n` +

            `ℹ️ The message must have been received by the bot before it was unsent.`;

        await sendToAdmins(message);
    }

    // =========================================================
    // MAIN MONITOR
    // =========================================================

    return async function monitor({ event }) {

        if (!event) {
            return;
        }

        /*
         * Must have thread ID.
         */
        if (!event.threadID) {
            return;
        }

        /*
         * Only group/thread monitoring.
         */
        const botID =
            getBotID();

        /*
         * Ignore bot's own messages.
         */
        if (
            botID &&
            event.senderID &&
            String(event.senderID) === botID
        ) {

            return;
        }

        // =====================================================
        // NORMAL MESSAGE
        // =====================================================

        if (
            event.type === "message" ||
            event.type === "message_reply"
        ) {

            await handleNormalMessage(
                event
            );

            return;
        }

        // =====================================================
        // UNSEND
        // =====================================================

        if (
            event.type ===
            "message_unsend"
        ) {

            await handleUnsend(
                event
            );

            return;
        }
    };
};
