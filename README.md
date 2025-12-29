# IranMapAI

## Overview
IranMapAI is a Django web app that visualizes Iranian provinces and islands on an SVG map, colors each region by its average score, and provides a city detail page with charts and a client-side chatbot backed by the Persian Assistant API. The backend stores cities, score fields, and per-city scores; the frontend renders the map and dashboards with static assets and CDN charts.

## How the dashboard works

### Data flow
1) **City + score data** is stored in Postgres (or SQLite for local dev).
2) **`MainApplication.views.main`** loads all cities, maps each city name to a slug used by the SVG, computes an average score, and assigns a color bucket.
3) **`iranmap.html`** receives `city_data` and `city_colors_by_slug`, then colors the SVG provinces via jQuery and links each province to its detail page.
4) **`MainApplication.views.city_detail`** loads all field types and scores for the selected city and serializes them into JSON.
5) **`city_detail.html`** uses ApexCharts to render an overview chart plus a chart per field.
6) **Chatbot UI** is included on the map and detail pages and calls the Persian Assistant API from the browser.

### Color logic (map)
The average score is mapped to fixed color buckets in `MainApplication/views.py`:
- 90-100: green
- 70-89.99: light green
- 50-69.99: yellow
- 20-49.99: orange
- 0-19.99: red

## Backend architecture

### Apps
- **`AI_Model`**: Django project config (settings, URLs, WSGI/ASGI).
- **`AthenticationApplication`**: Custom user model and admin customization.
- **`MainApplication`**: Core map + dashboard features and data models.

### Models (`MainApplication/models.py`)
- **City**: Province or island (name, population, type, is_capital).
- **FieldType**: A score category (e.g., health, traffic).
- **CityFieldScore**: A single score for a city + field.
- **get_city_average_score**: Helper to compute the average score for a city.

### Custom user model (`AthenticationApplication/models.py`)
- Extends `AbstractBaseUser` and `PermissionsMixin`.
- Adds profile image, phone number, national ID, Jalali birth date.
- `AUTH_USER_MODEL` is set to `AthenticationApplication.User`.

## Frontend architecture
- **SVG map + labels**: `MainApplication/templates/MainApplication/iranmap.html` and `MainApplication/static/MainApplication/js/iranmap.js`.
- **Charts**: `MainApplication/templates/MainApplication/city_detail.html` using ApexCharts via CDN.
- **Chatbot UI**: `MainApplication/static/MainApplication/js/script_ChatBot.js` with styles in `MainApplication/static/MainApplication/css/style_ChatBot.css`.

## Chat assistant behavior
- **Text queries**: `POST /api/v1/query/text` with `query`, `temperature`, and `max_tokens`.
- **Voice queries**: `POST /api/v1/query/voice` with `audio` and `language=fa-IR` (chat shows an audio player and transcription header if provided).
- **20-minute sessions**: Stored in `localStorage` per user; survives refresh, back, and city navigation until the session expires.
- **Clear history**: The trash icon clears current session history in the browser.
- **City context injection**: On city pages, the assistant receives a hidden summary of field scores and averages so it can answer city-specific questions without showing the data to the user.
- **Recording timer**: Shows elapsed time while voice recording is active.

## Data import and seed tools
Custom management commands in `MainApplication/management/commands`:
- `add_cities`: Inserts provinces and islands (used in initial setup).
- `sample_maker`: Generates `sample.xlsx` and `sample.csv` with random metrics.
- `json_converter`: Converts those sample files into JSON.
- `sql_converter`: Loads a JSON file of scores into the database.

SQLite migration notes are in `docs/migrations/README.md`.

## Configuration
- **Primary DB**: Postgres (see `AI_Model/settings.py`).
- **SQLite option**: `AI_Model/settings_sqlite.py`.
- **Env file**: `.env.local` is loaded if present.

Expected Postgres env vars:
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_HOST`
- `POSTGRES_PORT`

## Run locally (Postgres)

### 1) Install dependencies
```bash
pip install -r requriment.txt
```

### 2) Migrate
```bash
python manage.py makemigrations
python manage.py migrate
```

### 3) Seed cities
```bash
python manage.py add_cities
```

### 4) Create an admin user
```bash
python manage.py createsuperuser
```

### 5) Run the server
```bash
python manage.py runserver
```

Open:
- App: `http://127.0.0.1:8000/`
- Admin: `http://127.0.0.1:8000/admin/`

## Run locally (SQLite)
```bash
DJANGO_SETTINGS_MODULE=AI_Model.settings_sqlite python manage.py migrate
DJANGO_SETTINGS_MODULE=AI_Model.settings_sqlite python manage.py loaddata sqlite_seed.json
DJANGO_SETTINGS_MODULE=AI_Model.settings_sqlite python manage.py runserver
```

## Docker
```bash
docker compose up --build
```

- App: `http://127.0.0.1:4000/`
- Postgres: `localhost:5432`

## Project structure
```text
AI_Model/                     # Django project settings + ASGI/WSGI
  settings.py
  settings_sqlite.py
  urls.py
AthenticationApplication/      # Custom user model + admin
  admin.py
  models.py
MainApplication/               # Core map + scoring app
  management/commands/         # add_cities, sample_maker, json_converter, sql_converter
  static/MainApplication/      # JS/CSS for map and chatbot
  templates/MainApplication/   # iranmap.html, city_detail.html
  models.py
  urls.py
  views.py
Dockerfile
README.md
manage.py
requriment.txt
sqlite_seed.json               # Sample fixture export
profile_image/                # Example profile image
```

## Notes
- `docs/migrations/README.md` documents how to migrate SQLite data into Postgres.
- `db.sqlite3` is present in the repo as a local dev snapshot.
