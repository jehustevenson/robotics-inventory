// server/index.js
// ─────────────────────────────────────────────────────────────
//  Express proxy server for RoboLend
//  Forwards requests to Google Apps Script, bypassing CORS
//  because this runs server-side (no browser restrictions)
// ─────────────────────────────────────────────────────────────
require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const fetch   = require("node-fetch");

const app  = express();
const PORT = process.env.PORT || 3001;
const SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;

if (!SCRIPT_URL) {
  console.error("❌  GOOGLE_SCRIPT_URL is not set in server/.env");
  process.exit(1);
}

// ── Middleware ────────────────────────────────────────────────
app.use(cors({
  origin: [
    "http://localhost:4028",
    "http://localhost:3000",
    /\.builtwithrocket\.new$/,
    /\.amazonaws\.com$/,
  ],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
}));

app.use(express.json());

// ── Health check ──────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", scriptUrl: SCRIPT_URL ? "set" : "missing" });
});

// ── GET proxy ─────────────────────────────────────────────────
// e.g. GET /api/sheets?action=getDashboard
app.get("/api/sheets", async (req, res) => {
  try {
    const qs  = new URLSearchParams(req.query).toString();
    const url = `${SCRIPT_URL}?${qs}`;
    console.log(`[GET] → ${url}`);

    const response = await fetch(url, {
      method:   "GET",
      redirect: "follow",
      headers: {
        "User-Agent": "RoboLend-Server/1.0",
      },
    });

    const text = await response.text();
    console.log(`[GET] ← ${response.status} | ${text.slice(0, 120)}`);

    // Try to parse as JSON, forward as-is if not
    try {
      const json = JSON.parse(text);
      return res.json(json);
    } catch {
      return res.status(502).json({
        status: "error",
        message: `Apps Script returned non-JSON: ${text.slice(0, 300)}`,
      });
    }
  } catch (err) {
    console.error("[GET] error:", err.message);
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ── POST proxy ────────────────────────────────────────────────
// e.g. POST /api/sheets  { action: "addItem", ... }
app.post("/api/sheets", async (req, res) => {
  try {
    console.log(`[POST] → ${SCRIPT_URL}`, req.body);

    const response = await fetch(SCRIPT_URL, {
      method:  "POST",
      redirect: "follow",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
        "User-Agent":   "RoboLend-Server/1.0",
      },
      body: JSON.stringify(req.body),
    });

    const text = await response.text();
    console.log(`[POST] ← ${response.status} | ${text.slice(0, 120)}`);

    try {
      const json = JSON.parse(text);
      return res.json(json);
    } catch {
      return res.status(502).json({
        status: "error",
        message: `Apps Script returned non-JSON: ${text.slice(0, 300)}`,
      });
    }
  } catch (err) {
    console.error("[POST] error:", err.message);
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅  RoboLend proxy server running on http://localhost:${PORT}`);
  console.log(`    Forwarding /api/sheets → ${SCRIPT_URL}`);
});