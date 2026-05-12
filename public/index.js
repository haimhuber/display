// Frontend slideshow logic
let images = [];
let index = 0;
let intervalId = null;

let adminPassword = null;
let slideIntervalMs = 5000;

const slide = document.getElementById("slide");
const message = document.getElementById("message");
const slideIntervalValue = document.getElementById("slideIntervalValue");
const changeIntervalBtn = document.getElementById("changeIntervalBtn");

function updateLayoutSize() {
    const navbar = document.querySelector(".navbar");
    const main = document.querySelector(".main");

    const height = window.innerHeight || document.documentElement.clientHeight;
    const navbarHeight = navbar.offsetHeight;

    main.style.height = (height - navbarHeight) + "px";
}

window.addEventListener("load", updateLayoutSize);
window.addEventListener("resize", updateLayoutSize);
window.addEventListener("orientationchange", function () {
    setTimeout(updateLayoutSize, 300);
});

setInterval(updateLayoutSize, 1000);

function fetchConfig() {
    return fetch('/api/config').then(r => r.json()).then(cfg => {
        slideIntervalMs = (cfg.defaultSlideIntervalSeconds || 5) * 1000;
        slideIntervalValue.innerText = (slideIntervalMs/1000) + ' Seconds';
    }).catch(err => {
        console.warn('Could not fetch /api/config', err);
    });
}

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

    const imageName = images[index];

    const imageUrl = "/pics/" + encodeURIComponent(imageName) + "?t=" + Date.now();

    const testImage = new Image();

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
    openPasswordModal().then(password => {
        if (!password) return; // cancelled

        return fetch('/api/verify-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });
    }).then(res => {
        if (!res) return; // cancelled earlier
        if (!res.ok) throw new Error('unauthorized');
        return res.json();
    }).then(result => {
        if (!result) return;
        // proceed to change interval
        const currentSeconds = slideIntervalMs / 1000;

        let seconds = prompt("Enter new slide interval in seconds:", currentSeconds);

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
    }).catch(err => {
        alert('Incorrect password');
    });
}

// Password modal helpers
function openPasswordModal() {
    return new Promise((resolve) => {
        const modal = document.getElementById('passwordModal');
        const input = document.getElementById('modalPasswordInput');
        const submit = document.getElementById('modalSubmit');
        const cancel = document.getElementById('modalCancel');
        const backdrop = document.getElementById('modalBackdrop');

        function close(value) {
            modal.setAttribute('aria-hidden', 'true');
            // cleanup
            submit.removeEventListener('click', onSubmit);
            cancel.removeEventListener('click', onCancel);
            backdrop.removeEventListener('click', onCancel);
            input.removeEventListener('keydown', onKeyDown);
            input.value = '';
            resolve(value);
        }

        function onSubmit() {
            close(input.value);
        }

        function onCancel() {
            close(null);
        }

        function onKeyDown(e) {
            if (e.key === 'Enter') onSubmit();
            if (e.key === 'Escape') onCancel();
        }

        submit.addEventListener('click', onSubmit);
        cancel.addEventListener('click', onCancel);
        backdrop.addEventListener('click', onCancel);
        input.addEventListener('keydown', onKeyDown);

        // show
        modal.setAttribute('aria-hidden', 'false');
        setTimeout(() => input.focus(), 50);
    });
}

changeIntervalBtn.addEventListener('click', changeSlideInterval);

// bootstrap
fetchConfig().then(loadImages);
