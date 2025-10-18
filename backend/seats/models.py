from django.db import models

class Seat(models.Model):
    seat_id = models.CharField(max_length=20, unique=True)
    x = models.FloatField()
    y = models.FloatField()
    z = models.FloatField()
    section = models.CharField(max_length=2, null=True, blank=True)

    def __str__(self):
        return self.seat_id
