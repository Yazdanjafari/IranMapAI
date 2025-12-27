from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db.models import Avg

class City(models.Model):
    class CityType(models.TextChoices):
        city = ('شهر \\ استان', 'شهر \\ استان')
        island = ('جزیره', 'جزیره')         
    
    name = models.CharField(max_length=100, verbose_name="نام استان/جزیره")
    population = models.PositiveIntegerField(verbose_name="جمعیت", null=True, blank=True)
    city_type = models.CharField(max_length=20, choices=CityType.choices, verbose_name="نوع : شهر/جزیره", null=True, blank=True)
    is_capital = models.BooleanField(default=False, verbose_name="پایتخت")

    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name_plural = "استان / جزیره"    


# This will store custom fields (like health, education, etc.)
class FieldType(models.Model):
    name = models.CharField(max_length=50, unique=True, verbose_name="نام فیلد")

    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name_plural = "امتیاز"        


# This stores scores for each city and field type
class CityFieldScore(models.Model):
    city = models.ForeignKey(City, on_delete=models.CASCADE, related_name="scores")
    field = models.ForeignKey(FieldType, on_delete=models.CASCADE)
    score = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(100)],
        verbose_name="امتیاز"
    )

    class Meta:
        unique_together = ("city", "field")  # prevent duplicate entries

    def __str__(self):
        return f"{self.city.name} - {self.field.name}: {self.score}"
    
    class Meta:
        verbose_name_plural = "امتیاز دهی (تغیر داده نشود)"        


# Optional: Method to get average score for a city
def get_city_average_score(city_id):
    from django.db.models import Avg
    avg_score = CityFieldScore.objects.filter(city_id=city_id).aggregate(Avg('score'))
    return avg_score['score__avg'] if avg_score['score__avg'] else 0
