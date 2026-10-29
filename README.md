# AP ISW — ILC Monitoring Dashboard

Andhra Pradesh · India Safe Water · Evidence Action

## Running it

**The dashboard must be served over http.** Opening `Index.html` by
double-clicking it will show empty pages, because browsers refuse to let a
`file://` page read the JSON data files.

Easiest option, in VS Code:

1. Install the **Live Server** extension (`ritwickdey.LiveServer`).
2. Right-click `Index.html` → **Open with Live Server**.

Or serve the folder from a terminal with whatever you have installed:

```bash
npx serve .
```

```bash
python -m http.server 8000
```

Then open `http://localhost:8000/Index.html`.

Any static web host works the same way — copy the whole folder up as-is.

## Layout

```
Index.html              Shell: header, sidebar, and the frame sections load into
homepage.html           The eleven sections, one file each
AboutUs.html
MapLocation.html
DeviceStatus.html
DeviceDetails.html
TAChlorination.html
LMTChlorination.html
RefillDetails.html
JalMitraExport.html
Resources.html
Glossary.html
js/
  data-loader.js        Fetches the JSON files and puts them on window.APP_DATA
data/
  device-inventory.json     213 ILC sites — the main table
  process-monitoring.json  2850 TA chlorination readings
  lmt-data.json              71 LMT dose-check readings
  refill-tracker.json       161 refill records
  bucket-types.json           5 bucket definitions
  gallery-images.json        18 photo URLs for the homepage carousel
  resources.json              9 document links
  ohsr-master.json          207 AP Govt. asset-master entries (OHSR ID + scheme)
  ap-districts.geojson       26 district boundaries for the choropleth
```

`Index.html` keeps a `PAGES` map near the top of its script — that is where a
section's filename is defined. Rename or add a section by editing that object.

## Updating the data

1. Edit the file under `data/`.
2. **Bump `VERSION` at the top of `js/data-loader.js`** — any changed value
   works, a date is easiest to read.

Nothing else needs changing: every page reads these files at run time, so the
header KPIs and the sections always agree with each other.

Step 2 matters once the dashboard is hosted somewhere. `VERSION` is appended to
every data request as `?v=…`, so changing it gives each file a URL the browser
has not seen before. Skip it and someone who visited earlier may keep seeing the
old numbers from their cache, with nothing on screen to indicate the data is
stale. Locally you can usually get away with a hard reload instead.

Each page declares what it needs:

```js
ISWData.load('processMonitoring', 'deviceInventory').then(() => { ... });
```

The names map to files in `SOURCES` at the top of `js/data-loader.js`. To point
the dashboard at an API instead of static files, change the paths there — the
pages themselves do not need to be touched.

If a data file is missing or the dashboard is opened from disk, a red banner
appears at the top of the page saying what failed, rather than the page simply
rendering empty.

## Notes on the data

- The inventory holds **213** sites. Several page headers read "207" — that
  text is inherited from the original dashboard and was never updated.
- On Device Status, Functional (194) + Non-Functional (13) = 207, not 213. Six
  rows carry a third status value and fall outside both donut slices.
- One site (`AP/KR/VUY/014`) has a blank bucket type and a blank status. It is
  counted everywhere but is not offered as a Bucket filter option.

## External dependencies

Loaded from CDN, so the dashboard needs internet access:

- Chart.js 4.4.1 — Device Status, TA, LMT, Refill
- chartjs-adapter-date-fns 3 — LMT (time axis)
- Leaflet 1.9.4 — Homepage choropleth, Map Location

Map tiles come from Esri ArcGIS Online, and the carousel photos from Google
Drive.
