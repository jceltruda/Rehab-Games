# 🎮 Rehab Games

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://rehab-games.onrender.com/)
[![HackRPI 2025](https://img.shields.io/badge/HackRPI-2025-blue)](https://devpost.com/software/rehab-games)
[![Video Demo](https://img.shields.io/badge/video-demo-red)](https://youtu.be/QHAb9Sb3wYU)

> Turning tedious physical therapy homework into fun, engaging, and trackable web games.

Rehab Games is a webcam-based platform that transforms shoulder rehabilitation exercises into classic arcade games. Track your recovery progress while playing, making physical therapy something you'll actually look forward to.

## 🌟 Features

- **🎥 Webcam-Based Motion Tracking**: Uses MediaPipe Pose detection to track your movements in real-time
- **🕹️ Three Classic Games**:
  - **Pong**: Vertical shoulder mobility (Flexion/Extension)
  - **Flappy Bird**: Lateral arm raises (Shoulder Abduction)
  - **Arkanoid**: Horizontal arm movement (Abduction/Adduction)
- **📊 Progress Tracking**: Leaderboard system to monitor your scores and recovery over time
- **🎯 Difficulty Levels**: Easy, Medium, and Hard modes to match your rehabilitation stage
- **📱 Responsive Design**: Works on desktop browsers with webcam support

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- Webcam
- Modern web browser (Chrome, Firefox, Edge recommended)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/Rehab-Games-2.git
   cd Rehab-Games-2/RehabGames
   ```

2. **Create a virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run database migrations**
   ```bash
   python manage.py migrate
   ```

5. **Start the development server**
   ```bash
   python manage.py runserver
   ```

6. **Open your browser**
   Navigate to `http://localhost:8000`

## 🎯 How to Use

1. **Select a Game**: Choose from Pong, Flappy Bird, Arkanoid, or Road Fighter
2. **Grant Webcam Permission**: Allow your browser to access your webcam
3. **Choose Settings**: Select difficulty level and hand preference
4. **Position Yourself**: Stand where your full upper body is visible
5. **Start Playing**: Follow on-screen instructions for each game's controls
6. **Track Progress**: View your scores on the leaderboard

## 🏗️ Project Structure

```
RehabGames/
├── app/                          # Main Django application
│   ├── static/                   # Static files (CSS, JS, images)
│   │   ├── css/                  # Stylesheets
│   │   ├── js/                   # Game logic and hand tracking
│   │   └── visionEngine.js       # Core motion detection engine
│   ├── templates/                # HTML templates
│   ├── models.py                 # Database models
│   ├── views.py                  # View controllers
│   └── urls.py                   # URL routing
├── RehabGames/                   # Django project settings
│   ├── settings.py               # Configuration
│   └── urls.py                   # Root URL config
├── manage.py                     # Django management script
└── requirements.txt              # Python dependencies
```

## 🛠️ Technology Stack

### Backend
- **Django 4.2**: Web framework
- **SQLite**: Database for score tracking
- **Gunicorn**: Production WSGI server

### Frontend
- **HTML5 Canvas**: Game rendering
- **JavaScript**: Game logic
- **MediaPipe Pose**: Real-time pose detection
- **TensorFlow.js**: Machine learning backend

### Deployment
- **Render**: Hosting platform
- **WhiteNoise**: Static file serving

## 🎮 Game Details

### Pong
- **Exercise**: Shoulder Flexion/Extension (up and down)
- **Controls**: Move your arm up and down to control the paddle
- **Goal**: Beat the AI to 10 points

### Flappy Bird
- **Exercise**: Shoulder Abduction (lateral raises)
- **Controls**: Raise both arms to flap
- **Goal**: Navigate through as many pipes as possible

### Arkanoid
- **Exercise**: Shoulder Abduction/Adduction (side to side)
- **Controls**: Move your arm left and right to control the paddle
- **Goal**: Break all the bricks without losing the ball


## 📊 Database Schema

```python
# Score Model
class Score(models.Model):
    game = models.CharField(max_length=50)           # Game type
    player_name = models.CharField(max_length=100)   # Player name
    score = models.IntegerField()                    # Score achieved
    difficulty = models.CharField(max_length=20)     # Difficulty level
    date = models.DateTimeField(auto_now_add=True)   # Timestamp
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Joseph Celtruda** - [GitHub Profile](https://github.com/jceltruda)
- **Harrison Schmidt** - [GitHub Profile](https://github.com/johnsmith376)
- **Nicole Stepanenko** - [GitHub Profile](https://github.com/nstepanenko464)
- **Jimi Xia** - [GitHub Profile](https://github.com/jxia20)

## 📞 Links

- **Project Link**: [https://github.com/YOUR_USERNAME/Rehab-Games-2](https://github.com/jceltruda/Rehab-Games)
- **Live Demo**: [https://rehab-games.onrender.com/](https://rehab-games.onrender.com/)
- **DevPost**: [https://devpost.com/software/rehab-games](https://devpost.com/software/rehab-games)
- **Video Demo**: [https://www.youtube.com/watch?v=bg_oOPQS_mg](https://youtu.be/QHAb9Sb3wYU)
