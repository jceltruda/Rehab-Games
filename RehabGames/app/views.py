from django.shortcuts import render

def home_view(request):
    return render(request, 'home.html')

def game_select_view(request):
    return render(request, 'game_select.html')

def game_pong_view(request):
    return render(request, 'game_pong.html')

def game_flappy_view(request):
    return render(request, 'game_flappy.html')

def game_arkanoid_view(request):
    return render(request, 'game_arkanoid.html')
