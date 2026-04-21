// server/index.js
require("dotenv").config();
const express     = require("express");
const cors        = require("cors");
const compression = require("compression");
const fetch       = require("node-fetch");
const bcrypt      = require("bcryptjs");
const jwt         = require("jsonwebtoken");

const app  = express();
const PORT = process.env.PORT || 3001;
const SCRIPT_URL  = process.env.GOOGLE_SCRIPT_URL;
const JWT_SECRET  = process.env.JWT_SECRET;
const INACTIVITY_MINUTES = Number(process.env.INACTIVITY_MINUTES || 30);

if (!SCRIPT_URL)   { console.error("❌  GOOGLE_SCRIPT_URL is not set in server/.env"); process.exit(1); }
if (!JWT_SECRET)   { console.error("❌  JWT_SECRET is not set in server/.env");         process.exit(1); }

// ── Middleware ────────────────────────────────────────────────
// gzip the proxied JSON responses; typically 5–10× smaller on the wire.
app.use(compression());

app.use(cors({
  origin: [
    "http://localhost:4028",
    "http://localhost:3000",
    "http://robotics.local",
    /\.builtwithrocket\.new$/,
    /\.amazonaws\.com$/,
  ],
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
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

// ── In-memory TTL cache for Apps Script reads ────────────────
// Apps Script round-trips are 500ms–2s. Caching the common reads for
// 30s knocks most page loads down to near-instant without risking stale
// inventory for long. Every write action invalidates the relevant keys
// so changes propagate immediately.
const CACHE_TTL_MS = 30 * 1000;
const scriptCache  = new Map(); // key -> { data, expires }

function cacheKey(action, params = {}) {
  const sorted = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join("&");
  return sorted ? `${action}?${sorted}` : action;
}

function cacheGet(key) {
  const hit = scriptCache.get(key);
  if (!hit) return undefined;
  if (hit.expires < Date.now()) { scriptCache.delete(key); return undefined; }
  return hit.data;
}

function cacheSet(key, data) {
  scriptCache.set(key, { data, expires: Date.now() + CACHE_TTL_MS });
}

function invalidateCache(...prefixes) {
  for (const k of scriptCache.keys()) {
    if (prefixes.some((p) => k.startsWith(p))) scriptCache.delete(k);
  }
}

// Map a mutating action to the read prefixes it invalidates.
function invalidationsFor(action) {
  switch (action) {
    case "addItem":
    case "updateItem":
    case "deleteItem":
      return ["getItems", "getDashboard"];
    case "borrowItem":
    case "returnItem":
      return ["getTransactions", "getDashboard"];
    case "addUser":
    case "updateUser":
    case "deleteUser":
      return ["getUsers"];
    default:
      return [];
  }
}

// ── Apps Script client helpers ────────────────────────────────
// The Apps Script has no auth layer — only this server knows its URL.
async function scriptGet(action, params = {}) {
  const key = cacheKey(action, params);
  const hit = cacheGet(key);
  if (hit !== undefined) return hit;

  const qs  = new URLSearchParams({ action, ...params }).toString();
  const res = await fetch(`${SCRIPT_URL}?${qs}`, {
    method: "GET", redirect: "follow",
    headers: { "User-Agent": "RoboLend-Server/1.0" },
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); }
  catch { throw new Error(`Apps Script returned non-JSON: ${text.slice(0, 300)}`); }
  if (json.status === "error") throw new Error(json.message);
  cacheSet(key, json.data);
  return json.data;
}

async function scriptPost(body) {
  const res = await fetch(SCRIPT_URL, {
    method: "POST", redirect: "follow",
    headers: { "Content-Type": "text/plain;charset=utf-8", "User-Agent": "RoboLend-Server/1.0" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); }
  catch { throw new Error(`Apps Script returned non-JSON: ${text.slice(0, 300)}`); }
  if (json.status === "error") throw new Error(json.message);
  return json.data;
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

  let users;
  try {
    users = await scriptGet("getUsers");
  } catch (err) {
    console.error("Login: failed to fetch users from Apps Script:", err.message);
    return res.status(500).json({ status: "error", message: "Authentication backend unavailable." });
  }

  const user = (users || []).find((u) => String(u.username) === String(username));
  if (!user) {
    return res.status(401).json({ status: "error", message: "Invalid username or password." });
  }

  const valid = await bcrypt.compare(password, user.passwordHash || "");
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

// ── /api/users (admin-only CRUD) ──────────────────────────────
// Hashes stay server-side: plaintext passwords never reach the Apps Script.
app.get("/api/users", requireAuth, requireAdmin, async (req, res) => {
  try {
    const users = await scriptGet("getUsers");
    // Strip passwordHash before responding.
    const safe = (users || []).map(({ passwordHash, ...rest }) => rest);
    res.json({ status: "ok", data: safe });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

app.post("/api/users", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password || !role) {
      return res.status(400).json({ status: "error", message: "username, password, and role are required." });
    }
    if (!["admin", "user"].includes(role)) {
      return res.status(400).json({ status: "error", message: "role must be 'admin' or 'user'." });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ status: "error", message: "Password must be at least 6 characters." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const created = await scriptPost({ action: "addUser", username, passwordHash, role });
    invalidateCache("getUsers");
    res.json({ status: "ok", data: created });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

app.patch("/api/users/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role, password } = req.body;

    const payload = { action: "updateUser", id };
    if (role !== undefined) {
      if (!["admin", "user"].includes(role)) {
        return res.status(400).json({ status: "error", message: "role must be 'admin' or 'user'." });
      }
      payload.role = role;
    }
    if (password !== undefined && password !== "") {
      if (String(password).length < 6) {
        return res.status(400).json({ status: "error", message: "Password must be at least 6 characters." });
      }
      payload.passwordHash = await bcrypt.hash(password, 10);
    }

    const result = await scriptPost(payload);
    invalidateCache("getUsers");
    res.json({ status: "ok", data: result });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

app.delete("/api/users/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Guard: don't let an admin delete themselves (they'd lock themselves out).
    const users = await scriptGet("getUsers");
    const target = (users || []).find((u) => String(u.id) === String(id));
    if (target && target.username === req.user.username) {
      return res.status(400).json({ status: "error", message: "You cannot delete your own account." });
    }

    const result = await scriptPost({ action: "deleteUser", id });
    invalidateCache("getUsers");
    res.json({ status: "ok", data: result });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ── GET proxy (protected, cached) ─────────────────────────────
app.get("/api/sheets", requireAuth, async (req, res) => {
  const { action, ...params } = req.query;
  if (!action) {
    return res.status(400).json({ status: "error", message: "Missing action parameter." });
  }
  try {
    const data = await scriptGet(action, params);
    console.log(`[GET] ${req.user.username} → ${action} (cached=${scriptCache.has(cacheKey(action, params))})`);
    return res.json({ status: "ok", data });
  } catch (err) {
    return res.status(500).json({ status: "error", message: err.message });
  }
});

// ── POST proxy (protected; inventory writes are admin-only) ───
app.post("/api/sheets", requireAuth, async (req, res) => {
  const adminOnlyActions = ["addItem", "updateItem", "deleteItem"];

  if (adminOnlyActions.includes(req.body?.action) && req.user?.role !== "admin") {
    return res.status(403).json({ status: "error", message: "Only admins can modify inventory." });
  }

  // User-management actions must go through /api/users (which hashes
  // passwords server-side). Block them from the generic sheets proxy.
  const blockedActions = ["addUser", "updateUser", "deleteUser"];
  if (blockedActions.includes(req.body?.action)) {
    return res.status(400).json({ status: "error", message: "Use /api/users for user management." });
  }

  // ── Borrow: attach authoritative owner (username) server-side ─
  // Teachers can never pretend to borrow as someone else; the owner
  // always matches their JWT. Admins may specify `borrowedBy` in the
  // body to assign a borrow to a specific teacher's username.
  if (req.body?.action === "borrowItem") {
    if (req.user?.role === "admin") {
      req.body.borrowedBy = req.body.borrowedBy || req.body.teacherName || req.user.username;
    } else {
      req.body.borrowedBy = req.user.username;
    }
  }

  // ── Return: admin OR the original borrower only ───────────────
  if (req.body?.action === "returnItem") {
    if (req.user?.role !== "admin") {
      try {
        const txns = await scriptGet("getTransactions");
        const txn  = (txns || []).find((t) => String(t.id) === String(req.body.id));
        if (!txn) {
          return res.status(404).json({ status: "error", message: "Transaction not found." });
        }
        // Fallback to teacherName for transactions created before the
        // borrowedBy column existed (legacy rows).
        const owner = txn.borrowedBy || txn.teacherName;
        if (String(owner) !== String(req.user.username)) {
          return res.status(403).json({
            status: "error",
            message: "Only the borrower or an admin can mark this returned.",
          });
        }
      } catch (err) {
        return res.status(500).json({ status: "error", message: err.message });
      }
    }
  }

  try {
    console.log(`[POST] ${req.user.username} (${req.user.role}) → action: ${req.body?.action}`);

    const response = await fetch(SCRIPT_URL, {
      method: "POST", redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8", "User-Agent": "RoboLend-Server/1.0" },
      body: JSON.stringify(req.body),
    });

    const text = await response.text();
    let parsed;
    try { parsed = JSON.parse(text); }
    catch {
      return res.status(502).json({ status: "error", message: `Apps Script returned non-JSON: ${text.slice(0, 300)}` });
    }

    // Invalidate any cached reads affected by this write so subsequent
    // GETs see fresh data immediately.
    if (parsed?.status === "ok") {
      const keys = invalidationsFor(req.body?.action);
      if (keys.length) invalidateCache(...keys);
    }

    return res.json(parsed);
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅  RoboLend proxy server running on http://localhost:${PORT}`);
  console.log(`    Forwarding /api/sheets → ${SCRIPT_URL}`);
  console.log(`    JWT inactivity timeout: ${INACTIVITY_MINUTES} minutes`);
  console.log(`    Users now live in the Google Sheet 'Users' tab.`);
});
