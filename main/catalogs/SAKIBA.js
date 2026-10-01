console.clear();

const { spawn } = require("child_process");
const express = require("express");
const app = express();
const chalk = require("chalk");
const logger = require("./SAKIBC.js");
const path = require("path");

const PORT = Number(process.env.PORT) || 8080;
let server = null;
let child = null;
let restartCount = 0;
let restarting = false;

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "website", "ryuko.html"));
});

function startWebServer() {
  if (server) return;

  server = app.listen(PORT, () => {
    logger.loader(`app deployed on port ${chalk.blueBright(PORT)}`);
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      logger(`port ${PORT} is already in use; keeping the existing process alive`, "error");
    } else {
      logger(`web server error: ${err.message}`, "error");
    }
  });
}

function startBot(message = "") {
  if (message) logger(message, "starting");

  console.log(chalk.blue("DEPLOYING MAIN SYSTEM"));
  logger.loader(`deploying app on port ${chalk.blueBright(PORT)}`);

  startWebServer();

  if (child && !child.killed) return;

  child = spawn(
    process.execPath,
    ["--trace-warnings", "--async-stack-traces", "SAKIBB.js"],
    {
      cwd: __dirname,
      stdio: "inherit",
      shell: false
    }
  );

  child.on("error", (error) => {
    logger(`child process error: ${error.message}`, "error");
  });

  child.on("close", (codeExit) => {
    child = null;

    if (codeExit === 0) {
      logger("SAKIB process stopped normally.", "system");
      return;
    }

    if (restarting) return;

    if (restartCount >= 5) {
      logger("SAKIB stopped after 5 restart attempts.", "error");
      return;
    }

    restartCount += 1;
    restarting = true;

    setTimeout(() => {
      restarting = false;
      logger(`restarting SAKIB (${restartCount}/5)...`, "starting");
      startBot();
    }, 3000);
  });
}

startBot();
