const VisionEngine = (function () {
    let videoElement, canvasElement, ctx;
    let pose;
    let callbacks = [];

    let mode = "single";              
    let axes = "xy";                   
    let inputType = "continuous";     
    let selectedHand = "right";        

    const L_SH = 11, R_SH = 12;
    const L_EL = 13, R_EL = 14;
    const L_WR = 15, R_WR = 16;

    let lastState = "neutral";


    function init(config = {}) {
        selectedHand = config.hand || "right";
        mode = config.mode || "single";
        axes = config.axes || "xy";
        inputType = config.inputType || "continuous";

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

        const left = {
            shoulder: lm[L_SH],
            elbow: lm[L_EL],
            wrist: lm[L_WR]
        };

        const right = {
            shoulder: lm[R_SH],
            elbow: lm[R_EL],
            wrist: lm[R_WR]
        };

        let output;

        if (mode === "single") {
            output = processSingleArm(left, right);
        } else {
            output = processDoubleArm(left, right);
        }

        if (!output) return;

        if (inputType === "discrete") {
            output = convertToDiscrete(output);
            if (!output) return;
        }

        callbacks.forEach(cb => cb(output));
    }


    function processSingleArm(left, right) {
        const arm = selectedHand === "right" ? right : left;
        const wrist = arm.wrist;

        let out = {};

        if (axes.includes("x")) out.x = wrist.x;
        if (axes.includes("y")) out.y = wrist.y;
        out.z = wrist.z;

        return out;
    }


    function processDoubleArm(left, right) {
        const wristX = (left.wrist.x + right.wrist.x) / 2;
        const wristY = (left.wrist.y + right.wrist.y) / 2;

        let out = {};

        if (axes.includes("x")) out.x = wristX;
        if (axes.includes("y")) out.y = wristY;
        out.z = (left.wrist.z + right.wrist.z) / 2;

        out.left = left;
        out.right = right;

        return out;
    }


    function convertToDiscrete(out) {
        const thresholdUp = 0.40;     
        const thresholdDown = 0.55;   

        let leftUp = out.left?.wrist.y < out.left?.shoulder.y;
        let rightUp = out.right?.wrist.y < out.right?.shoulder.y;

        let bothUp = leftUp && rightUp;
        let bothDown =
            out.left?.wrist.y > out.left?.shoulder.y &&
            out.right?.wrist.y > out.right?.shoulder.y;

        if (bothUp && lastState !== "up") {
            lastState = "up";
            return { command: "UP" };
        }

        if (bothDown && lastState !== "down") {
            lastState = "down";
            return { command: "DOWN" };
        }

        return null;
    }


    function onMove(cb) {
        callbacks.push(cb);
    }

    function setHand(h) { selectedHand = h; }
    function setMode(m) { mode = m; }
    function setAxes(a) { axes = a; }
    function setInputType(t) { inputType = t; }

    return {
        init,
        onMove,
        setHand,
        setMode,
        setAxes,
        setInputType
    };
})();
