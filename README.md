# g3w-admin-panoramax

Proof of concept Django plugin for G3W-ADMIN/G3W-CLIENT that adds a **Panoramax** map control to every project: click on the map (or use the map context menu) to view the nearest [Panoramax](https://panoramax.fr/) street-level 360° image, if any is available at that location.

<img width="1266" height="913" alt="image" src="https://github.com/user-attachments/assets/62e12070-f9af-4ade-8bfe-ca340d46ad0e" />

## How it works

- The Django app (`panoramax/`) has no models, migrations or API routes: on startup it just registers a signal receiver ([`receivers.py`](panoramax/receivers.py)) that adds a `panoramax` entry (plugin version + project id) to the client init config for every project.
- G3W-CLIENT reads that config and loads the client-side plugin ([`static/panoramax/js/plugin.js`](panoramax/static/panoramax/js/plugin.js)), which registers a map control that:
  1. queries the public Panoramax API (`https://api.panoramax.xyz/api`) for the closest image to the picked coordinate;
  2. shows a vector tile layer with the available image coverage while the control is active;
  3. opens the result in a 360° viewer ([`@photo-sphere-viewer/core`](https://photo-sphere-viewer.js.org/), loaded on demand from a CDN).

No server-side settings or credentials are required: all requests to Panoramax are made directly from the browser.

## Installation

Install the module into [`g3w-admin`](https://github.com/g3w-suite/g3w-admin/tree/v.3.5.x/g3w-admin) applications folder:

```sh
# Install module from github (v1.0.0)
pip3 install git+https://github.com/g3w-suite/g3w-admin-panoramax.git@v1.0.0

# Install module from github (master branch)
# pip3 install git+https://github.com/g3w-suite/g3w-admin-panoramax.git@master

# Install module from local folder (git development)
# pip3 install /g3w-admin/g3w-admin/panoramax
```

Enable `'panoramax'` module adding it to `G3WADMIN_LOCAL_MORE_APPS` list:

```py
# local_settings.py

G3WADMIN_LOCAL_MORE_APPS = [
    ...
    'panoramax'
    ...
]
```

Refer to [g3w-suite-docker](https://github.com/g3w-suite/g3w-suite-docker) repository for more info about running this on a docker instance.

## Configuration

No server-side settings are required. Once installed and enabled, the control is automatically shown on every project's map.

## Development

```sh
make install   # fetch shared versioning/venv Makefiles
```

Version numbers are derived from git tags via `setuptools_scm` (see `_version.py`, generated at build time and not tracked in git).

## License

[Mozilla Public License 2.0 (MPL 2.0)](LICENSE)
