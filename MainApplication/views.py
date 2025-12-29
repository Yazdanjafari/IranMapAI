import json

from django.http import Http404
from django.shortcuts import get_object_or_404, render
from django.urls import reverse

from .models import City, CityFieldScore, FieldType, get_city_average_score

CITY_NAME_TO_SLUG = {
    "آذربایجان شرقی": "azerbaijan-east",
    "آذربایجان غربی": "azerbaijan-west",
    "اردبیل": "ardabil",
    "اصفهان": "isfahan",
    "البرز": "alborz",
    "ایلام": "ilam",
    "بوشهر": "bushehr",
    "تهران": "tehran",
    "چهارمحال بختیاری": "chahar-mahaal-bakhtiari",
    "خراسان جنوبی": "khorasan-south",
    "خراسان رضوی": "khorasan-razavi",
    "خراسان شمالی": "khorasan-north",
    "خوزستان": "khuzestan",
    "زنجان": "zanjan",
    "سمنان": "semnan",
    "سیستان و بلوچستان": "sistan-baluchestan",
    "فارس": "fars",
    "قزوین": "qazvin",
    "قم": "qom",
    "کردستان": "kurdistan",
    "کرمان": "kerman",
    "کرمانشاه": "kermanshah",
    "کهگیلویه و بویر احمد": "kohgiluyeh-boyer-ahmad",
    "گلستان": "golestan",
    "گیلان": "gilan",
    "لرستان": "lorestan",
    "مازندران": "mazandaran",
    "مرکزی": "markazi",
    "هرمزگان": "hormozgan",
    "همدان": "hamadan",
    "یزد": "yazd",
    # جزایر – only include if you also have them as City objects
    "ابو موسی": "abu-musa",
    "قشم": "qeshm",
    "فرور بزرگ": "faror-big",
    "فرور کوچک": "faror-small",
    "هندروابی": "hendorabi",
    "هنگام": "hengam",
    "هرمز": "hormoz",
    "خارک": "khark",
    "کیش": "kish",
    "لارک": "lark",
    "لاوان": "lavan",
    "سیری": "siri",
    "تنب بزرگ": "tunb-big",
    "تنب کوچک": "tunb-small",
}

SLUG_TO_CITY_NAME = {slug: name for name, slug in CITY_NAME_TO_SLUG.items()}


def _get_color_for_score(avg_score: float) -> str:
    """
    Return a hex color based on the average score.

    90 - 100 => green
    70 - 89.99 => light green
    50 - 69.99 => yellow
    20 - 49.99 => orange
    0  - 19.99 => red
    """
    if avg_score >= 90:
        return "#008000"  # green
    if avg_score >= 70:
        return "#66bb6a"  # light green
    if avg_score >= 50:
        return "#ffeb3b"  # yellow
    if avg_score >= 20:
        return "#ff9800"  # orange
    return "#f44336"      # red


def main(request):
    city_data = {}
    city_colors_by_slug = {}

    for city in City.objects.all():
        slug = CITY_NAME_TO_SLUG.get(city.name)
        if not slug:
            continue

        key = slug.replace("-", "_")

        avg = get_city_average_score(city.id) or 0
        avg_rounded = round(avg, 2)
        color = _get_color_for_score(avg_rounded)

        city_data[key] = {
            "name": city.name,
            "avg": avg_rounded,
            "color": color,
            "detail_url": reverse("Authenticate:city_detail", args=[slug]),
        }

        city_colors_by_slug[slug] = color

    return render(
        request,
        "MainApplication/iranmap.html",
        {
            "city_data": city_data,
            "city_colors_by_slug": city_colors_by_slug,
        },
    )


def city_detail(request, slug: str):
    city_name = SLUG_TO_CITY_NAME.get(slug)
    if not city_name:
        raise Http404("City not found")

    city = get_object_or_404(City, name=city_name)
    field_types = list(FieldType.objects.all().order_by("name"))
    scores_by_field_id = {
        score.field_id: score.score
        for score in CityFieldScore.objects.filter(city=city).select_related("field")
    }
    field_data = [
        {"name": field.name, "score": scores_by_field_id.get(field.id, 0)}
        for field in field_types
    ]

    return render(
        request,
        "MainApplication/city_detail.html",
        {
            "city_name": city_name,
            "city_slug": slug,
            "fields": field_types,
            "field_data_json": json.dumps(field_data, ensure_ascii=False),
        },
    )
