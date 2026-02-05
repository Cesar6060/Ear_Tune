# api/serializers.py - Updated serializers with the new GameSession fields

from rest_framework import serializers
from ear_tune.models import Game, Challenge, GameSession, FrequencyBand, EQChallenge, RhythmChallenge, UserProfile, Achievement, UserAchievement

class GameSerializer(serializers.ModelSerializer):
    """Converts Game instances into JSON format and validates input data."""
    class Meta:
        model = Game
        fields = '__all__'

class ChallengeSerializer(serializers.ModelSerializer):
    """Converts Challenge instances to/from JSON."""
    class Meta:
        model = Challenge 
        fields = '__all__'

class GameSessionSerializer(serializers.ModelSerializer):
    """Converts GameSession instances to/from JSON with the new fields."""
    class Meta:
        model = GameSession
        fields = [
            'id', 'date_played', 'score', 'challenge', 'user', 
            'active', 'attempts_left', 'is_attempt', 'parent_session'
        ]
        read_only_fields = ['id', 'date_played', 'user']

    def create(self, validated_data):
        """Override create to set the user from the request."""
        user = self.context['request'].user
        validated_data['user'] = user
        return super().create(validated_data)
    
class FrequencyBandSerializer(serializers.ModelSerializer):
    class Meta:
        model = FrequencyBand
        fields = '__all__'

class EQChallengeSerializer(serializers.ModelSerializer):
    frequency_band = FrequencyBandSerializer(read_only=True)

    class Meta:
        model = EQChallenge
        fields = ['id', 'source_audio', 'frequency_band', 'change_amount',
                 'difficulty', 'hint_text']

class RhythmChallengeSerializer(serializers.ModelSerializer):
    """Converts RhythmChallenge instances to/from JSON."""
    class Meta:
        model = RhythmChallenge
        fields = ['id', 'pattern_data', 'tempo', 'time_signature',
                 'difficulty', 'audio_file', 'correct_pattern']

class UserProfileSerializer(serializers.ModelSerializer):
    """Converts UserProfile instances to/from JSON."""
    current_xp = serializers.IntegerField(source='xp', read_only=True)
    xp_for_next_level = serializers.SerializerMethodField()
    username = serializers.CharField(source='user.username', read_only=True)
    date_joined = serializers.DateTimeField(source='user.date_joined', read_only=True)

    class Meta:
        model = UserProfile
        fields = ['id', 'current_xp', 'level', 'xp_for_next_level', 'username', 'date_joined',
                  'total_games_played', 'total_correct_answers', 'current_streak',
                  'longest_streak', 'last_activity_date', 'created_at']

    def get_xp_for_next_level(self, obj):
        """Calculate XP needed for next level."""
        next_level = obj.level + 1
        return (next_level - 1) ** 2 * 100

class AchievementSerializer(serializers.ModelSerializer):
    """Converts Achievement instances to/from JSON."""
    class Meta:
        model = Achievement
        fields = '__all__'

class UserAchievementSerializer(serializers.ModelSerializer):
    """Converts UserAchievement instances to/from JSON with nested achievement data."""
    achievement = AchievementSerializer(read_only=True)

    class Meta:
        model = UserAchievement
        fields = '__all__'
