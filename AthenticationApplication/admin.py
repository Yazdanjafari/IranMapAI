from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _
from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    """Custom admin panel for the User model with Persian labels and profile preview."""

    # The fields displayed in the user list page
    list_display = (
        "username",
        "first_name",
        "last_name",
        "phone_number",
        "nationality_id",
        "is_active",
        "is_staff",
        "is_superuser",
        "date_joined",
    )
    list_filter = (
        "is_active",
        "is_staff",
        "is_superuser",
        "date_joined",
    )

    search_fields = ("username", "first_name", "last_name", "phone_number", "nationality_id", "email")

    ordering = ("-update",)

    readonly_fields = ("date_joined", "update")

    # For editing user
    fieldsets = (
        (_("اطلاعات حساب کاربری"), {
            "fields": (
                "username",
                "email",
                "password",
            )
        }),
        (_("اطلاعات شخصی"), {
            "fields": (
                "first_name",
                "last_name",
                "phone_number",
                "nationality_id",
                "date_of_birth",
                "profile",
            )
        }),
        (_("وضعیت دسترسی"), {
            "fields": (
                "is_active",
                "is_staff",
                "is_superuser",
                "groups",
                "user_permissions",
            )
        }),
        (_("تاریخ‌های مهم"), {
            "fields": (
                "date_joined",
                "update",
            )
        }),
    )

    # For creating a user in admin
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": (
                "username",
                "password1",
                "password2",
                "first_name",
                "last_name",
                "email",
                "phone_number",
                "nationality_id",
                "date_of_birth",
                "profile",
                "is_active",
                "is_staff",
                "is_superuser",
                "groups",
                "user_permissions",
            ),
        }),
    )
