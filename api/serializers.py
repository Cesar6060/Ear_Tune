# api/serializers.py - Updated serializers with the new GameSession fields

from rest_framework import serializers
from ear_tune.models import Game, Challenge, GameSession

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