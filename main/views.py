from django.shortcuts import render, redirect
from django.views.decorators.csrf import csrf_exempt
from .models import PangScore
from django.http import JsonResponse
import json
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger


def index(request):
    if request.method == 'POST':
        player_name = request.POST.get('username')
        if player_name:
            #return redirect(f'https://pang-django-phaser.onrender.com/game/?player_name={player_name}')
            return redirect(f'http://127.0.0.1:8000/game/?player_name={player_name}')
    return render(request, 'main/index.html')

def game(request):
    player_name = request.GET.get('player_name', 'Jugador Desconocido')
    return render(request, 'main/game.html', {'player_name': player_name})

@csrf_exempt  # Asegura que se permitan solicitudes sin CSRF si no se maneja en el frontend.
def save_score(request):
    if request.method == 'POST':
        try:
            # Parsear los datos JSON recibidos en la solicitud POST
            data = json.loads(request.body)
            player_name = data.get('player_name')
            score = data.get('score')

            # Validar los datos recibidos
            if not player_name or not isinstance(score, (int, float)):
                return JsonResponse({'error': 'Datos inválidos'}, status=400)

            # Crear y guardar el puntaje en la base de datos
            PangScore.objects.create(player_name=player_name, score=score)
            return JsonResponse({'message': 'Puntaje guardado correctamente!'}, status=201)

        except ValueError as e:
            return JsonResponse({'error': 'Error al procesar los datos: {}'.format(str(e))}, status=400)
        except Exception as e:
            return JsonResponse({'error': 'Error interno del servidor: {}'.format(str(e))}, status=500)
    else:
        return JsonResponse({'error': 'Método no permitido'}, status=405)
    


def pang_scores_list(request):
    # Get all scores, ordered by score in descending order
    scores_list = PangScore.objects.order_by('-score')
    
    # Set up pagination (10 items per page)
    paginator = Paginator(scores_list, 10)
    
    # Get the current page number from the request
    page = request.GET.get('page', 1)
    
    try:
        # Try to get the specified page
        scores = paginator.page(page)
    except PageNotAnInteger:
        # If page is not an integer, deliver first page
        scores = paginator.page(1)
    except EmptyPage:
        # If page is out of range, deliver last page of results
        scores = paginator.page(paginator.num_pages)
    
    # Context to pass to the template
    context = {
        'scores': scores,
        'total_scores': scores_list.count()
    }
    
    return render(request, 'main/pang_scores_list.html', context)





