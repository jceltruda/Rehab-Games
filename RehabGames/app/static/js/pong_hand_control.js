// static/js/pong_hand_control.js

let detector = null;
let videoEl = null;
let overlayCanvas = null;
let overlayCtx = null;
let running = false;

// Global value the game can read: 0.0 - 1.0
window.handY = null;

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
                overlayCanvas.width  = videoEl.videoWidth;
                overlayCanvas.height = videoEl.videoHeight;
                overlayCanvas.style.width  = videoEl.clientWidth + "px";
                overlayCanvas.style.height = videoEl.clientHeight + "px";
            }

            console.log("Webcam ready:", videoEl.videoWidth, videoEl.videoHeight);
            resolve();
        };
    });
}

function drawWebcamOverlay(hand, yNorm) {
    if (!overlayCtx || !overlayCanvas || !videoEl) return;

    const w = overlayCanvas.width;
    const h = overlayCanvas.height;

    overlayCtx.clearRect(0, 0, w, h);

    if (!hand || typeof yNorm !== "number") {
        overlayCtx.beginPath();
        overlayCtx.moveTo(0, h / 2);
        overlayCtx.lineTo(w, h/2);
        overlayCtx.strokeStyle = "rgba(0, 255, 255, 0.4)";
        overlayCtx.lineWidth = 2;
        overlayCtx.stroke();
        overlayCtx.closePath();
        return;
    }

    // Draw all keypoints
    for (const keypoint of hand.keypoints) {
        overlayCtx.beginPath();
        overlayCtx.arc(keypoint.x, keypoint.y, 5, 0, Math.PI * 2);
        overlayCtx.fillStyle = "rgba(255, 0, 0, 0.7)"; // Red dots for all points
        overlayCtx.fill();
        overlayCtx.closePath();
    }

    const wrist = hand.keypoints[0];
    const wx = wrist.x;
    const wy = wrist.y;

    // 1) wrist circle (larger and green)
    overlayCtx.beginPath();
    overlayCtx.arc(wx, wy, 10, 0, Math.PI * 2);
    overlayCtx.fillStyle = "rgba(0, 255, 0, 0.9)";
    overlayCtx.fill();
    overlayCtx.closePath();

    // 2) horizontal line at mapped handY (0..1)
    const lineY = yNorm * h;
    overlayCtx.beginPath();
    overlayCtx.moveTo(0, lineY);
    overlayCtx.lineTo(w, lineY);
    overlayCtx.strokeStyle = "rgba(255, 255, 0, 0.9)";
    overlayCtx.lineWidth = 3;
    overlayCtx.stroke();
    overlayCtx.closePath();
}

async function trackHandsLoop() {
    if (!running || !detector || !videoEl) return;

    const hands = await detector.estimateHands(videoEl, {
        flipHorizontal: false // The CSS transform handles the mirroring
    });

    if (hands.length > 0) {
        const hand = hands[0];
        const wrist = hand.keypoints[0];

        // The video is flipped, so we need to flip the X coordinate for normalization
        const yNorm = wrist.y / videoEl.videoHeight;
        const clamped = Math.min(1, Math.max(0, yNorm));

        window.handY = clamped;

        drawWebcamOverlay(hand, clamped);
    } else {
        window.handY = null;
        drawWebcamOverlay(null, null);
    }

    requestAnimationFrame(trackHandsLoop);
}

function setupWebcamToggle() {
    const container = document.getElementById("webcamContainer");
    const checkbox = document.getElementById("toggleWebcam");
    if (!container || !checkbox) return;

    container.style.display = checkbox.checked ? "flex" : "none";

    checkbox.addEventListener("change", () => {
        container.style.display = checkbox.checked ? "flex" : "none";
    });
}

async function initHandControl() {
    if (running) return;
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

window.initHandControl = initHandControl;
