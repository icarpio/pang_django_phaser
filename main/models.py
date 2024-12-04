from django.db import models

class PangScore(models.Model):
    player_name = models.CharField(max_length=20)  # Nombre del jugador
    score = models.IntegerField()  # Puntos del jugador
    date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.player_name} - {self.score} - {self.date}"