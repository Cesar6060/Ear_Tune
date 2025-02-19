import random
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect, get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from .models import Game, Challenge, GameSession
from .forms import AnswerForm
from .utils import validate_answer



# Create your views here.
@login_required
def home(request):
    """ Render the homepage with a welcome message and a list of available games."""
    games = Game.objects.all()
    welcome_message = "Welcome to EarTune! Please select a game to begin."
    return render(request, 'ear_tune/home.html', {
        'games': games,
        'welcome_message': welcome_message,
    })
    

@login_required
def game_selection(request):
    """
    Render the game selection screen with a list of available games.
    """
    games = Game.objects.all()
    return render(request, 'ear_tune/game_selection.html', {'games': games})


@login_required
@csrf_exempt
def game_detail(request, game_id):
    """Render a game detail page; retrieves the first challenge for the game."""
    game = get_object_or_404(Game, id=game_id)
    challenges = list(game.challenges.all())
    challenge = random.choice(challenges) if challenges else None
    result = None
    audio_file = None

    if challenge and challenge.challenge_type == "note":
        audio_file = f"{challenge.correct_answer.lower()}3.wav"

    active_session = GameSession.objects.filter(user=request.user, challenge__game=game, active=True).first()
    if not active_session:
        active_session = GameSession.objects.create(challenge=challenge, score=0, user=request.user, active=True)

    if request.method == 'POST' and challenge is not None:
        form = AnswerForm(request.POST)
        if form.is_valid():
            answer = form.cleaned_data['answer']
            user_input = answer.strip().lower()
            correct_value = challenge.correct_answer.strip().lower()

            # Debug output to check the normalized values.
            print("DEBUG: User input =", repr(user_input))
            print("DEBUG: Correct answer =", repr(correct_value))

            result_message, score = validate_answer(user_input, correct_value)
            
            if score == 1:
                active_session.score += 1
                active_session.save()
                messages.success(request, f"Correct! Your current score is {active_session.score}.")
        
            else:
                active_session.active = False
                active_session.save()
                messages.error(request, f"Incorrect. Your final score was {active_session.score}.")

            return redirect('ear_tune:game_detail', game_id=game.id)

    else:
        form = AnswerForm()

    return render(request, 'ear_tune/game_detail.html', {
        'game': game,
        'challenge': challenge,
        'form': form,
        'result': result,
        'audio_file': audio_file,
        'active_session': active_session,
    })


@login_required
def game_history(request):
    """Render a page displaying a list of all game sessions."""
    sessions = GameSession.objects.filter(user=request.user).order_by('-date_played')
    return render(request, 'ear_tune/game_history.html', {'sessions': sessions})


