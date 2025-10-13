from django.core.management.base import BaseCommand
from seats.models import Seat
import csv
import os

class Command(BaseCommand):
    help = 'Import seat coordinates from CSV'

    def handle(self, *args, **options):
        csv_path = os.path.join(
            os.path.dirname(__file__),   
            '..', '..', 'data', 'seats_vision.csv'
        )
        csv_path = os.path.normpath(csv_path)

        with open(csv_path, newline='', encoding='utf-8-sig') as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                Seat.objects.update_or_create(
                    seat_id=row['seat_id'].strip(),
                    defaults={
                        'x': float(row['x']),
                        'y': float(row['y']),
                        'z': float(row['z']),
                    }
                )
