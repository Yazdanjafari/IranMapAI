from pathlib import Path
import pandas as pd
import json
from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = 'Convert Excel and CSV files to JSON'

    def handle(self, *args, **kwargs):
        # Project root (where manage.py is)
        BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent  # go up 4 levels

        excel_file = BASE_DIR / "sample.xlsx"
        csv_file = BASE_DIR / "sample.csv"
        json_file_from_excel = BASE_DIR / "sample_from_excel.json"
        json_file_from_csv = BASE_DIR / "sample_from_csv.json"

        # Check if files exist first
        if not excel_file.exists():
            self.stdout.write(self.style.ERROR(f"Excel file not found: {excel_file}"))
            return
        if not csv_file.exists():
            self.stdout.write(self.style.ERROR(f"CSV file not found: {csv_file}"))
            return

        # Convert Excel
        df_excel = pd.read_excel(excel_file, index_col=0)
        df_excel_transposed = df_excel.T
        json_data_excel = df_excel_transposed.to_dict(orient="index")
        with open(json_file_from_excel, "w", encoding="utf-8") as f:
            json.dump(json_data_excel, f, ensure_ascii=False, indent=4)
        self.stdout.write(self.style.SUCCESS(f"Excel converted to JSON: {json_file_from_excel}"))

        # Convert CSV
        df_csv = pd.read_csv(csv_file, index_col=0)
        df_csv_transposed = df_csv.T
        json_data_csv = df_csv_transposed.to_dict(orient="index")
        with open(json_file_from_csv, "w", encoding="utf-8") as f:
            json.dump(json_data_csv, f, ensure_ascii=False, indent=4)
        self.stdout.write(self.style.SUCCESS(f"CSV converted to JSON: {json_file_from_csv}"))
