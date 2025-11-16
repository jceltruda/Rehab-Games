// ---- Game Config ----
const WIDTH = 800;
const HEIGHT = 600;
const FPS = 60;

const BRICK_ROWS = 6;
const BRICK_COLS = 10;
const BRICK_WIDTH = WIDTH / BRICK_COLS;
const BRICK_HEIGHT = 25;

const PADDLE_WIDTH = 100;
const PADDLE_HEIGHT = 15;

const BASE_PADDLE_SPEED = 7;
const BASE_BALL_SPEED = 5;

// Difficulty settings: matches your Python DIFFICULTIES
const DIFFICULTIES = {
    "1": { label: "Easy", mult: 0.75 },
    "2": { label: "Normal", mult: 1.0 },
    "3": { label: "Hard", mult: 1.3 },
};

// Colors
const COLORS = {
    BLACK: "#000000",
    WHITE: "#FFFFFF",
    GREY: "#646464",
    RED: "rgb(220,20,60)",
    GREEN: "rgb(0,200,0)",
    BLUE: "rgb(30,144,255)",
    YELLOW: "rgb(255,215,0)",
    PURPLE: "rgb(138,43,226)",
    ORANGE: "rgb(255,140,0)",
};

const BRICK_COLORS = [
    COLORS.RED,
    COLORS.ORANGE,
    COLORS.YELLOW,
    COLORS.GREEN,
    COLORS.BLUE,
    COLORS.PURPLE,
];

// ---- Input state ----
const keys = {
    left: false,
    right: false,
    space: false,
    r: false,
    l: false,
    one: false,
    two: false,
    three: false,
};

// ---- Game states ----
const STATE = {
    HAND_SELECT: "hand_select",
    DIFF_SELECT: "diff_select",
    PLAYING: "playing",
    GAME_OVER: "game_over",
};

let canvas, ctx;
let gameState = STATE.HAND_SELECT;

let handLabel = "Right hand";
let difficultyLabel = "Normal";
let difficultyMult = 1.0;

let paddle, ball, bricks;
let lives = 3;
let score = 0;
let win = false;
let scoreSubmitted = false;  

// ---- Paddle class ----
class Paddle {
    constructor(speedMult) {
        this.w = PADDLE_WIDTH;
        this.h = PADDLE_HEIGHT;
        this.x = (WIDTH - this.w) / 2;
        this.y = HEIGHT - 60;
        this.speed = BASE_PADDLE_SPEED * speedMult;
    }

    update() {
        // --- NEW: use webcam handX if available ---
        if (typeof window.handX === "number") {
            // Apply left/right hand mirroring so both feel natural
            let normX = window.handX;  // 0..1
            if (handLabel === "Left hand") {
                normX = 1 - normX;
            }

            const targetCenterX = normX * WIDTH;
            this.x = targetCenterX - this.w / 2;
        } else {
            // Fallback to keyboard control
            if (keys.left) this.x -= this.speed;
            if (keys.right) this.x += this.speed;
        }

        // Clamp to bounds
        if (this.x < 0) this.x = 0;
        if (this.x + this.w > WIDTH) this.x = WIDTH - this.w;
    }

    draw(ctx) {
        ctx.fillStyle = COLORS.WHITE;
        ctx.fillRect(this.x, this.y, this.w, this.h);
    }
}

// ---- Ball class ----
class Ball {
    constructor(speedMult) {
        this.r = BASE_BALL_SPEED;
        this.baseSpeed = BASE_BALL_SPEED * speedMult;
        this.stuckToPaddle = true;
        this.resetPositionOnly();
    }

    resetPositionOnly() {
        this.x = WIDTH / 2;
        this.y = HEIGHT / 2;
        const dir = Math.random() < 0.5 ? -1 : 1;
        const angle = dir * (0.5 + Math.random() * 0.5);
        this.dx = this.baseSpeed * angle;
        this.dy = -this.baseSpeed;
        this.stuckToPaddle = true;
    }

    update(paddle, bricks) {
        if (this.stuckToPaddle) {
            this.x = paddle.x + paddle.w / 2;
            this.y = paddle.y - this.r - 1;
            return 0;
        }

        this.x += this.dx;
        this.y += this.dy;

        // Walls
        if (this.x - this.r <= 0) {
            this.x = this.r;
            this.dx *= -1;
        }
        if (this.x + this.r >= WIDTH) {
            this.x = WIDTH - this.r;
            this.dx *= -1;
        }
        if (this.y - this.r <= 0) {
            this.y = this.r;
            this.dy *= -1;
        }

        // Paddle
        if (
            this.y + this.r >= paddle.y &&
            this.x >= paddle.x &&
            this.x <= paddle.x + paddle.w &&
            this.dy > 0
        ) {
            this.y = paddle.y - this.r;
            this.dy *= -1;

            const offset = (this.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
            this.dx += offset * 2;
        }

        // Bricks
        let destroyed = 0;
        for (let i = 0; i < bricks.length; i++) {
            const b = bricks[i];
            if (this.collidesWithBrick(b)) {
                destroyed = 1;
                const hitFromSide =
                    Math.abs(this.x - b.x) < this.r ||
                    Math.abs(this.x - (b.x + b.w)) < this.r;
                if (hitFromSide) {
                    this.dx *= -1;
                } else {
                    this.dy *= -1;
                }
                bricks.splice(i, 1);
                break;
            }
        }
        return destroyed;
    }

    collidesWithBrick(brick) {
        const cx = this.x;
        const cy = this.y;
        return (
            cx >= brick.x &&
            cx <= brick.x + brick.w &&
            cy >= brick.y &&
            cy <= brick.y + brick.h
        );
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.YELLOW;
        ctx.fill();
        ctx.closePath();
    }
}

// ---- Brick class ----
class Brick {
    constructor(x, y, w, h, color) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.color = color;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.w, this.h);
        ctx.strokeStyle = COLORS.BLACK;
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.w, this.h);
    }
}

// ---- Helpers ----
function createBricks() {
    const bricks = [];
    for (let row = 0; row < BRICK_ROWS; row++) {
        for (let col = 0; col < BRICK_COLS; col++) {
            const x = col * BRICK_WIDTH;
            const y = row * BRICK_HEIGHT + 50;
            const color = BRICK_COLORS[row % BRICK_COLORS.length];
            bricks.push(new Brick(x, y, BRICK_WIDTH, BRICK_HEIGHT, color));
        }
    }
    return bricks;
}

function drawText(ctx, text, size, color, cx, cy) {
    ctx.fillStyle = color;
    ctx.font = `bold ${size}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, cx, cy);
}

async function submitScore(score) {
    try {
        const resp = await fetch("/submit_score/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                player: "Guest",
                game: "arkanoid",
                score: score,
                difficulty: difficultyLabel,  // include difficulty
            }),
        });

        if (!resp.ok) {
            console.error("Submit failed:", resp.status, await resp.text());
        } else {
            console.log("Score submitted!");
        }
    } catch (err) {
        console.error("Error submitting score:", err);
    }
}


function handleGameOver(didWin) {
    if (!scoreSubmitted) {
        console.log("handleGameOver called. didWin =", didWin, "score =", score);
        scoreSubmitted = true;
        submitScore(score);
    }
    win = didWin;
    gameState = STATE.GAME_OVER;
}

// ---- Input handling ----
window.addEventListener("keydown", (e) => {
    const key = e.key;

    if (gameState === STATE.HAND_SELECT) {
        if (key === "r" || key === "R") {
            handLabel = "Right hand";
            gameState = STATE.DIFF_SELECT;
        } else if (key === "l" || key === "L") {
            handLabel = "Left hand";
            gameState = STATE.DIFF_SELECT;
        }
        return;
    }

    if (gameState === STATE.DIFF_SELECT) {
        if (key === "1" || key === "2" || key === "3") {
            const diff = DIFFICULTIES[key];
            difficultyLabel = diff.label;
            difficultyMult = diff.mult;
            startNewGame();
            gameState = STATE.PLAYING;
        }
        return;
    }

    if (gameState === STATE.PLAYING) {
        if (key === "ArrowLeft" || key === "a" || key === "A") keys.left = true;
        if (key === "ArrowRight" || key === "d" || key === "D") keys.right = true;
        if (key === " ") keys.space = true;
        return;
    }

    if (gameState === STATE.GAME_OVER) {
        if (key === "r" || key === "R") {
            startNewGame();
            gameState = STATE.PLAYING;
        }
    }
});

window.addEventListener("keyup", (e) => {
    const key = e.key;
    if (key === "ArrowLeft" || key === "a" || key === "A") keys.left = false;
    if (key === "ArrowRight" || key === "d" || key === "D") keys.right = false;
    if (key === " ") keys.space = false;
});

// ---- Game setup ----
function startNewGame() {
    paddle = new Paddle(difficultyMult);
    ball = new Ball(difficultyMult);
    bricks = createBricks();
    lives = 3;
    score = 0;
    win = false;
    scoreSubmitted = false;
}

// ---- Main loop ----
function update() {
    if (gameState === STATE.PLAYING) {
        paddle.update();

        const before = bricks.length;
        ball.update(paddle, bricks);
        const after = bricks.length;
        const diff = before - after;
        if (diff > 0) {
            score += diff * 10;
        }

        // Launch with space
        if (ball.stuckToPaddle && keys.space) {
            ball.stuckToPaddle = false;
        }

        // Lost ball
        if (ball.y - ball.r > HEIGHT) {
            lives -= 1;
            if (lives <= 0) {
                handleGameOver(false);
            } else {
                ball.resetPositionOnly();
            }
        }

        // Win condition
        if (bricks.length === 0) {
            handleGameOver(true);
        }
    }

    draw();
    requestAnimationFrame(update);
}

// ---- Drawing ----
function draw() {
    if (!ctx) return;

    ctx.fillStyle = COLORS.GREY;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    if (gameState === STATE.HAND_SELECT) {
        drawText(ctx, "Select Control Hand", 40, COLORS.WHITE, WIDTH / 2, HEIGHT / 2 - 60);
        drawText(ctx, "Press R for RIGHT hand", 30, COLORS.BLUE, WIDTH / 2, HEIGHT / 2);
        drawText(ctx, "Press L for LEFT hand", 30, COLORS.GREEN, WIDTH / 2, HEIGHT / 2 + 40);
        return;
    }

    if (gameState === STATE.DIFF_SELECT) {
        drawText(ctx, "Select Difficulty", 40, COLORS.WHITE, WIDTH / 2, HEIGHT / 2 - 80);
        drawText(ctx, "1 - Easy (slower)", 28, COLORS.GREEN, WIDTH / 2, HEIGHT / 2 - 20);
        drawText(ctx, "2 - Normal", 28, COLORS.YELLOW, WIDTH / 2, HEIGHT / 2 + 20);
        drawText(ctx, "3 - Hard (faster)", 28, COLORS.RED, WIDTH / 2, HEIGHT / 2 + 60);
        return;
    }

    // Bricks
    for (const b of bricks) {
        b.draw(ctx);
    }

    // Paddle & ball
    paddle.draw(ctx);
    ball.draw(ctx);

    // HUD
    drawText(ctx, `Score: ${score}`, 22, COLORS.WHITE, 80, 20);
    drawText(ctx, `Lives: ${lives}`, 22, COLORS.WHITE, WIDTH - 80, 20);
    drawText(ctx, `Difficulty: ${difficultyLabel}`, 22, COLORS.WHITE, WIDTH / 2, 20);
    drawText(ctx, `Hand: ${handLabel}`, 20, COLORS.WHITE, WIDTH / 2, 50);

    if (ball.stuckToPaddle && gameState === STATE.PLAYING) {
        drawText(
            ctx,
            "Press SPACE to launch",
            26,
            COLORS.WHITE,
            WIDTH / 2,
            HEIGHT / 2 + 40
        );
    }

    if (gameState === STATE.GAME_OVER) {
        const msg = win ? "YOU WIN!" : "GAME OVER";
        drawText(ctx, msg, 48, COLORS.WHITE, WIDTH / 2, HEIGHT / 2 - 20);
        drawText(
            ctx,
            "Press R to restart",
            24,
            COLORS.WHITE,
            WIDTH / 2,
            HEIGHT / 2 + 30
        );
    }
}

function startArkanoid() {
    if (canvas && ctx) {
        // If already initialized, just reset game state
        gameState = STATE.HAND_SELECT;
        return;
    }

    canvas = document.getElementById("arkanoidCanvas");
    if (!canvas) {
        console.error("Canvas #arkanoidCanvas not found.");
        return;
    }
    ctx = canvas.getContext("2d");

    gameState = STATE.HAND_SELECT;
    requestAnimationFrame(update);
}

// expose to the global window so HTML can call it
window.startArkanoid = startArkanoid;
