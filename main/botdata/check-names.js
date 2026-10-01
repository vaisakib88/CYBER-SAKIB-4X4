// main/botdata/check-names.js
const fs = require("fs");
const path = require("path");

// যেসব নাম অবশ্যই project-এ থাকতে হবে
const REQUIRED_NAMES = ["SAKIB", "Sakib", "sakib", "♕ 𝐒𝐀𝐊𝐈𝐁 ♕"];

// Default commands path
const COMMANDS_PATH = path.join(__dirname, "../../scripts/commands");

// সব JS ফাইল recursively পাওয়া
function getAllJsFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const ent of entries) {
    const fullPath = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      files = files.concat(getAllJsFiles(fullPath));
    } else if (ent.isFile() && fullPath.endsWith(".js")) {
      files.push(fullPath);
    }
  }
  return files;
}

// মূল চেক
try {
  if (!fs.existsSync(COMMANDS_PATH)) {
    console.error(`[CHECKNAME ERROR] commands path পাওয়া গেল না: "${COMMANDS_PATH}"`);
    process.exit(1);
  }

  const jsFiles = getAllJsFiles(COMMANDS_PATH);
  if (jsFiles.length === 0) {
    console.error(`[CHECKNAME ERROR] "${COMMANDS_PATH}" মধ্যে কোন .js ফাইল পাওয়া যায়নি।`);
    process.exit(1);
  }

  // প্রতিটি নাম project-wide check
  const missing = [];
  const foundIn = {};

  REQUIRED_NAMES.forEach(name => {
    const found = jsFiles.some(f => fs.readFileSync(f, "utf8").includes(name));
    if (!found) {
      missing.push(name);
    } else {
      foundIn[name] = jsFiles.filter(f => fs.readFileSync(f, "utf8").includes(name)).slice(0,5);
    }
  });

  if (missing.length > 0) {
    console.error("\n[CHECKNAME ERROR] নিম্নলিখিত নাম(গুলো) project-wide পাওয়া যায়নি বা পরিবর্তিত হয়েছে:");
    missing.forEach(n => console.error(` - ${n}`));
    console.error("এই কারণে build/run বন্ধ করা হচ্ছে।\n");
    process.exit(1);
  }

  console.log("\n[CHECKNAME] Name check passed — সব প্রয়োজনীয় নাম project-wide পাওয়া গেছে:");
  Object.keys(foundIn).forEach(name => {
    console.log(` * ${name} -> examples (${foundIn[name].length}):`);
    foundIn[name].forEach(f => console.log(`     - ${path.relative(process.cwd(), f)}`));
  });
  console.log("");

} catch (err) {
  console.error("\n[CHECKNAME EXCEPTION] ", err);
  process.exit(1);
}
