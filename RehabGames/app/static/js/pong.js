document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    // --- Player Input Abstraction ---
    let playerInput = 'STOP'; // Possible states: 'UP', 'DOWN', 'STOP'

    // --- Event Listeners for Player Input ---
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowUp') {
            playerInput = 'UP';
        } else if (e.key === 'ArrowDown') {
            playerInput = 'DOWN';
        }
    });

    document.addEventListener('keyup', (e) => {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            playerInput = 'STOP';
        }
    });

    // --- Game Objects ---
    const paddleWidth = 10;
    const paddleHeight = 100;

    const playerPaddle = {
        x: 10,
        y: canvas.height / 2 - paddleHeight / 2,
        width: paddleWidth,
        height: paddleHeight,
        color: 'white',
        score: 0,
        speed: 8
    };

    const aiPaddle = {
        x: canvas.width - paddleWidth - 10,
        y: canvas.height / 2 - paddleHeight / 2,
        width: paddleWidth,
        height: paddleHeight,
        color: 'white',
        score: 0,
        speed: 6 // AI speed slightly slower for a beatable AI
    };

    const ball = {
        x: canvas.width / 2,
        y: canvas.height / 2,
        radius: 7,
        speed: 5,
        velocityX: 5,
        velocityY: 5,
        color: 'white'
    };

    // --- Helper function to reset the ball ---
    function resetBall() {
        ball.x = canvas.width / 2;
        ball.y = canvas.height / 2;
        ball.speed = 5;
        // Serve to the player who just scored
        ball.velocityX = -ball.velocityX;
        ball.velocityY = 5; // Reset vertical velocity
    }

    // --- Update Function (Game Logic) ---
    function update() {
        // Move Player Paddle based on input variable
        if (playerInput === 'UP' && playerPaddle.y > 0) {
            playerPaddle.y -= playerPaddle.speed;
        } else if (playerInput === 'DOWN' && playerPaddle.y < canvas.height - playerPaddle.height) {
            playerPaddle.y += playerPaddle.speed;
        }

        // Simple AI for AI Paddle
        const aiCenter = aiPaddle.y + aiPaddle.height / 2;
        if (aiCenter < ball.y - 35 && aiPaddle.y < canvas.height - aiPaddle.height) {
            aiPaddle.y += aiPaddle.speed;
        } else if (aiCenter > ball.y + 35 && aiPaddle.y > 0) {
            aiPaddle.y -= aiPaddle.speed;
        }

        // Move the ball
        ball.x += ball.velocityX;
        ball.y += ball.velocityY;

        // Ball collision with top and bottom walls
        if (ball.y + ball.radius > canvas.height || ball.y - ball.radius < 0) {
            ball.velocityY = -ball.velocityY;
        }

        // Ball collision with paddles
        let player = (ball.x < canvas.width / 2) ? playerPaddle : aiPaddle;
        if (collision(ball, player)) {
            // Calculate where the ball hit the paddle
            let collidePoint = (ball.y - (player.y + player.height / 2));
            // Normalize the value
            collidePoint = collidePoint / (player.height / 2);
            // Calculate the angle in Radian
            let angleRad = (Math.PI / 4) * collidePoint;

            // Change the X and Y velocity direction
            let direction = (ball.x < canvas.width / 2) ? 1 : -1;
            ball.velocityX = direction * ball.speed * Math.cos(angleRad);
            ball.velocityY = ball.speed * Math.sin(angleRad);

            // Increase ball speed after each hit
            ball.speed += 0.2;
        }

        // Scoring
        if (ball.x - ball.radius < 0) {
            // AI scores
            aiPaddle.score++;
            resetBall();
        } else if (ball.x + ball.radius > canvas.width) {
            // Player scores
            playerPaddle.score++;
            resetBall();
        }
    }

    function collision(b, p) {
        p.top = p.y;
        p.bottom = p.y + p.height;
        p.left = p.x;
        p.right = p.x + p.width;

        b.top = b.y - b.radius;
        b.bottom = b.y + b.radius;
        b.left = b.x - b.radius;
        b.right = b.x + b.radius;

        return p.left < b.right && p.top < b.bottom && p.right > b.left && p.bottom > b.top;
    }

    // --- Draw Function ---
    function draw() {
        // Clear the canvas with a black rectangle
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw the center line
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, 0);
        ctx.lineTo(canvas.width / 2, canvas.height);
        ctx.stroke();
        ctx.setLineDash([]); // Reset line dash

        // Draw the scores
        ctx.fillStyle = 'white';
        ctx.font = '45px "Press Start 2P"';
        ctx.fillText(playerPaddle.score, canvas.width / 4, 50);
        ctx.fillText(aiPaddle.score, 3 * canvas.width / 4, 50);

        // Draw the paddles
        ctx.fillStyle = playerPaddle.color;
        ctx.fillRect(playerPaddle.x, playerPaddle.y, playerPaddle.width, playerPaddle.height);
        ctx.fillStyle = aiPaddle.color;
        ctx.fillRect(aiPaddle.x, aiPaddle.y, aiPaddle.width, aiPaddle.height);

        // Draw the ball
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = ball.color;
        ctx.fill();
    }

    // --- Game Loop ---
    function gameLoop() {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }

    // --- Start the Game ---
    gameLoop();
});
