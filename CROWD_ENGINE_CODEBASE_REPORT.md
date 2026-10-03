# PujoPath Crowd Engine — Current Codebase Report

## 1. Executive Summary

The current Crowd Engine is a lightweight traffic-based crowd estimator for each pandal. It does not calculate crowd from check-ins or user activity. Instead, it stores a list of nearby sample points on each Pandal, periodically issues Google Routes API requests for those points, stores the results as observation records, and then aggregates a weighted average congestion score for the pandal.

The main runtime flow is:

- `server.js` starts the scheduler after MongoDB connects.
- `crowdScheduler.service.js` immediately runs a refresh and then schedules repeats with `setInterval` every 15 minutes.
- `crowdRefresh.service.js` finds all pandals with `crowdSamplePoints` and calls `collectPandalCrowdObservations` for each.
- `crowdObservation.service.js` filters stale sample points, selects at most two per pandal per refresh, calls `getTrafficObservation` for each, and inserts new `CrowdSample` documents.
- `crowdAggregation.service.js` reads recent `CrowdSample` records and computes a weighted score using each sample point’s `weight`.
- `pandal.controller.js` exposes `GET /api/pandals/:id/crowd` and returns `{ status, score, sampleCount, observedAt }`.

The major external dependency is Google Routes API, accessed via `fetch()` to `https://routes.googleapis.com/directions/v2:computeRoutes`, with the API key read from `process.env.GOOGLE_MAPS_API_KEY`. MongoDB stores the source data and observations. The data model is centered on `Pandal` (embedded `crowdSamplePoints`) and `CrowdSample` (one record per sample-point observation). There is no separate `CrowdStatus` collection or dedicated `Crowd` model in the inspected code.

The implementation appears intended to estimate current crowd intensity for each pandal by measuring how much travel time deviates from free-flow travel time at nearby roads, then using that as a proxy for congestion at the pandal. It is not a full real-time occupancy model and does not include historical trend modeling beyond a 15-minute aggregation window and a 24-hour TTL on observation records.

---

## 2. Inspected Files

| File | Purpose | Imports | Imported By | Status |
|------|---------|---------|-------------|--------|
| `backend/services/crowd/crowdAggregation.service.js` | Aggregates recent observations into a pandal crowd status and score | `CrowdSample` | `backend/controllers/pandal.controller.js` | Active |
| `backend/services/crowd/crowdEngine.service.js` | Refreshes a single pandal’s crowd status end-to-end | `Pandal`, `collectPandalCrowdObservations`, `getPandalCrowdStatus` | `backend/scripts/testCrowdEngine.js` | Active |
| `backend/services/crowd/crowdObservation.service.js` | Checks stale sample points, calls traffic provider, and saves observations | `Pandal`, `CrowdSample`, `getTrafficObservation` | `backend/services/crowd/crowdEngine.service.js`, `backend/services/crowd/crowdRefresh.service.js` | Active |
| `backend/services/crowd/crowdRefresh.service.js` | Refreshes crowd data for all pandals with sample points | `Pandal`, `collectPandalCrowdObservations` | `backend/services/crowd/crowdScheduler.service.js` | Active |
| `backend/services/crowd/crowdScheduler.service.js` | Starts the periodic refresh loop | `refreshCrowdData` | `backend/server.js` | Active |
| `backend/services/crowd/googleTraffic.service.js` | Calls Google Routes API and converts response into congestion metrics | `fetch` | `backend/services/crowd/crowdObservation.service.js` | Active |
| `backend/models/crowdSample.model.js` | Stores individual sampled traffic observations | `mongoose` | `backend/services/crowd/crowdObservation.service.js`, `backend/services/crowd/crowdAggregation.service.js` | Model |
| `backend/models/pandal.model.js` | Stores pandal metadata and embedded crowd-sample points | `mongoose` | `backend/services/crowd/crowdObservation.service.js`, `backend/services/crowd/crowdEngine.service.js`, `backend/services/crowd/crowdRefresh.service.js`, `backend/controllers/pandal.controller.js` | Model |
| `backend/controllers/pandal.controller.js` | Reads crowd status and returns it through API | `Pandal`, `getPandalCrowdStatus` | `backend/routes/pandal.route.js` | Active |
| `backend/routes/pandal.route.js` | Exposes crowd route | `getPandalCrowd` | `backend/server.js` | Route |
| `backend/server.js` | Starts MongoDB, mounts routes, and starts crowd scheduler | `pandalRoutes`, `startCrowdScheduler` | application startup | Active |
| `backend/scripts/generateCrowdSamplePoints.js` | Generates sample points using Overpass for each pandal | `fs/promises`, `fetch` | none discovered | Script |
| `backend/scripts/seedCrowdSamplePoints.js` | Seeds generated sample points into MongoDB pandals | `Pandal` | none discovered | Script |
| `backend/scripts/testCrowdEngine.js` | Runs a single pandal crowd refresh against MongoDB | `Pandal`, `refreshPandalCrowd` | none discovered | Test |
| `backend/scripts/testCrowdObservation.js` | Runs a single observation collection against MongoDB | `Pandal`, `collectPandalCrowdObservations` | none discovered | Test |
| `backend/seed.js` | Seeds initial pandal documents with static crowd sample data | `Pandal`, `crowdSamplePoints.json` | none discovered | Script |
| `backend/config/checkin.config.js` | Check-in radius and points config | none | `backend/controllers/checkin.controller.js` | Configuration |
| `backend/models/checkin.model.js` | Stores user check-ins for points and uniqueness | `mongoose` | `backend/controllers/checkin.controller.js` | Model |
| `backend/controllers/checkin.controller.js` | Creates/retrieves check-ins | `CheckIn`, `Pandal`, `User`, `CHECKIN_CONFIG` | `backend/routes/checkin.route.js` | Active |
| `backend/routes/checkin.route.js` | Exposes check-in endpoints | `createCheckIn`, `getPandalCheckInCount`, `getUserCheckIns` | `backend/server.js` | Route |
| `backend/.env.example` | Documents environment variables | none | none | Configuration |

Notes:

- A direct `CrowdStatus` model was not found.
- A direct `CrowdObservation` model was not found; the actual persisted observation model is `CrowdSample`.
- The `backend/tests` directory did not contain crowd-specific test files in the inspected code search.

---

## 3. Current Architecture

Actual architecture discovered in the code:

```text
Frontend / API client
     ↓
Express app (`server.js`)
     ↓
Route layer (`routes/pandal.route.js`)
     ↓
Controller (`controllers/pandal.controller.js`)
     ↓
Aggregation layer (`crowdAggregation.service.js`)
     ↓
MongoDB (`CrowdSample` observations + `Pandal.crowdSamplePoints` metadata)
     ↑
     └─ background scheduler (`crowdScheduler.service.js`)
             ↓
         refresh service (`crowdRefresh.service.js`)
             ↓
       observation service (`crowdObservation.service.js`)
             ↓
      traffic provider (`googleTraffic.service.js`)
             ↓
      Google Routes API
```

Important differences from a common “service + repository + controller” pattern:

- The primary data is embedded in `Pandal.crowdSamplePoints`, not in a separate `SamplePoint` collection.
- Observations are stored as `CrowdSample` documents, not in a dedicated `CrowdObservation` collection.
- There is no queue, worker pool, or message broker. The scheduler loops directly in-process using `setInterval`.
- There is no dedicated status table; status is computed on read from recent observation data.
- The current architecture is best described as “scheduler-driven aggregation over recent sampled traffic observations,” not a persistent crowd engine state machine.

---

## 4. End-to-End Crowd Data Flow

A complete flow through the current implementation is:

1. What starts the process?
   - `backend/server.js` calls `startCrowdScheduler()` immediately after MongoDB connection succeeds.
   - `startCrowdScheduler()` in `backend/services/crowd/crowdScheduler.service.js` performs an initial refresh and then repeats every 15 minutes.

2. Which function is called first?
   - `startCrowdScheduler()`
   - Then `refreshCrowdData()`
   - Then `collectPandalCrowdObservations(pandalId)`

3. Which service calls which?
   - `crowdScheduler.service.js` → `refreshCrowdData()`
   - `crowdRefresh.service.js` → `collectPandalCrowdObservations(pandalId)` for each pandal
   - `crowdObservation.service.js` → `getTrafficObservation({ samplePoint, pandalLocation })`
   - `crowdObservation.service.js` → `CrowdSample.insertMany(results)`
   - `crowdAggregation.service.js` → `CrowdSample.find(...)` and `classifyCrowd(score)`

4. Where are pandal coordinates obtained?
   - From `Pandal.location.coordinates` stored in the `Pandal` document (`backend/models/pandal.model.js`).
   - The destination passed to Google Routes is `pandal.location.coordinates`.

5. Where is traffic data obtained?
   - From the Google Routes API via `getTrafficObservation()` in `backend/services/crowd/googleTraffic.service.js`.
   - The request includes `origin` = sample point coordinates and `destination` = pandal location coordinates.

6. Where are crowd observations generated?
   - In `collectPandalCrowdObservations()` in `backend/services/crowd/crowdObservation.service.js`.
   - It calls `getTrafficObservation()` once per selected stale sample point and builds a `CrowdSample` document with `congestionLevel`, `congestionScore`, `durationSeconds`, `staticDurationSeconds`, `trafficRatio`, `source: "google"`, and `observedAt`.

7. How are observations aggregated?
   - `getPandalCrowdStatus(pandal)` in `backend/services/crowd/crowdAggregation.service.js` queries `CrowdSample.find({ pandalId, congestionScore: { $ne: null }, observedAt: { $gte: now - 15 minutes } })`.
   - It reads each sample point’s weight from `pandal.crowdSamplePoints` using `samplePointId`.
   - It computes a weighted average score using `congestionScore * weight` and divides by total weight.

8. How is the final crowd score/status calculated?
   - `score = weightedScore / totalWeight`
   - Rounded to two decimal places with `Math.round(... * 100) / 100`
   - Status is then classified by `classifyCrowd(score)`:
     - score < 30 => `LOW`
     - score < 60 => `MODERATE`
     - otherwise => `HIGH`
   - If no recent observations exist, status is `UNKNOWN` and score is `null`.

9. Where is the result stored?
   - The raw measurements are stored in the `CrowdSample` collection.
   - The derived status is not persisted as a separate model. It is computed on demand from recent `CrowdSample` documents.

10. How can the frontend/API retrieve it?
   - Through `GET /api/pandals/:id/crowd` in `backend/routes/pandal.route.js` → `backend/controllers/pandal.controller.js` → `getPandalCrowdStatus(pandal)`.
   - The response includes the derived status and score, e.g. `status`, `score`, `sampleCount`, `observedAt`.

---

## 5. Crowd Scheduler

The scheduler is implemented in `backend/services/crowd/crowdScheduler.service.js`.

- How it starts:
  - `server.js` calls `startCrowdScheduler()` after successful `mongoose.connect(process.env.MONGO_URI)`.
- Mechanism used:
  - `setInterval(...)`, not `cron`.
  - No cron dependency was found in `backend/package.json` or in the searched backend files.
- Refresh interval:
  - `const REFRESH_INTERVAL = 15 * 60 * 1000;`
  - This is every 15 minutes.
- What happens on each refresh:
  - `refreshCrowdData()` finds all pandals with `crowdSamplePoints.0` and calls `collectPandalCrowdObservations(pandal._id)` sequentially in a loop.
  - Each call tries to refresh stale sample points and writes new `CrowdSample` records.
- Overlap protection:
  - No concurrency lock or in-flight guard was found.
  - `setInterval` calls `refreshCrowdData()` without checking whether a previous refresh is still running.
  - Because the function is invoked repeatedly and `refreshCrowdData()` is not awaited internally before scheduling the next tick, multiple refreshes can overlap if processing is slower than the interval.
- Error handling:
  - `refreshCrowdData()` catches errors per-pandal and increments `failed` while continuing the loop.
  - Scheduler wraps each tick in `catch((error) => console.error(...))`.
  - Initial run also catches errors and logs them.
- Can scheduler failures crash the backend?
  - Not from the inspected scheduler code itself. A refresh error is logged to the console and does not abort the process.
- Development vs production difference:
  - Not determined from inspected code. There is no `NODE_ENV` branch or environment-specific behavior in the scheduler implementation.

---

## 6. Crowd Refresh Service

`backend/services/crowd/crowdRefresh.service.js` implements the batch refresh loop.

Public function:

- `refreshCrowdData()`

Inputs:

- Reads MongoDB `Pandal` documents with `"crowdSamplePoints.0": { $exists: true }`
- Returns nothing directly; only logs status to the console

Outputs:

- Side effect: loads new `CrowdSample` observations via `collectPandalCrowdObservations(pandal._id)`
- Console summary: `updated` and `failed` counts

Database interactions:

- `Pandal.find({ "crowdSamplePoints.0": { $exists: true } })`
- For each pandal, calls `collectPandalCrowdObservations(pandal._id)`
- Does not read or write a separate crowd aggregate table

Traffic interactions:

- No direct API calls here
- Delegates all traffic requests to `collectPandalCrowdObservations()` and then `getTrafficObservation()`

Calls to other Crowd services:

- `crowdRefresh.service.js` → `collectPandalCrowdObservations()` from `crowdObservation.service.js`

Error handling:

- per-pandal try/catch
- catches `error.message` and logs `FAILED: ${pandal.name}`
- continues to process remaining pandals after failures

Scope:

- The service processes all pandals that have at least one `crowdSamplePoints` entry.
- It does not target a specific subgroup or selected pandals from a config file.

External request granularity:

- It does not call the external traffic API directly.
- The actual external request count depends on `collectPandalCrowdObservations` and is per stale sample point, with a maximum of 2 stale points per pandal per refresh cycle.

---

## 7. Crowd Engine

The main functions in the current implementation are:

- `backend/services/crowd/crowdEngine.service.js`
  - `refreshPandalCrowd(pandalId)`
- `backend/services/crowd/crowdObservation.service.js`
  - `collectPandalCrowdObservations(pandalId)`
- `backend/services/crowd/crowdAggregation.service.js`
  - `getPandalCrowdStatus(pandal)`
  - `classifyCrowd(score)`
- `backend/services/crowd/googleTraffic.service.js`
  - `getTrafficObservation({ samplePoint, pandalLocation })`
  - `classifyTraffic(ratio)`
  - `calculateCongestionScore(ratio)`

Inputs:

- Pandal ID (single-pandal refresh path)
- Pandal document with `location` and `crowdSamplePoints[]`
- Sample-point objects containing `samplePointId`, `location.coordinates`, `weight`, `enabled`, and name metadata

Outputs:

- `refreshPandalCrowd()` returns:
  - `pandalId`
  - `pandalName`
  - `status`
  - `score`
  - `sampleCount`
  - `observedAt`
- `collectPandalCrowdObservations()` returns an array of inserted observation objects.
- `getTrafficObservation()` returns a result object with `congestionLevel`, `congestionScore`, `durationSeconds`, `staticDurationSeconds`, `trafficRatio`.

Calculation logic:

1. `collectPandalCrowdObservations` loads a Pandal and all enabled sample points.
2. It fetches the latest `CrowdSample` record per sample point.
3. It identifies stale points whose `observedAt` is older than `REFRESH_AFTER_MS = 15 minutes`.
4. If stale points exist, it selects a limited subset: `POINTS_PER_REFRESH = 2`.
5. Each selected sample point triggers a Google Routes call.

Traffic-derived calculations in `googleTraffic.service.js`:

- `durationSeconds = parseDuration(route.duration)`
- `staticDurationSeconds = parseDuration(route.staticDuration)`
- `trafficRatio = durationSeconds / staticDurationSeconds` when both are present and `staticDurationSeconds > 0`
- `congestionLevel` is classified by:
  - ratio === null => `UNKNOWN`
  - ratio < 1.15 => `NORMAL`
  - ratio < 1.50 => `SLOW`
  - else => `TRAFFIC_JAM`
- `congestionScore` is computed as:

```text
if ratio <= 1: score = 0
else: score = ((ratio - 1) / 1.5) * 100
score = min(100, rounded(score to 2 decimals))
```

This means the score is effectively a normalized “delay above baseline” score, bounded at 100.

Aggregation calculation in `crowdAggregation.service.js`:

```text
weightedScore += observation.congestionScore * samplePointWeight
totalWeight += samplePointWeight
score = (weightedScore / totalWeight)
```

Then:

- `status = LOW` if score < 30
- `status = MODERATE` if score < 60
- `status = HIGH` otherwise

Thresholds and constants discovered in code:

- `CONCURRENCY = 3` (parallel per-pandal batch size)
- `POINTS_PER_REFRESH = 2` (max sample points refreshed per pandal per cycle)
- `REFRESH_AFTER_MS = 15 * 60 * 1000` (15 minutes)
- `classifyCrowd(score)` boundaries: 30 and 60
- `classifyTraffic(ratio)` boundaries: 1.15 and 1.50

Check-in contribution:

- Not present in the inspected Crowd Engine code.
- No code in the crowd services reads `CheckIn`, `User.points`, or `checkin` totals.

Historical contribution:

- Only recent observations are considered: `observedAt >= now - 15 minutes`.
- There is no trend calculation, moving average beyond that filtered window, or long-term historical weighting in the inspected code.

---

## 8. Crowd Aggregation

`backend/services/crowd/crowdAggregation.service.js` performs the current aggregation step.

What aggregation means in this implementation:

- It aggregates multiple recent traffic observations from different sample points for the same pandal into one crowd score and status.
- The aggregation is not a route-level or geographical cluster aggregation. It is a per-pandal weighted mean over recent sample point observations.

Input data:

- `CrowdSample.find({ pandalId: pandal._id, congestionScore: { $ne: null }, observedAt: { $gte: now - 15min } })`
- Each observation contains `congestionScore` and `samplePointId`
- Each pandal contains `crowdSamplePoints[]` with `samplePointId` and `weight`

Output data:

- `status: "UNKNOWN" | "LOW" | "MODERATE" | "HIGH"`
- `score: Number | null`
- `sampleCount: Number`
- `observedAt: Date | null`

Grouping logic:

- All observations are grouped by `pandalId` because the query is constrained to the current pandal.
- The data are not grouped by geographic region or route beyond the pandal.

Averaging / weighting:

- The algorithm takes `weight` from each sample point, defaulting to 1 if no weight is supplied.
- Weighted average formula:

```text
weightedScore = sum(observation.congestionScore * samplePointWeight)
totalWeight = sum(samplePointWeight)
score = weightedScore / totalWeight
```

Then rounded to two decimals.

Time windows:

- Recent window uses `observedAt >= Date.now() - 15 * 60 * 1000`
- The aggregated score intentionally ignores older data.

Spatial logic:

- Spatial grouping is implicit: each `pandalId` is paired with its own embedded sample points.
- No `geoWithin`, polygon, or radius-based aggregation is performed in the aggregation service itself.

Filtering and thresholds:

- Observations with `congestionScore: null` are excluded.
- If no eligible observations remain, the aggregation returns `UNKNOWN`.
- There is no min/max filtering or confidence threshold beyond the existence of observations.

---

## 9. Crowd Observation

In the current codebase, a "Crowd Observation" is not a separate model; it is represented by the `CrowdSample` model in `backend/models/crowdSample.model.js`.

Schema/model:

- `pandalId` (ObjectId ref `Pandal`, indexed)
- `samplePointId` (String, indexed)
- `samplePointName` (String)
- `congestionLevel` (`NORMAL`, `SLOW`, `TRAFFIC_JAM`, `UNKNOWN`)
- `congestionScore` (`Number`, min 0, max 100, default null)
- `durationSeconds` (`Number`, default null)
- `staticDurationSeconds` (`Number`, default null)
- `trafficRatio` (`Number`, default null)
- `source` (`"google"`, default `"google"`)
- `observedAt` (`Date`, required, default `Date.now`)

How observations are created:

- `collectPandalCrowdObservations()` in `backend/services/crowd/crowdObservation.service.js` calls `getTrafficObservation()`.
- It wraps each result in a document:

```javascript
{
  pandalId: pandal._id,
  samplePointId: samplePoint.samplePointId,
  samplePointName: samplePoint.name,
  ...observation,
  source: "google",
  observedAt: new Date(),
}
```

- It writes them with `await CrowdSample.insertMany(results)`. There is no intermediate `CrowdObservation` model.

What fields are stored:

- Traffic metrics for one route: duration, static duration, ratio, and derived score/level
- Pandal and sample point identifiers
- Source tag and timestamp

Timestamps:

- `observedAt` is stored as a `Date`
- It is used both for age checks and TTL expiration

How long observations remain useful:

- `backend/models/crowdSample.model.js` defines a TTL index:

```javascript
crowdSampleSchema.index(
  { observedAt: 1 },
  { expireAfterSeconds: 86400 }
);
```

This means MongoDB deletes old docs after 24 hours.

Old observations:

- They are not removed by application code except by the MongoDB TTL index.
- The aggregation logic itself ignores observations older than 15 minutes; the 24-hour TTL is a broader retention rule.

Query patterns:

- Latest sample per sample point is found by sorting `CrowdSample.find({ pandalId, samplePointId: { $in: ... } }).sort({ observedAt: -1 }).lean();`
- Recent aggregate is found by filtering `observedAt` for 15-minute window.

---

## 10. Traffic Integration

This section describes the actual current traffic provider in `backend/services/crowd/googleTraffic.service.js`.

Provider name:

- Google Maps Routes API, specifically the Directions v2 `computeRoutes` endpoint.

API endpoint(s):

- `https://routes.googleapis.com/directions/v2:computeRoutes`

HTTP library:

- Native `fetch()` from the Node.js runtime, not a third-party HTTP client.

Request parameters:

- Method: `POST`
- Headers:
  - `Content-Type: application/json`
  - `X-Goog-Api-Key`: `process.env.GOOGLE_MAPS_API_KEY`
  - `X-Goog-FieldMask`: `routes.duration,routes.staticDuration,routes.distanceMeters,routes.travelAdvisory`
- Body:
  - `origin`: `toWaypoint(samplePoint.location.coordinates)`
  - `destination`: `toWaypoint(pandalLocation.coordinates)`
  - `travelMode`: `"DRIVE"`
  - `routingPreference`: `"TRAFFIC_AWARE"`

Coordinate format:

- `toWaypoint([longitude, latitude])` converts a GeoJSON-style array to:

```javascript
{
  location: {
    latLng: {
      latitude,
      longitude,
    },
  },
}
```

- This confirms the API receives `[longitude, latitude]` order.

Number of requests:

- One Google request per selected sample point.
- The service does not request a route for an entire pandal or for all sample points at once.
- Inside `collectPandalCrowdObservations`, a batch size of 3 is used (`CONCURRENCY = 3`), but that is only parallelization across the selected stale points, not a different external request shape.

Response parsing:

- `const data = await response.json();`
- If `!response.ok`, it throws `data?.error?.message || "Google Routes API failed with ${response.status}"`.
- If `!data.routes?.length`, it returns unknown/null values instead of throwing.
- `parseDuration(duration)` strips the trailing `s` from values like `"123s"` and parses to a number.
- It extracts `route.duration`, `route.staticDuration`, and then calculates `trafficRatio`.

Traffic metrics extracted:

- `durationSeconds`
- `staticDurationSeconds`
- `trafficRatio`
- `congestionLevel`
- `congestionScore`

Error handling:

- Missing API key:
  - throws `Error("GOOGLE_MAPS_API_KEY is not configured")`
- HTTP error response:
  - throws with Google error message or status code
- No route returned:
  - returns `UNKNOWN` + null metrics without raising an exception

Retry behavior:

- None in the inspected code.
- No exponential backoff, no retry loop, no circuit breaker.

Timeout behavior:

- None is configured on `fetch`.
- The code does not set an explicit timeout.

API-key handling:

- Read from `process.env.GOOGLE_MAPS_API_KEY`
- Sent in request header `X-Goog-Api-Key`
- The code does not log the key.
- If a secret appears in source or environment references, it should be treated as `[SECRET REDACTED]` and omitted from the report.

Caching:

- No traffic caching mechanism was found in the inspected code.
- The code does not memoize responses by sample point or time window.

Rate limiting:

- No explicit rate limiting or queue was found.
- The only scheduling control is the 15-minute refresh loop and local `CONCURRENCY = 3` batching.

---

## 11. Traffic Request Count

For one crowd refresh cycle, the request count depends on the number of pandals with sample points and how many of those sample points are stale.

The actual code path is:

- `crowdScheduler.service.js` → `refreshCrowdData()`
- `refreshCrowdData()` loops every pandal matching `"crowdSamplePoints.0": { $exists: true }`
- For each pandal, `collectPandalCrowdObservations(pandalId)` runs

Inside `collectPandalCrowdObservations()`:

- samplePoints are filtered to `enabled !== false`
- stale sample points are selected based on `REFRESH_AFTER_MS = 15 * 60 * 1000`
- then they are sorted and sliced to `POINTS_PER_REFRESH = 2`
- then the service makes one Google request per selected sample point

Therefore, the maximum request count for one pandal in one refresh cycle is:

```text
max_requests_per_pandal = 2
```

The actual request count is:

```text
sum over all pandals of min(2, number_of_stale_enabled_sample_points_for_that_pandal)
```

With `CONCURRENCY = 3`, the service may process up to 3 requests in parallel within each pandal batch, but the overall logic still remains “one request per stale sample point.”

The scaling behavior is effectively linear in the number of active pandals with sample points, subject to the stale-point threshold and the 2-point cap per pandal per cycle. If the number of pandals doubles, the maximum external traffic requests can double, assuming the stale-point cap is reached for each pandal.

---

## 12. Caching

The inspected code does not show a dedicated traffic caching mechanism.

The findings are:

- In-memory cache: No explicit cache object or Map was found for Google route responses.
- MongoDB cache: `CrowdSample` documents are stored in MongoDB, but they are raw observations, not a cache layer for traffic results.
- Redis: No Redis client or Redis configuration was found in the inspected crowd files.
- TTL: There is a MongoDB TTL index on `CrowdSample.observedAt` with `expireAfterSeconds: 86400` (24 hours).
- HTTP caching: No cache headers or conditional request logic were found.
- No cache conclusion: The current implementation stores observations and reads them later, but it does not cache live traffic responses for reuse across scheduler runs.

Therefore, the accurate statement is:

"No traffic caching mechanism was found in the inspected code."

---

## 13. Rate Limiting and Request Deduplication

The code does not show a full rate-limiting or request-deduplication system.

What exists:

- Per-pandal concurrency limit: `CONCURRENCY = 3` in `collectPandalCrowdObservations()`
- Refresh interval: 15 minutes via `setInterval`
- Per-pandal refresh cap: `POINTS_PER_REFRESH = 2`
- Scheduler-level failure logging: errors are logged but do not abort the process

What does not exist in the inspected code:

- Rate limiting: No token bucket, fixed-window limiter, or upstream request throttling
- Request queue: No queue/worker system for external Google calls
- Request throttling: No per-minute or per-second limit
- Concurrent-request limit across all pandals: There is no global request semaphore
- Duplicate-request prevention: No deduplication for identical sample-point requests in the same refresh cycle
- In-flight request deduplication: No Map/Set keyed by samplePointId to avoid duplicate requests while a refresh is in progress
- Scheduler locking: No mutex / lock flag / `inProgress` guard to prevent overlapping refresh cycles

The most relevant concurrency behavior is that `setInterval` calls `refreshCrowdData()` without waiting for the previous run to finish. This means overlapping refreshes are possible in practice when runtime duration exceeds the interval.

---

## 14. MongoDB Models

The actual models relevant to the Crowd Engine are:

| Model | Collection | Important Fields | Indexes | Relationships |
|------|------------|------------------|---------|--------------|
| `Pandal` | `pandals` | `name`, `location: Point`, `crowdSamplePoints[]` | `{ location: "2dsphere" }` | `CrowdSample.pandalId` refers to this document |
| `CrowdSample` | `crowdSamples` | `pandalId`, `samplePointId`, `samplePointName`, `congestionLevel`, `congestionScore`, `durationSeconds`, `staticDurationSeconds`, `trafficRatio`, `source`, `observedAt` | `pandalId + observedAt`, `samplePointId`, TTL on `observedAt` | Each record belongs to a pandal and a sample point |
| `CheckIn` | `checkins` | `userId`, `pandalId`, `location`, `category`, `points` | unique `{ userId, pandalId }`, `{ pandalId, createdAt: -1 }` | Not used by crowd engine |

Explanation:

- `Pandal` model: Stores pandal metadata and an embedded `crowdSamplePoints` array. Each sample point has `samplePointId`, `location`, `weight`, `enabled`, `source`, `highway`, and `distanceMeters`.
- `CrowdSample` model: Stores traffic observations at the sample-point level. It is the actual observation collection, even though the service folder is named `crowdObservation.service.js`.
- `CheckIn` model: Exists for reward/score tracking, not for crowd calculation. No code in the crowd services consumes it.

No `Crowd` model or `CrowdStatus` model was found in the inspected implementation.

---

## 15. Geospatial Logic

The geospatial logic is centered on the `Pandal.location` and `crowdSamplePoints[].location` fields.

GeoJSON structures:

- `location` for a pandal is a GeoJSON `Point`:

```javascript
{
  type: "Point",
  coordinates: [longitude, latitude]
}
```

- Each `crowdSamplePoints[]` item also contains a `location` with the same structure.

Coordinate order:

- The code consistently uses `[longitude, latitude]`, not `[latitude, longitude]`.
- This is enforced in the model validation and in `toWaypoint([longitude, latitude])` in the Google service.

2dsphere indexes:

- `pandalSchema.index({ location: "2dsphere" })`
- This supports geospatial queries for pandals by location.

`$near` queries:

- `backend/controllers/pandal.controller.js` uses `$near` for nearby pandal lookup:
  - `GET /api/pandals/nearby`
- `backend/controllers/checkin.controller.js` also uses `$near` to verify whether a user is within the check-in proximity radius.

`$geoNear`:

- Not found in the inspected code.

Polygon/radius calculations:

- The code uses `$near` with `$maxDistance` for both nearby pandals and check-in validation.
- No custom polygon logic or geoJSON polygon aggregation was found in the crowd engine.

Sample-point generation:

- `backend/scripts/generateCrowdSamplePoints.js` computes `distanceMeters()` with a spherical-earth haversine formula.
- It searches roads near pandals using Overpass and selects points within 300-800 meters and at least 150 meters apart.

Distance calculations:

- `generateCrowdSamplePoints.js` computes road-to-pandal distance using latitude/longitude coordinates and chooses candidate roads near the pandal.
- The result is saved as `distanceMeters` on each sample point embedded in the Pandal.

---

## 16. Crowd Sample Points

Crowd sample points exist as embedded points in each `Pandal.document` under `pandal.crowdSamplePoints`.

Why they exist:

- They are the measurement anchors for the crowd engine. The engine calls Google Routes for each sample point and uses the resulting traffic metric as a proxy for current traffic near the pandal.
- They are not an occupancy model; they act as traffic probes around the pandal.

How they are generated:

- `backend/scripts/generateCrowdSamplePoints.js` hits Overpass endpoints and searches for nearby roads around a pandal.
- The script filters road types: `trunk`, `trunk_link`, `primary`, `primary_link`, `secondary`, `secondary_link`, `tertiary`, `tertiary_link`.
- It calculates candidate road points, ranks them by road type, and chooses up to `TARGET_POINTS = 5` with a minimum distance of 150 meters between each chosen point.

How many can exist:

- The script defines `TARGET_POINTS = 5`.
- In practice, each pandal can have up to 5 selected sample points, but some may have fewer if no suitable roads are found.

How they relate to pandals:

- They are embedded on each `Pandal` document under `crowdSamplePoints`.
- Each sample point has a `samplePointId`, `name`, `location`, `weight`, `enabled`, `source`, `highway`, and `distanceMeters`.

How they relate to traffic requests:

- One sample point corresponds to one traffic request when it is stale and selected for refresh.
- The service limits each pandal to `POINTS_PER_REFRESH = 2` stale points per refresh.

How they are seeded:

- `backend/scripts/seedCrowdSamplePoints.js` reads `backend/data/crowdSamplePoints.generated.json` and assigns the generated points to each `Pandal` in MongoDB.
- `backend/seed.js` also seeds `crowdSamplePoints` from a static JSON file, but the generated file is the more explicit crowd-sample-points pipeline.

Static vs dynamic:

- They are static in the sense that they are precomputed geographic points attached to a pandal.
- They are not dynamic: the script generates them once and then the runtime decides which of them to refresh based on age.

Stored in MongoDB:

- Yes. They are embedded under each `Pandal` record, not placed in a separate collection.

---

## 17. API Layer

The crowd-related API is a single endpoint exposed by `backend/routes/pandal.route.js`.

| Method | Endpoint | Handler | Purpose |
|--------|----------|---------|---------|
| `GET` | `/api/pandals/:id/crowd` | `getPandalCrowd` in `backend/controllers/pandal.controller.js` | Return the current crowd result for a pandal |

Details for the endpoint:

- Authentication requirement:
  - No auth middleware is applied in `backend/routes/pandal.route.js` for this route.
  - This is a public read endpoint.
- Input:
  - `:id` must be a valid MongoDB ObjectId.
- Output:
  - Returns a standard API success payload with `data` containing `pandalId`, `pandalName`, `status`, `score`, `sampleCount`, `observedAt`.
- Error responses:
  - 400 if the ObjectId is invalid
  - 404 if the pandal does not exist
  - Generic error path via `next(error)`
- Database operations:
  - Reads `Pandal.findById(req.params.id).select("_id name crowdSamplePoints")`
  - Reads `CrowdSample` records indirectly via `getPandalCrowdStatus(pandal)`
- Does it trigger crowd calculation?
  - Yes. The endpoint computes the crowd status from recent `CrowdSample` observations at request time.

The endpoint is not configured to trigger a fresh traffic refresh itself; it reads the last successful stored observations and computes status from them.

---

## 18. Check-in Integration

The codebase has a separate check-in feature; it is not consumed by the Crowd Engine.

Check-in model:

- `backend/models/checkin.model.js`
- Fields:
  - `userId`
  - `pandalId`
  - `location: Point`
  - `category`
  - `points`
- Unique index: `{ userId, pandalId }`
- Additional index: `{ pandalId, createdAt: -1 }`

Check-in route and controller:

- `backend/routes/checkin.route.js`
- `backend/controllers/checkin.controller.js`
- `POST /api/checkins` requires auth via `requireAuth`
- This feature enforces proximity via `$near` and awards points from `CHECKIN_CONFIG`

Duplicate-check protection:

- `CheckIn.findOne({ userId, pandalId: pandal._id })` before creating a new record.
- Unique index on `{ userId, pandalId }` also prevents duplicate check-ins at the database level.

Points:

- `backend/config/checkin.config.js`
- Example values:
  - `traditional: 10`
  - `theme: 15`
  - `heritage: 20`
  - `DEFAULT_POINTS: 10`

How check-ins affect crowd calculation:

- Not currently. No function in the Crowd Engine imports `CheckIn` or uses `checkin` data.

Current integration status:

- No integration between Check-in and Crowd Engine was found in the inspected code.

---

## 19. Existing Tests and Scripts

| File | What it tests | How to run | What it proves |
|------|---------------|-------------|----------------|
| `backend/scripts/testCrowdEngine.js` | Runs a single end-to-end crowd refresh for one pandal using `refreshPandalCrowd()` | `node scripts/testCrowdEngine.js` from `backend/` with valid `MONGO_URI` configured | The single-pandal refresh path can fetch a pandal, collect observations, aggregate status, and print the result |
| `backend/scripts/testCrowdObservation.js` | Runs the traffic-observation collection path for a real pandal | `node scripts/testCrowdObservation.js` from `backend/` with valid `MONGO_URI` configured | The `collectPandalCrowdObservations()` path can query MongoDB, find stale sample points, call the traffic API, and insert new `CrowdSample` observations |
| `backend/scripts/generateCrowdSamplePoints.js` | Generates static sample-point candidates from Overpass data | `node scripts/generateCrowdSamplePoints.js` | The data-generation pipeline can query nearby roads and write candidate sample-point metadata files |
| `backend/scripts/seedCrowdSamplePoints.js` | Seeds generated sample points into each pandal document in MongoDB | `node scripts/seedCrowdSamplePoints.js` | The generated sample-point data can be applied into the live `Pandal.crowdSamplePoints` structure |
| `backend/seed.js` | Seeds initial pandal records and attaches `crowdSamplePoints` from the static JSON file | `node seed.js` | The project can populate initial Pandal documents with sample point metadata |
| `backend/scripts/liveApiSmokeTest.js` | Food API smoke test, not crowd-focused | `node scripts/liveApiSmokeTest.js` | Not a crowd-engine test; it validates food endpoints and read-only DB semantics |

Additional notes:

- A search of `backend/tests` did not reveal dedicated crowd-engine test cases.
- There are no tests specifically validating scheduler behavior, retry logic, or the concurrency guard because that logic is not implemented.

---

## 20. Environment Variables

Only variable names are listed below, as requested.

```text
PORT
MONGO_URI
GOOGLE_MAPS_API_KEY
FRONTEND_URL
```

These are the environment variables directly relevant to the current Crowd Engine startup path and external traffic API integration as inspected in the code. No dedicated crowd-specific refresh interval or scheduler toggle variable was found in the codebase.
