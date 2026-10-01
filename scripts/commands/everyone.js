module.exports.config = {
    name: "everyone",
    version: "1.0.0",
    permission: 0,
    credits: "Sakib Vai",
    description: "Mention each member individually with your custom text",
    prefix: true,
    category: "group",
    usages: "-@everyone আপনার মেসেজ",
    cooldowns: 5,
};

module.exports.run = async ({ api, event, args }) => {
    if (!event.isGroup) return api.sendMessage("এই কমান্ড শুধু গ্রুপে কাজ করবে!", event.threadID);

    const text = args.join(" ");
    if (!text) return api.sendMessage("দয়া করে লিখুন: -@everyone আপনার মেসেজ", event.threadID);

    const threadInfo = await api.getThreadInfo(event.threadID);

    for (let participant of threadInfo.participantIDs) {
        if (participant != api.getCurrentUserID()) {
            const name = threadInfo.userInfo.find(u => u.id === participant)?.name || "Member";
            const msg = {
                body: `@${name} ${text}`,
                mentions: [{ tag: name, id: participant }]
            };
            await new Promise(resolve => setTimeout(resolve, 1000)); // ১ সেকেন্ড বিরতি
            api.sendMessage(msg, event.threadID);
        }
    }
};
