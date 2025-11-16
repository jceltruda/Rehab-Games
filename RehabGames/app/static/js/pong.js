document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const gameButton = document.getElementById('gameControlButton');
    const easyBtn = document.getElementById('easyBtn');
    const mediumBtn = document.getElementById('mediumBtn');
    const hardBtn = document.getElementById('hardBtn');
    mediumBtn.classList.add('active-difficulty');

    // --- Difficulty Settings ---
    const difficultySettings = {
        EASY: {
            ballSpeed: 4,
            aiReaction: 0.03 // Slower AI   
        },
        MEDIUM: {
            ballSpeed: 6,
            aiReaction: 0.05 // The old baseline
        },
        HARD: {
            ballSpeed: 8, // Faster ball
            aiReaction: 0.05 // Same AI as medium
        }
    };

    let currentSettings = difficultySettings.MEDIUM;

    // --- Game State ---
    let gameState = 'START'; // 'START', 'PLAYING', 'PAUSED'
    let visionControl = true; // Control with vision by default

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

    // --- Button Control Logic ---
    gameButton.addEventListener('click', () => {
        if (gameState === 'START') {
            gameState = 'PLAYING';
            gameButton.textContent = 'Pause';
        } else if (gameState === 'PLAYING') {
            gameState = 'PAUSED';
            gameButton.textContent = 'Resume';
        } else if (gameState === 'PAUSED') {
            gameState = 'PLAYING';
            gameButton.textContent = 'Pause';
        }
    });

    // --- Difficulty Button Listeners ---
    easyBtn.addEventListener('click', () => setDifficulty('EASY'));
    mediumBtn.addEventListener('click', () => setDifficulty('MEDIUM'));
    hardBtn.addEventListener('click', () => setDifficulty('HARD'));

    function setDifficulty(difficulty) {
        // --- ADD THIS BLOCK ---
        // 1. Remove active class from all buttons
        easyBtn.classList.remove('active-difficulty');
        mediumBtn.classList.remove('active-difficulty');
        hardBtn.classList.remove('active-difficulty');

        // 2. Add active class to the selected button
        if (difficulty === 'EASY') {
            easyBtn.classList.add('active-difficulty');
        } else if (difficulty === 'MEDIUM') {
            mediumBtn.classList.add('active-difficulty');
        } else if (difficulty === 'HARD') {
            hardBtn.classList.add('active-difficulty');
        }
        // --- END OF NEW BLOCK ---

        currentSettings = difficultySettings[difficulty];
        playerPaddle.score = 0;
        aiPaddle.score = 0;
        resetBall();
        gameState = 'START';
        gameButton.textContent = 'Start';
    }

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
        speed: 6 // This is now a max speed
    };

    const ball = {
        x: canvas.width / 2,
        y: canvas.height / 2,
        radius: 7,
        speed: currentSettings.ballSpeed,
        velocityX: currentSettings.ballSpeed,
        velocityY: currentSettings.ballSpeed,
        color: 'white'
    };

    // --- Helper function to reset the ball ---
    function resetBall() {
        ball.x = canvas.width / 2;
        ball.y = canvas.height / 2;
        ball.speed = currentSettings.ballSpeed;
        // Serve to the player who just scored
        ball.velocityX = -ball.velocityX;
        ball.velocityY = currentSettings.ballSpeed; // Reset vertical velocity
    }

    // --- Update Function (Game Logic) ---
    function update() {
        // Vision control is now handled in the gameLoop, so we only need keyboard fallback here
        if (!visionControl) {
            // Keyboard control
            if (playerInput === 'UP' && playerPaddle.y > 0) {
                playerPaddle.y -= playerPaddle.speed;
            } else if (playerInput === 'DOWN' && playerPaddle.y < canvas.height - playerPaddle.height) {
                playerPaddle.y += playerPaddle.speed;
            }
        }

        // --- Beatable AI Logic ---
        // The AI paddle tries to follow the ball's y position, but with a slight delay.
        const targetY = ball.y - aiPaddle.height / 2;
        aiPaddle.y += (targetY - aiPaddle.y) * currentSettings.aiReaction;

        // Clamp the AI paddle's position to stay within the canvas
        if (aiPaddle.y < 0) {
            aiPaddle.y = 0;
        } else if (aiPaddle.y > canvas.height - aiPaddle.height) {
            aiPaddle.y = canvas.height - aiPaddle.height;
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

        // --- Draw Game State Messages ---
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '50px "Press Start 2P"';
        ctx.textAlign = 'center';

        if (gameState === 'START') {
            ctx.fillText('Press Start', canvas.width / 2, canvas.height / 2);
        } else if (gameState === 'PAUSED') {
            ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
        }
        ctx.textAlign = 'left'; // Reset alignment
    }

    // --- Game Loop ---
    function gameLoop() {
        // Update paddle position based on vision regardless of game state
        if (visionControl && window.handY !== null) {
            const targetY = window.handY * canvas.height;
            // Adjust for paddle center
            const smoothedY = playerPaddle.y + (targetY - (playerPaddle.y + playerPaddle.height / 2)) * 0.5; 
            
            // Clamp to canvas boundaries
            playerPaddle.y = Math.max(0, Math.min(canvas.height - playerPaddle.height, smoothedY));
        }

        // Only update game logic if the game is in 'PLAYING' state
        if (gameState === 'PLAYING') {
            update();
        }
        draw();
        requestAnimationFrame(gameLoop);
    }

    // --- Start the Game Loop ---
    // The loop now runs continuously, but the update() function is conditional.
    gameLoop();
});
