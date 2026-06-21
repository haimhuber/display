(function () {
  var IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
  var VIDEO_EXTENSIONS = [".mp4", ".webm", ".ogg"];

  var DEBUG = false;

  var mediaFiles = [];
  var currentIndex = 0;
  var currentImageLayer = "A";
  var slideIntervalSeconds = 5;

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

  function log(text, data, level) {
    if (!DEBUG) return;

    if (!level) level = "info";

    try {
      console.log("[ABB DISPLAY][" + level + "] " + text, data || "");
    } catch (e) {}
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
          success(JSON.parse(xhr.responseText), xhr.status);
        } catch (e) {
          fail("JSON parse error: " + e.message);
        }
      } else {
        fail("HTTP " + xhr.status + " from " + url);
      }
    };

    xhr.onerror = function () {
      fail("Network error loading " + url);
    };

    xhr.send();
  }

  function loadConfig(next) {
    xhrGetJson(
      "/api/config?v=" + Date.now(),
      function (config) {
        if (config && Number(config.defaultSlideIntervalSeconds) > 0) {
          slideIntervalSeconds = Number(config.defaultSlideIntervalSeconds);
        }

        log("Config loaded", config);
        next();
      },
      function (err) {
        log("Config failed, using default", err, "warn");
        slideIntervalSeconds = 5;
        next();
      }
    );
  }

  function loadMediaList() {
    xhrGetJson(
      "/api/images?v=" + Date.now(),
      function (files) {
        if (!files || !files.length) {
          showMessage("No media files found");
          return;
        }

        mediaFiles = [];

        for (var i = 0; i < files.length; i++) {
          if (isImage(files[i]) || isVideo(files[i])) {
            mediaFiles.push(files[i]);
          }
        }

        if (!mediaFiles.length) {
          showMessage("No supported media files");
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

  function getMediaUrl(file) {
    return "/pics/" + encodeURIComponent(file);
  }

  function showNextMedia() {
    if (!mediaFiles.length) return;

    var file = mediaFiles[currentIndex];
    var src = getMediaUrl(file);

    log("Showing media", {
      index: currentIndex,
      file: file,
      src: src
    });

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

  window.onerror = function (msg, url, line, col) {
    log("WINDOW ERROR", {
      msg: msg,
      url: url,
      line: line,
      col: col
    }, "error");

    return false;
  };

  function start() {
    initElements();

    showMessage("Loading media...");

    loadConfig(function () {
      loadMediaList();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();