from django.shortcuts import render
from .models import Score
from django.http import JsonResponse

def index(request):
    return render(request, 'main/index.html')

def save_score(request):
    if request.method == 'POST':
        player_name = request.POST.get('player_name')
        score = request.POST.get('score')
        Score.objects.create(player_name=player_name, score=score)
        return JsonResponse({'message': 'Puntaje guardado correctamente!'})
    return JsonResponse({'error': 'Método no permitido'}, status=400)

def game(request):
    return render(request, 'main/game.html')
