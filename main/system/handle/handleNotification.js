module.exports = function ({ api }) {
    const moment = require("moment");
    const botID = api.getCurrentUserID();
    const form = {
        av: botID,
        fb_api_req_friendly_name: "CometNotificationsDropdownQuery",
        fb_api_caller_class: "RelayModern",
        doc_id: "5025284284225032",
        variables: JSON.stringify({
            count: 5,
            environment: "MAIN_SURFACE",
            menuUseEntryPoint: true,
            scale: 1
        })
    };

    try {
        api.httpPost("https://www.facebook.com/api/graphql/", form, (e, i) => {
            try {
                if (e) {
                    console.error("[Notification] Facebook request error:", e);
                    return;
                }

                if (!i) return;

                const response = typeof i === "string" ? JSON.parse(i) : i;
                const data = response?.data?.viewer;
                const edges = data?.notifications_page?.edges;

                if (!Array.isArray(edges)) return;

                const operator = global.config?.OPERATOR?.[0];
                if (!operator) return;

                const getMinutesOfTime = (d1, d2) => {
                    const diff = d2.getTime() - d1.getTime();
                    return Math.ceil(diff / (60 * 1000));
                };

                for (const item of edges) {
                    if (item?.node?.row_type !== "NOTIFICATION") continue;

                    const notif = item?.node?.notif;
                    const timestamp = notif?.creation_time?.timestamp;
                    if (!timestamp) continue;

                    if (getMinutesOfTime(new Date(Number(timestamp) * 1000), new Date()) <= 1) {
                        const body = notif?.body?.text || "";
                        const link = notif?.url || "";
                        const time = moment.tz("Asia/Manila").format("HH:mm:ss DD/MM/YYYY");

                        const msg =
                            "notification\n" +
                            `\ntime : ${time}` +
                            `\nmessage : ${body}` +
                            `\n\nlink : ${link}`;

                        api.sendMessage(msg, operator);
                    }
                }
            } catch (err) {
                console.error("[Notification] Parse/handler error:", err);
            }
        });
    } catch (err) {
        console.error("[Notification] Request error:", err);
    }
};
