import pygame
import sys
import random

# --- Game Constants ---
SCREEN_WIDTH = 400
SCREEN_HEIGHT = 600
BIRD_WIDTH = 95  # This is the full *image* width
BIRD_HEIGHT = 95 # This is the full *image* height
GRAVITY = 0.25
FLAP_STRENGTH = -5.5
FAST_FALL_STRENGTH = 1.5
HORIZONTAL_SPEED = 3
PIPE_WIDTH = 80

# --- NEW: Hitbox Adjustment ---
# Tweak these values to make the hitbox smaller than the image
# This value is for *both sides* (e.g., 10px total shrink means 5px from left, 5px from right)
HITBOX_X_SHRINK = 40 # Try values from 5-15
HITBOX_Y_SHRINK = 54  # Try values from 4-10

# --- Colors ---
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
SKY_BLUE = (112, 197, 206)
GREEN = (0, 128, 0)
YELLOW = (255, 215, 0)

# --- Difficulty Settings ---
DIFFICULTY_LEVELS = {
    'Easy': {
        'PIPE_GAP': 225,       # Much larger gap
        'PIPE_SPEED': 1.5,      # Much slower pipes
        'PIPE_SPACING': 2200    # Much more time between pipes
    },
    'Medium': {
        'PIPE_GAP': 175,       # This was the old 'Easy'
        'PIPE_SPEED': 2.0,      # This was the old 'Easy'
        'PIPE_SPACING': 1800    # This was the old 'Easy'
    },
    'Hard': {
        'PIPE_GAP': 150,       # This was the old 'Medium'
        'PIPE_SPEED': 2.5,      # This was the old 'Medium'
        'PIPE_SPACING': 1500    # This was the old 'Medium'
    }
}
DIFFICULTY_NAMES = ['Easy', 'Medium', 'Hard']

# --- Global Game Variables (set by difficulty) ---
DEFAULT_DIFFICULTY_NAME = DIFFICULTY_NAMES[0]
GAME_PIPE_GAP = DIFFICULTY_LEVELS[DEFAULT_DIFFICULTY_NAME]['PIPE_GAP']
GAME_PIPE_SPEED = DIFFICULTY_LEVELS[DEFAULT_DIFFICULTY_NAME]['PIPE_SPEED']
GAME_PIPE_SPACING = DIFFICULTY_LEVELS[DEFAULT_DIFFICULTY_NAME]['PIPE_SPACING']

# =================================================================
# --- SWAPPABLE INPUT SECTION (START) ---
# =================================================================
controls = {
    'up': False, 'down': False, 'left': False, 'right': False
}

def handle_keyboard_input(event):
    if event.type == pygame.KEYDOWN:
        if event.key == pygame.K_UP: controls['up'] = True
        if event.key == pygame.K_DOWN: controls['down'] = True
        if event.key == pygame.K_LEFT: controls['left'] = True
        if event.key == pygame.K_RIGHT: controls['right'] = True
    if event.type == pygame.KEYUP:
        if event.key == pygame.K_UP: controls['up'] = False
        if event.key == pygame.K_DOWN: controls['down'] = False
        if event.key == pygame.K_LEFT: controls['left'] = False
        if event.key == pygame.K_RIGHT: controls['right'] = False
# =================================================================
# --- SWAPPABLE INPUT SECTION (END) ---
# =================================================================

class Bird:
    def __init__(self):
        # self.rect is still the main rectangle for drawing and position
        self.rect = pygame.Rect(SCREEN_WIDTH // 4, SCREEN_HEIGHT // 2, BIRD_WIDTH, BIRD_HEIGHT)
        self.velocity_y = 0
        self.velocity_x = 0
        
        try:
            original_image = pygame.image.load('flappyBird/bird.png').convert_alpha()
            self.image = pygame.transform.scale(original_image, (BIRD_WIDTH, BIRD_HEIGHT))
        except pygame.error:
            print("Warning: 'flappyBird/bird.png' not found. Using a yellow rectangle for the bird.")
            self.image = None # Fallback to drawing a rectangle if image not found

    def update(self):
        self.velocity_y += GRAVITY
        if controls['up']: self.velocity_y = FLAP_STRENGTH
        if controls['down']: self.velocity_y += FAST_FALL_STRENGTH
        self.velocity_x = 0
        if controls['left']: self.velocity_x = -HORIZONTAL_SPEED
        if controls['right']: self.velocity_x = HORIZONTAL_SPEED
        
        self.rect.y += self.velocity_y
        self.rect.x += self.velocity_x

        if self.rect.left < 0: self.rect.left = 0
        if self.rect.right > SCREEN_WIDTH: self.rect.right = SCREEN_WIDTH

    def draw(self, screen):
        if self.image:
            screen.blit(self.image, self.rect)
        else:
            pygame.draw.rect(screen, YELLOW, self.rect) # Fallback drawing
        
        # --- Optional: Uncomment this line to see your hitbox ---
        # This line is now UNCOMMENTED so you can see the red box:
        # pygame.draw.rect(screen, (255, 0, 0), self.get_hitbox(), 2)

    def get_hitbox(self):
        # Create a new, smaller rectangle for collision
        # This is the "shrunken" hitbox
        return self.rect.inflate(-HITBOX_X_SHRINK, -HITBOX_Y_SHRINK)

    def check_collision(self, pipes):
        # --- MODIFIED: Use the new get_hitbox() method ---
        hitbox = self.get_hitbox()

        # Check for ground/sky collision with the shrunken box
        if hitbox.top <= 0 or hitbox.bottom >= SCREEN_HEIGHT: 
            return True
        
        # Check for pipe collision with the shrunken box
        for pipe in pipes:
            if hitbox.colliderect(pipe.top_rect) or hitbox.colliderect(pipe.bottom_rect): 
                return True
        return False

class Pipe:
    def __init__(self, x):
        self.x = x
        self.width = PIPE_WIDTH
        self.gap_top = random.randint(100, SCREEN_HEIGHT - GAME_PIPE_GAP - 100)
        self.top_rect = pygame.Rect(self.x, 0, self.width, self.gap_top)
        self.bottom_rect = pygame.Rect(self.x, self.gap_top + GAME_PIPE_GAP, self.width, SCREEN_HEIGHT - (self.gap_top + GAME_PIPE_GAP))
        self.passed = False

    def update(self):
        self.x -= GAME_PIPE_SPEED
        self.top_rect.x = self.x
        self.bottom_rect.x = self.x

    def draw(self, screen):
        pygame.draw.rect(screen, GREEN, self.top_rect)
        pygame.draw.rect(screen, GREEN, self.bottom_rect)

def draw_text(screen, text, font, color, x, y, center=True):
    text_surface = font.render(text, True, color)
    text_rect = text_surface.get_rect()
    if center: text_rect.center = (x, y)
    else: text_rect.topleft = (x, y)
    screen.blit(text_surface, text_rect)

def main():
    pygame.init()
    screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
    pygame.display.set_caption("Shoulder-Bird Rehab")
    clock = pygame.time.Clock()
    font_large = pygame.font.Font(None, 72)
    font_small = pygame.font.Font(None, 36)
    font_menu = pygame.font.Font(None, 48)

    game_state = 'menu'
    bird = Bird() # Bird instance created here
    pipes = []
    score = 0
    selected_difficulty_index = 0

    SPAWN_PIPE_EVENT = pygame.USEREVENT

    running = True
    while running:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
                pygame.quit()
                sys.exit()

            handle_keyboard_input(event) 
            
            if game_state == 'playing' and event.type == SPAWN_PIPE_EVENT:
                pipes.append(Pipe(SCREEN_WIDTH))
            
            if event.type == pygame.KEYDOWN:
                if game_state == 'menu':
                    if event.key == pygame.K_UP:
                        selected_difficulty_index = (selected_difficulty_index - 1) % len(DIFFICULTY_NAMES)
                    elif event.key == pygame.K_DOWN:
                        selected_difficulty_index = (selected_difficulty_index + 1) % len(DIFFICULTY_NAMES)
                    elif event.key == pygame.K_RETURN:
                        global GAME_PIPE_GAP, GAME_PIPE_SPEED, GAME_PIPE_SPACING
                        selected_diff = DIFFICULTY_NAMES[selected_difficulty_index]
                        GAME_PIPE_GAP = DIFFICULTY_LEVELS[selected_diff]['PIPE_GAP']
                        GAME_PIPE_SPEED = DIFFICULTY_LEVELS[selected_diff]['PIPE_SPEED']
                        GAME_PIPE_SPACING = DIFFICULTY_LEVELS[selected_diff]['PIPE_SPACING']
                        
                        pygame.time.set_timer(SPAWN_PIPE_EVENT, GAME_PIPE_SPACING)
                        
                        game_state = 'playing'
                        bird = Bird() # Re-create bird for a fresh start with potentially new image
                        pipes = []
                        score = 0
                        controls['up'] = False 
                
                elif game_state == 'game_over':
                    if event.key == pygame.K_UP or event.key == pygame.K_RETURN:
                        game_state = 'menu'
                        pygame.time.set_timer(SPAWN_PIPE_EVENT, 0)

        screen.fill(SKY_BLUE)

        if game_state == 'playing':
            bird.update()
            for pipe in pipes[:]:
                pipe.update()
                if pipe.x + pipe.width < 0: pipes.remove(pipe)
                if not pipe.passed and pipe.x < bird.rect.x:
                    pipe.passed = True
                    score += 1
            
            if bird.check_collision(pipes): game_state = 'game_over' 

            for pipe in pipes: pipe.draw(screen)
            bird.draw(screen)
            draw_text(screen, str(score), font_large, WHITE, SCREEN_WIDTH // 2, 50)
        
        elif game_state == 'menu':
            bird.draw(screen)
            draw_text(screen, "Shoulder-Bird", font_large, WHITE, SCREEN_WIDTH // 2, SCREEN_HEIGHT // 4)
            draw_text(screen, "Select Difficulty:", font_small, WHITE, SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 - 50)
            
            for i, diff_name in enumerate(DIFFICULTY_NAMES):
                color = YELLOW if i == selected_difficulty_index else WHITE
                draw_text(screen, diff_name, font_menu, color, SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 + i * 50)
            
            draw_text(screen, "Use UP/DOWN to select", font_small, WHITE, SCREEN_WIDTH // 2, SCREEN_HEIGHT - 100)
            draw_text(screen, "Press ENTER to start", font_small, WHITE, SCREEN_WIDTH // 2, SCREEN_HEIGHT - 50)

        elif game_state == 'game_over':
            for pipe in pipes: pipe.draw(screen)
            bird.draw(screen)
            draw_text(screen, "Game Over", font_large, WHITE, SCREEN_WIDTH // 2, SCREEN_HEIGHT // 3)
            draw_text(screen, f"Score: {score}", font_small, WHITE, SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2)
            draw_text(screen, "Press UP for menu", font_small, WHITE, SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 + 50)

        pygame.display.flip()
        clock.tick(60)

if __name__ == "__main__":
    main()