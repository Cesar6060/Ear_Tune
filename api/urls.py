# api/urls.py - Updated URL configuration for the API endpoints

from django.urls import path
from .views import (
    GameList, 
    GameDetail, 
    ChallengeList, 
    RandomChallenge, 
    GameSessionList,
    CreateGameSession, 
    SubmitAnswer,
    RegisterUser,
    FrequencyBandList,
    RandomEQChallenge,
    SubmitEQAnswer
)

urlpatterns = [
    path('games/', GameList.as_view(), name='game-list'),
    path('games/<int:pk>/', GameDetail.as_view(), name='game-detail'),
    path('challenges/', ChallengeList.as_view(), name='challenge-list'),
    path('challenges/random/', RandomChallenge.as_view(), name='random-challenge'),
    path('game-sessions/', GameSessionList.as_view(), name='game-session-list'),
    path('game-sessions/create/', CreateGameSession.as_view(), name='create-game-session'),
    path('submit-answer/', SubmitAnswer.as_view(), name='submit-answer'),
    path('register/', RegisterUser.as_view(), name='api-register'),
    path('frequency-bands/', FrequencyBandList.as_view(), name='frequency-band-list'),
    path('eq-challenge/random/', RandomEQChallenge.as_view(), name='random-eq-challenge'),
    path('eq-challenge/submit/', SubmitEQAnswer.as_view(), name='submit-eq-answer'),

]