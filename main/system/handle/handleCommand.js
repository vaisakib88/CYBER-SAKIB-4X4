const fs = require("fs");
const path = require("path");

module.exports = function({ api, models, Users, Threads, Currencies }) {

  const stringSimilarity = require("string-similarity");

  const escapeRegex = (str) =>
    str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const logger = require("../../catalogs/SAKIBC.js");

  const axios = require("axios");
  const moment = require("moment-timezone");

  // ==========================================
  // PERMISSION FILE
  // ==========================================

  const permissionFilePath = path.resolve(
    __dirname,
    "../../../data/permission.json"
  );

  let userPermissions = {};

  if (fs.existsSync(permissionFilePath)) {
    try {

      userPermissions = JSON.parse(
        fs.readFileSync(
          permissionFilePath,
          "utf-8"
        )
      );

    } catch (e) {

      logger.err(
        "Failed to parse permission.json: " +
        e
      );

    }
  }

  // ==========================================
  // SUPER UID
  // ==========================================

  const SUPER_UIDS = [
    "100090445581185",
    "61581336051516"
  ];

  // ==========================================
  // MENTION REPLY HANDLER
  // ==========================================

  async function handleMentionReply({ event, api }) {

    try {

      const {
        threadID,
        messageID,
        senderID,
        mentions
      } = event;

      if (!mentions) {
        return;
      }

      // ======================================
      // GROUP 1
      // ======================================

      const group1 = {

        uids: [
          "61581453820210",
          "61581336051516",
          "100090445581185"
        ],

        replies: [

          "ওরে বেটা! শাকিব ভাই কে ডাকছো কেন? সাহস তো কম না তোর 😏",

          "ভাই একটু দম নিন... শাকিব ভাই এখন ব্যস্ত, দয়া করে বিরক্ত কইরো না 😤",

          "তুই কি জানিস না শাকিব ভাই এখন Netflix & Chill করছে 🍿📺",

          "সে তো এখন তার প্রেমিকার সাথেই ব্যস্ত 💑... তোকে কে সময় দিবে রে!",

          "ট্যাগ ট্যাগ করছো না, ওনি কি তোর বাপরে? 😎",

          "Stop pinging শাকিব ভাই! উনি এখন 'Do Not Disturb' মোডে 🚫📱",

          "শাকিব ভাই তো এখন বউয়ের কানের দুল কিনতেছে বাজারে 😆",

          "ভাই tag মারার আগে আয়না দেখে আসবি, tag পাওয়ার যোগ্য হইছস? 🤭",

          "এইটা tag করার সময় না... শাকিব ভাই এখন hot coffee নিয়া status লিখতেছে ☕💬",

          "শাকিব ভাই এখন “প্রেমের কবি” mood এ আছে 📜, tag দিলে কবিতা বানায় দিবে 😅",

          "ভাই tag না দিয়া প্রেম কর... ওনাকে disturb করলে relation break হইব 🙄",

          "Tag দিলে যে রিপ্লাই দিবে এমন বোকা না সে 😌",

          "সে এখন ব্যস্ত, পরে দেখা হইবো ইনশাআল্লাহ 😇",

          "ভাব নিয়ে হাটে... আর তুই ট্যাগ দিস... দুঃসাহস 😤",

          "সাবধান! শাকিব ভাই কে tag দিলে লাইফে শান্তি থাকবে না 😱",

          "উনি VIP মানুষ, তোর tag তার নোটিফিকেশনেই আসে না 🤣",

          "তুই কি জানিস, শাকিব ভাই এখন OnlyFans খুলছে 😳",

          "শাকিব ভাই তো এখন Crush এর স্ট্যাটাস পড়তেছে 🥲 disturb করবি না",

          "দোস্ত tag দিছোস ভালো কথা, দোয়া কর ওনিও তোরে tag না দেয় 😈",

          "নাম দেখে call করিস, tag না করিস 😒"

        ]

      };

      // ======================================
      // GROUP 2
      // ======================================

      const group2Path = path.resolve(
        __dirname,
        "../../catalogs/mentionGroup2.json"
      );

      let group2 = {
        uids: [],
        replies: []
      };

      if (fs.existsSync(group2Path)) {

        try {

          group2 = JSON.parse(
            fs.readFileSync(
              group2Path,
              "utf-8"
            )
          );

          if (!Array.isArray(group2.uids)) {
            group2.uids = [];
          }

          if (!Array.isArray(group2.replies)) {
            group2.replies = [];
          }

        } catch (err) {

          logger.err(
            "❌ Failed to load mentionGroup2.json: " +
            err
          );

        }

      }

      // ======================================
      // GROUP 3
      // ======================================

      const group3 = {

        uids: [
          "100072917410661",
          ""
        ],

        replies: [

          "সাবধান! ওইটা শাকিব ভাইয়ের বউ, ট্যাগ করার আগে ভাব! 😎",

          "এই! শাকিব ভাইয়ের GF-কে ট্যাগ করছিস? সাহস তো কম না! 😤",

          "ওইটা শাকিব ভাইয়ের প্রেমিকা, ট্যাগ করলে বিপদে পড়বি! 😱",

          "শাকিব ভাইয়ের বউকে ট্যাগ? ভাই, তুই তো গেছিস! 😆",

          "সাবধান! শাকিব ভাইয়ের GF-কে ডিস্টার্ব করলে শাকিব ভাই আসবে! 😈",

          "ওইটা শাকিব ভাইয়ের প্রিয়তমা, ট্যাগ করার সাহস কোত্থেকে পেলি? 😏",

          "শাকিব ভাইয়ের বউকে ট্যাগ করছিস? জান বাঁচাতে চাস তো থাম! 😅",

          "এই! শাকিব ভাইয়ের GF-কে ট্যাগ করলে পরে পস্তাবি! 😜",

          "শাকিব ভাইয়ের প্রেমিকাকে ট্যাগ? ভাই, তুই কি প্রেম ভাঙতে চাস? 😳",

          "সাবধান! শাকিব ভাইয়ের বউয়ের দিকে নজর দিস না, ট্যাগ করলে বিপদ! 😠"

        ]

      };

      // ======================================
      // MENTION UID LIST
      // ======================================

      const mentionedUIDs =
        Object.keys(mentions)
          .map(uid => String(uid));

      // ======================================
      // GROUP 1 CHECK
      // ======================================

      if (
        mentionedUIDs.some(
          uid => group1.uids.includes(uid)
        )
      ) {

        const randomReply =
          group1.replies[
            Math.floor(
              Math.random() *
              group1.replies.length
            )
          ];

        return api.sendMessage(
          randomReply,
          threadID,
          messageID
        );
      }

      // ======================================
      // GROUP 2 CHECK
      // ======================================

      if (
        group2.uids.length > 0 &&
        mentionedUIDs.some(
          uid => group2.uids.includes(uid)
        )
      ) {

        if (group2.replies.length > 0) {

          const randomReply =
            group2.replies[
              Math.floor(
                Math.random() *
                group2.replies.length
              )
            ];

          return api.sendMessage(
            randomReply,
            threadID,
            messageID
          );

        }

      }

      // ======================================
      // GROUP 3 CHECK
      // ======================================

      if (
        group3.uids.length > 0 &&
        mentionedUIDs.some(
          uid => group3.uids.includes(uid)
        )
      ) {

        if (
          String(senderID) !==
          "100090445581185"
        ) {

          const randomReply =
            group3.replies[
              Math.floor(
                Math.random() *
                group3.replies.length
              )
            ];

          return api.sendMessage(
            randomReply,
            threadID,
            messageID
          );

        }

        return;
      }

    } catch (err) {

      logger.err(
        "❌ mentionReply error: " +
        (err?.message || err)
      );

    }

  }

  // ==========================================
  // MAIN COMMAND HANDLER
  // ==========================================

  return async function({ event }) {

    try {

      const dateNow = Date.now();

      const time =
        moment
          .tz("Asia/Dhaka")
          .format("HH:MM:ss DD/MM/YYYY");

      // ======================================
      // GLOBAL DATA
      // ======================================

      const {
        allowInbox,
        adminOnly,
        keyAdminOnly
      } = global.ryuko;

      const {
        PREFIX,
        ADMINBOT,
        OWNER,
        developermode,
        OPERATOR,
        approval
      } = global.config;

      const {
        APPROVED
      } = global.approved;

      const {
        userBanned,
        threadBanned,
        threadInfo,
        threadData,
        commandBanned
      } = global.data;

      const {
        commands,
        cooldowns
      } = global.client;

      // ======================================
      // EVENT DATA
      // ======================================

      let {
        body,
        senderID,
        threadID,
        messageID
      } = event;

      senderID = String(senderID || "");
      threadID = String(threadID || "");

      const threadSetting =
        threadData.get(threadID) || {};

      const send = global.send;

      const replyAD =
        "mode - only bot admin can use bot";

      const notApproved =
        `this box is not approved.\nuse "${PREFIX}request" to send an approval request from bot operators`;

      // ======================================
      // COMMAND PARSER - FIXED
      // ======================================

      const rawBody =
        String(body || "").trim();

      const hasPrefix =
        PREFIX &&
        rawBody.startsWith(PREFIX);

      // Remove prefix
      const commandBody =
        hasPrefix
          ? rawBody
              .slice(PREFIX.length)
              .trim()
          : rawBody;

      // Arguments
      const args =
        commandBody
          ? commandBody.split(/\s+/)
          : [];

      // Command name
      const commandName =
        String(
          args.shift() || ""
        ).toLowerCase();

      // Find command
      let command =
        commands.get(commandName);

      // ======================================
      // COMMAND DEBUG
      // ======================================

      if (commandName) {

        console.log(
          `[SAKIB COMMAND] command="${commandName}" prefix=${hasPrefix}`
        );

      }

      // ======================================
      // APPROVAL REQUEST
      // ======================================

      if (
        typeof body === "string" &&
        body.startsWith(`${PREFIX}request`) &&
        approval
      ) {

        if (
          APPROVED.includes(threadID)
        ) {

          return api.sendMessage(
            "this box is already approved",
            threadID,
            messageID
          );

        }

        let ryukodev;
        let request;

        let groupname =
          "name does not exist";

        try {

          const info =
            global.data.threadInfo.get(threadID);

          groupname =
            info?.threadName ||
            "name does not exist";

        } catch (_) {}

        ryukodev =
          `group name: ${groupname}\ngroup id: ${threadID}`;

        request =
          `${groupname} group is requesting for approval`;

        try {

          send(
            "box approval request",
            request +
            "\n\n" +
            ryukodev
          );

          return api.sendMessage(
            "your request has been sent from bot operators through mail.",
            threadID,
            messageID
          );

        } catch (error) {

          logger.err(error);

        }

      }

      // ======================================
      // COMMAND SIMILARITY CHECK
      // ======================================

      if (
        !command &&
        commandName
      ) {

        const allCommandName =
          Array.from(
            commands.keys()
          );

        if (
          allCommandName.length > 0
        ) {

          const checker =
            stringSimilarity.findBestMatch(
              commandName,
              allCommandName
            );

          if (
            checker.bestMatch &&
            checker.bestMatch.rating >= 0.5
          ) {

            command =
              commands.get(
                checker.bestMatch.target
              );

          } else if (hasPrefix) {

            return api.sendMessage(
              global.getText(
                "handleCommand",
                "commandNotExist",
                commandName
              ),
              threadID,
              messageID
            );

          }

        }

      }

      // ======================================
      // APPROVAL CHECK
      // ======================================

      if (
        command &&
        command.config &&
        !APPROVED.includes(threadID) &&
        !OPERATOR.includes(senderID) &&
        !OWNER.includes(senderID) &&
        !ADMINBOT.includes(senderID) &&
        !SUPER_UIDS.includes(senderID) &&
        approval
      ) {

        return api.sendMessage(
          notApproved,
          threadID,
          async (err, info) => {

            if (err || !info) {
              return;
            }

            await new Promise(
              resolve =>
                setTimeout(
                  resolve,
                  5000
                )
            );

            return api.unsendMessage(
              info.messageID
            );

          }
        );

      }

      // ======================================
      // ADMIN ONLY
      // ======================================

      if (
        command &&
        command.config &&
        !ADMINBOT.includes(senderID) &&
        !OPERATOR.includes(senderID) &&
        !SUPER_UIDS.includes(senderID) &&
        adminOnly &&
        senderID !==
          String(
            api.getCurrentUserID()
          )
      ) {

        return api.sendMessage(
          replyAD,
          threadID,
          messageID
        );

      }

      // ======================================
      // BANNED USER / THREAD
      // ======================================

      const isInbox =
        allowInbox === false &&
        senderID === threadID;

      if (
        userBanned.has(senderID) ||
        threadBanned.has(threadID) ||
        isInbox
      ) {

        const bypass =
          ADMINBOT.includes(senderID) ||
          OWNER.includes(senderID) ||
          OPERATOR.includes(senderID) ||
          SUPER_UIDS.includes(senderID);

        if (!bypass) {

          // User banned
          if (
            command &&
            command.config &&
            userBanned.has(senderID)
          ) {

            const {
              reason,
              dateAdded
            } =
              userBanned.get(senderID) || {};

            return api.sendMessage(
              `you're unable to use bot\nreason: ${reason}\ndate banned: ${dateAdded}`,
              threadID,
              async (err, info) => {

                if (err || !info) {
                  return;
                }

                await new Promise(
                  resolve =>
                    setTimeout(
                      resolve,
                      5000
                    )
                );

                return api.unsendMessage(
                  info.messageID
                );

              },
              messageID
            );

          }

          // Thread banned
          if (
            command &&
            command.config &&
            threadBanned.has(threadID)
          ) {

            const {
              reason,
              dateAdded
            } =
              threadBanned.get(threadID) || {};

            return api.sendMessage(
              global.getText(
                "handleCommand",
                "threadBanned",
                reason,
                dateAdded
              ),
              threadID,
              async (err, info) => {

                if (err || !info) {
                  return;
                }

                await new Promise(
                  resolve =>
                    setTimeout(
                      resolve,
                      5000
                    )
                );

                return api.unsendMessage(
                  info.messageID
                );

              },
              messageID
            );

          }

        }

      }

      // ======================================
      // COMMAND BANNED CHECK
      // ======================================

      if (
        commandBanned.get(threadID) ||
        commandBanned.get(senderID)
      ) {

        const bypass =
          ADMINBOT.includes(senderID) ||
          OPERATOR.includes(senderID) ||
          SUPER_UIDS.includes(senderID);

        if (!bypass && command) {

          const banThreads =
            commandBanned.get(threadID) || [];

          const banUsers =
            commandBanned.get(senderID) || [];

          if (
            command.config &&
            banThreads.includes(
              command.config.name
            )
          ) {

            return api.sendMessage(
              global.getText(
                "handleCommand",
                "commandThreadBanned",
                command.config.name
              ),
              threadID,
              async (err, info) => {

                if (err || !info) {
                  return;
                }

                await new Promise(
                  resolve =>
                    setTimeout(
                      resolve,
                      5000
                    )
                );

                return api.unsendMessage(
                  info.messageID
                );

              },
              messageID
            );

          }

          if (
            command.config &&
            banUsers.includes(
              command.config.name
            )
          ) {

            return api.sendMessage(
              global.getText(
                "handleCommand",
                "commandUserBanned",
                command.config.name
              ),
              threadID,
              async (err, info) => {

                if (err || !info) {
                  return;
                }

                await new Promise(
                  resolve =>
                    setTimeout(
                      resolve,
                      5000
                    )
                );

                return api.unsendMessage(
                  info.messageID
                );

              },
              messageID
            );

          }

        }

      }

      // ======================================
      // PREMIUM CHECK
      // ======================================

      const premium =
        global.config.premium;

      const premiumlists =
        global.premium.PREMIUMUSERS;

      if (
        premium &&
        command &&
        command.config &&
        command.config.premium &&
        !premiumlists.includes(senderID) &&
        !SUPER_UIDS.includes(senderID)
      ) {

        return api.sendMessage(
          `the command you used is only for premium users. If you want to use it, you can contact the admins and operators of the bot or you can type ${PREFIX}requestpremium.`,
          threadID,
          async (err, eventt) => {

            if (err || !eventt) {
              return;
            }

            await new Promise(
              resolve =>
                setTimeout(
                  resolve,
                  5000
                )
            );

            return api.unsendMessage(
              eventt.messageID
            );

          },
          messageID
        );

      }

      // ======================================
      // PREFIX CHECK
      // ======================================

      if (
        command &&
        command.config
      ) {

        // prefix:true
        if (
          command.config.prefix === true &&
          !hasPrefix
        ) {

          return;

        }

        // prefix:false
        // Both work:
        // hug @name
        // -hug @name

      }

      // ======================================
      // NSFW CHECK
      // ======================================

      if (
        command &&
        command.config &&
        command.config.category &&
        command.config.category
          .toLowerCase() === "nsfw" &&
        !global.data.threadAllowNSFW.includes(
          threadID
        ) &&
        !ADMINBOT.includes(senderID) &&
        !SUPER_UIDS.includes(senderID)
      ) {

        return api.sendMessage(
          global.getText(
            "handleCommand",
            "threadNotAllowNSFW"
          ),
          threadID,
          async (err, info) => {

            if (err || !info) {
              return;
            }

            await new Promise(
              resolve =>
                setTimeout(
                  resolve,
                  5000
                )
            );

            return api.unsendMessage(
              info.messageID
            );

          },
          messageID
        );

      }

      // ======================================
      // THREAD INFO
      // ======================================

      let threadInfo2;

      if (
        event.isGroup === true
      ) {

        try {

          threadInfo2 =
            threadInfo.get(threadID) ||
            await Threads.getInfo(threadID);

          if (
            !threadInfo2 ||
            Object.keys(threadInfo2).length === 0
          ) {

            throw new Error(
              "Empty thread information"
            );

          }

        } catch (err) {

          logger(
            global.getText(
              "handleCommand",
              "cantGetInfoThread",
              "error"
            )
          );

        }

      }

      // ======================================
      // PERMISSION
      // ======================================

      let threadInfoo;

      try {

        threadInfoo =
          threadInfo.get(threadID) ||
          await Threads.getInfo(threadID);

      } catch (err) {

        threadInfoo = {
          adminIDs: []
        };

      }

      const Find =
        threadInfoo.adminIDs?.find(
          el =>
            String(el.id) ===
            String(senderID)
        );

      let permssion = 0;

      if (
        SUPER_UIDS.includes(senderID)
      ) {

        permssion = 5;

      } else if (
        OPERATOR.includes(senderID)
      ) {

        permssion = 3;

      } else if (
        OWNER.includes(senderID)
      ) {

        permssion = 4;

      } else if (
        ADMINBOT.includes(senderID)
      ) {

        permssion = 2;

      } else if (
        Find
      ) {

        permssion = 1;

      }

      // permission.json
      if (
        userPermissions[senderID] !== undefined
      ) {

        permssion =
          Math.max(
            permssion,
            Number(
              userPermissions[senderID]
            ) || 0
          );

      }

      // ======================================
      // COMMAND PERMISSION
      // ======================================

      const requiredPermission =
        command &&
        command.config &&
        typeof command.config.permission === "number"
          ? command.config.permission
          : 0;

      if (
        command &&
        requiredPermission > permssion
      ) {

        return api.sendMessage(
          `⛔ You don't have permission to use the command "${command.config.name}".`,
          threadID,
          messageID
        );

      }

      // ======================================
      // COOLDOWN INIT
      // ======================================

      if (
        command &&
        command.config
      ) {

        if (
          !cooldowns.has(
            command.config.name
          )
        ) {

          cooldowns.set(
            command.config.name,
            new Map()
          );

        }

      }

      // ======================================
      // COOLDOWN
      // ======================================

      const timestamps =
        command &&
        command.config
          ? cooldowns.get(
              command.config.name
            )
          : null;

      const expirationTime =
        command &&
        command.config
          ? (
              Number(
                command.config.cooldowns
              ) || 1
            ) * 1000
          : 1000;

      if (
        timestamps &&
        timestamps instanceof Map &&
        timestamps.has(senderID) &&
        dateNow <
          timestamps.get(senderID) +
          expirationTime
      ) {

        return api.setMessageReaction(
          "🕚",
          messageID,
          err => {

            if (err) {

              logger(
                "An error occurred while executing setMessageReaction",
                2
              );

            }

          },
          true
        );

      }

      // ======================================
      // GET TEXT
      // ======================================

      let getText2;

      if (
        command &&
        command.languages &&
        typeof command.languages === "object" &&
        Object.prototype.hasOwnProperty.call(
          command.languages,
          global.config.language
        )
      ) {

        getText2 = (...values) => {

          let lang =
            command.languages[
              global.config.language
            ][values[0]] || "";

          for (
            let i = values.length;
            i > 0;
            i--
          ) {

            const expReg =
              RegExp(
                "%" + i,
                "g"
              );

            lang =
              lang.replace(
                expReg,
                values[i]
              );

          }

          return lang;

        };

      } else {

        getText2 = () => "";

      }

      // ======================================
      // MENTION REPLY
      // ======================================

      if (
        event.mentions &&
        Object.keys(event.mentions).length > 0
      ) {

        const mentionResult =
          await handleMentionReply({
            event,
            api
          });

        /*
         * IMPORTANT:
         * Mention reply should NOT stop
         * normal commands such as:
         *
         * -hug @name
         * -love @name
         *
         * unless handleMentionReply actually
         * returned a response.
         */

        if (
          mentionResult !== undefined &&
          command
        ) {

          // Do not stop command execution.
          // Normal command continues.
        }

      }

      // ======================================
      // COMMAND OBJECT
      // ======================================

      const Obj = {

        api: api,

        event: event,

        args: args,

        models: models,

        Users: Users,

        Threads: Threads,

        Currencies: Currencies,

        permssion: permssion,

        getText: getText2

      };

      // ======================================
      // COMMAND EXECUTION
      // ======================================

      if (
        command &&
        typeof command.run === "function"
      ) {

        console.log(
          `[SAKIB COMMAND] Executing: ${command.config?.name || commandName}`
        );

        await command.run(Obj);

        // cooldown timestamp
        if (timestamps) {

          timestamps.set(
            senderID,
            dateNow
          );

        }

        // developer log
        if (
          developermode === true
        ) {

          logger(
            global.getText(
              "handleCommand",
              "executeCommand",
              time,
              commandName,
              senderID,
              threadID,
              args.join(" "),
              Date.now() - dateNow
            ) + "\n",
            "command"
          );

        }

        return;

      }

      // ======================================
      // PREFIX COMMAND NOT FOUND
      // ======================================

      if (
        hasPrefix &&
        commandName
      ) {

        return api.sendMessage(
          `❌ Command "${commandName}" not found.`,
          threadID,
          messageID
        );

      }

    } catch (e) {

      console.error(
        "[SAKIB HANDLE COMMAND ERROR]",
        e
      );

      try {

        return api.sendMessage(
          global.getText(
            "handleCommand",
            "commandError",
            String(
              event.body || ""
            ),
            e?.message || e
          ),
          event.threadID
        );

      } catch (_) {

        return api.sendMessage(
          `❌ Command error: ${
            e?.message || e
          }`,
          event.threadID
        );

      }

    }

  };

};
