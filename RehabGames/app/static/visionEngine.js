const VisionEngine = (function () {
    let videoElement, canvasElement, ctx;
    let pose;
    let callbacks = [];
    let selectedHand = "right";

    function init(config = {}) {
        selectedHand = config.hand || "right";

        videoElement = document.createElement("video");
        videoElement.autoplay = true;
        videoElement.playsInline = true;
        videoElement.style.display = "none";

        canvasElement = document.createElement("canvas");
        canvasElement.width = 640;
        canvasElement.height = 480;
        canvasElement.style.display = "none";

        document.body.appendChild(videoElement);
        document.body.appendChild(canvasElement);
        ctx = canvasElement.getContext("2d");

        pose = new Pose({
            locateFile: (file) =>
                `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5/${file}`
        });

        pose.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            enableSegmentation: false,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        pose.onResults(onResults);

        const camera = new Camera(videoElement, {
            onFrame: async () => {
                await pose.send({ image: videoElement });
            },
            width: 640,
            height: 480,
        });
        camera.start();
    }

    function onResults(results) {
        if (!results.poseLandmarks) return;

        const lm = results.poseLandmarks;
        const hand = selectedHand === "right" ? lm[20] : lm[19];

        const output = {
            x: 1 - hand.x,
            y: hand.y,
            z: hand.z
        };

        callbacks.forEach(cb => cb(output));
    }

    function onHandMove(cb) {
        callbacks.push(cb);
    }

    return {
        init,
        onHandMove
    };
})();
