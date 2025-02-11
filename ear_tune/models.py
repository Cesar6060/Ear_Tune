from django.db import models
from django.contrib.auth.models import User

# Create your models here.
class Game(models.Model):
    """A type of game available to play."""
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    def __str__(self):
        """Return the name of the game"""
        return self.name


class Challenge(models.Model):
    """ An ear-training challenge for users to complete where each challenge is linked to a specific game."""
    game = models.ForeignKey(
        Game, 
        on_delete=models.CASCADE, 
        related_name='challenges', 
        null=True, 
        blank=True
    )

    CHALLENGE_TYPE_CHOICES = [
        ('note', 'Note'),
        ('chord', 'Chord'),
        # Additional challenge types can be added here

    ]
    challenge_type = models.CharField(max_length=20, choices=CHALLENGE_TYPE_CHOICES)
    prompt = models.CharField(max_length=200) 
    correct_answer = models.CharField(max_length=50)

    def __str__(self):
        """Return a string representation of the challenge."""
        return f"{self.get_challenge_type_display()} - {self.prompt}"
    

class GameSession(models.Model):
    """A record of a user's game session, tracking performance"""
    date_played = models.DateTimeField(auto_now_add=True)

    score = models.IntegerField(default=0)
    challenge = models.ForeignKey(Challenge, on_delete=models.CASCADE, related_name='game_sessions')

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='game_sessions')


    def __str__(self):
        """Return a string representation of the game session."""
        return f"Session on {self.date_played} with score {self.score}"

