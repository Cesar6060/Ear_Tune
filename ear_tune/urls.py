from django.urls import path
from . import views

app_name = 'ear_tune'

urlpatterns = [
    path('', views.home, name='home'),
    
]