from django.shortcuts import render, redirect
from django.http import HttpResponse
from django.conf import settings
import subprocess
import sys
from pathlib import Path

BASE_DIR = Path(settings.BASE_DIR)

# Our game directory is the parent of the Django project folder:
GAME_DIR = BASE_DIR.parent  # .../Rehab-Games


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

def vision_page(request):
    return render(request, 'vision.html')
