# api/views.py - Updated API views for the 3-attempts functionality

import random
from django.contrib.auth.models import User
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from ear_tune.models import Game, Challenge, GameSession
from .serializers import GameSerializer, ChallengeSerializer, GameSessionSerializer

# Keep existing GET views
class GameList(generics.ListAPIView):  
    """ GET endpoint that returns a list of all games. """
    queryset = Game.objects.all()
    serializer_class = GameSerializer
    permission_classes = [permissions.AllowAny]

class GameDetail(generics.RetrieveAPIView):
    """ GET endpoint that returns details of a specific game. """
    queryset = Game.objects.all()
    serializer_class = GameSerializer
    permission_classes = [permissions.AllowAny]

class ChallengeList(generics.ListAPIView):
    """ GET endpoint that returns list of challenges of the type 'note'. """
    queryset = Challenge.objects.filter(challenge_type='note')
    serializer_class = ChallengeSerializer

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

class GameSessionList(generics.ListAPIView):
    """ GET endpoint that returns game sessions for the authenticated user, ordered by the most recent."""
    serializer_class = GameSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return GameSession.objects.filter(
            user=self.request.user, 
            is_attempt=False
        ).order_by('-date_played')
    
class RegisterUser(generics.CreateAPIView):
    """
    POST endpoint to register a new user.
    """
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        username = request.data.get('username')
        password1 = request.data.get('password1')
        password2 = request.data.get('password2')
        
        # Validation
        if not username or not password1 or not password2:
            return Response({
                'error': 'Please provide a username and password'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if password1 != password2:
            return Response({
                'error': 'Passwords do not match'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if User.objects.filter(username=username).exists():
            return Response({
                'error': 'Username already exists'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate password strength
        try:
            validate_password(password1)
        except ValidationError as e:
            return Response({
                'error': e.messages
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create the user
        try:
            user = User.objects.create_user(
                username=username,
                password=password1
            )
            return Response({
                'success': 'User registered successfully',
                'user_id': user.id,
                'username': user.username
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# New GameSession creation view
class CreateGameSession(generics.CreateAPIView):
    """ POST endpoint to create a new game session. """
    serializer_class = GameSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        game_id = request.data.get('game_id')
        if not game_id:
            return Response({'detail': 'game_id is required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            game = Game.objects.get(id=game_id)
        except Game.DoesNotExist:
            return Response({'detail': 'Game not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        # Get a random challenge for this game
        challenges = list(Challenge.objects.filter(game=game))
        if not challenges:
            return Response({'detail': 'No challenges available for this game.'}, status=status.HTTP_404_NOT_FOUND)
        
        challenge = random.choice(challenges)
        
        # Create a new game session
        session = GameSession.objects.create(
            user=request.user,
            challenge=challenge,
            score=0,
            active=True,
            attempts_left=3,
            is_attempt=False
        )
        
        serializer = self.get_serializer(session)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

# Updated SubmitAnswer view
class SubmitAnswer(generics.GenericAPIView):
    """ 
    POST endpoint to submit an answer to a challenge.
    Validates the answer, updates the game session, and returns result.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, *args, **kwargs):
        challenge_id = request.data.get('challenge_id')
        answer = request.data.get('answer')
        session_id = request.data.get('session_id')

        if not challenge_id or not answer:
            return Response({'detail': 'challenge_id and answer are required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not session_id:
            return Response({'detail': 'session_id is required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            challenge = Challenge.objects.get(id=challenge_id)
            session = GameSession.objects.get(id=session_id, user=request.user)
        except Challenge.DoesNotExist:
            return Response({'detail': 'Challenge not found.'}, status=status.HTTP_404_NOT_FOUND)
        except GameSession.DoesNotExist:
            return Response({'detail': 'Session not found or does not belong to the user.'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if session is still active
        if not session.active:
            return Response({'detail': 'This game session has ended.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user has attempts left
        if session.attempts_left <= 0:
            session.active = False
            session.save()
            return Response({
                'result': 'Game over. No attempts left.',
                'attempts_left': 0,
                'score': session.score
            }, status=status.HTTP_200_OK)
        
        # Validate the answer
        user_input = answer.strip().lower()
        correct_value = challenge.correct_answer.strip().lower()
        
        is_correct = False
        if "_" in correct_value:
            acceptable = [val.strip().lower() for val in correct_value.split("_")]
            is_correct = user_input in acceptable
        else:
            is_correct = user_input == correct_value
        
        # Create an attempt record
        attempt = GameSession.objects.create(
            user=request.user,
            challenge=challenge,
            score=1 if is_correct else 0,
            active=True,
            attempts_left=0,
            is_attempt=True,
            parent_session=session
        )
        
        # Update the parent session
        if is_correct:
            session.score += 1
            response_data = {
                'result': 'Correct!',
                'score': session.score,
                'attempts_left': session.attempts_left
            }
        else:
            session.attempts_left -= 1
            if session.attempts_left <= 0:
                session.active = False
                response_data = {
                    'result': 'Incorrect. Game Over!',
                    'score': session.score,
                    'attempts_left': 0,
                    'game_over': True
                }
            else:
                response_data = {
                    'result': f'Incorrect. You have {session.attempts_left} attempts left.',
                    'score': session.score,
                    'attempts_left': session.attempts_left
                }
        
        session.save()
        
        return Response(response_data, status=status.HTTP_200_OK)