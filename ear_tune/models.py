# ear_tune/models.py - Add attempts field to GameSession model

from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from datetime import date
import math

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


# Gamification Models

class UserProfile(models.Model):
    """User profile for tracking gamification progress."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    xp = models.IntegerField(default=0)
    level = models.IntegerField(default=1)
    total_games_played = models.IntegerField(default=0)
    total_correct_answers = models.IntegerField(default=0)
    current_streak = models.IntegerField(default=0)
    longest_streak = models.IntegerField(default=0)
    last_activity_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def calculate_level(self):
        """Calculate level from XP (100 XP per level with scaling)."""
        if self.xp == 0:
            return 1
        # Formula: level = floor(sqrt(xp / 100)) + 1
        # This creates a scaling progression: Level 1: 0 XP, Level 2: 100 XP, Level 3: 400 XP, Level 4: 900 XP, etc.
        level = math.floor(math.sqrt(self.xp / 100)) + 1
        return level

    def add_xp(self, amount):
        """Add XP and check for level up."""
        old_level = self.level
        self.xp += amount
        new_level = self.calculate_level()

        if new_level > old_level:
            self.level = new_level
            level_up = True
        else:
            self.level = new_level
            level_up = False

        self.save()
        return level_up

    def update_streak(self):
        """Check and update daily streak."""
        today = date.today()

        if self.last_activity_date is None:
            # First activity
            self.current_streak = 1
            self.last_activity_date = today
        elif self.last_activity_date == today:
            # Already played today, no change
            pass
        elif (today - self.last_activity_date).days == 1:
            # Consecutive day
            self.current_streak += 1
            self.last_activity_date = today
            # Update longest streak if needed
            if self.current_streak > self.longest_streak:
                self.longest_streak = self.current_streak
        else:
            # Streak broken
            self.current_streak = 1
            self.last_activity_date = today

        self.save()

    def __str__(self):
        return f"{self.user.username}'s Profile - Level {self.level} ({self.xp} XP)"


class Achievement(models.Model):
    """Represents an achievement that users can unlock."""
    CRITERIA_TYPE_CHOICES = [
        ('games_played', 'Games Played'),
        ('streak', 'Streak'),
        ('accuracy', 'Accuracy'),
        ('level', 'Level'),
        ('perfect_scores', 'Perfect Scores'),
    ]

    name = models.CharField(max_length=100)
    description = models.TextField()
    icon = models.CharField(max_length=50)  # emoji or icon name
    criteria_type = models.CharField(max_length=20, choices=CRITERIA_TYPE_CHOICES)
    criteria_value = models.IntegerField()  # threshold to unlock
    xp_reward = models.IntegerField(default=50)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['criteria_type', 'criteria_value']

    def __str__(self):
        return f"{self.name} - {self.get_criteria_type_display()} ({self.criteria_value})"


class UserAchievement(models.Model):
    """Tracks which achievements users have unlocked."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='achievements')
    achievement = models.ForeignKey(Achievement, on_delete=models.CASCADE)
    unlocked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'achievement']
        ordering = ['-unlocked_at']

    def __str__(self):
        return f"{self.user.username} unlocked {self.achievement.name}"


# Signal to auto-create UserProfile when User is created
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """Create a UserProfile when a new User is created."""
    if created:
        UserProfile.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """Save the UserProfile when the User is saved."""
    if hasattr(instance, 'profile'):
        instance.profile.save()


# Helper function to check and unlock achievements
def check_and_unlock_achievements(user):
    """
    Check each achievement criteria against user stats and unlock if criteria met.
    Returns list of newly unlocked achievements.
    """
    newly_unlocked = []

    # Get user profile
    profile = user.profile

    # Get all achievements
    all_achievements = Achievement.objects.all()

    # Get already unlocked achievement IDs
    unlocked_ids = UserAchievement.objects.filter(user=user).values_list('achievement_id', flat=True)

    for achievement in all_achievements:
        # Skip if already unlocked
        if achievement.id in unlocked_ids:
            continue

        # Check criteria
        criteria_met = False

        if achievement.criteria_type == 'games_played':
            criteria_met = profile.total_games_played >= achievement.criteria_value
        elif achievement.criteria_type == 'streak':
            criteria_met = profile.current_streak >= achievement.criteria_value
        elif achievement.criteria_type == 'level':
            criteria_met = profile.level >= achievement.criteria_value
        elif achievement.criteria_type == 'accuracy':
            # Calculate overall accuracy
            if profile.total_games_played > 0:
                accuracy = (profile.total_correct_answers / profile.total_games_played) * 100
                criteria_met = accuracy >= achievement.criteria_value
        elif achievement.criteria_type == 'perfect_scores':
            # Count perfect score sessions (score = 100)
            perfect_count = GameSession.objects.filter(
                user=user,
                score=100,
                is_attempt=False
            ).count()
            criteria_met = perfect_count >= achievement.criteria_value

        # Unlock if criteria met
        if criteria_met:
            UserAchievement.objects.create(
                user=user,
                achievement=achievement
            )
            # Award XP reward
            profile.add_xp(achievement.xp_reward)
            newly_unlocked.append({
                'id': achievement.id,
                'name': achievement.name,
                'description': achievement.description,
                'icon': achievement.icon,
                'xp_reward': achievement.xp_reward
            })

    return newly_unlocked