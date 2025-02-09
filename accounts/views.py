# Ear_Tune/accounts/views.py
from django.shortcuts import render, redirect
from django.contrib.auth import login
from django.contrib.auth.forms import UserCreationForm


# Create your views here.
def register(request):
    """Register a new user and redirect to login page."""
    if request.method != 'POST':
        # Display blank registration form
        form = UserCreationForm()
    else:
        # Process completed form.
        form = UserCreationForm(data=request.POST)
        if form.is_valid():
            new_user = form.save()
            # Log the user in and then redirect to the home page.
            login(request, new_user)
            return redirect('ear_tune:home') # Adjusted redirect to homepage
        

    # Display blank of invalid form.
    context = {'form': form}
    return render(request, 'registration/register.html', context)
    

