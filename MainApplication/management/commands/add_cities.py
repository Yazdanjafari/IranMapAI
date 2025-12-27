from django.core.management.base import BaseCommand
from MainApplication.models import City

class Command(BaseCommand):
    help = "Populate the database with initial cities and islands"

    def handle(self, *args, **kwargs):
        provinces = [
            {"name": "آذربایجان شرقی", "population": 4000000, "is_capital": False},
            {"name": "آذربایجان غربی", "population": 3000000, "is_capital": False},
            {"name": "اردبیل", "population": 1500000, "is_capital": False},
            {"name": "اصفهان", "population": 5000000, "is_capital": False},
            {"name": "البرز", "population": 2700000, "is_capital": False},
            {"name": "ایلام", "population": 600000, "is_capital": False},
            {"name": "بوشهر", "population": 1200000, "is_capital": False},
            {"name": "تهران", "population": 14000000, "is_capital": True},  # پایتخت
            {"name": "چهارمحال بختیاری", "population": 1000000, "is_capital": False},
            {"name": "خراسان جنوبی", "population": 800000, "is_capital": False},
            {"name": "خراسان رضوی", "population": 6000000, "is_capital": False},
            {"name": "خراسان شمالی", "population": 1000000, "is_capital": False},
            {"name": "خوزستان", "population": 4700000, "is_capital": False},
            {"name": "زنجان", "population": 1000000, "is_capital": False},
            {"name": "سمنان", "population": 700000, "is_capital": False},
            {"name": "سیستان و بلوچستان", "population": 2700000, "is_capital": False},
            {"name": "فارس", "population": 4900000, "is_capital": False},
            {"name": "قزوین", "population": 1100000, "is_capital": False},
            {"name": "قم", "population": 1200000, "is_capital": False},
            {"name": "کردستان", "population": 1400000, "is_capital": False},
            {"name": "کرمان", "population": 3200000, "is_capital": False},
            {"name": "کرمانشاه", "population": 2000000, "is_capital": False},
            {"name": "کهگیلویه و بویر احمد", "population": 700000, "is_capital": False},
            {"name": "گلستان", "population": 1900000, "is_capital": False},
            {"name": "گیلان", "population": 2500000, "is_capital": False},
            {"name": "لرستان", "population": 1700000, "is_capital": False},
            {"name": "مازندران", "population": 3300000, "is_capital": False},
            {"name": "مرکزی", "population": 1300000, "is_capital": False},
            {"name": "هرمزگان", "population": 1600000, "is_capital": False},
            {"name": "همدان", "population": 1700000, "is_capital": False},
            {"name": "یزد", "population": 1100000, "is_capital": False},
        ]

        islands = [
            {"name": "ابو موسی", "population": 20000, "is_capital": False},
            {"name": "قشم", "population": 130000, "is_capital": False},
            {"name": "فرور بزرگ", "population": 1000, "is_capital": False},
            {"name": "فرور کوچک", "population": 800, "is_capital": False},
            {"name": "هندروابی", "population": 500, "is_capital": False},
            {"name": "هنگام", "population": 1500, "is_capital": False},
            {"name": "هرمز", "population": 1000, "is_capital": False},
            {"name": "خارک", "population": 10000, "is_capital": False},
            {"name": "کیش", "population": 50000, "is_capital": False},
            {"name": "لارک", "population": 3000, "is_capital": False},
            {"name": "لاوان", "population": 2000, "is_capital": False},
            {"name": "سیری", "population": 1500, "is_capital": False},
            {"name": "تنب بزرگ", "population": 1000, "is_capital": False},
            {"name": "تنب کوچک", "population": 800, "is_capital": False},
        ]

        # اضافه کردن استان‌ها و جزایر به دیتابیس
        for item in provinces + islands:
            City.objects.get_or_create(
                name=item["name"],
                defaults={
                    "population": item["population"],
                    "is_capital": item["is_capital"]
                }
            )

        self.stdout.write(self.style.SUCCESS("All provinces and islands have been added to the database!"))
