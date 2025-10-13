from django.urls import path
from .views import SeatView

urlpatterns = [
    path('/', SeatView.as_view(), name='seat-view'),
]
