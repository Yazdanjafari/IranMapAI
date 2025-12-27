from django.urls import path
from . import views
from django.views.static import serve
from django.conf import settings
from django.conf.urls.static import static

app_name = "Authenticate"

urlpatterns = [
    path("", views.main, name="Main"),
]

