import pygame
import sys
import random
import cv2
import numpy as np
import PoseModule as pm  # your pose detector

# ---- Camera config ----
wCam, hCam = 1280, 720

# ---- Game Config ----
WIDTH, HEIGHT = 800, 600
FPS = 60

BRICK_ROWS = 6
BRICK_COLS = 10
BRICK_WIDTH = WIDTH // BRICK_COLS
BRICK_HEIGHT = 25

PADDLE_WIDTH = 100
PADDLE_HEIGHT = 15

BASE_PADDLE_SPEED = 7
BASE_BALL_SPEED = 5

# Difficulty settings
DIFFICULTIES = {
    "1": ("Easy", 0.75),
    "2": ("Normal", 1.0),
    "3": ("Hard", 1.3),
}

# Colors
BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
GREY = (100, 100, 100)
RED = (220, 20, 60)
GREEN = (0, 200, 0)
BLUE = (30, 144, 255)
YELLOW = (255, 215, 0)
PURPLE = (138, 43, 226)
ORANGE = (255, 140, 0)

BRICK_COLORS = [RED, ORANGE, YELLOW, GREEN, BLUE, PURPLE]


class Paddle:
    def __init__(self, speed_multiplier: float):
        self.width = PADDLE_WIDTH
        self.height = PADDLE_HEIGHT
        self.rect = pygame.Rect(
            (WIDTH - self.width) // 2,
            HEIGHT - 60,
            self.width,
            self.height,
        )
        self.speed = BASE_PADDLE_SPEED * speed_multiplier

    def update(self, keys):
        if keys[pygame.K_LEFT] or keys[pygame.K_a]:
            self.rect.x -= self.speed
        if keys[pygame.K_RIGHT] or keys[pygame.K_d]:
            self.rect.x += self.speed

        if self.rect.left < 0:
            self.rect.left = 0
        if self.rect.right > WIDTH:
            self.rect.right = WIDTH

    def draw(self, surf):
        pygame.draw.rect(surf, WHITE, self.rect)


class Ball:
    def __init__(self, speed_multiplier: float):
        self.radius = BASE_BALL_SPEED
        self.base_speed = BASE_BALL_SPEED * speed_multiplier
        self.stuck_to_paddle = True
        self.reset_position_only()

    def reset_position_only(self):
        self.x = WIDTH // 2
        self.y = HEIGHT // 2
        angle = random.choice([-1, 1]) * random.uniform(0.5, 1.0)
        self.dx = self.base_speed * angle
        self.dy = self.base_speed * -1
        self.stuck_to_paddle = True

    @property
    def pos(self):
        return int(self.x), int(self.y)

    def update(self, paddle, bricks):
        if self.stuck_to_paddle:
            self.x = paddle.rect.centerx
            self.y = paddle.rect.top - self.radius - 1
            return

        self.x += self.dx
        self.y += self.dy

        if self.x - self.radius <= 0:
            self.x = self.radius
            self.dx *= -1
        if self.x + self.radius >= WIDTH:
            self.x = WIDTH - self.radius
            self.dx *= -1
        if self.y - self.radius <= 0:
            self.y = self.radius
            self.dy *= -1

        if (
            self.y + self.radius >= paddle.rect.top
            and paddle.rect.left <= self.x <= paddle.rect.right
            and self.dy > 0
        ):
            self.y = paddle.rect.top - self.radius
            self.dy *= -1
            offset = (self.x - paddle.rect.centerx) / (paddle.rect.width / 2)
            self.dx += offset * 2

        hit_index = None
        for i, brick in enumerate(bricks):
            if brick.rect.collidepoint(self.pos):
                hit_index = i
                if (
                    abs(self.x - brick.rect.left) < self.radius
                    or abs(self.x - brick.rect.right) < self.radius
                ):
                    self.dx *= -1
                else:
                    self.dy *= -1
                break

        if hit_index is not None:
            bricks.pop(hit_index)

    def draw(self, surf):
        pygame.draw.circle(surf, YELLOW, self.pos, self.radius)


class Brick:
    def __init__(self, x, y, w, h, color):
        self.rect = pygame.Rect(x, y, w, h)
        self.color = color

    def draw(self, surf):
        pygame.draw.rect(surf, self.color, self.rect)
        pygame.draw.rect(surf, BLACK, self.rect, 2)


def create_bricks():
    bricks = []
    for row in range(BRICK_ROWS):
        for col in range(BRICK_COLS):
            x = col * BRICK_WIDTH
            y = row * BRICK_HEIGHT + 50
            color = BRICK_COLORS[row % len(BRICK_COLORS)]
            bricks.append(Brick(x, y, BRICK_WIDTH, BRICK_HEIGHT, color))
    return bricks


def draw_text(surf, text, size, color, center):
    font = pygame.font.SysFont("arial", size, bold=True)
    render = font.render(text, True, color)
    rect = render.get_rect(center=center)
    surf.blit(render, rect)


def select_difficulty(screen, clock):
    selecting = True
    chosen_label = "Normal"
    chosen_mult = 1.0

    while selecting:
        clock.tick(FPS)
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit()
            if event.type == pygame.KEYDOWN:
                if event.key in (pygame.K_1, pygame.K_KP1):
                    chosen_label, chosen_mult = DIFFICULTIES["1"]
                    selecting = False
                elif event.key in (pygame.K_2, pygame.K_KP2):
                    chosen_label, chosen_mult = DIFFICULTIES["2"]
                    selecting = False
                elif event.key in (pygame.K_3, pygame.K_KP3):
                    chosen_label, chosen_mult = DIFFICULTIES["3"]
                    selecting = False

        screen.fill(BLACK)
        draw_text(screen, "Select Difficulty", 40, WHITE, (WIDTH//2, HEIGHT//2 - 80))
        draw_text(screen, "1 - Easy", 30, GREEN, (WIDTH//2, HEIGHT//2 - 20))
        draw_text(screen, "2 - Normal", 30, YELLOW, (WIDTH//2, HEIGHT//2 + 20))
        draw_text(screen, "3 - Hard", 30, RED, (WIDTH//2, HEIGHT//2 + 60))
        pygame.display.flip()

    return chosen_label, chosen_mult


def select_hand(screen, clock):
    selecting = True
    hand_label = "Right hand"
    wrist_idx = 16
    elbow_idx = 14

    while selecting:
        clock.tick(FPS)
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit()
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_r:
                    hand_label = "Right hand"
                    wrist_idx = 16
                    elbow_idx = 14
                    selecting = False
                elif event.key == pygame.K_l:
                    hand_label = "Left hand"
                    wrist_idx = 15
                    elbow_idx = 13
                    selecting = False

        screen.fill(BLACK)
        draw_text(screen, "Select Control Hand", 40, WHITE, (WIDTH//2, HEIGHT//2 - 60))
        draw_text(screen, "Press R for RIGHT hand", 30, BLUE, (WIDTH//2, HEIGHT//2))
        draw_text(screen, "Press L for LEFT hand", 30, GREEN, (WIDTH//2, HEIGHT//2 + 40))
        pygame.display.flip()

    return hand_label, wrist_idx, elbow_idx


def main():
    pygame.init()
    screen = pygame.display.set_mode((WIDTH, HEIGHT))
    pygame.display.set_caption("Arkanoid with Pose Control")
    clock = pygame.time.Clock()

    # Hand selection
    hand_label, wrist_idx, elbow_idx = select_hand(screen, clock)

    # Difficulty selection
    difficulty_label, difficulty_mult = select_difficulty(screen, clock)

    # Camera + Pose
    cap = cv2.VideoCapture(0)
    cap.set(3, wCam)
    cap.set(4, hCam)
    detector = pm.poseDetector()

    paddle = Paddle(difficulty_mult)
    ball = Ball(difficulty_mult)
    bricks = create_bricks()

    lives = 3
    score = 0
    running = True
    game_over = False
    win = False

    while running:
        clock.tick(FPS)
        keys = pygame.key.get_pressed()
        pose_controlled = False

        # ---- Pose detection ----
        success, img = cap.read()
        if success:
            img = detector.findPose(img, False)
            lmList = detector.findPosition(img, False)

            if len(lmList) != 0:
                try:
                    lx, ly = lmList[11][1], lmList[11][2]
                    rx, ry = lmList[12][1], lmList[12][2]
                    wx, wy = lmList[wrist_idx][1], lmList[wrist_idx][2]

                    angle = detector.findAngle(img, 12, elbow_idx, wrist_idx, draw=False)

                    cx = int((lx + rx) / 2)
                    cy = int((ly + ry) / 2)

                    dx = wx - cx
                    shoulder_width = abs(rx - lx)
                    if shoulder_width < 1:
                        shoulder_width = 1

                    max_range = shoulder_width * 2
                    dx = np.clip(dx, -max_range, max_range)
                    normalized = (dx + max_range) / (2 * max_range)
                    mapped_x = int(normalized * WIDTH)

                    # Move paddle
                    paddle.rect.centerx = mapped_x
                    paddle.rect.centerx = np.clip(paddle.rect.centerx, 0, WIDTH)

                    pose_controlled = True

                    # ---- VISUAL TRACKERS ----
                    cv2.circle(img, (lx, ly), 10, (0,255,0), cv2.FILLED)
                    cv2.circle(img, (rx, ry), 10, (0,255,0), cv2.FILLED)
                    cv2.circle(img, (cx, cy), 8, (0,255,255), cv2.FILLED)

                    wrist_color = (255,0,0) if wrist_idx == 16 else (0,0,255)
                    cv2.circle(img, (wx, wy), 10, wrist_color, cv2.FILLED)

                    cv2.line(img, (cx, cy), (wx, wy), (255,0,255), 3)

                    cam_x = int(np.interp(mapped_x, [0, WIDTH], [0, wCam]))
                    cv2.line(img, (cam_x, 0), (cam_x, hCam), (0,255,255), 2)

                    cv2.putText(
                        img,
                        f"{hand_label}: angle {int(angle)}",
                        (20,40),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        1,
                        (255,255,255),
                        2
                    )

                except:
                    pass

            cv2.imshow("Pose", img)
            if cv2.waitKey(1) & 0xFF == ord("q"):
                running = False
                continue

        # ---- Game events ----
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_SPACE and ball.stuck_to_paddle and not game_over:
                    ball.stuck_to_paddle = False
                if event.key == pygame.K_r and game_over:
                    paddle = Paddle(difficulty_mult)
                    ball = Ball(difficulty_mult)
                    bricks = create_bricks()
                    lives = 3
                    score = 0
                    game_over = False
                    win = False

        if not game_over:
            if not pose_controlled:
                paddle.update(keys)

            bricks_before = len(bricks)
            ball.update(paddle, bricks)
            score += (bricks_before - len(bricks)) * 10

            if ball.y - ball.radius > HEIGHT:
                lives -= 1
                if lives <= 0:
                    game_over = True
                else:
                    ball.reset_position_only()

            if len(bricks) == 0:
                game_over = True
                win = True

        # ---- Draw everything ----
        screen.fill(GREY)

        for brick in bricks:
            brick.draw(screen)

        paddle.draw(screen)
        ball.draw(screen)

        draw_text(screen, f"Score: {score}", 24, WHITE, (80,20))
        draw_text(screen, f"Lives: {lives}", 24, WHITE, (WIDTH-80,20))
        draw_text(screen, f"Difficulty: {difficulty_label}", 24, WHITE, (WIDTH//2,20))
        draw_text(screen, f"Hand: {hand_label}", 22, WHITE, (WIDTH//2,50))

        if ball.stuck_to_paddle and not game_over:
            draw_text(screen, "Press SPACE to launch", 28, WHITE, (WIDTH//2, HEIGHT//2 + 40))

        if game_over:
            msg = "YOU WIN!" if win else "GAME OVER"
            draw_text(screen, msg, 48, WHITE, (WIDTH//2, HEIGHT//2 - 20))
            draw_text(screen, "Press R to restart", 24, WHITE, (WIDTH//2, HEIGHT//2 + 30))

        pygame.display.flip()

    cap.release()
    cv2.destroyAllWindows()
    pygame.quit()
    sys.exit()


if __name__ == "__main__":
    main()
