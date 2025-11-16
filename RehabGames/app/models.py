from django.db import models

# models.py
class Score(models.Model):
    GAME_CHOICES = [
        ("arkanoid", "Arkanoid"),
        ("shoulder-bird", "Shoulder-Bird"),
    ]

    game = models.CharField(max_length=50, choices=GAME_CHOICES)
    player_name = models.CharField(max_length=100)
    score = models.IntegerField()
    difficulty = models.CharField(
        max_length=20,
        default="Easy",    # <-- add a default so migrations don’t bug you
    )
    date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.player_name} - {self.game} - {self.score}"