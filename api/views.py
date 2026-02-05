# api/views.py - Updated API views for the 3-attempts functionality

import random
from datetime import date, timedelta
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db.models import Q
from rest_framework import generics, status, permissions
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from ear_tune.models import Game, Challenge, GameSession, FrequencyBand, EQChallenge, RhythmChallenge, UserProfile, Achievement, UserAchievement, check_and_unlock_achievements
from .serializers import GameSerializer, ChallengeSerializer, GameSessionSerializer, FrequencyBandSerializer, EQChallengeSerializer, RhythmChallengeSerializer, UserProfileSerializer, AchievementSerializer, UserAchievementSerializer

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

        # Get user profile (create if doesn't exist)
        profile, created = UserProfile.objects.get_or_create(user=request.user)

        # Update the parent session
        if is_correct:
            session.score += 1

            # Calculate XP (simplified for note challenge - 100% accuracy)
            # Base XP: 10, Perfect bonus: +25, Difficulty: assume beginner (1x)
            base_xp = 10
            perfect_bonus = 25
            xp_earned = base_xp + perfect_bonus

            # Award XP and check for level up
            old_level = profile.level
            level_up = profile.add_xp(xp_earned)
            new_level = profile.level

            # Update profile stats
            profile.total_games_played += 1
            profile.total_correct_answers += 1
            profile.update_streak()
            profile.save()

            # Check for achievement unlocks
            unlocked_achievements = check_and_unlock_achievements(request.user)

            response_data = {
                'result': 'Correct!',
                'score': session.score,
                'attempts_left': session.attempts_left,
                'xp_earned': xp_earned,
                'level_up': level_up,
                'new_level': new_level,
                'unlocked_achievements': unlocked_achievements
            }
        else:
            session.attempts_left -= 1

            # Update profile stats (game played, but not correct)
            profile.total_games_played += 1
            profile.save()

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

class FrequencyBandList(generics.ListAPIView):
    """List all frequency bands for reference"""
    queryset = FrequencyBand.objects.all()
    serializer_class = FrequencyBandSerializer
    permission_classes = [permissions.AllowAny]

class RandomEQChallenge(generics.GenericAPIView):
    """Get a random EQ challenge."""
    serializer_class = EQChallengeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        difficulty = request.query_params.get('difficulty', 'beginner')

        # Get challenges for the frequency game
        try:
            frequency_game = Game.objects.get(name='Frequency Recognition')
            challenges = EQChallenge.objects.filter(
                game=frequency_game,
                difficulty=difficulty
            )

            if not challenges.exists():
                return Response(
                    {'detail': f'No challenges available for {difficulty} level.'},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Select a random challenge (convert QuerySet to list)
            challenge = random.choice(list(challenges))
            serializer = self.get_serializer(challenge)
            return Response(serializer.data)

        except Game.DoesNotExist:
            return Response(
                {'detail': 'Frequency Recognition game not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
    
class SubmitEQAnswer(generics.GenericAPIView):
    """Submit an answer for an EQ challenge."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        challenge_id = request.data.get('challenge_id')
        frequency_band_id = request.data.get('frequency_band_id')
        change_amount = request.data.get('change_amount')

        try:
            challenge = EQChallenge.objects.get(id=challenge_id)
        
        except EQChallenge.DoesNotExist:
            return Response(
                {'detail': 'Challenge not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if answer is correct
        is_correct = (
            challenge.frequency_band.id == frequency_band_id and
            challenge.change_amount == change_amount
        )

        # Calculate accuracy (100% if correct, 0% if incorrect)
        accuracy = 100 if is_correct else 0

        # Get user profile (create if doesn't exist)
        profile, created = UserProfile.objects.get_or_create(user=request.user)

        # Calculate XP
        # Base XP: 10
        base_xp = 10

        # Accuracy bonus: accuracy * 0.5 (max 50 points for 100%)
        accuracy_bonus = accuracy * 0.5

        # Difficulty multiplier
        difficulty_multipliers = {
            'beginner': 1.0,
            'intermediate': 1.5,
            'advanced': 2.0
        }
        difficulty_multiplier = difficulty_multipliers.get(challenge.difficulty, 1.0)

        # Perfect score bonus: +25 XP for 100% accuracy
        perfect_bonus = 25 if accuracy == 100 else 0

        # Calculate total XP
        xp_earned = int((base_xp + accuracy_bonus) * difficulty_multiplier + perfect_bonus)

        # Award XP and check for level up
        old_level = profile.level
        level_up = profile.add_xp(xp_earned)
        new_level = profile.level

        # Update profile stats
        profile.total_games_played += 1
        if is_correct:
            profile.total_correct_answers += 1
        profile.update_streak()
        profile.save()

        # Check for achievement unlocks
        unlocked_achievements = check_and_unlock_achievements(request.user)

        # Create a game session record
        session = GameSession.objects.create(
            user=request.user,
            challenge=None,
            score=100 if is_correct else 0,
            active=False
        )

        response_data = {
            'correct': is_correct,
            'correct_answer': {
                'frequency_band': challenge.frequency_band.name,
                'change_amount': challenge.change_amount
            },
            'xp_earned': xp_earned,
            'level_up': level_up,
            'new_level': new_level,
            'unlocked_achievements': unlocked_achievements
        }
        if not is_correct:
            response_data['user_answer'] = {
                'frequency_band_id': frequency_band_id,
                'change_amount': change_amount
            }

        return Response(response_data, status=status.HTTP_200_OK)

class RandomRhythmChallengeView(generics.GenericAPIView):
    """GET endpoint that returns a random rhythm challenge."""
    serializer_class = RhythmChallengeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        difficulty = request.query_params.get('difficulty', 'beginner')

        # Get challenges for the rhythm game
        try:
            rhythm_game = Game.objects.get(name='Rhythm Recognition')
            challenges = RhythmChallenge.objects.filter(
                game=rhythm_game,
                difficulty=difficulty
            )

            if not challenges.exists():
                return Response(
                    {'detail': f'No challenges available for {difficulty} level.'},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Select a random challenge (convert QuerySet to list)
            challenge = random.choice(list(challenges))
            serializer = self.get_serializer(challenge)
            return Response(serializer.data)

        except Game.DoesNotExist:
            return Response(
                {'detail': 'Rhythm Recognition game not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

class SubmitRhythmAnswerView(generics.GenericAPIView):
    """
    POST endpoint to submit and validate a rhythm answer.
    Compares user's tapped timestamps with correct pattern using a tolerance of ±100ms.
    Returns accuracy percentage, feedback, and score.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        challenge_id = request.data.get('challenge_id')
        user_taps = request.data.get('user_taps')  # Expected to be a list of timestamps in ms

        if not challenge_id or user_taps is None:
            return Response(
                {'detail': 'challenge_id and user_taps are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            challenge = RhythmChallenge.objects.get(id=challenge_id)
        except RhythmChallenge.DoesNotExist:
            return Response(
                {'detail': 'Challenge not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Get the correct pattern (timestamps in ms)
        correct_pattern = challenge.correct_pattern

        # Validate that user_taps is a list
        if not isinstance(user_taps, list):
            return Response(
                {'detail': 'user_taps must be a list of timestamps.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Calculate accuracy with ±100ms tolerance
        tolerance = 100  # milliseconds
        correct_count = 0
        total_expected = len(correct_pattern)

        # Match each expected tap with the closest user tap
        matched_user_taps = set()

        for correct_tap in correct_pattern:
            for i, user_tap in enumerate(user_taps):
                if i not in matched_user_taps:
                    if abs(user_tap - correct_tap) <= tolerance:
                        correct_count += 1
                        matched_user_taps.add(i)
                        break

        # Calculate accuracy percentage
        if total_expected > 0:
            accuracy = (correct_count / total_expected) * 100
        else:
            accuracy = 0

        # Calculate score based on accuracy
        if accuracy >= 90:
            score = 100
            feedback = "Excellent! Perfect rhythm!"
            correct = True
        elif accuracy >= 75:
            score = 75
            feedback = "Great job! Very close to the beat!"
            correct = False
        elif accuracy >= 60:
            score = 50
            feedback = "Good effort! Keep practicing your timing."
            correct = False
        elif accuracy >= 40:
            score = 25
            feedback = "Not quite there. Try listening more carefully to the rhythm."
            correct = False
        else:
            score = 0
            feedback = "Keep practicing! Listen to the pattern carefully."
            correct = False

        # Get user profile (create if doesn't exist)
        profile, created = UserProfile.objects.get_or_create(user=request.user)

        # Calculate XP
        # Base XP: 10
        base_xp = 10

        # Accuracy bonus: accuracy * 0.5 (max 50 points for 100%)
        accuracy_bonus = accuracy * 0.5

        # Difficulty multiplier
        difficulty_multipliers = {
            'beginner': 1.0,
            'intermediate': 1.5,
            'advanced': 2.0
        }
        difficulty_multiplier = difficulty_multipliers.get(challenge.difficulty, 1.0)

        # Perfect score bonus: +25 XP for 100% accuracy
        perfect_bonus = 25 if accuracy == 100 else 0

        # Calculate total XP
        xp_earned = int((base_xp + accuracy_bonus) * difficulty_multiplier + perfect_bonus)

        # Award XP and check for level up
        old_level = profile.level
        level_up = profile.add_xp(xp_earned)
        new_level = profile.level

        # Update profile stats
        profile.total_games_played += 1
        if accuracy >= 90:  # Consider >= 90% as correct
            profile.total_correct_answers += 1
        profile.update_streak()
        profile.save()

        # Check for achievement unlocks
        unlocked_achievements = check_and_unlock_achievements(request.user)

        # Create a game session record
        session = GameSession.objects.create(
            user=request.user,
            challenge=None,  # RhythmChallenge is separate from Challenge model
            score=score,
            active=False
        )

        response_data = {
            'accuracy': round(accuracy, 2),
            'score': score,
            'feedback': feedback,
            'correct': correct,
            'correct_taps': correct_count,
            'total_expected': total_expected,
            'user_tap_count': len(user_taps),
            'xp_earned': xp_earned,
            'level_up': level_up,
            'new_level': new_level,
            'unlocked_achievements': unlocked_achievements
        }

        return Response(response_data, status=status.HTTP_200_OK)

# Gamification API Views

class UserProfileView(generics.RetrieveAPIView):
    """
    GET endpoint that returns the current user's profile with stats.
    """
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        """Return the current user's profile, creating it if it doesn't exist."""
        profile, created = UserProfile.objects.get_or_create(user=self.request.user)
        return profile

class AchievementsListView(generics.ListAPIView):
    """
    GET endpoint that returns all achievements with locked/unlocked status for the current user.
    """
    serializer_class = AchievementSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return all achievements."""
        return Achievement.objects.all()

    def list(self, request, *args, **kwargs):
        """Override list to include locked/unlocked status."""
        achievements = self.get_queryset()
        user_achievements = UserAchievement.objects.filter(user=request.user).values_list('achievement_id', flat=True)

        achievements_data = []
        for achievement in achievements:
            achievement_data = AchievementSerializer(achievement).data
            achievement_data['unlocked'] = achievement.id in user_achievements

            # If unlocked, get the unlock date
            if achievement_data['unlocked']:
                user_achievement = UserAchievement.objects.get(user=request.user, achievement=achievement)
                achievement_data['unlocked_at'] = user_achievement.unlocked_at
            else:
                achievement_data['unlocked_at'] = None

            achievements_data.append(achievement_data)

        return Response(achievements_data)

class LeaderboardView(generics.ListAPIView):
    """
    GET endpoint that returns the top 10 users by XP.
    """
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return top 10 users by XP."""
        return UserProfile.objects.select_related('user').order_by('-xp')[:10]

    def list(self, request, *args, **kwargs):
        """Override list to include username and rank."""
        queryset = self.get_queryset()

        leaderboard_data = []
        for rank, profile in enumerate(queryset, start=1):
            profile_data = UserProfileSerializer(profile).data
            profile_data['rank'] = rank
            profile_data['username'] = profile.user.username
            leaderboard_data.append(profile_data)

        return Response(leaderboard_data)

class UpdateStreakView(APIView):
    """
    POST endpoint to update user's streak on login.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        """Update the user's login streak."""
        # Get or create profile
        profile, created = UserProfile.objects.get_or_create(user=request.user)

        today = date.today()

        # If last login was yesterday, increment streak
        if profile.last_login_date == today - timedelta(days=1):
            profile.current_streak += 1

            # Update longest streak if current is greater
            if profile.current_streak > profile.longest_streak:
                profile.longest_streak = profile.current_streak

        # If last login was today, do nothing (already logged in today)
        elif profile.last_login_date == today:
            pass

        # If last login was more than 1 day ago, reset streak
        else:
            profile.current_streak = 1

        # Update last login date
        profile.last_login_date = today
        profile.save()

        return Response({
            'current_streak': profile.current_streak,
            'longest_streak': profile.longest_streak,
            'last_login_date': profile.last_login_date
        }, status=status.HTTP_200_OK)