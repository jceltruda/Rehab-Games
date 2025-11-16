from django.urls import path
from . import views

# test
urlpatterns = [
    path('', views.home_view, name='home'),
    path('select/', views.game_select_view, name='game_select'),
    path('game/pong/', views.game_pong_view, name='game_pong'),
    path('game/flappy/', views.game_flappy_view, name='game_flappy'),
    path('game/arkanoid/', views.game_arkanoid_view, name='game_arkanoid'),
    path('game/road_fighter/', views.game_road_fighter_view, name='game_road_fighter')

]
