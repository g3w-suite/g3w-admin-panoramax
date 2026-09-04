/**
 * @file adds a Panoramax map control and context menu entry on every map.
 */
(function () {

  const GUI        = g3w.app;
  const _          = g3w.gettext;
  const {
    XHR,
    PickCoordinatesInteraction,
  }                = g3w.utils;

  new class extends g3w.Plugin {
    constructor() {
      super({ name: 'panoramax' });

      GUI.isReady().then(async () => {
        if (!this.registerPlugin(this.config.gid)) {
          return;
        }

        GUI.addControl('panoramax', new PanoramaxControl());

        this.setReady(true);
      });
    }
  };

  /**
   * Map control that queries the Panoramax API for the nearest street-level
   * image at a clicked/picked coordinate and displays it in a 360° viewer
   * (`@photo-sphere-viewer/core`, loaded on demand from a CDN).
   */
  class PanoramaxControl extends g3w.Control {

    /** @type {string} */
    #API = 'https://api.panoramax.xyz/api';

    /** @type {ol.Map} */
    #map = null;

    /** @type {ol.Feature} */
    #marker = new ol.Feature();

    /** @type {boolean} */
    active = false;

    /** @type {Promise} resolves to the `@photo-sphere-viewer/core` module (loaded once) */
    static #psv = null;

    /** @type {object} current photo-sphere-viewer instance */
    #viewer = null;

    /** @type {ol.layer.Vector} */
    #layer = new ol.layer.Vector({
      source: new ol.source.Vector({ features: [] }),
      style: (feature, resolution) => [
        new ol.style.Style({
          text: new ol.style.Text({
            text:   '\uf21d', 
            font:   '900 18px "Font Awesome 5 Free"', 
            fill:   new ol.style.Fill({ color: '#ff0' }),
            stroke: new ol.style.Stroke({ color: '#000', width: 2 }),
          })
        })
      ]
    });

    /** @type {ol.layer.VectorTile} */
    #coverage = new ol.layer.VectorTile({
      visible: false,
      source: new ol.source.VectorTile({
        format: new ol.format.MVT(),
        url:    `${this.#API}/map/{z}/{x}/{y}.mvt`,
      }),
      style: feature => new ol.style.Style(
        'Point' === feature.getGeometry().getType()
          ? { image: new ol.style.Circle({ radius: 4, fill: new ol.style.Fill({ color: '#e91e63' }) }) }
          : { stroke: new ol.style.Stroke({ color: '#e91e63', width: 3 }) }
      ),
    });

    constructor(opts = {}) {

      super({
        ...opts,
        offline:                 false,
        visible:                 true,
        name:                    'panoramax',
        tipLabel:                _('Panoramax'),
        clickmap:                true,
        interactionClass:        PickCoordinatesInteraction,
        interactionClassOptions: { cursor: 'ol-panoramax' },
        cursorClass:             'ol-panoramax',
        customClass:             'fas fa-road',
      });

      if (!document.getElementById('psv-css')) {
        document.head.insertAdjacentHTML('beforeend', /* html */ `<link id="psv-css" rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@photo-sphere-viewer/core@5/index.css">`);
      }

      GUI.on('closecontent', () => {
        this.#viewer?.destroy();
        this.#viewer = null;
        if (this.isToggled()) {
          this.#layer.getSource().clear();
        }
      });

      GUI.on('map:context-menu', menu => {
        menu.items.push({
          icon:     'fas fa-road',
          label:    'Panoramax',
          position: 10,
          cbk:      () => GUI.getMapControl('panoramax')?.showPanoramax(menu.map_coords),
        });
      });

    }

    static #loadPSV() {
      // load the viewer module once and cache the promise for subsequent calls
      return PanoramaxControl.#psv = PanoramaxControl.#psv || import('https://cdn.jsdelivr.net/npm/@photo-sphere-viewer/core@5/+esm');
    }

    /**
     * Fetch the closest Panoramax image (within a small bbox) to the given
     * WGS84 coordinate and open it in the 360° viewer, or warn if none found.
     * @param {{ lng: number, lat: number }} coords
     */
    setPosition({ lng, lat }) {
      this.active = true;

      const delta = 0.001;

      Promise.all([
        XHR.get({
          url: `${this.#API}/search`,
          params: {
            limit: 1,
            bbox:  [ lng - delta, lat - delta, lng + delta, lat + delta ].join(','),
          }
        }),
        PanoramaxControl.#loadPSV(),
      ])
        .then(async ([data, { Viewer }]) => {
          const feature  = (data.features || [])[0];
          const panorama = feature?.assets?.sd?.href || feature?.assets?.hd?.href;
          if (!panorama) {
            await GUI.closeContent();
            GUI.showUserMessage({
              type:     'warning',
              message:  'No Panoramax images found at this location',
              autoclose: true,
            });
            return;
          }
          this.#viewer?.destroy();
          await GUI.setContent({
            title:   'Panoramax',
            content: '<div id="panoramax" style="height:100%; width:100%;"></div>',
          });
          this.#viewer = new Viewer({
            container:      document.getElementById('panoramax'),
            panorama,
            defaultZoomLvl: 0,
            navbar:         ['zoom', 'fullscreen'],
          });
        })
        .catch(e => { console.warn(e); GUI.closeContent(); });
    }

    setMap(map) {
      this.#map = map;

      super.setMap(map);

      this.#map.addLayer(this.#coverage);
      this.#map.addLayer(this.#layer);

      this._interaction.on('picked', ({ coordinate }) => {
        this.showPanoramax(coordinate);
        if (this._autountoggle) {
          this.toggle();
        }
      });
    }

    /** @param {ol.Coordinate} coordinate map coordinate (control's projection) to look up */
    showPanoramax(coordinate) {
      const [ lng, lat ] = ol.proj.transform(coordinate, this.#map.getView().getProjection().getCode(), 'EPSG:4326');
      this.#marker.setGeometry(new ol.geom.Point(coordinate));
      this.setPosition({ lng, lat });
    }

    /** Reset marker, viewer and content panel to the control's inactive state. */
    clear() {
      this.#layer.getSource().clear();
      this.#marker.setGeometry(null);
      this.#viewer?.destroy();
      this.#viewer = null;
      if (this.active) {
        GUI.closeContent();
      }
      this.active = false;
    }

    /** Show/hide the coverage tile layer and marker feature along with the control state. */
    toggle(toggle) {
      super.toggle(toggle);
      this.#coverage.setVisible(this.isToggled());
      if (this.isToggled()) {
        this.#layer.getSource().addFeatures([this.#marker]);
      } else {
        this.clear();
      }
    }

  }

})();
