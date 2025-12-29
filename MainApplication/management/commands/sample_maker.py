from django.core.management.base import BaseCommand
from pathlib import Path
import pandas as pd
import random

class Command(BaseCommand):
    help = 'Generate sample Excel and CSV files with random data'

    def handle(self, *args, **kwargs):
        BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent  # project root

        excel_file = BASE_DIR / "sample.xlsx"
        csv_file = BASE_DIR / "sample.csv"

        # Define provinces and metrics
        provinces = [
            "آذربایجان شرقی", "آذربایجان غربی", "اردبیل", "اصفهان", "البرز", "ایلام",
            "بوشهر", "تهران", "چهارمحال و بختیاری", "خراسان جنوبی", "خراسان رضوی",
            "خراسان شمالی", "خوزستان", "زنجان", "سمنان", "سیستان و بلوچستان", "فارس",
            "قزوین", "قم", "کردستان", "کرمان", "کرمانشاه", "کهگیلویه و بویراحمد",
            "گلستان", "گیلان", "لرستان", "مازندران", "مرکزی", "هرمزگان", "همدان", "یزد"
        ]

        metrics = [
            "میزان شادی", "میزان ترافیک", "میزان سلامتی", "میزان رضایتمندی", "میزان آلودگی",
            "میزان اقتصادی", "میزان مطالعه عمومی", "میزان تفریحات", "میزان تحصیلات",
            "میزان درآمد", "میزان مصرف انرژی", "میزان خستگی", "میزان امنیت", "میزان مصرف آب",
            "میزان ورزش", "میزان خواب", "میزان استرس", "میزان مشارکت اجتماعی",
            "میزان نوآوری", "میزان تولید زباله", "میزان رضایت مشتری", "میزان پیشرفت شغلی",
            "میزان خلاقیت", "میزان دسترسی به خدمات بهداشتی", "میزان ترافیک اینترنت",
            "میزان فعالیت فرهنگی", "میزان تعاملات خانوادگی", "میزان کیفیت هوا",
            "میزان هزینه‌های زندگی", "میزان یادگیری مهارت‌های جدید"
        ]

        # Generate random data
        data = {province: [random.randint(1, 100) for _ in metrics] for province in provinces}
        df = pd.DataFrame(data, index=metrics)

        # Save files
        df.to_excel(excel_file, engine='openpyxl')
        df.to_csv(csv_file, encoding='utf-8-sig')

        self.stdout.write(self.style.SUCCESS(f"Excel and CSV files created in {BASE_DIR}"))
