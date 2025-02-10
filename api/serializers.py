"""Serializers for the API endpoints. This file defines DRF serializers for the Game, Challenge, and GameSession models."""

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
    """ Converts GameSession instances to/from JSON."""
    class Meta:
        model = GameSession
        fields = '__all__'