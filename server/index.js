// server/index.js
require("dotenv").config();
const express  = require("express");
const cors     = require("cors");
const fetch    = require("node-fetch");
const bcrypt   = require("bcryptjs");
const jwt      = require("jsonwebtoken");

const app  = express();
const PORT = process.env.PORT || 3001;
const SCRIPT_URL  = process.env.GOOGLE_SCRIPT_URL;
const JWT_SECRET  = process.env.JWT_SECRET;
const INACTIVITY_MINUTES = Number(process.env.INACTIVITY_MINUTES || 30);

if (!SCRIPT_URL)   { console.error("❌  GOOGLE_SCRIPT_URL is not set in server/.env"); process.exit(1); }
if (!JWT_SECRET)   { console.error("❌  JWT_SECRET is not set in server/.env");         process.exit(1); }

// Parse users from env
let USERS = [];
try {
  USERS = JSON.parse(process.env.USERS || "[]");
} catch (e) {
  console.error("❌  Could not parse USERS from server/.env. Must be valid JSON.");
  process.exit(1);
}

// ── Middleware ────────────────────────────────────────────────
app.use(cors({
  origin: [
    "http://localhost:4028",
    "http://localhost:3000",
    "http://robotics.local",
    /\.builtwithrocket\.new$/,
    /\.amazonaws\.com$/,
  ],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

// ── JWT Auth Middleware ───────────────────────────────────────
function requireAuth(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ status: "error", message: "No token provided." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ status: "error", message: "Invalid or expired token." });
  }
}

// ── Admin-only middleware ─────────────────────────────────────
function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ status: "error", message: "Admin access required." });
  }
  next();
}

// ── Health check ──────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", scriptUrl: SCRIPT_URL ? "set" : "missing" });
});

// ── Login endpoint ────────────────────────────────────────────
app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ status: "error", message: "Username and password required." });
  }

  const user = USERS.find((u) => u.username === username);
  if (!user) {
    return res.status(401).json({ status: "error", message: "Invalid username or password." });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ status: "error", message: "Invalid username or password." });
  }

  const token = jwt.sign(
    { username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: `${INACTIVITY_MINUTES}m` }
  );

  res.json({
    status: "ok",
    data: {
      token,
      username: user.username,
      role: user.role,
      expiresInMinutes: INACTIVITY_MINUTES,
    },
  });
});

// ── Token refresh (resets inactivity timer) ───────────────────
app.post("/api/auth/refresh", requireAuth, (req, res) => {
  const token = jwt.sign(
    { username: req.user.username, role: req.user.role },
    JWT_SECRET,
    { expiresIn: `${INACTIVITY_MINUTES}m` }
  );
  res.json({
    status: "ok",
    data: { token, username: req.user.username, role: req.user.role, expiresInMinutes: INACTIVITY_MINUTES },
  });
});

// ── GET proxy (protected) ─────────────────────────────────────
app.get("/api/sheets", requireAuth, async (req, res) => {
  try {
    const qs  = new URLSearchParams(req.query).toString();
    const url = `${SCRIPT_URL}?${qs}`;
    console.log(`[GET] ${req.user.username} → ${url}`);

    const response = await fetch(url, {
      method: "GET", redirect: "follow",
      headers: { "User-Agent": "RoboLend-Server/1.0" },
    });

    const text = await response.text();
    try {
      return res.json(JSON.parse(text));
    } catch {
      return res.status(502).json({ status: "error", message: `Apps Script returned non-JSON: ${text.slice(0, 300)}` });
    }
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ── POST proxy (protected; inventory writes are admin-only) ───
app.post("/api/sheets", requireAuth, async (req, res) => {
  const adminOnlyActions = ["addItem", "updateItem", "deleteItem"];

  if (adminOnlyActions.includes(req.body?.action) && req.user?.role !== "admin") {
    return res.status(403).json({ status: "error", message: "Only admins can modify inventory." });
  }

  try {
    console.log(`[POST] ${req.user.username} (${req.user.role}) → action: ${req.body?.action}`);

    const response = await fetch(SCRIPT_URL, {
      method: "POST", redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8", "User-Agent": "RoboLend-Server/1.0" },
      body: JSON.stringify(req.body),
    });

    const text = await response.text();
    try {
      return res.json(JSON.parse(text));
    } catch {
      return res.status(502).json({ status: "error", message: `Apps Script returned non-JSON: ${text.slice(0, 300)}` });
    }
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅  RoboLend proxy server running on http://localhost:${PORT}`);
  console.log(`    Forwarding /api/sheets → ${SCRIPT_URL}`);
  console.log(`    JWT inactivity timeout: ${INACTIVITY_MINUTES} minutes`);
  console.log(`    Users loaded: ${USERS.map(u => `${u.username} (${u.role})`).join(", ")}`);
});