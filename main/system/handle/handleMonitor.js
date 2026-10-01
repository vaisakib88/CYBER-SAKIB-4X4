/**
 * ============================================================
 * SAKIB BOT - ROBUST MEDIA UNSEND MONITOR (FINAL FIX)
 * ============================================================
 */

module.exports = function ({ api }) {

    const config = global.config || {};
    const axios = require("axios");

    const CACHE_TTL = 24 * 60 * 60 * 1000;
    const MAX_CACHE = 5000;
    const messageCache = new Map();

    function getTargets() {
        const targets = [
            ...(Array.isArray(config.OPERATOR) ? config.OPERATOR : []),
            ...(Array.isArray(config.ADMINBOT) ? config.ADMINBOT : [])
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

    function getBotID() {
        try {
            if (typeof api.getCurrentUserID === "function") {
                const id = api.getCurrentUserID();
                if (id) return String(id);
            }
        } catch (error) {}
        return null;
    }

    async function sendToTargets(message) {
        const targets = getTargets();
        if (!targets || targets.length === 0) return;

        for (const uid of targets) {
            try {
                await api.sendMessage(message, uid);
            } catch (error) {}
        }
    }

    function getAttachmentType(attachment) {
        if (!attachment) return "unknown";
        const type = String(attachment.type || "").toLowerCase();
        if (type === "photo" || type === "image") return "photo";
        if (type === "video") return "video";
        if (type === "sticker") return "sticker";
        if (type === "audio") return "audio";
        return type || "unknown";
    }

    function getAttachmentURL(attachment) {
        if (!attachment) return null;
        return (
            attachment.url ||
            attachment.previewUrl ||
            attachment.largePreviewUrl ||
            attachment.videoUrl ||
            attachment.downloadUrl ||
            attachment.playableUrl ||
            null
        );
    }

    function cleanupCache() {
        const now = Date.now();
        for (const [messageID, data] of messageCache) {
            if (!data || !data.time || now - data.time > CACHE_TTL) {
                messageCache.delete(messageID);
            }
        }

        if (messageCache.size > MAX_CACHE) {
            const entries = [...messageCache.entries()].sort((a, b) => (a[1].time || 0) - (b[1].time || 0));
            const removeCount = messageCache.size - MAX_CACHE;
            for (let i = 0; i < removeCount; i++) {
                messageCache.delete(entries[i][0]);
            }
        }
    }

    const cleanupTimer = setInterval(cleanupCache, 10 * 60 * 1000);
    if (cleanupTimer && typeof cleanupTimer.unref === "function") {
        cleanupTimer.unref();
    }

    async function cacheMessage(event) {
        if (!event) return;
        const messageID = event.messageID || event.messageId;
        if (!messageID) return;

        const attachments = [];
        if (Array.isArray(event.attachments)) {
            for (const attachment of event.attachments) {
                if (!attachment) continue;
                const url = getAttachmentURL(attachment);
                let cachedStream = null;

                if (url) {
                    try {
                        // Try global utils first
                        if (global.utils && typeof global.utils.getStreamFromURL === "function") {
                            cachedStream = await global.utils.getStreamFromURL(url);
                        }
                    } catch (e) {}

                    // Fallback using axios stream if global utils fails
                    if (!cachedStream) {
                        try {
                            const res = await axios.get(url, { responseType: 'stream' });
                            cachedStream = res.data;
                        } catch (e) {}
                    }
                }

                attachments.push({
                    type: getAttachmentType(attachment),
                    url: url,
                    stream: cachedStream
                });
            }
        }

        messageCache.set(String(messageID), {
            time: Date.now(),
            messageID: String(messageID),
            senderID: event.senderID ? String(event.senderID) : "Unknown",
            threadID: event.threadID ? String(event.threadID) : "Unknown",
            body: String(event.body || ""),
            attachments
        });

        cleanupCache();
    }

    async function handleUnsend(event) {
        const messageID = event.messageID || event.messageId;
        if (!messageID) return;

        const key = String(messageID);
        let cached = messageCache.get(key);

        if (cached) {
            if (cached.body && cached.body.trim() !== "") {
                const textMessage = 
                    `🗑️ SAKIB UNSEND MONITOR\n\n` +
                    `⚠️ Message Unsent!\n\n` +
                    `👤 Sender UID: ${cached.senderID}\n` +
                    `🆔 Group ID: ${cached.threadID}\n\n` +
                    `💬 Message:\n${cached.body}`;

                await sendToTargets(textMessage);
            }

            if (Array.isArray(cached.attachments) && cached.attachments.length > 0) {
                for (const attachment of cached.attachments) {
                    const typeName = attachment.type.toUpperCase();
                    const message = 
                        `🗑️ SAKIB UNSEND MONITOR\n\n` +
                        `📸 ${typeName} UNSENT!\n\n` +
                        `👤 Sender UID: ${cached.senderID}\n` +
                        `🆔 Group ID: ${cached.threadID}`;

                    let sent = false;
                    const targets = getTargets();

                    // 1. Try cached stream first
                    if (attachment.stream) {
                        for (const uid of targets) {
                            try {
                                await api.sendMessage({
                                    body: message,
                                    attachment: attachment.stream
                                }, uid);
                                sent = true;
                            } catch (err) {}
                        }
                    }

                    // 2. If stream fails, try fetching fresh via axios/global.utils on unsend
                    if (!sent && attachment.url) {
                        let freshStream = null;
                        try {
                            if (global.utils && typeof global.utils.getStreamFromURL === "function") {
                                freshStream = await global.utils.getStreamFromURL(attachment.url);
                            }
                            if (!freshStream) {
                                const res = await axios.get(attachment.url, { responseType: 'stream' });
                                freshStream = res.data;
                            }
                        } catch (e) {}

                        if (freshStream) {
                            for (const uid of targets) {
                                try {
                                    await api.sendMessage({
                                        body: message,
                                        attachment: freshStream
                                    }, uid);
                                    sent = true;
                                } catch (err) {}
                            }
                        }
                    }

                    if (!sent) {
                        await sendToTargets(message + `\n\n⚠️ Could not retrieve media.`);
                    }
                }
            }

            messageCache.delete(key);
            return;
        }
    }

    return async function monitor({ event }) {
        if (!event) return;
        if (!event.threadID) return;

        const botID = getBotID();
        if (botID && event.senderID && String(event.senderID) === botID) {
            return;
        }

        if (event.type === "message" || event.type === "message_reply") {
            await cacheMessage(event);
            return;
        }

        if (event.type === "message_unsend") {
            await handleUnsend(event);
            return;
        }
    };
};
