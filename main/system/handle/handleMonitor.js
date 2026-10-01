/**
 * ============================================================
 * SAKIB BOT - UNSEND ONLY GROUP MONITOR
 * ============================================================
 *
 * কাজ:
 *
 * ❌ কেউ message/photo/video/sticker পাঠালেই notification যাবে না
 *
 * ✅ কেউ message UNSEND করলে তখনই notification যাবে
 *
 * ✅ Text unsend -> original text
 * ✅ Photo unsend -> original photo পাঠানোর চেষ্টা
 * ✅ Video unsend -> original video পাঠানোর চেষ্টা
 * ✅ Sticker unsend -> sticker information
 *
 * Target:
 * Config.json -> OPERATOR + ADMINBOT
 *
 * IMPORTANT:
 * Message আসার সময় cache করা হয়।
 * পরে message_unsend এলে cache থেকে original content নেওয়া হয়।
 * ============================================================
 */

module.exports = function ({ api }) {

    const config = global.config || {};

    // =========================================================
    // SETTINGS
    // =========================================================

    // কতক্ষণ message cache-এ থাকবে
    const CACHE_TTL = 24 * 60 * 60 * 1000;

    // সর্বোচ্চ কত message cache রাখা হবে
    const MAX_CACHE = 5000;

    /*
     * messageID -> original message
     */
    const messageCache = new Map();

    // =========================================================
    // TARGET UID
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
                typeof api.getCurrentUserID ===
                "function"
            ) {

                const id =
                    api.getCurrentUserID();

                if (id) {
                    return String(id);
                }
            }

        } catch (error) {

            console.error(
                "[SAKIB UNSEND MONITOR] Bot UID error:",
                error.message
            );
        }

        return null;
    }

    // =========================================================
    // SEND TEXT TO TARGETS
    // =========================================================

    async function sendToTargets(message) {

        const targets =
            getTargets();

        if (
            !targets ||
            targets.length === 0
        ) {

            console.log(
                "[SAKIB UNSEND MONITOR] " +
                "No OPERATOR/ADMINBOT UID found."
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
                    `[SAKIB UNSEND MONITOR] ` +
                    `Send failed to ${uid}:`,
                    error.message
                );
            }
        }
    }

    // =========================================================
    // SEND ATTACHMENT TO TARGETS
    // =========================================================

    async function sendAttachment(
        message,
        url
    ) {

        if (!url) {
            return false;
        }

        if (
            !global.utils ||
            typeof global.utils.getStreamFromURL !==
            "function"
        ) {

            console.error(
                "[SAKIB UNSEND MONITOR] " +
                "getStreamFromURL unavailable."
            );

            return false;
        }

        const targets =
            getTargets();

        let sent = false;

        for (const uid of targets) {

            try {

                const stream =
                    await global.utils
                        .getStreamFromURL(url);

                if (!stream) {
                    continue;
                }

                await api.sendMessage(
                    {
                        body: message,
                        attachment: stream
                    },
                    uid
                );

                sent = true;

            } catch (error) {

                console.error(
                    `[SAKIB UNSEND MONITOR] ` +
                    `Attachment failed to ${uid}:`,
                    error.message
                );
            }
        }

        return sent;
    }

    // =========================================================
    // GET ATTACHMENT TYPE
    // =========================================================

    function getAttachmentType(
        attachment
    ) {

        if (!attachment) {
            return "unknown";
        }

        const type =
            String(
                attachment.type ||
                ""
            ).toLowerCase();

        if (
            type === "photo" ||
            type === "image"
        ) {

            return "photo";
        }

        if (
            type === "video"
        ) {

            return "video";
        }

        if (
            type === "sticker"
        ) {

            return "sticker";
        }

        if (
            type === "audio"
        ) {

            return "audio";
        }

        return type || "unknown";
    }

    // =========================================================
    // GET ATTACHMENT URL
    // =========================================================

    function getAttachmentURL(
        attachment
    ) {

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

        const now =
            Date.now();

        for (
            const [
                messageID,
                data
            ] of messageCache
        ) {

            if (
                !data ||
                !data.time ||
                now - data.time >
                    CACHE_TTL
            ) {

                messageCache.delete(
                    messageID
                );
            }
        }

        // Keep maximum cache size
        if (
            messageCache.size >
            MAX_CACHE
        ) {

            const entries =
                [...messageCache.entries()]
                    .sort(
                        (a, b) =>
                            (a[1].time || 0) -
                            (b[1].time || 0)
                    );

            const removeCount =
                messageCache.size -
                MAX_CACHE;

            for (
                let i = 0;
                i < removeCount;
                i++
            ) {

                messageCache.delete(
                    entries[i][0]
                );
            }
        }
    }

    // =========================================================
    // PERIODIC CACHE CLEANUP
    // =========================================================

    const cleanupTimer =
        setInterval(
            cleanupCache,
            10 * 60 * 1000
        );

    if (
        cleanupTimer &&
        typeof cleanupTimer.unref ===
        "function"
    ) {

        cleanupTimer.unref();
    }

    // =========================================================
    // CACHE ORIGINAL MESSAGE
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
            Array.isArray(
                event.attachments
            )
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

                    id:
                        attachment.ID ||
                        attachment.id ||
                        null,

                    name:
                        attachment.name ||
                        attachment.filename ||
                        null

                });
            }
        }

        /*
         * Save original message.
         */
        messageCache.set(
            String(messageID),
            {

                time: Date.now(),

                messageID:
                    String(messageID),

                senderID:
                    event.senderID
                        ? String(
                            event.senderID
                        )
                        : "Unknown",

                threadID:
                    event.threadID
                        ? String(
                            event.threadID
                        )
                        : "Unknown",

                body:
                    String(
                        event.body || ""
                    ),

                attachments

            }
        );

        cleanupCache();
    }

    // =========================================================
    // PROCESS UNSEND
    // =========================================================

    async function handleUnsend(
        event
    ) {

        const messageID =
            event.messageID ||
            event.messageId;

        if (!messageID) {
            return;
        }

        const key =
            String(messageID);

        const cached =
            messageCache.get(key);

        // =====================================================
        // CACHE FOUND
        // =====================================================

        if (cached) {

            /*
             * -----------------------------------------------
             * TEXT UNSEND
             * -----------------------------------------------
             */

            if (
                cached.body &&
                cached.body.trim() !== ""
            ) {

                const textMessage =
                    `🗑️ SAKIB GROUP MONITOR\n\n` +

                    `⚠️ Message UNSENT\n\n` +

                    `👤 Sender UID: ` +
                    `${cached.senderID}\n` +

                    `🆔 Group ID: ` +
                    `${cached.threadID}\n` +

                    `🆔 Message ID: ` +
                    `${cached.messageID}\n\n` +

                    `💬 Original Message:\n` +
                    `${cached.body}`;

                await sendToTargets(
                    textMessage
                );
            }

            /*
             * -----------------------------------------------
             * ATTACHMENT UNSEND
             * -----------------------------------------------
             */

            if (
                Array.isArray(
                    cached.attachments
                ) &&
                cached.attachments.length > 0
            ) {

                for (
                    const attachment
                    of cached.attachments
                ) {

                    // =========================================
                    // PHOTO
                    // =========================================

                    if (
                        attachment.type ===
                        "photo"
                    ) {

                        const message =
                            `🗑️ SAKIB GROUP MONITOR\n\n` +

                            `📸 PHOTO UNSENT\n\n` +

                            `👤 Sender UID: ` +
                            `${cached.senderID}\n` +

                            `🆔 Group ID: ` +
                            `${cached.threadID}\n` +

                            `🆔 Message ID: ` +
                            `${cached.messageID}`;

                        if (
                            attachment.url
                        ) {

                            const success =
                                await sendAttachment(
                                    message,
                                    attachment.url
                                );

                            /*
                             * URL failed হলে শুধু
                             * information পাঠাবে।
                             */
                            if (!success) {

                                await sendToTargets(
                                    message +
                                    `\n\n⚠️ ` +
                                    `Photo URL expired ` +
                                    `or unavailable.`
                                );
                            }

                        } else {

                            await sendToTargets(
                                message +
                                `\n\n⚠️ ` +
                                `Original photo URL ` +
                                `unavailable.`
                            );
                        }
                    }

                    // =========================================
                    // VIDEO
                    // =========================================

                    else if (
                        attachment.type ===
                        "video"
                    ) {

                        const message =
                            `🗑️ SAKIB GROUP MONITOR\n\n` +

                            `🎥 VIDEO UNSENT\n\n` +

                            `👤 Sender UID: ` +
                            `${cached.senderID}\n` +

                            `🆔 Group ID: ` +
                            `${cached.threadID}\n` +

                            `🆔 Message ID: ` +
                            `${cached.messageID}`;

                        if (
                            attachment.url
                        ) {

                            const success =
                                await sendAttachment(
                                    message,
                                    attachment.url
                                );

                            if (!success) {

                                await sendToTargets(
                                    message +
                                    `\n\n⚠️ ` +
                                    `Video URL expired ` +
                                    `or unavailable.`
                                );
                            }

                        } else {

                            await sendToTargets(
                                message +
                                `\n\n⚠️ ` +
                                `Original video URL ` +
                                `unavailable.`
                            );
                        }
                    }

                    // =========================================
                    // STICKER
                    // =========================================

                    else if (
                        attachment.type ===
                        "sticker"
                    ) {

                        /*
                         * Sticker পাঠানোর সময় কোনো
                         * notification যায়নি।
                         *
                         * কিন্তু sticker UNSEND হলে
                         * তখন notification যাবে।
                         */

                        const message =
                            `🗑️ SAKIB GROUP MONITOR\n\n` +

                            `🎭 STICKER UNSENT\n\n` +

                            `👤 Sender UID: ` +
                            `${cached.senderID}\n` +

                            `🆔 Group ID: ` +
                            `${cached.threadID}\n` +

                            `🆔 Message ID: ` +
                            `${cached.messageID}`;

                        await sendToTargets(
                            message
                        );
                    }

                    // =========================================
                    // OTHER ATTACHMENT
                    // =========================================

                    else {

                        const message =
                            `🗑️ SAKIB GROUP MONITOR\n\n` +

                            `📎 ATTACHMENT UNSENT\n\n` +

                            `📂 Type: ` +
                            `${attachment.type}\n\n` +

                            `👤 Sender UID: ` +
                            `${cached.senderID}\n` +

                            `🆔 Group ID: ` +
                            `${cached.threadID}\n` +

                            `🆔 Message ID: ` +
                            `${cached.messageID}`;

                        await sendToTargets(
                            message
                        );
                    }
                }
            }

            /*
             * Remove after processing.
             */
            messageCache.delete(
                key
            );

            return;
        }

        // =====================================================
        // CACHE NOT FOUND
        // =====================================================

        /*
         * Original content cache-এ না থাকলে
         * শুধু UNSEND notification।
         */

        const message =
            `🗑️ SAKIB GROUP MONITOR\n\n` +

            `⚠️ Message UNSENT\n\n` +

            `❌ Original message was not found ` +
            `in cache.\n\n` +

            `👤 Sender UID: ` +
            `${event.senderID || "Unknown"}\n` +

            `🆔 Group ID: ` +
            `${event.threadID || "Unknown"}\n` +

            `🆔 Message ID: ` +
            `${messageID}`;

        await sendToTargets(
            message
        );
    }

    // =========================================================
    // MAIN MONITOR
    // =========================================================

    return async function monitor({
        event
    }) {

        if (!event) {
            return;
        }

        if (!event.threadID) {
            return;
        }

        /*
         * Ignore bot's own messages.
         */
        const botID =
            getBotID();

        if (
            botID &&
            event.senderID &&
            String(
                event.senderID
            ) === botID
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

            /*
             * IMPORTANT:
             *
             * এখানে কোনো notification নেই।
             *
             * শুধু future UNSEND-এর জন্য
             * original message cache করা হচ্ছে।
             */

            cacheMessage(event);

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
