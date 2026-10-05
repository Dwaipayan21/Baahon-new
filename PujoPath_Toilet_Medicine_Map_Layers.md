# PujoPath — Toilet & Medicine Store Map Layers

## Purpose

Add two new map layers to the existing PujoPath map:

1. **Public Toilets** 🚻
2. **Medicine Stores / Pharmacies** 💊

The data for both layers is already prepared as static GeoJSON files. Do **not** create a backend API, MongoDB model, or CRUD API for these features.

---

## Data Files

Keep these files in:

```text
src/data/
├── toilets.geojson
└── medicines.geojson
```

### `toilets.geojson`

Contains mapped public toilet locations in the Kolkata administrative area.

### `medicines.geojson`

Contains mapped pharmacy/medicine-store locations in the Kolkata administrative area.

The files are static datasets and should be loaded by the frontend.

---

## What You Need to Build

### 1. Toilet Layer

Load:

```text
src/data/toilets.geojson
```

and display the toilet locations on the existing map.

Use a clear toilet marker/icon, preferably:

```text
🚻
```

or an appropriate map marker/icon.

When the user clicks a toilet marker, show a popup.

The popup should use the available GeoJSON properties. At minimum, show:

- Toilet
- Name, if available
- Address/details, if available
- Fee, if available
- Opening hours, if available
- Accessibility information, if available

Do not show empty/undefined fields.

---

### 2. Medicine Store Layer

Load:

```text
src/data/medicines.geojson
```

and display pharmacy/medicine-store locations on the existing map.

Use a clear medicine/pharmacy marker, preferably:

```text
💊
```

or an appropriate map marker/icon.

When the user clicks a pharmacy marker, show a popup.

Use the available GeoJSON properties. Show useful information such as:

- Pharmacy name, if available
- Address/details, if available
- Phone, if available
- Opening hours, if available
- Website, if available

Do not show empty/undefined fields.

---

## 3. Layer Toggles

Add both layers to the existing map layer controls.

For example:

```text
☑ Pandals
☑ Routes
☑ Red Zones
☑ Shelters
☑ Settlement
☑ Toilets
☑ Medicine Stores
```

The user should be able to:

- Turn the Toilet layer ON/OFF
- Turn the Medicine Store layer ON/OFF

Do not change the existing layer behavior.

---

## 4. Keep Existing Map Features Unchanged

This is important.

Do **not** break or unnecessarily modify:

- Pandal markers
- Pandal popups
- Routes
- Route selection
- Red-zone layer
- Shelter layer
- Settlement layer
- Crowd information
- Check-in functionality
- Existing map controls
- Search
- Existing UI

Only add the two new layers and the minimum code required to support them.

---

## 5. GeoJSON Coordinate Handling

The GeoJSON coordinates follow the standard format:

```text
[longitude, latitude]
```

Do not accidentally treat them as:

```text
[latitude, longitude]
```

Use the existing map library's GeoJSON support where possible instead of manually transforming every coordinate.

---

## 6. Recommended Structure

If the project already has a map/layer structure, follow the existing pattern.

For example:

```text
src/
├── components/
│   ├── ...
│   ├── ToiletLayer.jsx
│   └── MedicineLayer.jsx
│
├── data/
│   ├── toilets.geojson
│   └── medicines.geojson
│
└── ...
```

If creating separate components is unnecessary because the existing map component already handles all layers, keep the implementation inside the existing structure instead.

**Do not create unnecessary files.**

---

## 7. Performance

The datasets are static.

Do not:

- Call Google Places API for these locations
- Create a new backend endpoint
- Fetch the data repeatedly from an external service
- Store the locations in MongoDB

Load the local GeoJSON files from the frontend.

If the existing map already has a suitable GeoJSON/layer mechanism, reuse it.

---

## 8. Marker Visibility

The new markers should:

- Appear only when their layer is enabled
- Be easy to distinguish from pandal markers
- Work correctly when zooming and panning
- Not interfere with existing route lines or other layers

---

## 9. Important Data Limitation

The GeoJSON files contain locations currently mapped in the source dataset.

Do **not** describe them in the UI as "all toilets in Kolkata" or "all pharmacies in Kolkata".

Use neutral wording such as:

- "Public Toilets"
- "Medicine Stores"
- "Pharmacies"

---

## 10. Testing Checklist

Before finishing, verify:

### Toilets

- [ ] `toilets.geojson` loads without errors
- [ ] Toilet markers appear
- [ ] Toilet layer can be toggled
- [ ] Clicking a toilet opens a popup
- [ ] Missing properties do not produce `undefined` text

### Medicine Stores

- [ ] `medicines.geojson` loads without errors
- [ ] Medicine-store markers appear
- [ ] Medicine-store layer can be toggled
- [ ] Clicking a marker opens a popup
- [ ] Missing properties do not produce `undefined` text

### Existing Map

- [ ] Pandal markers still work
- [ ] Routes still work
- [ ] Existing layers still work
- [ ] Existing map controls still work
- [ ] No console errors
- [ ] Mobile layout is not broken

---

## Final Expected Result

The existing PujoPath map should have two additional optional layers:

```text
                    PujoPath Map
                         │
        ┌────────────────┼────────────────┐
        │                │                │
      Pandals          Routes        Other Layers
                                         │
                              ┌──────────┴──────────┐
                              │                     │
                         🚻 Toilets            💊 Pharmacies
                              │                     │
                         GeoJSON                GeoJSON
```

The implementation should be **frontend-only**, use the supplied local GeoJSON files, and make the smallest possible changes to the existing map.

