from django.urls import path
from .views import seat_list

urlpatterns = [
    path('', seat_list, name='seat-list'),
]
