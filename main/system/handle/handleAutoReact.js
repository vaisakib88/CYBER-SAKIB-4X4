/**
 * SAKIB BOT - AUTO SEEN + AUTO REACT
 */

module.exports = function ({ api }) {

    // যে reaction দিতে চাও
    const REACTION = "❤️";

    function getBotID() {
        try {
            return typeof api.getCurrentUserID === "function"
                ? String(api.getCurrentUserID())
                : null;
        } catch (e) {
            return null;
        }
    }

    return async function ({ event }) {

        if (!event) return;
        if (!event.threadID) return;

        /*
         * শুধু নতুন message
         */
        if (
            event.type !== "message" &&
            event.type !== "message_reply"
        ) {
            return;
        }

        /*
         * নিজের message ignore
         */
        const botID = getBotID();

        if (
            botID &&
            event.senderID &&
            String(event.senderID) === botID
        ) {
            return;
        }

        /*
         * =========================
         * AUTO SEEN
         * =========================
         */
        try {
            if (typeof api.markAsRead === "function") {
                await api.markAsRead(event.threadID);
            }
        } catch (error) {
            console.error(
                "[SAKIB AUTO SEEN]",
                error.message
            );
        }

        /*
         * =========================
         * AUTO REACT
         * =========================
         */
        try {
            if (
                event.messageID &&
                typeof api.setMessageReaction === "function"
            ) {
                await api.setMessageReaction(
                    REACTION,
                    event.messageID,
                    () => {},
                    true
                );
            }
        } catch (error) {
            console.error(
                "[SAKIB AUTO REACT]",
                error.message
            );
        }
    };
};
