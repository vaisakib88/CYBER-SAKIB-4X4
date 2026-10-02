const express = require("express");
const axios = require("axios");
const sharp = require("sharp");

const app = express();

const PORT = process.env.PORT || 3000;

// ==========================================
// SAKIB HUG API
// ==========================================

const SERVICE_NAME = "SAKIB HUG API";


// ==========================================
// VALID UID
// ==========================================

function validUID(uid) {
  return /^\d{5,30}$/.test(String(uid || ""));
}


// ==========================================
// GET FACEBOOK PROFILE IMAGE (UPDATED)
// ==========================================

async function getProfileImage(uid) {
  const urls = [
    `https://graph.facebook.com/${encodeURIComponent(uid)}/picture?height=720&width=720&migration_overrides=%7Boctober_2012_classic%3Atrue%7D`,
    `https://graph.facebook.com/${encodeURIComponent(uid)}/picture?type=large`
  ];

  for (const url of urls) {
    try {
      const response = await axios.get(url, {
        responseType: "arraybuffer",
        timeout: 10000,
        maxRedirects: 5,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });

      if (response.data && response.data.byteLength > 1000) {
        return Buffer.from(response.data);
      }
    } catch (err) {
      // Ignore and try next
    }
  }

  // Fallback image if fetch fails
  return await sharp({
    create: {
      width: 720,
      height: 720,
      channels: 4,
      background: { r: 200, g: 200, b: 200, alpha: 1 }
    }
  }).png().toBuffer();
}


// ==========================================
// CREATE BACKGROUND
// ==========================================

function makeBackground() {
  return Buffer.from(`
<svg
  width="720"
  height="900"
  xmlns="http://www.w3.org/2000/svg"
>

  <defs>

    <linearGradient
      id="bg"
      x1="0"
      y1="0"
      x2="1"
      y2="1"
    >

      <stop
        offset="0%"
        stop-color="#ff8fb3"
      />

      <stop
        offset="50%"
        stop-color="#ffd1dc"
      />

      <stop
        offset="100%"
        stop-color="#ff6f91"
      />

    </linearGradient>

  </defs>


  <rect
    width="720"
    height="900"
    rx="42"
    fill="url(#bg)"
  />


  <circle
    cx="80"
    cy="120"
    r="25"
    fill="#fff"
    opacity=".65"
  />

  <circle
    cx="640"
    cy="130"
    r="18"
    fill="#fff"
    opacity=".6"
  />

  <circle
    cx="90"
    cy="760"
    r="16"
    fill="#fff"
    opacity=".5"
  />

  <circle
    cx="640"
    cy="760"
    r="26"
    fill="#fff"
    opacity=".5"
  />


  <text
    x="360"
    y="85"
    text-anchor="middle"
    font-family="Arial,sans-serif"
    font-size="46"
    font-weight="700"
    fill="#ffffff"
  >
    HUG ❤️
  </text>


  <text
    x="360"
    y="840"
    text-anchor="middle"
    font-family="Arial,sans-serif"
    font-size="28"
    font-weight="700"
    fill="#ffffff"
  >
    A warm hug for you 🫂
  </text>

</svg>
`);
}


// ==========================================
// AVATAR FRAME
// ==========================================

function makeOverlay() {
  return Buffer.from(`
<svg
  width="720"
  height="900"
  xmlns="http://www.w3.org/2000/svg"
>

  <circle
    cx="215"
    cy="355"
    r="112"
    fill="none"
    stroke="#ffffff"
    stroke-width="8"
  />

  <circle
    cx="505"
    cy="355"
    r="112"
    fill="none"
    stroke="#ffffff"
    stroke-width="8"
  />


  <text
    x="360"
    y="450"
    text-anchor="middle"
    font-family="Arial,sans-serif"
    font-size="65"
    font-weight="700"
    fill="#ffffff"
  >
    ❤️
  </text>

</svg>
`);
}


// ==========================================
// HOME
// ==========================================

app.get("/", (req, res) => {
  res.json({
    ok: true,
    name: SERVICE_NAME,
    status: "online",
    endpoint: "/hug?one=UID1&two=UID2"
  });
});


// ==========================================
// HEALTH
// ==========================================

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: SERVICE_NAME,
    status: "online"
  });
});


// ==========================================
// HUG
// ==========================================

app.get("/hug", async (req, res) => {
  const one = String(req.query.one || "").trim();
  const two = String(req.query.two || "").trim();

  console.log("");
  console.log("================================");
  console.log("        SAKIB HUG REQUEST");
  console.log("================================");
  console.log("ONE :", one);
  console.log("TWO :", two);

  if (!validUID(one) || !validUID(two)) {
    console.log("❌ Invalid UID");
    return res.status(400).json({
      ok: false,
      error: "Both one and two must be valid numeric Facebook user IDs."
    });
  }

  try {
    console.log("📥 Downloading profile images...");

    const [img1, img2] = await Promise.all([
      getProfileImage(one),
      getProfileImage(two)
    ]);

    console.log("✅ Profile images downloaded");

    const avatar1 = await sharp(img1)
      .resize(210, 210, {
        fit: "cover",
        position: "centre"
      })
      .png()
      .toBuffer();

    const avatar2 = await sharp(img2)
      .resize(210, 210, {
        fit: "cover",
        position: "centre"
      })
      .png()
      .toBuffer();

    console.log("🎨 Creating Hug image...");

    const card = await sharp(makeBackground())
      .composite([
        {
          input: avatar1,
          left: 110,
          top: 250
        },
        {
          input: avatar2,
          left: 400,
          top: 250
        }
      ])
      .png()
      .toBuffer();

    const finalImage = await sharp(card)
      .composite([
        {
          input: makeOverlay(),
          left: 0,
          top: 0
        }
      ])
      .png()
      .toBuffer();

    console.log("✅ Hug image created");

    res
      .status(200)
      .set({
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
        "Content-Length": String(finalImage.length)
      })
      .send(finalImage);

    console.log("📤 Hug image sent");

  } catch (error) {
    console.error("");
    console.error("❌ SAKIB HUG API ERROR");
    console.error(error.message);

    if (error.response && error.response.status) {
      console.error("Facebook HTTP:", error.response.status);
    }

    return res.status(502).json({
      ok: false,
      error: "Failed to create hug image.",
      details: error.response?.status
        ? `Profile image request returned HTTP ${error.response.status}.`
        : error.message
    });
  }
});


// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, "0.0.0.0", () => {
  console.log("");
  console.log("========================================");
  console.log("        SAKIB HUG API ONLINE");
  console.log("========================================");
  console.log(`PORT: ${PORT}`);
  console.log(`SERVICE: ${SERVICE_NAME}`);
  console.log("========================================");
});
