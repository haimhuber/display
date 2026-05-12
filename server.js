const express = require("express");
const fs = require("fs");
const path = require("path");
const os = require("os");

const app = express();

const PORT = 3002;
const PICS_DIR = "C:\\ABB_Pics";

const ELECTRIC_BILLING_URL = "http://192.168.1.148:8000";
const KNX_MONITORING_URL = "http://192.168.1.148:3001";

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

app.use("/pics", express.static(PICS_DIR));

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

app.get("/", (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<title>ABB News Display</title>

<style>
* { box-sizing: border-box; }

html, body {
    margin: 0;
    width: 100%;
    height: 100%;
}

body {
    background: #0a0a0b;
    color: #ffffff;
    font-family: Arial, Helvetica, sans-serif;
    overflow: hidden;
}

.navbar {
    height: 82px;
    background: linear-gradient(180deg, #1b1c1f 0%, #111214 100%);
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 28px;
    border-bottom: 4px solid #ff000f;
    box-shadow:
        0 12px 35px rgba(0,0,0,0.55),
        inset 0 1px 0 rgba(255,255,255,0.06);
}

.brand {
    display: flex;
    align-items: center;
    gap: 16px;
}

.brand-main {
    font-size: 38px;
    font-weight: 900;
    color: #ff000f;
    letter-spacing: 1px;
    text-shadow: 0 0 18px rgba(255,0,15,0.28);
}

.brand-sub {
    font-size: 15px;
    font-weight: 800;
    color: #d6d6d6;
}

.top-actions {
    display: flex;
    align-items: center;
    gap: 12px;
}

.nav-links {
    display: flex;
    gap: 10px;
}

.nav-links a,
.interval-button {
    position: relative;
    color: #f5f5f5;
    text-decoration: none;
    padding: 13px 20px;
    border-radius: 12px;
    background:
        linear-gradient(180deg, #3a3b42 0%, #202126 55%, #15161a 100%);
    border: 1px solid #454750;
    font-size: 14px;
    font-weight: 900;
    cursor: pointer;
    overflow: hidden;
    box-shadow:
        inset 0 1px 0 rgba(255,255,255,0.22),
        inset 0 -3px 0 rgba(0,0,0,0.45),
        0 8px 0 #08090b,
        0 15px 24px rgba(0,0,0,0.45);
    transform: translateY(0);
    transition:
        transform 0.16s ease,
        box-shadow 0.16s ease,
        background 0.16s ease,
        color 0.16s ease,
        border-color 0.16s ease;
}

.nav-links a::before,
.interval-button::before {
    content: "";
    position: absolute;
    top: 0;
    left: -120%;
    width: 80%;
    height: 100%;
    background: linear-gradient(
        90deg,
        transparent,
        rgba(255,255,255,0.28),
        transparent
    );
    transform: skewX(-20deg);
    transition: left 0.55s ease;
}

.nav-links a:hover,
.interval-button:hover {
    background:
        linear-gradient(180deg, #ff2630 0%, #e3000d 60%, #a90008 100%);
    border-color: rgba(255,255,255,0.35);
    color: #ffffff;
    transform: translateY(-3px);
    box-shadow:
        inset 0 1px 0 rgba(255,255,255,0.35),
        inset 0 -3px 0 rgba(80,0,5,0.6),
        0 11px 0 #5c0005,
        0 20px 32px rgba(255,0,15,0.28);
}

.nav-links a:hover::before,
.interval-button:hover::before {
    left: 140%;
}

.nav-links a:active,
.interval-button:active {
    transform: translateY(5px);
    box-shadow:
        inset 0 1px 0 rgba(255,255,255,0.18),
        inset 0 -1px 0 rgba(0,0,0,0.45),
        0 3px 0 #08090b,
        0 8px 16px rgba(0,0,0,0.35);
}

.interval-button {
    font-family: Arial, Helvetica, sans-serif;
}

.main {
    height: calc(100vh - 82px);
    width: 100%;
    padding: 18px;
    background:
        radial-gradient(circle at 15% 20%, rgba(255,0,15,0.12), transparent 26%),
        linear-gradient(90deg, rgba(255,0,15,0.06), transparent 35%),
        #111214;
}

.dashboard-frame {
    width: 100%;
    height: 100%;
    display: grid;
    grid-template-columns: 280px minmax(0, 1fr);
    gap: 18px;
}

.dashboard-panel {
    background:
        linear-gradient(145deg, #1f2024 0%, #141518 100%);
    border: 1px solid #303137;
    border-radius: 18px;
    padding: 18px;
    box-shadow:
        0 22px 50px rgba(0,0,0,0.46),
        inset 0 1px 0 rgba(255,255,255,0.06);
}

.sidebar-title {
    font-size: 20px;
    font-weight: 900;
    margin-bottom: 6px;
}

.sidebar-subtitle {
    font-size: 13px;
    color: #a9a9a9;
    line-height: 1.5;
    margin-bottom: 22px;
}

.kpi-card {
    background:
        linear-gradient(145deg, #121317 0%, #0d0e11 100%);
    border: 1px solid #2b2c31;
    border-left: 5px solid #ff000f;
    border-radius: 14px;
    padding: 14px;
    margin-bottom: 14px;
    box-shadow:
        inset 0 1px 0 rgba(255,255,255,0.06),
        0 12px 24px rgba(0,0,0,0.28);
}

.kpi-label {
    color: #a0a0a0;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.8px;
}

.kpi-value {
    margin-top: 6px;
    font-size: 22px;
    font-weight: 900;
}

.kpi-small {
    margin-top: 6px;
    font-size: 12px;
    color: #8f8f8f;
}

.slide-area {
    min-width: 0;
    min-height: 0;
    background:
        linear-gradient(145deg, #1f2024 0%, #141518 100%);
    border: 1px solid #303137;
    border-radius: 18px;
    padding: 14px;
    box-shadow:
        0 22px 50px rgba(0,0,0,0.46),
        inset 0 1px 0 rgba(255,255,255,0.06);
}

.slide-header {
    height: 42px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid #303137;
    margin-bottom: 12px;
}

.slide-title {
    font-size: 16px;
    font-weight: 900;
}

.live-pill {
    background: rgba(255,0,15,0.13);
    border: 1px solid rgba(255,0,15,0.62);
    color: #ff4650;
    padding: 6px 13px;
    border-radius: 99px;
    font-size: 12px;
    font-weight: 900;
    box-shadow: 0 0 18px rgba(255,0,15,0.18);
    animation: pulseLive 1.8s infinite;
}

@keyframes pulseLive {
    0% { box-shadow: 0 0 0 rgba(255,0,15,0.0); }
    50% { box-shadow: 0 0 20px rgba(255,0,15,0.38); }
    100% { box-shadow: 0 0 0 rgba(255,0,15,0.0); }
}

.slideshow {
    width: 100%;
    height: calc(100% - 54px);
}

.slide-frame {
    width: 100%;
    height: 100%;
    background: #050505;
    border-radius: 14px;
    overflow: hidden;
    position: relative;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 4px;
    border: 1px solid #303136;
    box-shadow:
        inset 0 1px 0 rgba(255,255,255,0.06),
        0 15px 35px rgba(0,0,0,0.35);
}

#slide {
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: top center;
    display: block;
    border-radius: 8px;
}

#message {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #cfcfcf;
    font-size: 28px;
    text-align: center;
    z-index: 3;
}

@media (max-width: 1100px) {
    .dashboard-frame {
        grid-template-columns: 1fr;
    }

    .dashboard-panel {
        display: none;
    }

    .main {
        padding: 8px;
    }

    .navbar {
        height: 72px;
        padding: 0 12px;
    }

    .brand-main {
        font-size: 30px;
    }

    .brand-sub {
        display: none;
    }

    .nav-links a,
    .interval-button {
        font-size: 11px;
        padding: 8px 10px;
        border-radius: 10px;
        box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.18),
            inset 0 -2px 0 rgba(0,0,0,0.4),
            0 5px 0 #08090b,
            0 10px 18px rgba(0,0,0,0.35);
    }

    .slide-area {
        padding: 8px;
    }
}
</style>
</head>

<body>

<nav class="navbar">
    <div class="brand">
        <div class="brand-main">ABB</div>
        <div class="brand-line"></div>
        <div class="brand-sub">Operational News Dispaly</div>
    </div>

    <div class="top-actions">
        <button class="interval-button" onclick="changeSlideInterval()">
            Slide Interval: <span id="slideIntervalValue">5 Seconds</span>
        </button>

        <div class="nav-links">
            <a href="/">Slideshow</a>
           
        </div>
    </div>
</nav>

<main class="main">
    <section class="slideshow">
        <div class="slide-frame">
            <img id="slide">
            <div id="message">Loading images...</div>
        </div>
    </section>
</main>

<script>
var images = [];
var index = 0;
var intervalId = null;

var adminPassword = "${ADMIN_PASSWORD}";
var slideIntervalMs = ${DEFAULT_SLIDE_INTERVAL_SECONDS * 1000};

var slide = document.getElementById("slide");
var message = document.getElementById("message");
var slideIntervalValue = document.getElementById("slideIntervalValue");

function updateLayoutSize() {
    var navbar = document.querySelector(".navbar");
    var main = document.querySelector(".main");

    var height = window.innerHeight || document.documentElement.clientHeight;
    var navbarHeight = navbar.offsetHeight;

    main.style.height = (height - navbarHeight) + "px";
}

window.addEventListener("load", updateLayoutSize);
window.addEventListener("resize", updateLayoutSize);
window.addEventListener("orientationchange", function () {
    setTimeout(updateLayoutSize, 300);
});

setInterval(updateLayoutSize, 1000);

function fetchImages(callback) {
    fetch("/api/images?t=" + Date.now())
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            images = data;
            if (callback) callback();
        })
        .catch(function(error) {
            console.log("ERROR: " + error.message);
            message.innerHTML = "Image loading error";
            message.style.display = "flex";
        });
}

function loadImages() {
    updateLayoutSize();

    fetchImages(function() {
        if (images.length === 0) {
            message.innerHTML = "No images found";
            message.style.display = "flex";
            return;
        }

        showImage();
        restartSlideshowTimer();
    });
}

function restartSlideshowTimer() {
    if (intervalId) {
        clearInterval(intervalId);
    }

    intervalId = setInterval(function() {
        index++;

        if (index >= images.length) {
            index = 0;

            fetchImages(function() {
                if (images.length > 0) {
                    showImage();
                }
            });
        } else {
            showImage();
        }

    }, slideIntervalMs);
}

function showImage() {
    if (images.length === 0) return;

    if (index >= images.length) index = 0;

    var imageName = images[index];

    var imageUrl =
        "/pics/" +
        encodeURIComponent(imageName) +
        "?t=" +
        Date.now();

    var testImage = new Image();

    testImage.onload = function () {
        slide.src = imageUrl;

        slide.style.display = "none";

        setTimeout(function () {
            slide.style.display = "block";
            updateLayoutSize();
        }, 50);

        message.style.display = "none";
    };

    testImage.onerror = function () {
        message.innerHTML = "Image load failed";
        message.style.display = "flex";
    };

    testImage.src = imageUrl;
}

function changeSlideInterval() {
    var password = prompt("Enter admin password:");

    if (password === null) return;

    if (password !== adminPassword) {
        alert("Incorrect password");
        return;
    }

    var currentSeconds = slideIntervalMs / 1000;

    var seconds = prompt("Enter new slide interval in seconds:", currentSeconds);

    if (seconds === null) return;

    seconds = Number(seconds);

    if (!seconds || seconds < 1) {
        alert("Invalid interval. Please enter a number greater than 0.");
        return;
    }

    slideIntervalMs = seconds * 1000;
    slideIntervalValue.innerHTML = seconds + " Seconds";

    restartSlideshowTimer();

    alert("Slide interval updated to " + seconds + " seconds");
}

loadImages();
</script>

</body>
</html>
    `);
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