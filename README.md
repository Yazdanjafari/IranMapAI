# Project Setup (Django)

## Prerequisites

* Python **3.9+**
* `pip`

## Setup & Run

### 1) Install dependencies

From the project root (where `manage.py` exists):

```bash
pip install -r requirements.txt
```

### 2) Create and apply migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### 3) Load initial data (cities)

```bash
python manage.py add_cities
```

### 4) Admin credentials (default)

* **username:** `admin`
* **password:** `admin`

> ⚠️ Change these in production.

### 5) Run the server

```bash
python manage.py runserver
```

Open:

* App: `http://127.0.0.1:8000/`
* Admin: `http://127.0.0.1:8000/admin/`

Feel free to fork, improve, and submit pull requests.
Clean code and smart ideas are always welcome 💡
