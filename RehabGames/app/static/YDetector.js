// YDetector.js
const YDetector = (function () {
    let lastY = null;
    let threshold = 0.02;
    let mode = "continuous";
    let callbacks = [];
    let active = false;

    function init(config = {}) {
        threshold = config.threshold || threshold;
        mode = config.mode || mode;

        VisionEngine.onHandMove(coords => {
            detect(coords);
        });
    }

    function detect(coords) {
        if (lastY === null) {
            lastY = coords.y;
            return;
        }

        const dy = coords.y - lastY;
        lastY = coords.y;

        let direction = null;
        if (dy > threshold) direction = "DOWN";
        else if (dy < -threshold) direction = "UP";

        if (mode === "continuous" && direction) {
            callbacks.forEach(cb => cb(direction));
        }

        if (mode === "discrete") {
            if (!active && direction) {
                active = true;
                callbacks.forEach(cb => cb(direction));
            } else if (!direction) {
                active = false;
            }
        }
    }

    function onMove(cb) {
        callbacks.push(cb);
    }

    return {
        init,
        onMove
    };
})();
