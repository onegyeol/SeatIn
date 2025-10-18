from rest_framework import serializers
from .models import Seat

class SeatSerializer(serializers.ModelSerializer):
    class Meta:
        model = Seat
        fields = ['id', 'seat_id', 'x', 'y', 'z', 'section']
