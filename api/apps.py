from django.apps import AppConfig


class ApiConfig(AppConfig):
    name = "api"

    def ready(self):
        from .seed_data import seed_catalog_and_demo_data

        try:
            seed_catalog_and_demo_data()
        except Exception:
            pass
