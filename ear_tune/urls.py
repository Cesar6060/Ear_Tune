from django.urls import path
from . import views

app_name = 'ear_tune'

urlpatterns = [
    path('', views.home, name='home'),
    path('game/<int:game_id>/', views.game_detail, name='game_detail'),
]