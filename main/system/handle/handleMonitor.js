/**
 * SAKIB BOT - GROUP MONITOR
 * Sends photos, videos and links from groups
 * to Config.json OPERATOR + ADMINBOT UIDs.
 */

module.exports = function ({ api }) {

    const config = global.config || {};

    function getTargets() {
        const targets = [
            ...(Array.isArray(config.OPERATOR) ? config.OPERATOR : []),
            ...(Array.isArray(config.ADMINBOT) ? config.ADMINBOT : [])
        ];

        return [...new Set(
            targets
                .filter(Boolean)
                .map(String)
        )];
    }

    function sendToAdmins(message) {
        const targets = getTargets();

        for (const uid of targets) {
            try {
                api.sendMessage(message, uid);
            } catch (error) {
                console.error(
                    `[SAKIB MONITOR] Failed to send notification to ${uid}:`,
                    error.message
                );
            }
        }
    }

    function extractLinks(text) {
        if (!text) return [];

        const regex = /https?:\/\/[^\s]+/gi;
        return text.match(regex) || [];
    }

    return async function monitor({ event }) {

        if (!event) return;

        /*
         * Only monitor group messages.
         */
        if (!event.threadID) return;

        /*
         * Ignore messages sent by the bot itself.
         */
        const botID =
            typeof api.getCurrentUserID === "function"
                ? String(api.getCurrentUserID())
                : null;

        if (
            botID &&
            event.senderID &&
            String(event.senderID) === botID
        ) {
            return;
        }

        /*
         * ==========================
         * NORMAL MESSAGE
         * ==========================
         */

        if (event.type === "message") {

            const body = event.body || "";
            const links = extractLinks(body);

            /*
             * Link detected
             */
            if (links.length > 0) {

                const message =
                    `🔗 SAKIB GROUP MONITOR\n\n` +
                    `📌 Link detected\n` +
                    `👤 Sender UID: ${event.senderID || "Unknown"}\n` +
                    `💬 Message:\n${body}\n\n` +
                    `🔗 Links:\n${links.join("\n")}\n\n` +
                    `🆔 Group ID: ${event.threadID}`;

                sendToAdmins(message);
            }

            /*
             * ==========================
             * ATTACHMENTS
             * ==========================
             */

            if (
                Array.isArray(event.attachments) &&
                event.attachments.length > 0
            ) {

                for (const attachment of event.attachments) {

                    if (!attachment) continue;

                    const type =
                        String(attachment.type || "").toLowerCase();

                    /*
                     * PHOTO
                     */
                    if (
                        type === "photo" ||
                        type === "image"
                    ) {

                        const message =
                            `🖼️ SAKIB GROUP MONITOR\n\n` +
                            `📸 New photo received\n` +
                            `👤 Sender UID: ${event.senderID || "Unknown"}\n` +
                            `🆔 Group ID: ${event.threadID}`;

                        sendToAdmins(message);

                        /*
                         * Forward image when a usable URL exists.
                         */
                        const url =
                            attachment.url ||
                            attachment.previewUrl ||
                            attachment.largePreviewUrl;

                        if (url) {

                            for (const uid of getTargets()) {

                                try {

                                    await api.sendMessage(
                                        {
                                            body: message,
                                            attachment: await global.utils.getStreamFromURL(url)
                                        },
                                        uid
                                    );

                                } catch (error) {

                                    console.error(
                                        `[SAKIB MONITOR] Photo forward failed:`,
                                        error.message
                                    );

                                }

                            }
                        }
                    }

                    /*
                     * VIDEO
                     */
                    else if (type === "video") {

                        const message =
                            `🎥 SAKIB GROUP MONITOR\n\n` +
                            `🎬 New video received\n` +
                            `👤 Sender UID: ${event.senderID || "Unknown"}\n` +
                            `🆔 Group ID: ${event.threadID}`;

                        sendToAdmins(message);

                        const url =
                            attachment.url ||
                            attachment.videoUrl;

                        if (url) {

                            for (const uid of getTargets()) {

                                try {

                                    await api.sendMessage(
                                        {
                                            body: message,
                                            attachment: await global.utils.getStreamFromURL(url)
                                        },
                                        uid
                                    );

                                } catch (error) {

                                    console.error(
                                        `[SAKIB MONITOR] Video forward failed:`,
                                        error.message
                                    );

                                }

                            }
                        }
                    }
                }
            }
        }

        /*
         * ==========================
         * UNSEND MESSAGE
         * ==========================
         */

        if (event.type === "message_unsend") {

            const message =
                `🗑️ SAKIB GROUP MONITOR\n\n` +
                `⚠️ A message was unsent.\n\n` +
                `👤 Sender UID: ${event.senderID || "Unknown"}\n` +
                `🆔 Group ID: ${event.threadID}\n` +
                `🆔 Message ID: ${event.messageID || "Unknown"}`;

            sendToAdmins(message);
        }
    };
};
