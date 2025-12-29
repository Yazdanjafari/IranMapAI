# Data Migration Guide (SQLite to Postgres)

Use this guide when you have existing data in `db.sqlite3` and want to move it
into Postgres.

## Prerequisites
- Postgres is running via Docker Compose (`db` service).
- Django dependencies are installed in your virtual environment.

## Migration steps
1) Start Postgres:
```bash
docker compose up -d db
```

2) Apply migrations to Postgres:
```bash
python manage.py migrate
```
If you changed models and have not created migrations yet:
```bash
python manage.py makemigrations
python manage.py migrate
```

3) Export data from SQLite:
```bash
python manage.py dumpdata \
  --settings=AI_Model.settings_sqlite \
  --natural-foreign --natural-primary \
  --exclude contenttypes --exclude auth.permission \
  --exclude admin.logentry --exclude sessions.session \
  -o sqlite_seed.json
```

4) Import into Postgres:
```bash
python manage.py loaddata sqlite_seed.json
```

## Troubleshooting
- If `loaddata` fails, remove the offending model from the dump with
  `--exclude app_label.ModelName`, then retry.
- Keep `sqlite_seed.json` as a backup after a successful import.

## Optional data tools
Generate sample XLSX and CSV files:
```bash
python manage.py sample_maker
```

Convert `sample.xlsx` and `sample.csv` to JSON:
```bash
python manage.py json_converter
```

Load JSON scores into Postgres:
```bash
python manage.py sql_converter --file sample_from_csv.json
python manage.py sql_converter --file sample_from_excel.json
```
