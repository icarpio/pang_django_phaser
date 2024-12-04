from django.contrib import admin
from django.urls import path
from main import views

urlpatterns = [
    path('', views.index, name='index'),
    path('game/', views.game, name='game'),
    path('api/scores/', views.save_score, name='save_score'),
    path('pang-scores/', views.pang_scores_list, name='pang_scores_list'),
]