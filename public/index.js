let images = [];
let index = 0;
let intervalId = null;
let slideIntervalMs = 5000;

const slide = document.getElementById("slide");
const message = document.getElementById("message");

function fetchImages(callback) {
    fetch("/api/images?t=" + Date.now())
        .then(response => response.json())
        .then(data => {
            images = data;

            if (callback) {
                callback();
            }
        })
        .catch(error => {
            console.error(error);
            message.innerHTML = "Image loading error";
            message.style.display = "flex";
        });
}

function loadImages() {
    fetchImages(() => {
        if (!images.length) {
            message.innerHTML = "No images found";
            message.style.display = "flex";
            return;
        }

        showImage();
        startTimer();
    });
}

function startTimer() {
    if (intervalId) {
        clearInterval(intervalId);
    }

    intervalId = setInterval(() => {
        index++;

        if (index >= images.length) {
            index = 0;

            fetchImages(() => {
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
    if (!images.length) return;

    if (index >= images.length) {
        index = 0;
    }

    const imageName = images[index];

    const imageUrl =
        "/pics/" +
        encodeURIComponent(imageName) +
        "?t=" +
        Date.now();

    const testImage = new Image();

    testImage.onload = function () {
        slide.src = imageUrl;

        slide.style.display = "none";

        setTimeout(() => {
            slide.style.display = "block";
        }, 50);

        message.style.display = "none";
    };

    testImage.onerror = function () {
        message.innerHTML = "Image load failed";
        message.style.display = "flex";
    };

    testImage.src = imageUrl;
}

loadImages();