"""
Signal receivers that hook the plugin into G3W-ADMIN's project init flow.
"""
from django.dispatch import receiver

from core.signals import initconfig_plugin_start

from . import __version__


@receiver(initconfig_plugin_start)
def set_initconfig_value(sender, **kwargs):
    """
    Add the `panoramax` entry to the client init config for every project,
    so G3W-CLIENT knows to load and register the Panoramax control.

    `gid` uniquely identifies the project (type + id) and is used by the
    client plugin to avoid registering itself more than once per project.
    """

    return {
        'panoramax': {
            'version': __version__,
            'gid': f"{kwargs['projectType']}:{kwargs['project']}",
        },
    }
