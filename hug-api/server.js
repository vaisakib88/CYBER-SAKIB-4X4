const express = require("express");
const axios = require("axios");
const sharp = require("sharp");

const app = express();

const PORT = process.env.PORT || 3000;

// ==========================================
// SAKIB HUG API
// ==========================================

function validUID(uid) {
  return /^\d{5,30}$/.test(String(uid || ""));
}


// ==========================================
// GET FACEBOOK PROFILE IMAGE
// ==========================================

async function getProfileImage(uid) {

  const url =
    `https://graph.facebook.com/${encodeURIComponent(uid)}/picture` +
    `?type=large&width=720&height=720`;

  const response = await axios.get(url, {

    responseType: "arraybuffer",

    timeout: 15000,

    maxRedirects: 5,

    headers: {
      "User-Agent": "Mozilla/5.0 SAKIB-HUG-API"
    }

  });

  return Buffer.from(response.data);
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
    cy="100"
    r="22"
    fill="#fff"
    opacity=".65"
  />


  <circle
    cx="640"
    cy="130"
    r="16"
    fill="#fff"
    opacity=".6"
  />


  <circle
    cx="90"
    cy="760"
    r="14"
    fill="#fff"
    opacity=".5"
  />


  <circle
    cx="640"
    cy="760"
    r="24"
    fill="#fff"
    opacity=".5"
  />


  <text
    x="360"
    y="82"
    text-anchor="middle"
    font-family="Arial,sans-serif"
    font-size="42"
    font-weight="700"
    fill="#fff"
  >
    HUG ❤️
  </text>


  <text
    x="360"
    y="835"
    text-anchor="middle"
    font-family="Arial,sans-serif"
    font-size="30"
    font-weight="700"
    fill="#fff"
  >
    A warm hug for you
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

    name: "SAKIB HUG API",

    version: "1.0.0",

    endpoint: "/hug?one=UID1&two=UID2"

  });

});


// ==========================================
// HEALTH
// ==========================================

app.get("/health", (req, res) => {

  res.json({

    ok: true,

    service: "SAKIB HUG API",

    status: "online"

  });

});


// ==========================================
// HUG ENDPOINT
// ==========================================

app.get("/hug", async (req, res) => {

  const one = String(
    req.query.one || ""
  ).trim();


  const two = String(
    req.query.two || ""
  ).trim();


  // ========================================
  // UID VALIDATION
  // ========================================

  if (
    !validUID(one) ||
    !validUID(two)
  ) {

    return res.status(400).json({

      ok: false,

      error:
        "Both one and two must be valid numeric Facebook user IDs."

    });

  }


  try {

    console.log(
      `[HUG] Creating hug: ${one} + ${two}`
    );


    // ======================================
    // DOWNLOAD BOTH PROFILE IMAGES
    // ======================================

    const [
      img1,
      img2
    ] = await Promise.all([

      getProfileImage(one),

      getProfileImage(two)

    ]);


    // ======================================
    // RESIZE PROFILE IMAGE 1
    // ======================================

    const avatar1 = await sharp(img1)

      .resize(
        210,
        210,
        {
          fit: "cover"
        }
      )

      .png()

      .toBuffer();


    // ======================================
    // RESIZE PROFILE IMAGE 2
    // ======================================

    const avatar2 = await sharp(img2)

      .resize(
        210,
        210,
        {
          fit: "cover"
        }
      )

      .png()

      .toBuffer();


    // ======================================
    // CREATE BASE CARD
    // ======================================

    const card = await sharp(
      makeBackground()
    )

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


    // ======================================
    // ADD CIRCLES + HEART
    // ======================================

    const overlay = Buffer.from(`

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
    stroke="#fff"
    stroke-width="8"
  />


  <circle
    cx="505"
    cy="355"
    r="112"
    fill="none"
    stroke="#fff"
    stroke-width="8"
  />


  <text
    x="360"
    y="430"
    text-anchor="middle"
    font-family="Arial"
    font-size="68"
    font-weight="700"
    fill="#fff"
  >
    ❤️
  </text>

</svg>

`);


    // ======================================
    // FINAL IMAGE
    // ======================================

    const finalImage = await sharp(card)

      .composite([

        {
          input: overlay
        }

      ])

      .png()

      .toBuffer();


    // ======================================
    // SEND IMAGE
    // ======================================

    res.set(
      "Content-Type",
      "image/png"
    );


    res.set(
      "Cache-Control",
      "no-store"
    );


    return res.send(
      finalImage
    );


  } catch (error) {

    console.error(
      "[SAKIB HUG API ERROR]",
      error.message
    );


    return res.status(502).json({

      ok: false,

      error:
        "Failed to create hug image.",

      details:
        error.response?.status

          ? `Profile image request returned HTTP ${error.response.status}.`

          : error.message

    });

  }

});


// ==========================================
// START SERVER
// ==========================================

app.listen(
  PORT,
  () => {

    console.log(
      `SAKIB HUG API running on port ${PORT}`
    );

  }
);
