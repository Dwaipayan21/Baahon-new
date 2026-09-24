# PujoPath Route Feature — AI Context & Frontend Integration Prompt

## 1. Purpose of This File

This document is a context prompt for the teammate responsible for building the **frontend UI for the route feature** of the PujoPath Durga Puja discovery application.

Paste this entire Markdown file into ChatGPT/another AI before asking for help with the route UI. The AI should use this document as the backend/API context and should **not redesign or change the backend logic** unless explicitly asked.

---

# 2. Project Context

PujoPath is a Durga Puja pandal discovery web application.

One of the implemented backend features is **route/navigation support**. The user can select a pandal and request a route from their current location to that pandal.

The route feature supports three modes:

- `walking`
- `car`
- `metro`

The frontend teammate's responsibility is to build the UI that consumes this existing API and presents the route clearly to the user.

---

# 3. Backend Work Already Completed

The backend route system has been implemented and tested.

## Route controller

The route controller handles:

```text
GET /api/path
```

It accepts these query parameters:

```text
latitude
longitude
pandalId
mode
```

Example:

```text
/api/path?latitude=22.5809&longitude=88.429&pandalId=6aab81e8fb7a886259cf5e51&mode=metro
```

Remove the accidental space in `pandalId` when actually calling the API:

```text
/api/path?latitude=22.5809&longitude=88.429&pandalId=6aab81e8fb7a886259cf5e51&mode=metro
```

Default mode:

```text
walking
```

---

# 4. Supported Modes

## Walking

The backend uses OpenRouteService with:

```text
foot-walking
```

The response contains:

- starting coordinates
- destination/pandal
- distance
- estimated time
- route geometry

---

## Car

The backend uses OpenRouteService with:

```text
driving-car
```

The response contains:

- starting coordinates
- destination/pandal
- distance
- estimated time
- route geometry

---

## Metro

Metro mode is more complex.

The backend combines:

1. Walking from user location to the nearest metro station
2. Metro station-to-station route
3. Walking from the destination metro station to the pandal

The metro network is represented using local JSON data for:

- Green Line stations
- Blue Line stations
- Green Line connections
- Blue Line connections

The backend has a metro service that:

- finds the nearest metro station to a GPS coordinate
- builds a metro graph
- finds a station-to-station path using BFS
- detects the lines used
- counts transfers
- returns the complete metro station sequence

---

# 5. Metro Interchange Already Works

Green and Blue line interchange has been implemented and tested successfully.

Example route:

```text
Salt Lake Sector V
        ↓
Karunamoyee
        ↓
Central Park
        ↓
City Centre
        ↓
Bengal Chemical
        ↓
Salt Lake Stadium
        ↓
Phoolbagan
        ↓
Sealdah
        ↓
Esplanade
        ↓
CHANGE LINE
        ↓
Esplanade (Line 1)
        ↓
Chandni Chowk
        ↓
Central
        ↓
Mahatma Gandhi Road
        ↓
Girish Park
        ↓
Shobhabazar Sutanuti
        ↓
Bagbazar Sarbojanin
```

The backend reports:

```json
"lines": [
  "Green",
  "Blue"
],
"transfers": 1
```

So the frontend must visually communicate that a **line change/transfer is required**.

---

# 6. Important Metro Response Structure

For a successful metro request, the API returns approximately:

```json
{
  "success": true,
  "data": {
    "mode": "metro",

    "start": {
      "latitude": 22.5809,
      "longitude": 88.429
    },

    "destination": {
      "pandalId": "6aab81e8fb7a886259cf5e51",
      "name": "Bagbazar Sarbojanin",
      "latitude": 22.6012,
      "longitude": 88.3668
    },

    "walking": {
      "toMetro": {
        "distance": {
          "value": 4,
          "unit": "m"
        },
        "estimatedTime": {
          "value": 1,
          "unit": "minutes"
        },
        "geometry": {
          "type": "LineString",
          "coordinates": []
        }
      },

      "fromMetro": {
        "distance": {
          "value": 828,
          "unit": "m"
        },
        "estimatedTime": {
          "value": 10,
          "unit": "minutes"
        },
        "geometry": {
          "type": "LineString",
          "coordinates": []
        }
      }
    },

    "metro": {
      "fromStation": {
        "id": "salt-lake-sector-v",
        "name": "Salt Lake Sector V",
        "line": "Green",
        "location": {
          "type": "Point",
          "coordinates": [
            88.4290204,
            22.5809412
          ]
        }
      },

      "toStation": {
        "id": "shobhabazar-sutanuti",
        "name": "Shobhabazar Sutanuti",
        "line": "Blue",
        "location": {
          "type": "Point",
          "coordinates": [
            88.3650951,
            22.5960768
          ]
        }
      },

      "stations": [],
      "lines": [
        "Green",
        "Blue"
      ],
      "transfers": 1
    }
  }
}
```

The actual `stations` array contains the complete sequence of metro stations.

---

# 7. What the Frontend Should Show

The goal is NOT to show raw JSON.

The frontend should turn the response into an easy-to-understand navigation experience.

For example:

```text
Route to Bagbazar Sarbojanin

[ Metro ]

🚶 Walk
Salt Lake Sector V
4 m · ~1 min

        ↓

🚇 Green Line

Salt Lake Sector V
Karunamoyee
Central Park
City Centre
...
Esplanade

        ↓

🔄 Change at Esplanade

        ↓

🚇 Blue Line

Esplanade
Chandni Chowk
Central
Mahatma Gandhi Road
Girish Park
Shobhabazar Sutanuti

        ↓

🚶 Walk
Shobhabazar Sutanuti → Bagbazar Sarbojanin
828 m · ~10 min
```

The exact visual design is up to the frontend teammate.

---

# 8. Suggested Route UI Structure

A useful UI can contain:

## Route mode selector

```text
[ Walking ] [ Car ] [ Metro ]
```

When the user selects a mode, call the same endpoint with the corresponding mode.

Example:

```text
mode=walking
mode=car
mode=metro
```

---

## Route summary

Show:

- destination pandal name
- total/leg distance where available
- estimated travel time where available
- selected mode

Do not invent metro travel time because the current backend response does not provide a metro ride duration.

---

## Walking / Car

For walking and car:

```text
Start
  ↓
Route
  ↓
Pandal
```

Use:

```text
data.geometry
```

to draw the route on the map.

---

## Metro

Metro should be visually divided into three logical parts:

### Part 1 — Walk to metro

Use:

```text
data.walking.toMetro
```

Display:

- distance
- estimated time
- walking route geometry

Then show:

```text
Nearest/boarding station:
data.metro.fromStation.name
```

---

### Part 2 — Metro journey

Use:

```text
data.metro.stations
data.metro.lines
data.metro.transfers
```

Show the stations in the exact order returned by the backend.

Do NOT sort or reorder the stations on the frontend.

For a transfer:

```text
data.metro.transfers > 0
```

show a clear transfer indicator.

Example:

```text
Green Line
   ↓
Esplanade
   ↓
Transfer
   ↓
Blue Line
```

The frontend may determine the line associated with each station from:

```text
station.line
```

This is preferable to assuming the line from array position.

---

### Part 3 — Walk from metro to pandal

Use:

```text
data.walking.fromMetro
```

Display:

- destination metro station
- distance
- estimated time
- walking route geometry

Then:

```text
Pandal
Bagbazar Sarbojanin
```

---

# 9. Map Integration

For walking and car modes:

```text
data.geometry
```

is the route geometry.

For metro mode there are separate walking geometries:

```text
data.walking.toMetro.geometry
data.walking.fromMetro.geometry
```

The metro section itself is represented by the ordered station data:

```text
data.metro.stations
```

Each station has:

```json
{
  "id": "...",
  "name": "...",
  "line": "Green",
  "location": {
    "type": "Point",
    "coordinates": [longitude, latitude]
  }
}
```

Important:

GeoJSON coordinates are:

```text
[longitude, latitude]
```

NOT:

```text
[latitude, longitude]
```

When passing coordinates to a mapping library, make sure its expected coordinate format is respected.

---

# 10. Important Frontend Rules

Do not duplicate backend route logic in the frontend.

The frontend should NOT:

- calculate nearest metro station
- calculate metro paths
- perform BFS
- calculate transfers
- rebuild the metro graph
- call OpenRouteService directly
- expose the OpenRouteService API key
- calculate alternative metro paths independently

The backend already handles these responsibilities.

The frontend's responsibility is:

```text
User interaction
      ↓
API request
      ↓
Parse response
      ↓
Display route
      ↓
Draw route/map
```

---

# 11. Error Handling

The frontend should gracefully handle:

### Invalid coordinates

Backend:

```text
400
Invalid latitude or longitude
```

### Invalid pandal ID

Backend:

```text
400
Invalid pandal ID
```

### Pandal not found

Backend:

```text
404
Pandal not found
```

### Invalid mode

Backend:

```text
400
Invalid mode. Use walking, car or metro
```

### Metro route unavailable

Backend:

```text
404
No metro route available for this journey
```

### Walking route to/from metro unavailable

Backend:

```text
404
Walking route to or from metro station not found
```

The frontend should show a user-friendly message instead of exposing raw backend errors.

---

# 12. Example API Requests

## Walking

```text
GET /api/path?latitude=22.5809&longitude=88.429&pandalId=6aab81e8fb7a886259cf5e51&mode=walking
```

## Car

```text
GET /api/path?latitude=22.5809&longitude=88.429&pandalId=6aab81e8fb7a886259cf5e51&mode=car
```

## Metro

```text
GET /api/path?latitude=22.5809&longitude=88.429&pandalId=6aab81e8fb7a886259cf5e51&mode=metro
```

---

# 13. Current Backend Architecture

Relevant backend pieces:

```text
backend/
├── controllers/
│   └── route.controller.js
│
├── routes/
│   └── path.route.js
│
├── services/
│   ├── routing.service.js
│   └── metro.service.js
│
└── data/
    └── metro/
        ├── green-line.json
        ├── blue-line.json
        ├── green-connections.json
        └── blue-connections.json
```

### route.controller.js

Responsible for:

- request validation
- pandal lookup
- mode selection
- metro route orchestration
- walking/car route orchestration
- API response formatting

### routing.service.js

Responsible for:

- communicating with OpenRouteService
- walking routes
- car routes
- returning GeoJSON route data

### metro.service.js

Responsible for:

- loading metro JSON data
- nearest station calculation
- metro graph construction
- BFS path finding
- interchange detection
- transfer counting
- metro route generation

---

# 14. Security

The frontend must never contain:

```text
OPENROUTESERVICE_API_KEY
```

The frontend only calls the PujoPath backend route endpoint.

The backend communicates with OpenRouteService.

---

# 15. Current Implementation Status

Backend route feature:

```text
✅ Walking route
✅ Car route
✅ Metro route
✅ Green Line
✅ Blue Line
✅ Green → Blue interchange
✅ Nearest metro station
✅ Transfer count
✅ Walking to metro
✅ Walking from metro
✅ Route geometry
✅ Pandal validation
✅ Coordinate validation
✅ Mode validation
✅ API testing completed
```

Frontend route UI:

```text
⏳ To be implemented by frontend teammate
```

---

# 16. What I Need Help With

When using this document as an AI prompt, the frontend teammate should ask the AI to help implement the route UI based on the existing backend contract.

For example:

> "Using the backend context above, help me implement the frontend route UI. Do not change the backend API. I will provide my existing frontend files. Modify only the necessary frontend files and keep the implementation consistent with the existing project."

Or:

> "Here is my existing map component. Integrate the walking/car/metro route response into it without changing the backend."

Or:

> "Build the metro route step/timeline UI from `data.metro.stations`, including line changes based on `station.line` and `data.metro.transfers`."

The AI should first inspect the existing frontend architecture and then make the smallest necessary changes rather than replacing the entire frontend.

---

# 17. Main UX Goal

The user should be able to select a pandal and understand:

```text
Where am I?
     ↓
How do I reach the pandal?
     ↓
Which transport mode am I using?
     ↓
Where do I walk?
     ↓
Which metro station do I use?
     ↓
Which metro line do I take?
     ↓
Where do I change lines?
     ↓
Which station do I get off at?
     ↓
How far do I walk to the pandal?
```

The final UI should make this information understandable at a glance while using the backend response as the single source of truth.

---

# 18. Important Instruction to the AI

Do not assume additional backend fields that are not present in the API response.

Do not invent:

- metro travel time
- metro fare
- train frequency
- platform number
- live metro status
- live train position
- alternative routes

unless the backend is later extended to provide those fields.

Work with the existing API contract first.

The primary objective is to turn the existing route API into a clear, reliable and user-friendly frontend navigation experience.
