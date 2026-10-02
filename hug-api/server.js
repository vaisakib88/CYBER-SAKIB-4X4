const express = require("express");

const app = express();

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.json({
    ok: true,
    name: "SAKIB HUG API",
    status: "online"
  });
});

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "SAKIB HUG API",
    status: "online"
  });
});

app.get("/hug", (req, res) => {
  res.json({
    ok: true,
    message: "HUG API is working",
    one: req.query.one || null,
    two: req.query.two || null
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`SAKIB HUG API running on port ${PORT}`);
});
