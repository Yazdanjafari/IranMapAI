import json
from django.core.management.base import BaseCommand
from MainApplication.models import City, FieldType, CityFieldScore

class Command(BaseCommand):
    help = "Load city scores from JSON into the database"

    def add_arguments(self, parser):
        parser.add_argument(
            '--file',
            type=str,
            help='Path to the JSON file to load',
        )

    def handle(self, *args, **options):
        file_path = options.get('file')
        if not file_path:
            self.stdout.write(self.style.ERROR("Please provide --file path"))
            return

        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        for city_name, fields in data.items():
            # Create city if it doesn't exist
            city, created_city = City.objects.get_or_create(
                name=city_name,
                defaults={'city_type': 'شهر \\ استان'}
            )
            if created_city:
                self.stdout.write(self.style.SUCCESS(f"Created city: {city_name}"))
            else:
                self.stdout.write(f"City exists: {city_name}")

            for field_name, score in fields.items():
                # Create FieldType if it doesn't exist
                field, created_field = FieldType.objects.get_or_create(name=field_name)
                if created_field:
                    self.stdout.write(self.style.SUCCESS(f"Created field type: {field_name}"))

                # Create CityFieldScore if it doesn't exist
                score_obj, created_score = CityFieldScore.objects.get_or_create(
                    city=city,
                    field=field,
                    defaults={'score': score}
                )
                if created_score:
                    self.stdout.write(self.style.SUCCESS(f"Added score for {city_name} - {field_name}: {score}"))
                else:
                    self.stdout.write(f"Score already exists for {city_name} - {field_name}")
