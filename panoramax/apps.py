from django.apps import AppConfig


class PanoramaxConfig(AppConfig):
    """Django app config: registers the signal receivers on startup."""

    name = 'panoramax'
    verbose_name = 'Panoramax'

    def ready(self):
        # importing registers the `@receiver` decorated functions
        from . import receivers
