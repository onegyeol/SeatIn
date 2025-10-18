from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Seat
from .serializers import SeatSerializer

@api_view(['GET'])
def seat_list(request):
    section = request.GET.get('section')  
    if section:
        seats = Seat.objects.filter(section=section)
    else:
        seats = Seat.objects.all()

    serializer = SeatSerializer(seats, many=True)
    return Response(serializer.data)