module.exports.config = {
	name: "leave",
	eventType: ["log:unsubscribe"],
	version: "1.0.0",
	credits: "SAKIB",
	description: "Notify when a member leaves or gets kicked from the group.",
};

module.exports.run = async function({ api, event, Users, Threads }) {

	try {

		if (
			event.logMessageData &&
			event.logMessageData.leftParticipantFbId == api.getCurrentUserID()
		) {
			return;
		}

		const { threadID } = event;

		/*
		 * Get thread data safely.
		 * Sometimes Threads.getData() may not return .data,
		 * so fallback to an empty object instead of crashing.
		 */
		let threadData = global.data.threadData.get(parseInt(threadID));

		if (!threadData) {
			try {
				const result = await Threads.getData(threadID);
				threadData = result && result.data ? result.data : {};
			} catch (error) {
				console.error(
					"[LEAVE] Failed to get thread data:",
					error.message
				);

				threadData = {};
			}
		}

		const userID =
			event.logMessageData &&
			event.logMessageData.leftParticipantFbId;

		if (!userID) {
			return;
		}

		const userName =
			global.data.userName.get(userID) ||
			await Users.getNameUser(userID);

		let boxName;

		try {
			boxName =
				global.data.threadInfo.get(threadID)?.threadName ||
				(await api.getThreadInfo(threadID)).threadName;
		} catch (error) {
			boxName = "এই গ্রুপ";
		}

		const kickerID = event.author;

		const kickerName =
			kickerID == userID
				? null
				: (
					global.data.userName.get(kickerID) ||
					await Users.getNameUser(kickerID)
				);

		let message;

		if (kickerID == userID) {

			// User left by themselves
			message =
				`🔺🎀 𝗚𝗢𝗢𝗗𝗕𝗬𝗘 🎀🔻\n\n` +
				`★ ${userName} ★\n\n` +
				`𝗟𝗲𝗳𝘁 𝗼𝘂𝗿 𝗚𝗿𝗼𝘂𝗽:\n` +
				`➤ ${boxName} ★\n\n` +
				`😥 𝗪𝗲 𝘄𝗶𝗹𝗹 𝗺𝗶𝘀𝘀 𝘆𝗼𝘂!\n` +
				`⚠ 𝗪𝗶𝘀𝗵𝗶𝗻𝗴 𝘆𝗼𝘂 𝗮 𝗴𝗼𝗼𝗱 𝗳𝘂𝘁𝘂𝗿𝗲!`;

		} else {

			// User was kicked by someone
			message =
				`🔺🎀 𝗞𝗜𝗖𝗞𝗘𝗗 🎀🔻\n\n` +
				`★ ${userName} ★\n\n` +
				`𝗛𝗮𝘀 𝗯𝗲𝗲𝗻 𝗸𝗶𝗰𝗸𝗲𝗱 𝗳𝗿𝗼𝗺:\n` +
				`➤ ${boxName} ★\n\n` +
				`👤 𝗞𝗶𝗰𝗸𝗲𝗱 𝗯𝘆: ${kickerName || "Unknown"}\n` +
				`⚠ 𝗣𝗹𝗲𝗮𝘀𝗲 𝗳𝗼𝗹𝗹𝗼𝘄 𝗴𝗿𝗼𝘂𝗽 𝗿𝘂𝗹𝗲𝘀!`;
		}

		/*
		 * Custom leave message
		 *
		 * threadData can now never be undefined here.
		 */
		if (
			threadData &&
			typeof threadData.customLeave !== "undefined" &&
			threadData.customLeave !== ""
		) {

			message = threadData.customLeave
				.replace(/\{name}/g, userName)
				.replace(
					/\{type}/g,
					(kickerID == userID)
						? "ingat sa byahe haha"
						: "ayan mateluk ka kase haha"
				)
				.replace(/\{boxName}/g, boxName)
				.replace(
					/\{kickerName}/g,
					kickerName || "Unknown"
				);
		}

		return api.sendMessage(
			{ body: message },
			threadID
		);

	} catch (error) {

		console.error(
			"[SAKIB LEAVE EVENT ERROR]",
			error
		);

		return;
	}
};
