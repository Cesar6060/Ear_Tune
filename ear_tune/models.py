# ear_tune/models.py - Add attempts field to GameSession model

from django.db import models
from django.contrib.auth.models import User

# Keep existing Game and Challenge models

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
    active = models.BooleanField(default=True)
    # New field to track remaining attempts
    attempts_left = models.IntegerField(default=3)
    # Track if this is a complete session or just an attempt
    is_attempt = models.BooleanField(default=False)
    # Reference to parent session (for tracking attempts)
    parent_session = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='attempts')

    def __str__(self):
        """Return a string representation of the game session."""
        return f"Session on {self.date_played} with score {self.score}"
    


class FrequencyBand(models.Model):
    """Represents a frequency range that can be modified in the game."""
    name = models.CharField(max_length=50)  # e.g., "Sub Bass", "Mids"
    min_frequency = models.IntegerField()   # in Hz
    max_frequency = models.IntegerField()   # in Hz
    center_frequency = models.IntegerField()  # common center point
    description = models.TextField(blank=True)
    order = models.IntegerField(default=0)  # for display ordering
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return f"{self.name} ({self.min_frequency}-{self.max_frequency} Hz)"


class EQChallenge(models.Model):
    """Represents a single EQ identification challenge."""
    DIFFICULTY_CHOICES = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
    ]

    CHANGE_AMOUNT_CHOICES = [
        (-12, '-12 dB'),
        (-9, '-9 dB'),
        (-6, '-6 dB'),
        (-3, '-3 dB'),
        (0, 'No Change'),
        (3, '+3 dB'),
        (6, '+6 dB'),
        (9, '+9 dB'),
        (12, '+12 dB'),
    ]

    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='eq_challenges')
    source_audio = models.CharField(max_length=200)  # path to original audio
    frequency_band = models.ForeignKey(FrequencyBand, on_delete=models.CASCADE)
    change_amount = models.IntegerField(choices=CHANGE_AMOUNT_CHOICES)
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES)
    hint_text = models.TextField(blank=True)  # optional hint for learning

    def __str__(self):
        return f"{self.source_audio} - {self.frequency_band.name} {self.change_amount}dB"


class RhythmChallenge(models.Model):
    """Represents a rhythm pattern identification challenge."""
    DIFFICULTY_CHOICES = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
    ]

    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='rhythm_challenges')
    pattern_data = models.JSONField()  # stores rhythm pattern
    tempo = models.IntegerField(default=120)  # BPM
    time_signature = models.CharField(max_length=10, default="4/4")
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES)
    audio_file = models.CharField(max_length=200)  # path to audio file
    correct_pattern = models.JSONField()  # expected answer
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Rhythm Challenge - {self.difficulty} - {self.tempo} BPM ({self.time_signature})"  