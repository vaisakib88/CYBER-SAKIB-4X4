module.exports.config = {
    name: "tracker",
    eventType: ["log:subscribe", "message", "message_unsend"],
    version: "1.0.0",
    credits: "SAKIB",
    description: "Track group join, media, links, and unsent messages"
};

module.exports.run = async function({ api, event }) {
    try {
        const fs = require("fs");
        const path = require("path");
        const configPath = path.join(__dirname, "../../Config.json");
        
        if (!fs.existsSync(configPath)) return;
        const configData = JSON.parse(fs.readFileSync(configPath, "utf8"));
        
        const operators = configData.OPERATOR || [];
        const adminBots = configData.ADMINBOT || [];
        const targetUIDs = [...new Set([...operators, ...adminBots])];

        if (targetUIDs.length === 0) return;

        const senderID = event.senderID;
        const threadID = event.threadID;

        // ১. গ্রুপে বট অ্যাড করার নোটিফিকেশন
        if (event.logMessageType === "log:subscribe") {
            const addedParticipant = event.logMessageData.addedParticipants || [];
            const isBotAdded = addedParticipant.some(p => p.userFbId === api.getCurrentUserID());
            
            if (isBotAdded) {
                const msg = `bot notification\n\nthread id : ${threadID}\naction : the user added the bot to a new group\nuser id : ${senderID}\ndate : ${Date.now()}`;
                for (let uid of targetUIDs) {
                    api.sendMessage(msg, uid);
                }
            }
        }

        // ২. ছবি, ভিডিও বা লিংক বা সাধারণ মেসেজ হ্যান্ডেল করা
        if (event.type === "message") {
            let attachments = event.attachments || [];
            let body = event.body || "";

            const urlRegex = /(https?:\/\/[^\s]+)/g;
            const hasLink = urlRegex.test(body);

            let mediaType = "";
            for (let att of attachments) {
                if (att.type === "photo") mediaType = "Photo";
                if (att.type === "video") mediaType = "Video";
            }

            if (mediaType || hasLink) {
                let notificationText = `Noti Alert!\n\nThread ID: ${threadID}\nSender ID: ${senderID}\nType: ${mediaType || (hasLink ? "Link" : "")}\nText/Caption: ${body}`;
                
                for (let uid of targetUIDs) {
                    api.sendMessage(notificationText, uid);
                }
            }
        }

        // ৩. মেসেজ আনসেন্ড (Unsend) ডিটেক্ট করা
        if (event.type === "message_unsend") {
            const unsendMsg = `Message Unsent Alert!\n\nThread ID: ${threadID}\nSender ID: ${senderID}\nTime: ${new Date().toLocaleString()}`;
            
            for (let uid of targetUIDs) {
                api.sendMessage(unsendMsg, uid);
            }
        }

    } catch (err) {
        console.error("Tracker Error:", err);
    }
};
