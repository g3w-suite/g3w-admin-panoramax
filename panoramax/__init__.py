"""
G3W-ADMIN plugin that enables the Panoramax map control on every project.

See README.md for installation and configuration instructions.
"""
from importlib.metadata import PackageNotFoundError, version

try:
    # installed package version (from git tag / setuptools_scm)
    __version__ = version('g3w-admin-panoramax')
except PackageNotFoundError:
    # fallback when running from source without an installed distribution
    __version__ = '0.0.0-alpha.0'
