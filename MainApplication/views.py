from django.shortcuts import render

from .models import City, get_city_average_score


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
    # Map Farsi province names in the DB to the CSS classes used in iranmap.html
    name_to_slug = {
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


    city_data = {}
    city_colors_by_slug = {}

    for city in City.objects.all():
        slug = name_to_slug.get(city.name)
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
            "admin_url": f"/admin/MainApplication/city/{city.id}/change/",
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