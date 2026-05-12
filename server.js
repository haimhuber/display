const express = require("express");
const fs = require("fs");
const path = require("path");
const os = require("os");

const app = express();

const PORT = 3002;
const PICS_DIR = "C:\\ABB_Pics";

const ADMIN_PASSWORD = "admin1234!";
const DEFAULT_SLIDE_INTERVAL_SECONDS = 5;

const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

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

// Serve pictures folder
app.use("/pics", express.static(PICS_DIR));

// JSON body parsing for API endpoints
app.use(express.json());

// Serve static frontend from the public directory
app.use(express.static(path.join(__dirname, "public")));

// API: list images in PICS_DIR
app.get("/api/images", (req, res) => {
    fs.readdir(PICS_DIR, (err, files) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        const images = files.filter(file =>
            allowedExtensions.includes(path.extname(file).toLowerCase())
        );

        res.json(images);
    });
});

// API: frontend configuration (keeps secrets server-side)
app.get('/api/config', (req, res) => {
    // Do NOT expose admin password to the client
    res.json({
        defaultSlideIntervalSeconds: DEFAULT_SLIDE_INTERVAL_SECONDS
    });
});

// Verify admin password without exposing it to clients
app.post('/api/verify-password', (req, res) => {
    const { password } = req.body || {};

    if (!password) return res.status(400).json({ ok: false, error: 'missing password' });

    if (password === ADMIN_PASSWORD) return res.json({ ok: true });

    return res.status(401).json({ ok: false });
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
