const XDetector = (function () {
    let lastX = null;
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
        if (lastX === null) {
            lastX = coords.x;
            return;
        }

        const dx = coords.x - lastX;
        lastX = coords.x;

        let direction = null;
        if (dx > threshold) direction = "RIGHT";
        else if (dx < -threshold) direction = "LEFT";

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
