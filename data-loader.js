/* ══════════════════════════════════════════════════════════════════════════
   AP ISW dashboard — shared data loader
   ──────────────────────────────────────────────────────────────────────────
   Every page's data lives in data/*.json. A page declares what it needs and
   waits for it before rendering:

     ISWData.load('deviceInventory', 'processMonitoring').then(startPage);

   Loaded sets are assigned onto window.APP_DATA under the same keys the
   dashboard has always used, so the rendering code is unchanged.

   NOTE: fetch() cannot read file:// URLs, so the dashboard must be served
   over http — VS Code's Live Server, or any static server. Opening the HTML
   straight from disk will leave the pages empty; see README.md.
   ══════════════════════════════════════════════════════════════════════════ */
(function () {
'use strict';

window.APP_DATA = window.APP_DATA || {};

/* ┌────────────────────────────────────────────────────────────────────────┐
   │  BUMP THIS WHENEVER YOU CHANGE ANYTHING IN data/                       │
   └────────────────────────────────────────────────────────────────────────┘
   It is appended to every data request as ?v=<VERSION>. The filenames never
   change, so without it a browser that cached data/device-inventory.json can
   keep serving the old copy after an update — the dashboard would show stale
   numbers with nothing on screen to say so. Changing this string makes each
   URL new, so every visitor picks the update up on their next reload.

   Any value works as long as it changes; a date is the easiest to eyeball. */
const VERSION = '2026-09-21';

/* Logical name -> file. The key is also the APP_DATA property the data lands
   on, except where 'key' says otherwise. */
const SOURCES = {
  deviceInventory:   { file: 'data/device-inventory.json'   },
  processMonitoring: { file: 'data/process-monitoring.json' },
  lmtData:           { file: 'data/lmt-data.json'           },
  refillTracker:     { file: 'data/refill-tracker.json'     },
  bucketTypes:       { file: 'data/bucket-types.json'       },
  galleryImages:     { file: 'data/gallery-images.json'     },
  resources:         { file: 'data/resources.json'          },
  ohsrMaster:        { file: 'data/ohsr-master.json'        },
  apDistricts:       { file: 'data/ap-districts.geojson'    }
};

/* Base path, so a page in a sub-folder still resolves data/ correctly. */
const BASE = (function () {
  const s = document.currentScript || document.querySelector('script[src*="data-loader.js"]');
  if (!s) return '';
  return s.src.replace(/js\/data-loader\.js(\?.*)?$/, '');
})();

const cache = {};   // name -> Promise, so two callers share one request

function fetchOne(name) {
  const src = SOURCES[name];
  if (!src) return Promise.reject(new Error('Unknown data set: ' + name));
  if (cache[name]) return cache[name];

  cache[name] = fetch(BASE + src.file + '?v=' + encodeURIComponent(VERSION))
    .then(r => {
      if (!r.ok) throw new Error(r.status + ' ' + r.statusText);
      return r.json();
    })
    .then(json => {
      window.APP_DATA[src.key || name] = json;
      return json;
    })
    .catch(err => {
      delete cache[name];                       // let a retry through
      const why = location.protocol === 'file:'
        ? 'the dashboard is open from disk (file://) — serve it over http instead; see README.md'
        : err.message;
      throw new Error('Could not load ' + src.file + ' — ' + why);
    });

  return cache[name];
}

/* Shows the failure on the page instead of only in the console, so a missing
   or unserved data file is obvious rather than looking like an empty report. */
function showError(err) {
  console.error('[ISWData]', err);
  const box = document.createElement('div');
  box.setAttribute('role', 'alert');
  box.style.cssText = 'margin:14px;padding:14px 18px;border-radius:8px;border-left:4px solid #c0392b;'
                    + 'background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.07);'
                    + 'font:13px/1.6 "Segoe UI",Arial,sans-serif;color:#1a2535;';
  box.innerHTML = '<strong style="color:#c0392b;">Data could not be loaded</strong><br>'
                + String(err.message || err).replace(/[<>&]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]));
  if (document.body) document.body.insertBefore(box, document.body.firstChild);
}

/* load(...names) -> Promise<APP_DATA>, resolved once every set is in place.
   Waits for DOMContentLoaded too, so callers can touch the DOM immediately. */
function load() {
  const names = Array.prototype.slice.call(arguments);
  const domReady = document.readyState === 'loading'
    ? new Promise(r => document.addEventListener('DOMContentLoaded', r))
    : Promise.resolve();

  return Promise.all([domReady].concat(names.map(fetchOne)))
    .then(() => window.APP_DATA)
    .catch(err => { showError(err); throw err; });
}

window.ISWData = { load: load, sources: SOURCES, version: VERSION };

})();
