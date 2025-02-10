"""URL configuration for the API endpoints in the EarTune project. This file maps API endpoints to their corresponding DRF views."""

from django.urls import path
from .views import GameList, ChallengeList, RandomChallenge, GameSessionList, SubmitAnswer

urlpatterns = [
    path('games/', GameList.as_view(), name='game-list'),
    path('challenges/', ChallengeList.as_view(), name='challenge-list'),
    path('challenges/random/', RandomChallenge.as_view(), name='random-challenge'),
    path('game-sessions/', GameSessionList.as_view(), name='game-session-list'),
    path('submit-answer/', SubmitAnswer.as_view(), name='submit-answer'),
]

