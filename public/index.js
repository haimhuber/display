(function () {
  var IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
  var VIDEO_EXTENSIONS = [".mp4", ".webm", ".ogg"];

  var AUTO_REFRESH_SECONDS = 10;

  var mediaFiles = [];
  var mediaSignature = "";
  var currentIndex = 0;
  var currentImageLayer = "A";
  var slideIntervalSeconds = 5;
  var refreshTimer = null;

  var slideA = null;
  var slideB = null;
  var videoSlide = null;
  var message = null;

  function initElements() {
    slideA = document.getElementById("slideA");
    slideB = document.getElementById("slideB");
    videoSlide = document.getElementById("videoSlide");
    message = document.getElementById("message");
  }

  function getExtension(fileName) {
    var index = fileName.lastIndexOf(".");
    if (index === -1) return "";
    return fileName.substring(index).toLowerCase();
  }

  function isImage(fileName) {
    return IMAGE_EXTENSIONS.indexOf(getExtension(fileName)) !== -1;
  }

  function isVideo(fileName) {
    return VIDEO_EXTENSIONS.indexOf(getExtension(fileName)) !== -1;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function showMessage(text) {
    if (!message) return;
    message.innerHTML = escapeHtml(text);
    message.style.display = "flex";
  }

  function hideMessage() {
    if (!message) return;
    message.style.display = "none";
  }

  function xhrGetJson(url, success, fail) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);

    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          success(JSON.parse(xhr.responseText));
        } catch (e) {
          fail();
        }
      } else {
        fail();
      }
    };

    xhr.onerror = function () {
      fail();
    };

    xhr.send();
  }

  function loadConfig(next) {
    xhrGetJson(
      "/api/config?t=" + Date.now(),
      function (config) {
        if (config && Number(config.defaultSlideIntervalSeconds) > 0) {
          slideIntervalSeconds = Number(config.defaultSlideIntervalSeconds);
        }

        next();
      },
      function () {
        slideIntervalSeconds = 5;
        next();
      }
    );
  }

  function normalizeMediaFiles(files) {
    var result = [];

    if (!files || !files.length) {
      return result;
    }

    for (var i = 0; i < files.length; i++) {
      if (isImage(files[i]) || isVideo(files[i])) {
        result.push(files[i]);
      }
    }

    return result;
  }

  function buildSignature(files) {
    return files.join("|");
  }

  function loadMediaList() {
    xhrGetJson(
      "/api/images?t=" + Date.now(),
      function (files) {
        mediaFiles = normalizeMediaFiles(files);
        mediaSignature = buildSignature(mediaFiles);
        currentIndex = 0;

        if (!mediaFiles.length) {
          showMessage("No media files found");
          return;
        }

        hideMessage();
        showNextMedia();
      },
      function () {
        showMessage("Failed to load media");
      }
    );
  }

  function refreshMediaListSilent() {
    xhrGetJson(
      "/api/images?t=" + Date.now(),
      function (files) {
        var updatedFiles = normalizeMediaFiles(files);
        var newSignature = buildSignature(updatedFiles);

        if (newSignature === mediaSignature) {
          return;
        }

        mediaSignature = newSignature;
        mediaFiles = updatedFiles;
        currentIndex = 0;

        if (!mediaFiles.length) {
          showMessage("No media files found");
          return;
        }

        hideMessage();
      },
      function () {}
    );
  }

  function getMediaUrl(file) {
    return "/pics/" + encodeURIComponent(file) + "?t=" + Date.now();
  }

  function showNextMedia() {
    if (!mediaFiles.length) return;

    var file = mediaFiles[currentIndex];
    var src = getMediaUrl(file);

    if (isImage(file)) {
      showImage(file, src);
      return;
    }

    if (isVideo(file)) {
      showVideo(file, src);
      return;
    }

    moveNext();
    setTimeout(showNextMedia, 1000);
  }

  function showImage(file, src) {
    var nextLayer;
    var prevLayer;

    if (currentImageLayer === "A") {
      nextLayer = slideB;
      prevLayer = slideA;
    } else {
      nextLayer = slideA;
      prevLayer = slideB;
    }

    if (videoSlide) {
      videoSlide.className = "media-layer";

      try {
        videoSlide.pause();
        videoSlide.removeAttribute("src");
        videoSlide.load();
      } catch (e) {}
    }

    nextLayer.onload = function () {
      prevLayer.className = "media-layer";
      nextLayer.className = "media-layer visible";

      currentImageLayer = currentImageLayer === "A" ? "B" : "A";

      moveNext();
      setTimeout(showNextMedia, slideIntervalSeconds * 1000);
    };

    nextLayer.onerror = function () {
      moveNext();
      setTimeout(showNextMedia, 1000);
    };

    nextLayer.src = src;
  }

  function showVideo(file, src) {
    slideA.className = "media-layer";
    slideB.className = "media-layer";

    videoSlide.onloadeddata = function () {
      videoSlide.className = "media-layer visible";

      try {
        var playResult = videoSlide.play();

        if (playResult && playResult.catch) {
          playResult.catch(function () {
            moveNext();
            setTimeout(showNextMedia, 1000);
          });
        }
      } catch (e) {
        moveNext();
        setTimeout(showNextMedia, 1000);
      }
    };

    videoSlide.onerror = function () {
      moveNext();
      setTimeout(showNextMedia, 1000);
    };

    videoSlide.onended = function () {
      videoSlide.className = "media-layer";

      moveNext();
      setTimeout(showNextMedia, 500);
    };

    videoSlide.src = src;
    videoSlide.muted = true;
    videoSlide.setAttribute("playsinline", "playsinline");
    videoSlide.load();
  }

  function moveNext() {
    currentIndex++;

    if (currentIndex >= mediaFiles.length) {
      currentIndex = 0;
    }
  }

  function startAutoRefresh() {
    if (refreshTimer) {
      clearInterval(refreshTimer);
    }

    refreshTimer = setInterval(function () {
      refreshMediaListSilent();
    }, AUTO_REFRESH_SECONDS * 1000);
  }

  function start() {
    initElements();

    showMessage("Loading media...");

    loadConfig(function () {
      loadMediaList();
      startAutoRefresh();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();