// static/js/arkanoid_hand_control.js

let detector = null;
let videoEl = null;
let overlayCanvas = null;
let overlayCtx = null;
let running = false;

// Global value the game can read: 0.0 - 1.0
window.handX = null;

async function createDetector() {
    const model = handPoseDetection.SupportedModels.MediaPipeHands;
    const detectorConfig = {
        runtime: "mediapipe",
        modelType: "lite",
        solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/hands"
    };
    return await handPoseDetection.createDetector(model, detectorConfig);
}

async function setupWebcam() {
    videoEl = document.getElementById("webcam");
    overlayCanvas = document.getElementById("webcamOverlay");

    if (!videoEl) {
        console.error("No #webcam element found");
        return;
    }
    if (!overlayCanvas) {
        console.error("No #webcamOverlay canvas found");
    } else {
        overlayCtx = overlayCanvas.getContext("2d");
    }

    const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
    });
    videoEl.srcObject = stream;

    // Wait until video metadata is loaded so we know its size
    return new Promise(resolve => {
        videoEl.onloadedmetadata = () => {
            videoEl.play();

            if (overlayCanvas) {
                // Match *drawing resolution* to the actual video
                overlayCanvas.width  = videoEl.videoWidth;
                overlayCanvas.height = videoEl.videoHeight;

                // Also make sure the CSS size matches the video element
                // so the overlay lines up visually.
                overlayCanvas.style.width  = videoEl.clientWidth + "px";
                overlayCanvas.style.height = videoEl.clientHeight + "px";
            }

            console.log("Webcam ready:", videoEl.videoWidth, videoEl.videoHeight);
            resolve();
        };
    });
}

// Draw wrist dot + vertical line mapped to handX
function drawWebcamOverlay(wrist, xNorm) {
    if (!overlayCtx || !overlayCanvas || !videoEl) return;

    const w = overlayCanvas.width;
    const h = overlayCanvas.height;

    overlayCtx.clearRect(0, 0, w, h);

    // If we *don't* have a wrist, draw a faint center line so you
    // can verify the overlay is visible at all.
    if (!wrist || typeof xNorm !== "number") {
        overlayCtx.beginPath();
        overlayCtx.moveTo(w / 2, 0);
        overlayCtx.lineTo(w / 2, h);
        overlayCtx.strokeStyle = "rgba(0, 255, 255, 0.4)";
        overlayCtx.lineWidth = 2;
        overlayCtx.stroke();
        overlayCtx.closePath();
        return;
    }

    // For the MediaPipe runtime, keypoints are already in video pixel space,
    // and we set overlayCanvas.width/height to videoWidth/height,
    // so we can just use wrist.x / wrist.y directly.
    const wx = wrist.x;
    const wy = wrist.y;

    // 1) wrist circle
    overlayCtx.beginPath();
    overlayCtx.arc(wx, wy, 10, 0, Math.PI * 2);
    overlayCtx.fillStyle = "rgba(0, 255, 0, 0.9)";
    overlayCtx.fill();
    overlayCtx.closePath();

    // 2) vertical line at mapped handX (0..1)
    const lineX = xNorm * w;
    overlayCtx.beginPath();
    overlayCtx.moveTo(lineX, 0);
    overlayCtx.lineTo(lineX, h);
    overlayCtx.strokeStyle = "rgba(255, 255, 0, 0.9)";
    overlayCtx.lineWidth = 3;
    overlayCtx.stroke();
    overlayCtx.closePath();
}

async function trackHandsLoop() {
    if (!running || !detector || !videoEl) return;

    const hands = await detector.estimateHands(videoEl, {
        flipHorizontal: true
    });

    let wrist = null;

    if (hands.length > 0) {
        const hand = hands[0];

        // keypoints[0] is the wrist for this model
        wrist = hand.keypoints[0]; // {x, y}

        // Normalize by video width -> 0..1
        const xNorm = wrist.x / videoEl.videoWidth;
        const clamped = Math.min(1, Math.max(0, xNorm));

        window.handX = clamped;

        // Draw visual tracker (wrist + vertical line)
        drawWebcamOverlay(wrist, clamped);
    } else {
        // No hand detected
        window.handX = null;

        // Draw the faint center line so overlay is still visible
        drawWebcamOverlay(null, null);
    }

    requestAnimationFrame(trackHandsLoop);
}

// Show/hide webcam container via checkbox
function setupWebcamToggle() {
    const container = document.getElementById("webcamContainer");
    const checkbox = document.getElementById("toggleWebcam");
    if (!container || !checkbox) return;

    // initial state
    container.style.display = checkbox.checked ? "flex" : "none";

    checkbox.addEventListener("change", () => {
        container.style.display = checkbox.checked ? "flex" : "none";
    });
}

async function initHandControl() {
    if (running) return; // already running
    running = true;

    setupWebcamToggle();

    try {
        await setupWebcam();
        detector = await createDetector();
        console.log("Hand detector created");
        trackHandsLoop();
    } catch (err) {
        console.error("Error initializing hand control:", err);
    }
}

// expose to window so template can call it
window.initHandControl = initHandControl;
