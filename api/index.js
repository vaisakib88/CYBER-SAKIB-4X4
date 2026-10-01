const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Cute/funny replies
const replies = [
  "I love you 💝",
  "এ বেডা তোগো GC এর C E O শাকিব কই😌",
  "Bot না জানু,বল 😌",
  "বলো জানু 🌚",
  "তোর কি চোখে পড়ে না আমি শাকিব বস এর সাথে ব্যাস্ত আসি😒",
  "amr Jan lagbe,Tumi ki single aso?",
  "bye", "মেও", "বলো কি বলবা, সবার সামনে বলবা নাকি?🤭🤏"
];

// API endpoint
app.get("/shakibbot", (req, res) => {
  const text = req.query.text?.toLowerCase() || "";

  let reply = replies[Math.floor(Math.random() * replies.length)];

  // Trigger keywords
  if (text.includes("তুমি কে")) reply = "আমি শাকিব ভাই এর বট 💖";
  else if (text.includes("ভালোবাসি")) reply = "আমিও তোমায় ভালোবাসি 😚";
  else if (text.includes("খবর")) reply = "বস শাকিব ভালো আছেন 😎";

  res.json({ reply });
});

app.listen(PORT, () => console.log(`✅ Shakib API running on port ${PORT}`));
