"""
    Defines URL patterns for accounts.
    Ear_Tune/accounts/urls.py
"""
from django.urls import path, include
from . import views

app_name = 'accounts'
urlpatterns = [
    path('register/', views.register, name='register'),
    path('', include('django.contrib.auth.urls')),
]
