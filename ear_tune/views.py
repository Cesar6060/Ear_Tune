from django.shortcuts import render
from .models import Challenge

# Create your views here.
def home(request):
        """Render home page with a challenge."""
        challenge = Challenge.objects.first()
        return render(request, 'ear_tune/home.html', {'challenge' : challenge})