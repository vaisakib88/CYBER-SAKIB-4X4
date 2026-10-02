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
// GET FACEBOOK PROFILE IMAGE (ULTIMATE FIX)
// ==========================================

async function getProfileImage(input) {
  let targetUrl = input;
  
  if (/^\d{5,30}$/.test(input)) {
    targetUrl = `https://graph.facebook.com/${input}/picture?height=720&width=720`;
  }

  const urls = [
    targetUrl,
    `https://graph.facebook.com/v13.0/${encodeURIComponent(input)}/picture?height=720&width=720`
  ];

  for (const url of urls) {
    try {
      const response = await axios.get(url, {
        responseType: "arraybuffer",
        timeout: 12000,
        maxRedirects: 5,
        headers: {
          "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1",
          "Accept": "image/*,*/*;q=0.8"
        }
      });

      if (response.data && response.data.byteLength > 1500) {
        return Buffer.from(response.data);
      }
    } catch (err) {
      // Try next
    }
  }

  // Fallback gray box if all fails
  return await sharp({
    create: {
      width: 720,
      height: 720,
      channels: 4,
      background: { r: 230, g: 230, b: 230, alpha: 1 }
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
    endpoint: "/hug?img1=URL1&img2=URL2"
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
  const img1Url = String(req.query.img1 || req.query.one || "").trim();
  const img2Url = String(req.query.img2 || req.query.two || "").trim();

  console.log("");
  console.log("================================");
  console.log("        SAKIB HUG REQUEST");
  console.log("================================");
  console.log("IMG 1:", img1Url);
  console.log("IMG 2:", img2Url);

  try {
    console.log("📥 Downloading profile images...");

    const [img1, img2] = await Promise.all([
      getProfileImage(img1Url),
      getProfileImage(img2Url)
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

    return res.status(502).json({
      ok: false,
      error: "Failed to create hug image.",
      details: error.message
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
