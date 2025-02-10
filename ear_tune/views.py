import random
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect, get_object_or_404
from .models import Game, Challenge, GameSession
from .forms import AnswerForm

# Create your views here.
@login_required
def home(request):
    """Render home page with a challenge."""
    
    note_challenge = list(Challenge.objects.filter(challenge_type='note'))
    challenge = random.choice(note_challenge) if note_challenge else None

    games = Game.objects.all()
    result = None
        
    if request.method == 'POST':
        form = AnswerForm(request.POST)
        if form.is_valid():
            answer = form.cleaned_data['answer']
            user_input = answer.strip().lower()
            correct_value = challenge.correct_answer.strip().lower()
            
            print("DEBUG: User input =", repr(user_input))
            print("DEBUG: Correct answer =", repr(correct_value))
            
            if "_" in correct_value:
                # Split the stored value into acceptable variants.
                acceptable = [val.strip().lower() for val in correct_value.split("_")]
                if user_input in acceptable:
                    result = "Correct!"
                else:
                    result = "Incorrect. Try again!"
            
            else: 
                if user_input == correct_value:
                    result = "Correct!"

                else:
                    result = "Incorrect. Try again!"

    else:
        form = AnswerForm()
        
    return render(request, 'ear_tune/home.html', {
        'challenge' : challenge,
        'form': form,
        'result': result,
        'games': games,
    })


@login_required
def game_selection(request):
    """
    Render the game selection screen with a list of available games.
    """
    games = Game.objects.all()
    return render(request, 'ear_tune/game_selection.html', {'games': games})


@login_required
def game_detail(request, game_id):
    """Render a game detail page; retrieves the first challenge for the game."""
    game = get_object_or_404(Game, id=game_id)
    challenge = game.challenges.first()
    result = None

    if request.method == 'POST':
        form = AnswerForm(request.POST)
        if form.is_valid():
            answer = form.cleaned_data['answer']
            user_input = answer.strip().lower()
            correct_value = challenge.correct_answer.strip().lower()
            
            if "_" in correct_value:
                # Split the stored value into acceptable variants.
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

            # Recored the game session with the attempt's score
            GameSession.objects.creat(challenge=challenge, score=score, user=request.user)
    else:
        form = AnswerForm()

    return render(request, 'ear_tune/game_detail.html', {
        'game': game,
        'challenge': challenge,
        'form': form,
        'result': result,
    })


@login_required
def game_history(request):
    """Render a page displaying a list of all game sessions."""
    sessions = GameSession.objects.filter(user=request.user).order_by('-date_played')
    return render(request, 'ear_tune/game_history.html', {'sessions': sessions})


