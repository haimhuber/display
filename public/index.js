
let mediaFiles = [];

let index = 0;

let intervalId = null;

const slideIntervalMs = 5000;

const slideA = document.getElementById("slideA");
const slideB = document.getElementById("slideB");
const videoSlide = document.getElementById("videoSlide");
const message = document.getElementById("message");

// which image layer is currently visible: 'A' or 'B'
let activeLayer = 'A';

function setMessage(text) {

    message.textContent = text;
    message.style.display = "flex";
    console.log(text);
}

function hideMessage() {
    message.style.display = "none";
}

function isVideo(fileName) {

    return /\.(mp4|webm|ogg|mov)$/i.test(fileName);
}

async function fetchMediaFiles() {

    try {

        const response =
            await fetch(
                "/api/images?t=" + Date.now()
            );

        if (!response.ok) {

            throw new Error(
                "API Error: " + response.status
            );
        }

        mediaFiles = await response.json();

        console.log(
            "Media count:",
            mediaFiles.length
        );

    } catch (err) {

        setMessage(
            "Failed loading media list"
        );

        console.error(err);
    }
}

async function loadMedia() {

    setMessage("Loading media list...");

    await fetchMediaFiles();

    if (!mediaFiles.length) {

        setMessage(
            "No images/videos found"
        );

        return;
    }

    showCurrentMedia();
}

function nextMedia() {

    index++;

    if (index >= mediaFiles.length) {

        index = 0;
    }

    showCurrentMedia();
}

function resetMediaElements() {

    // hide both image layers and video
    slideA.classList.remove('visible');
    slideB.classList.remove('visible');

    videoSlide.classList.remove('visible');
    try { videoSlide.pause(); } catch(e) {}
    videoSlide.removeAttribute('src');
}

function showCurrentMedia() {

    if (!mediaFiles.length) {

        return;
    }

    if (index >= mediaFiles.length) {

        index = 0;
    }

    const fileName =
        mediaFiles[index];

    const mediaUrl =
        "/pics/" +
        encodeURIComponent(fileName) +
        "?t=" +
        Date.now();

    console.log(
        "Showing:",
        fileName
    );

    resetMediaElements();

    if (isVideo(fileName)) {

        showVideo(
            mediaUrl,
            fileName
        );

    } else {

        showImage(
            mediaUrl,
            fileName
        );
    }
}

function showImage(
    imageUrl,
    fileName
) {

    // Preload the incoming image then crossfade
    const incoming = (activeLayer === 'A') ? slideB : slideA;
    const outgoing = (activeLayer === 'A') ? slideA : slideB;

    const img = new Image();
    img.onload = () => {
        incoming.src = imageUrl;
        // ensure incoming is behind outgoing until we toggle
        incoming.classList.add('visible');

        // remove visible from outgoing after a short frame to trigger transition
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                outgoing.classList.remove('visible');
            });
        });

        // swap active layer
        activeLayer = (activeLayer === 'A') ? 'B' : 'A';

        hideMessage();
        startImageTimer();
    };

    img.onerror = () => {
        setMessage('Image failed: ' + fileName);
    };

    img.src = imageUrl;
}

function startImageTimer() {

    clearTimeout(intervalId);

    intervalId =
        setTimeout(() => {

        nextMedia();

    }, slideIntervalMs);
}

function showVideo(
    videoUrl,
    fileName
) {

    // Preload video then crossfade the video layer in
    setMessage('Loading video...');

    // prepare video element
    videoSlide.src = videoUrl;
    videoSlide.load();

    videoSlide.onloadeddata = () => {
        // bring video layer in
        videoSlide.classList.add('visible');

        // hide both image layers
        slideA.classList.remove('visible');
        slideB.classList.remove('visible');

        hideMessage();

        const p = videoSlide.play();
        if (p && p.then) {
            p.then(() => console.log('Video autoplay started'))
             .catch(err => { console.error(err); setMessage('Video autoplay failed'); });
        }
    };

    videoSlide.onerror = () => {
        setMessage('Video failed: ' + fileName);
    };

    videoSlide.onended = () => nextMedia();
}

loadMedia();