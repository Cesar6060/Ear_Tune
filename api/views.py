"""API views for the EarTune application. This file defines endpoints to list games, retrieve challenges, record game sessions, and submit answers."""
import random
from rest_framework import generics, status
from rest_framework.response import Response
from ear_tune.models import Game, Challenge, GameSession
from .serializers import GameSerializer, ChallengeSerializer, GameSessionSerializer

# GET
class GameList(generics.ListAPIView):  
    """ GET endpoint that returns a list of all games. """
    queryset = Game.objects.all()
    serializer_class = GameSerializer

# GET
class ChallengeList(generics.ListAPIView):
    """ Get endpoint that returns list of challenges of the type 'note'. """
    queryset = Challenge.objects.filter(challenge_type='note')
    serializer_class = ChallengeSerializer

# GET
class RandomChallenge(generics.GenericAPIView):
    """ GET endpoint that returns a random challenge of type 'note'."""
    serializer_class = ChallengeSerializer

    def get(self, request, *args, **kwargs):
        challenges = list(Challenge.objects.filter(challenge_type='note'))
        if not challenges:
            return Response({'detail': 'No Challenges Available.'}, status=status.HTTP_404_NOT_FOUND)
        challenge = random.choice(challenges)
        serializer = self.get_serializer(challenge)
        return Response(serializer.data)

# GET
class GameSessionList(generics.ListAPIView):
    """ Get endpoint that returns game sessions for the authenticated user, ordered by the most recent."""
    serializer_class = GameSessionSerializer

    def get_queryset(self):
        return GameSession.objects.filter(user=self.request.user).order_by('-date_played') # '-' means decending order

# POST
class SubmitAnswer(generics.GenericAPIView):
    """ 
    POST endpoint to submit an answer to a challenge. 
    Validates the answer, records a game session, and returns result.
    """
    def post(self, request, *args, **kwargs):
        challenge_id = request.data.get('challenge_id')
        answer = request.data.get('answer')

        if not challenge_id or not answer:
            return Response({'detail': 'challenge_id and answer are required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            challenge = Challenge.objects.get(id=challenge_id)
        except Challenge.DoesNotExist:
            return Response({'detail': 'Challenge not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        user_input = answer.strip().lower()
        correct_value = challenge.correct_answer.strip().lower()

        if "_" in correct_value:
            acceptable = [val.strip().lower() for val in correct_value.split("_")]
            if user_input in acceptable:
                result = "Correct!"
                score = 1
            else:
                result = "Incorrect. Try again!"
                score = 0
            
        else:
            if user_input == correct_value:
                result = "Correct!"
                score = 1
            else:
                result = "Incorrect. Try again!"
                score = 0
        
        GameSession.objects.create(challenge=challenge, score=score, user=request.user)

        return Response({'result': result}, status=status.HTTP_200_OK)
    
