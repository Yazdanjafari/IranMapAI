# myapp/admin.py
from django.contrib import admin
from .models import City, FieldType, CityFieldScore, get_city_average_score

# Inline admin to show/edit scores directly in the city page
class CityFieldScoreInline(admin.TabularInline):
    model = CityFieldScore
    extra = 1
    min_num = 1
    verbose_name = "امتیاز فیلد"
    verbose_name_plural = "امتیازات فیلدها"


@admin.register(City)
class CityAdmin(admin.ModelAdmin):
    list_display = ('name', 'population', 'city_type', 'is_capital', 'average_score')
    list_filter = ('city_type',)
    search_fields = ('name',)
    inlines = [CityFieldScoreInline]

    # Show average score for the city in the admin list
    def average_score(self, obj):
        return round(get_city_average_score(obj.id), 2)
    average_score.short_description = "میانگین امتیاز"


@admin.register(FieldType)
class FieldTypeAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)


@admin.register(CityFieldScore)
class CityFieldScoreAdmin(admin.ModelAdmin):
    list_display = ('city', 'field', 'score')
    list_filter = ('field', 'city')
    search_fields = ('city__name', 'field__name')
