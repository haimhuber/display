const express = require("express");
const fs = require("fs");
const path = require("path");
const os = require("os");

const app = express();

const PORT = 3002;
const PICS_DIR = "C:\\ABB_Pics";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin1234!";

if (!process.env.ADMIN_PASSWORD) {
  console.warn("WARNING: ADMIN_PASSWORD not set in environment; using fallback.");
}

const DEFAULT_SLIDE_INTERVAL_SECONDS = 5;

const allowedExtensions = [
  ".jpg", ".jpeg", ".png", ".webp", ".gif",
  ".mp4", ".webm", ".ogg"
];

function getAllIPs() {
  const interfaces = os.networkInterfaces();
  const results = [];

  for (const name in interfaces) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        results.push({ name, ip: iface.address });
      }
    }
  }

  return results;
}

app.use(express.json());

// Disable cache for everything
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

// Serve pictures folder
app.use("/pics", express.static(PICS_DIR));

// Client tracking
const clients = new Map();

function recordClient(req, res, next) {
  const ip = req.headers["x-forwarded-for"]
    ? req.headers["x-forwarded-for"].split(",")[0].trim()
    : req.socket.remoteAddress;

  const ua = req.headers["user-agent"] || "";

  clients.set(ip, {
    ip,
    userAgent: ua,
    path: req.path,
    lastSeen: Date.now()
  });

  next();
}

app.use(recordClient);

// Serve frontend
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/images", (req, res) => {
  fs.readdir(PICS_DIR, (err, files) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const media = files
      .filter(file => allowedExtensions.includes(path.extname(file).toLowerCase()))
      .sort((a, b) => a.localeCompare(b));

    res.json(media);
  });
});

app.get("/api/config", (req, res) => {
  res.json({
    defaultSlideIntervalSeconds: DEFAULT_SLIDE_INTERVAL_SECONDS
  });
});

app.post("/api/verify-password", (req, res) => {
  const { password } = req.body || {};

  if (!password) {
    return res.status(400).json({ ok: false, error: "missing password" });
  }

  if (password === ADMIN_PASSWORD) {
    return res.json({ ok: true });
  }

  return res.status(401).json({ ok: false });
});

app.post("/api/clients", (req, res) => {
  const { password } = req.body || {};

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ ok: false });
  }

  const arr = Array.from(clients.values())
    .sort((a, b) => b.lastSeen - a.lastSeen)
    .map(c => ({
      ip: c.ip,
      userAgent: c.userAgent,
      path: c.path,
      lastSeen: c.lastSeen
    }));

  res.json({ ok: true, clients: arr });
});

app.listen(PORT, "0.0.0.0", () => {
  const ips = getAllIPs();

  console.log("=================================");
  console.log("ABB DISPLAY SERVER");
  console.log("=================================");
  console.log("Localhost : http://localhost:" + PORT);
  console.log("Loopback  : http://127.0.0.1:" + PORT);
  console.log("---------------------------------");
  console.log("NETWORK INTERFACES");
  console.log("---------------------------------");

  ips.forEach(item => {
    console.log(item.name + " -> http://" + item.ip + ":" + PORT);
  });

  console.log("---------------------------------");
  console.log("Pictures  : " + PICS_DIR);
  console.log("=================================");
});