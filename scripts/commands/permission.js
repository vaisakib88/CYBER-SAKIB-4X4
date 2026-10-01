const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "permission",
  version: "1.0.0",
  permission: 3,
  description: "Assign permission level to a user",
  prefix: true,
  category: "Admin",
  usages: "-permission1 <uid> | -permission2 <uid>",
  cooldowns: 5
};

module.exports.run = async function({ api, event }) {
  const permissionFilePath = path.resolve(__dirname, "../../../data/permission.json");

  // ensure data folder exists
  const dataDir = path.dirname(permissionFilePath);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  // load existing permissions safely
  let userPermissions = {};
  if (fs.existsSync(permissionFilePath)) {
    try {
      const fileContent = fs.readFileSync(permissionFilePath, "utf-8").trim();
      if (fileContent) userPermissions = JSON.parse(fileContent);
    } catch (e) {
      console.error("Failed to parse permission.json: " + e);
    }
  }

  const { body, threadID } = event;
  const parts = body.trim().split(/\s+/);
  const commandName = parts[0].toLowerCase();
  const targetUID = parts[1];

  if (!targetUID) return api.sendMessage("Usage: -permission1 <uid> or -permission2 <uid>", threadID);
  if (!/^\d+$/.test(targetUID)) return api.sendMessage("Invalid UID. Only numbers allowed.", threadID);

  let level = 0;
  if (commandName === "-permission1") level = 1;
  else if (commandName === "-permission2") level = 2;
  else return api.sendMessage("Invalid command. Use -permission1 or -permission2", threadID);

  // assign permission
  userPermissions[targetUID] = level;

  try {
    fs.writeFileSync(permissionFilePath, JSON.stringify(userPermissions, null, 2), "utf-8");
    return api.sendMessage(`✅ UID ${targetUID} has been granted permission level ${level}`, threadID);
  } catch (err) {
    console.error(err);
    return api.sendMessage("❌ Failed to update permission.json. Check file permissions.", threadID);
  }
};
