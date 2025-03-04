"""API views for the EarTune application. This file defines endpoints to list games, retrieve challenges, record game sessions, and submit answers."""
import random
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from ear_tune.models import Game, Challenge, GameSession
from .serializers import GameSerializer, ChallengeSerializer, GameSessionSerializer

# GET
class GameList(generics.ListAPIView):  
    """ GET endpoint that returns a list of all games. """
    queryset = Game.objects.all()
    serializer_class = GameSerializer
    permission_classes = [permissions.AllowAny]

# GET
class ChallengeList(generics.ListAPIView):
    """ Get endpoint that returns list of challenges of the type 'note'. """
    queryset = Challenge.objects.filter(challenge_type='note')
    serializer_class = ChallengeSerializer

# GET
class RandomChallenge(generics.GenericAPIView):
    """ GET endpoint that returns a random challenge of type 'note'."""
    serializer_class = ChallengeSerializer
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        game_id = request.query_params.get('game_id')
        if game_id:
            challenges = list(Challenge.objects.filter(challenge_type='note', game__id=game_id))
        else:
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
class SubmitAnswerView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        session_id = request.data.get('session_id')
        answer = request.data.get('answer')
        
        try:
            session = GameSession.objects.get(id=session_id, user=request.user, is_active=True)
        except GameSession.DoesNotExist:
            return Response({"error": "Active game session not found"}, status=status.HTTP_404_NOT_FOUND)
        
        if not session.current_challenge:
            return Response({"error": "No active challenge"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Normalize the answer if needed (assuming you have a helper function)
        normalized_answer = normalize_answer(answer)
        correct_answer = session.current_challenge.correct_answer
        
        if normalized_answer == correct_answer:
            # Correct answer logic
            session.score += 1
            session.current_challenge_attempts = 0  # Reset attempts for next challenge
            
            # Get next challenge
            next_challenge = Challenge.objects.filter(game=session.game).order_by('?').first()
            session.current_challenge = next_challenge
            session.save()
            
            return Response({
                "result": "correct",
                "score": session.score,
                "next_challenge": ChallengeSerializer(next_challenge).data
            })
        else:
            # Incorrect answer logic
            session.current_challenge_attempts += 1
            
            if session.current_challenge_attempts >= 3:
                # End the session after 3 failed attempts
                session.is_active = False
                session.save()
                return Response({
                    "result": "incorrect",
                    "game_over": True,
                    "final_score": session.score,
                    "correct_answer": correct_answer
                })
            else:
                # Still has attempts remaining
                session.save()
                return Response({
                    "result": "incorrect",
                    "attempts_left": 3 - session.current_challenge_attempts,
                    "score": session.score
                })
    
