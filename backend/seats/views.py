from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Seat

class SeatView(APIView):
    def get(self, request):
        seats = Seat.objects.all().values('seat_id', 'x', 'y', 'z')
        return Response(list(seats))
