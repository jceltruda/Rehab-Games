from django.shortcuts import render, redirect
from django.http import HttpResponse
from django.conf import settings
from .models import Score
import subprocess
import sys
from pathlib import Path
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

@csrf_exempt  # easy dev-mode option; see note below
def submit_score(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)

    try:
        data = json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    player = data.get("player", "Guest")
    game = data.get("game", "arkanoid")
    score_val = int(data.get("score", 0))
    difficulty = data.get("difficulty", "Easy")

    Score.objects.create(
        player_name=player,
        game=game,
        score=score_val,
        difficulty=difficulty,
    )

    return JsonResponse({"ok": True})
    
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

def game_road_fighter_view(request):
    return render(request, "game_road_fighter.html")

def leaderboard(request):
    selected_game = request.GET.get("game", "arkanoid")

    game_choices = [
        ("arkanoid", "Arkanoid"),
        ("shoulder-bird", "Shoulder-Bird"),
    ]

    scores = Score.objects.filter(game=selected_game).order_by("-score", "-date")

    label_map = dict(game_choices)
    selected_game_label = label_map.get(selected_game, "Leaderboard")

    context = {
        "scores": scores,
        "game_choices": game_choices,
        "selected_game": selected_game,
        "selected_game_label": selected_game_label,
    }

    return render(request, "leaderboard.html", context)

@csrf_exempt
def set_username(request):
    """
    Overwrite all 'Guest' player_name entries for a given game
    with the provided username.
    """
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)

    try:
        data = json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    username = data.get("username", "").strip()
    game = data.get("game", "").strip()

    if not username:
        return JsonResponse({"error": "Username required"}, status=400)

    # base queryset: all Guest scores
    qs = Score.objects.filter(player_name="Guest")

    # optionally narrow to a game, e.g. 'arkanoid' or 'shoulder-bird'
    if game:
        qs = qs.filter(game=game)

    updated_count = qs.update(player_name=username)

    return JsonResponse({"ok": True, "updated": updated_count})