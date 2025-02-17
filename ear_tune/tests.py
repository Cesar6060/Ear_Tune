"""
tests.py
--------
Unit tests for the EarTune "Notes" game.
"""

from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth.models import User
from .models import Game, Challenge, GameSession
from .utils import validate_answer

class NotesGameTests(TestCase):
    def setUp(self):
        """Setup test user, game, challenge, and authenticated client."""
        # Create a test user.
        self.user = User.objects.create_user(username='testuser', password='testpass')
        # Create a test game.
        self.game = Game.objects.create(name='Notes', description='Test notes game')
        # Create a challenge of type "note" with canonical correct_answer "c"
        self.challenge = Challenge.objects.create(
            game=self.game,
            challenge_type='note',
            prompt='Identify this note.',
            correct_answer='c'
        )
        # Initialize the test client and log in the test user.
        self.client = Client()
        self.client.login(username='testuser', password='testpass')

    def test_game_detail_get_displays_audio(self):
        """Ensure game_detail view includes the correct audio file ('c3.wav')."""
        url = reverse('ear_tune:game_detail', args=[self.game.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        # Check that the computed audio file name "c3.wav" appears in the response.
        self.assertIn("c3.wav", response.content.decode())

    def test_correct_answer_increments_session_score(self):
        """Correct answer ('c') should increment score and keep session active."""
        url = reverse('ear_tune:game_detail', args=[self.game.id])
        response = self.client.post(url, {'answer': 'c'})
        self.assertEqual(response.status_code, 302)  # Expect a redirect after POST.
        session = GameSession.objects.filter(user=self.user, challenge__game=self.game, active=True).first()
        self.assertIsNotNone(session)
        self.assertEqual(session.score, 1)
        self.assertTrue(session.active)

    def test_incorrect_answer_ends_session(self):
        """
        Test that submitting an incorrect answer (e.g., 'd') ends the active session.
        The session should be marked inactive, and the score should remain 0.
        """
        url = reverse('ear_tune:game_detail', args=[self.game.id])
        response = self.client.post(url, {'answer': 'd'})
        self.assertEqual(response.status_code, 302)
        session = GameSession.objects.filter(user=self.user, challenge__game=self.game).first()
        self.assertIsNotNone(session)
        self.assertEqual(session.score, 0)
        self.assertFalse(session.active)


class UtilsTests(TestCase):
    def test_validate_answer_correct(self):
        result, score = validate_answer("c", "c")
        self.assertEqual(result, "Correct!")
        self.asserEqual(score, 1)
    
    def test_validate_answer_incorrect(self):
        result, score =validate_answer("d", "c")
        self.assertEqual(result, "Incorrect. Try again!")
        self.assertEqual(score, 0)
