from django.db import models


class UserProfile(models.Model):

    uid = models.CharField(
        max_length=255,
        unique=True
    )

    nombre = models.CharField(
        max_length=150
    )

    email = models.EmailField(
        unique=True
    )

    creado = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return self.nombre