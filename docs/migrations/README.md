# Data Migration Guide (SQLite -> Postgres)

Use this guide if you have existing data in `db.sqlite3` but your Postgres
database is empty (for example, no cities, ranks, or parameters).

## Prerequisites
- Postgres is running via docker-compose.
- You have the Django dependencies installed in your venv.

## Steps
1) Start the Postgres service:
   docker compose up -d db

2) Apply migrations to create schema in Postgres:
   python manage.py migrate

3) Export data from SQLite:
   python manage.py dumpdata \
     --settings=AI_Model.settings_sqlite \
     --natural-foreign --natural-primary \
     --exclude contenttypes --exclude auth.permission \
     --exclude admin.logentry --exclude sessions.session \
     -o sqlite_seed.json

4) Import into Postgres:
   python manage.py loaddata sqlite_seed.json

## Notes
- If `loaddata` fails, read the error and remove the offending app from the dump
  command (for example, add `--exclude some_app.Model`), then retry.
- After a successful import, you can keep `sqlite_seed.json` as a backup.



### Options : make xlxs and csv sample files)
python manage.py sample_maker



### Options : convert xlxs and csv files to json)
note : your file's name should be : "sample.xlxs" and "sample.csv"
python manage.py json_converter



### Options : move json's data to postgresql)
note : your file's name should be : "sample_from_csv.json" and "sample_from_excel.json"
python manage.py sql_converter --file sample_from_csv.json
python manage.py sql_converter --file sample_from_excel.json