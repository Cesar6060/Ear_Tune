from django.shortcuts import render, redirect, get_object_or_404
from .models import Game, Challenge, GameSession
from .forms import AnswerForm

# Create your views here.

def game_selection(request):
    """Render the game selection screen with a list of available games."""
    games = Game.objects.all()
    return render(request, 'ear_tune/game_selection.html', {'games': games})

def game_detail(request, game_id):
    """Render a game detail page; retrieves the first challenge for the game."""
    game = get_object_or_404(Game, id=game_id)
    challenge = game.challenges.first()
    result = None

    if request.method == 'POST':
        form = AnswerForm(request.POST)
        if form.is_valid():
            answer = form.cleaned_data['answer']
            # Validate answer (case-insensitive and trimmed)
            if answer.strip().lower() == challenge.correct_answer.strip().lower():
                result = "Correct!"
                score = 1
            else:
                result = "Incorrect. Try again!"
                score = 0
            # Recored the game session with the attempt's score
            GameSession.objects.creat(challenge=challenge, score=score)
    else:
        form = AnswerForm()

    return render(request, 'ear_tune/game_detail.html', {
        'game': game,
        'challenge': challenge,
        'form': form,
        'result': result,
    })


def home(request):
    """Render home page with a challenge."""
    challenge = Challenge.objects.first()
    result = None
        
    if request.method == 'POST':
        form = AnswerForm(request.POST)
        if form.is_valid():
            answer = form.cleaned_data['answer']
            #Validate the submitted answer 
            if answer.strip().lower == challenge.correct_answer.strip().lower():
                result = "Correct!"
            else:
                result = "Incorrect. Try again!"

    else:
        form = AnswerForm()
        
    return render(request, 'ear_tune/home.html', {
        'challenge' : challenge,
        'form': form,
        'result': result,
        })