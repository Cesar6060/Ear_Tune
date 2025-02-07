from django.db import models

# Create your models here.
class Challenge(models.Model):
    """ An ear-training challenge for users to complete."""
    CHALLENGE_TYPE_CHOICES = [
        ('interval', 'Interval'),
        ('chord', 'Chord'),
        # Additional challenge types can be added here

    ]
    challenge_type = models.CharField(max_length=20, choices=CHALLENGE_TYPE_CHOICES)
    prompt = models.CharField(max_length=200) # A brief description or instructions for the challenge
    correct_answer = models.CharField(max_length=50)

    def __str__(self):
        """Return a string representation of the challenge."""
        return f"{self.get_challenge_type_display()} - {self.prompt}"
    

class GameSession(models.Model):
    """A record of a user's game session, tracking performance"""
    date_played = models.DateTimeField(auto_now_add=True)
    score = models.ForeignKey(Challenge, on_delete=models.CASCADE)

    def __str__(self):
        """Return a string representation of the game session."""
        return f"Session on {self.date_played} with score {self.score}"

