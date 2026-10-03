# PujoPath Crowd Engine — Implementation Plan

## 1. Purpose

This document defines the architecture and implementation plan for the **PujoPath Crowd Engine**.

The goal is to provide a crowd status for every pandal while keeping external traffic-API usage low and making the system scalable when the number of pandals increases.

The existing project plan requires:

- A Crowd API.
- Crowd statuses: **Low, Moderate, High, Very High**.
- A Check-in API.
- Crowd/check-in information in the frontend.
- A 15-minute crowd refresh cycle.
- MongoDB as the application database.

The project plan assigns these responsibilities to the backend and identifies Day 11 for the crowd-status API and Day 12 for the check-in API. fileciteturn2file1

---

## 2. Core Architecture Principle

### Never make one external traffic request per pandal.

The number of pandals can grow in the future, so the architecture must not be:

```text
29 pandals
   ↓
29 traffic API requests
```

or, later:

```text
500 pandals
   ↓
500 traffic API requests
```

Instead, traffic information should be acquired for **geographic traffic zones / cached traffic areas** and then reused locally for all pandals covered by that traffic data.

```text
                    External Traffic API
                           │
                           ▼
                  Traffic Zone Manager
                           │
                           ▼
                     Traffic Cache
                           │
          ┌────────────────┴────────────────┐
          ▼                ▼                ▼
       Pandal A          Pandal B        Pandal C
          │                │                │
          └────────────────┴────────────────┘
                           │
                           ▼
                 Local Crowd Calculation
                           │
                           ▼
                    MongoDB Crowd Data
                           │
                           ▼
                      Crowd API
                           │
                           ▼
                       Frontend
```

This makes external API usage depend primarily on **traffic coverage**, not the number of pandals.

---

# 3. High-Level System

```text
                    ┌─────────────────────┐
                    │  15-Minute Scheduler│
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │    Crowd Manager    │
                    └──────────┬──────────┘
                               │
                 ┌─────────────┴─────────────┐
                 │                           │
                 ▼                           ▼
       ┌──────────────────┐        ┌──────────────────┐
       │ Traffic Zone     │        │ Check-in / Local │
       │ Manager          │        │ Crowd Signals    │
       └────────┬─────────┘        └────────┬─────────┘
                │                           │
                ▼                           │
       ┌──────────────────┐                  │
       │ Cache / TTL Check│                  │
       └────────┬─────────┘                  │
                │                            │
          stale │                            │
                ▼                            │
       ┌──────────────────┐                  │
       │ Request Queue +  │                  │
       │ Rate Limiter     │                  │
       └────────┬─────────┘                  │
                │                            │
                ▼                            │
       ┌──────────────────┐                  │
       │ External Traffic │                  │
       │ Provider         │                  │
       └────────┬─────────┘                  │
                │                            │
                ▼                            │
       ┌──────────────────┐                  │
       │ Traffic Cache    │◄─────────────────┘
       └────────┬─────────┘
                │
                ▼
       ┌──────────────────┐
       │ Crowd Calculator │
       └────────┬─────────┘
                │
                ▼
       ┌──────────────────┐
       │ MongoDB          │
       │ Crowd Status     │
       └────────┬─────────┘
                │
                ▼
       ┌──────────────────┐
       │ GET Crowd API    │
       └────────┬─────────┘
                │
                ▼
             Frontend
```

---

# 4. Main Components

## 4.1 Pandal

The existing Pandal collection remains the source of truth for pandal locations.

Each pandal should have a valid geographic location.

The project already requires coordinate validation and a MongoDB `2dsphere` index for geospatial operations. fileciteturn2file1

Example:

```js
{
  _id: ObjectId,
  name: String,
  location: {
    type: "Point",
    coordinates: [longitude, latitude]
  }
}
```

---

# 5. Traffic Zone

A `TrafficZone` represents a geographic area for which traffic information can be reused.

Example:

```js
{
  zoneId: "kolkata-zone-01",

  geometry: {
    type: "Polygon",
    coordinates: [...]
  },

  trafficData: {
    congestionRatio: Number,
    averageSpeed: Number,
    freeFlowSpeed: Number
  },

  fetchedAt: Date,
  expiresAt: Date
}
```

### Important rule

A traffic zone is **not a pandal**.

Multiple pandals can belong to the same traffic zone.

Example:

```text
Traffic Zone 01
 ├── Pandal A
 ├── Pandal B
 ├── Pandal C
 ├── Pandal D
 └── Pandal E
```

One traffic refresh can therefore support several pandals.

---

# 6. Pandal-to-Traffic-Zone Mapping

When calculating crowd status:

```text
Pandal
   ↓
Find containing/nearest Traffic Zone
   ↓
Read cached traffic information
   ↓
Calculate crowd
```

This mapping should happen locally.

It must **not** trigger a new external traffic API request.

MongoDB geospatial queries should be used where appropriate.

---

# 7. Traffic Cache

The traffic cache is the most important part of the request-saving architecture.

Each cached traffic record should contain:

```text
zoneId
traffic values
fetchedAt
expiresAt
```

Before making an external request:

```text
Is cached data still valid?
       │
       ├── YES → reuse cache
       │
       └── NO → queue refresh
```

Therefore, the 15-minute scheduler does not automatically mean an external request every 15 minutes for every zone.

---

# 8. Scheduler

The scheduler runs the crowd engine periodically.

The project plan specifies a 15-minute crowd refresh cycle.

The scheduler should perform:

```text
Every 15 minutes
       ↓
Load active pandals
       ↓
Determine required traffic zones
       ↓
Check zone cache
       ↓
Refresh only stale/missing zones
       ↓
Calculate crowd locally
       ↓
Store updated crowd status
```

### Important

Do NOT implement:

```js
Promise.all(
  pandals.map(pandal => callExternalTrafficAPI(pandal))
);
```

That architecture scales external requests directly with the number of pandals and can quickly exhaust a provider quota.

---

# 9. Request Queue

All external traffic requests should pass through a single request queue.

```text
Traffic Zone Refresh Requests
            │
            ▼
      Request Queue
            │
            ▼
       Rate Limiter
            │
            ▼
    External Traffic API
```

Benefits:

- Prevents request bursts.
- Controls requests per second/minute.
- Makes provider limits easier to respect.
- Allows retries.
- Prevents multiple scheduler executions from requesting the same zone simultaneously.

---

# 10. Request Deduplication

If two parts of the application request the same traffic zone:

```text
Request A → Zone 01
Request B → Zone 01
Request C → Zone 01
```

the system should not send three external requests.

Instead:

```text
Request A ─┐
Request B ─┼──► One refresh job ───► External API
Request C ─┘
```

Maintain an in-memory or persistent "refresh in progress" state.

Example:

```js
refreshingZones.has(zoneId)
```

If the zone is already being refreshed, another request should wait for or reuse that refresh instead of creating another external request.

---

# 11. Stale-While-Refresh Strategy

If traffic data is temporarily unavailable, the crowd engine should continue using the most recent valid data.

Example:

```text
Fresh cache
    ↓
Use immediately

Expired cache
    ↓
Try refresh
    ↓
Success → replace cache

Failure
    ↓
Use last known traffic data
    ↓
Mark data as stale
```

This prevents a temporary external API problem from making the entire Crowd API unusable.

---

# 12. Crowd Calculation

Traffic data should be treated as **one input** to the crowd engine, not necessarily the complete crowd measurement.

The final crowd status can combine signals such as:

```text
Traffic
Check-ins
Historical crowd pattern
Time of day
Pandal popularity
```

Conceptually:

```text
Traffic Score
       +
Check-in Score
       +
Historical Score
       +
Time/Popularity Factors
       ↓
Crowd Score
       ↓
Crowd Status
```

Example status bands:

```text
LOW
MODERATE
HIGH
VERY HIGH
```

The exact thresholds should be kept in one configuration/module rather than duplicated throughout the codebase.

Example:

```js
CROWD_THRESHOLDS = {
  LOW: ...,
  MODERATE: ...,
  HIGH: ...,
  VERY_HIGH: ...
};
```

---

# 13. Check-in Integration

The project plan includes a Check-in API with duplicate-check protection. fileciteturn2file1

A check-in should contribute to the local crowd calculation without causing an external traffic request.

```text
User Check-in
     ↓
Check-in API
     ↓
MongoDB
     ↓
Crowd calculation
```

The check-in system and traffic system should therefore be loosely coupled.

---

# 14. Crowd Data Model

Recommended model:

```js
{
  pandalId: ObjectId,

  status: {
    type: String,
    enum: [
      "LOW",
      "MODERATE",
      "HIGH",
      "VERY_HIGH"
    ]
  },

  score: Number,

  trafficScore: Number,

  checkInScore: Number,

  calculatedAt: Date,

  trafficDataAge: Number,

  isStale: Boolean
}
```

The exact fields can be simplified if the frontend only needs status and basic metadata.

The important principle is to store the **calculated crowd result**, rather than forcing every frontend request to calculate crowd again.

---

# 15. Crowd API

The frontend should read the latest stored crowd result.

Example:

```http
GET /api/crowd
```

or:

```http
GET /api/crowd/:pandalId
```

Possible response:

```json
{
  "success": true,
  "data": {
    "pandalId": "....",
    "status": "HIGH",
    "score": 72,
    "calculatedAt": "2026-10-01T12:15:00Z"
  }
}
```

The frontend request should **never call the external traffic provider directly**.

---

# 16. Request Flow

## Normal flow

```text
Scheduler
   ↓
Find active pandals
   ↓
Find required zones
   ↓
Check cache
   ↓
Reuse fresh traffic
   ↓
Calculate crowd locally
   ↓
Save crowd status
```

External requests:

```text
Only for missing/stale zones
```

---

## Cache-expired flow

```text
Scheduler
   ↓
Zone cache expired
   ↓
Queue zone refresh
   ↓
Rate limiter
   ↓
External traffic API
   ↓
Update cache
   ↓
Calculate crowd
   ↓
Save result
```

---

## External API failure

```text
Scheduler
   ↓
Refresh fails
   ↓
Check last known data
   ↓
Use stale data
   ↓
Mark stale=true
   ↓
Calculate crowd
```

The system should not repeatedly hammer the external provider after a failure.

Use controlled retry/backoff.

---

# 17. Scaling Strategy

Suppose there are:

```text
30 pandals
```

The engine should not require:

```text
30 external requests
```

If those pandals are covered by:

```text
5 traffic zones
```

the target architecture is approximately:

```text
5 traffic-data refreshes
+
local calculation for 30 pandals
```

If the project later grows to:

```text
500 pandals
```

but the geographic coverage still requires:

```text
20 traffic zones
```

the traffic provider workload should remain related to those 20 zones, rather than becoming 500 requests.

This is the central scalability requirement.

---

# 18. Dynamic Zone Assignment

Do not hard-code:

```js
pandal1 → zone1
pandal2 → zone1
pandal3 → zone2
```

for the entire application.

Instead, use geographic information.

Recommended approach:

```text
Pandal coordinates
       ↓
Geospatial lookup
       ↓
Traffic zone
```

When a new pandal is added:

```text
New Pandal
    ↓
Coordinates validated
    ↓
Find applicable traffic zone
    ↓
Use existing traffic cache
```

This means adding pandals does not automatically increase the external API request count.

---

# 19. Recommended Backend Structure

Suggested structure:

```text
backend/
│
├── models/
│   ├── Pandal.js
│   ├── Crowd.js
│   ├── CheckIn.js
│   └── TrafficZone.js
│
├── controllers/
│   ├── crowd.controller.js
│   └── checkin.controller.js
│
├── routes/
│   ├── crowd.routes.js
│   └── checkin.routes.js
│
├── services/
│   ├── crowd/
│   │   ├── crowdEngine.service.js
│   │   ├── crowdCalculator.service.js
│   │   └── crowdScheduler.service.js
│   │
│   └── traffic/
│       ├── trafficProvider.service.js
│       ├── trafficZone.service.js
│       ├── trafficCache.service.js
│       ├── trafficQueue.service.js
│       └── trafficRateLimiter.service.js
│
├── config/
│   └── crowd.config.js
│
└── app.js
```

The exact filenames can be adapted to the existing project structure. Existing unrelated files should not be changed unnecessarily.

---

# 20. External Traffic Provider Abstraction

The crowd engine should not directly depend on one provider.

Use an interface/service abstraction:

```js
trafficProvider.getTrafficForZone(zone)
```

Then the implementation can internally use TomTom.

Architecture:

```text
Crowd Engine
     ↓
Traffic Provider Interface
     ↓
TomTom Provider
     ↓
TomTom API
```

This makes it possible to replace the provider later without rewriting the entire crowd engine.

---

# 21. TomTom Integration Boundary

TomTom should be treated only as the **traffic-data source**.

It should NOT own:

- Pandal data.
- Crowd calculation.
- Check-in logic.
- Crowd status storage.
- Frontend logic.

Those remain inside PujoPath.

```text
PujoPath
 ├── Pandal data
 ├── Check-ins
 ├── Traffic cache
 ├── Crowd calculation
 └── Crowd API

External provider
 └── Traffic information
```

Before implementation, the exact TomTom endpoint/request format and current usage limits should be verified against TomTom's current documentation.

---

# 22. API Budget Protection

Introduce a hard application-level budget.

Example concept:

```js
TRAFFIC_API_CONFIG = {
  maxRequestsPerRun: ...,
  maxRequestsPerMinute: ...,
  maxRequestsPerDay: ...,
  cacheTtlMinutes: ...
};
```

These values should come from environment/configuration rather than being scattered through the code.

If the budget is exhausted:

```text
Do not make more external requests.
Use cached/stale data.
Continue local crowd calculation.
```

This protects the application from accidental quota exhaustion.

---

# 23. Concurrency Protection

Only one crowd refresh process should operate at a time.

Use a lock such as:

```text
crowdRefreshRunning = true
```

Flow:

```text
Scheduler starts
      ↓
Is another refresh running?
      │
      ├── YES → skip this run
      │
      └── NO → acquire lock
                    ↓
              run refresh
                    ↓
              release lock
```

This prevents overlapping scheduler executions from creating duplicate traffic requests.

For a single backend instance, an application lock may be sufficient.

If the backend is later scaled to multiple instances, use a distributed lock or database-backed job system.

---

# 24. Database Strategy

MongoDB should store:

### Pandal

Permanent pandal information.

### TrafficZone

Cached traffic coverage and latest traffic data.

### Crowd

Latest calculated crowd status.

### CheckIn

User check-in records.

The project already uses MongoDB and includes geospatial indexing in the planned backend work. fileciteturn2file1

---

# 25. Data Freshness

Every crowd result should have a timestamp.

Example:

```text
calculatedAt
trafficFetchedAt
```

This allows the frontend/API to know whether the result is:

```text
Fresh
Recently cached
Stale
```

A stale result is preferable to making uncontrolled external requests.

---

# 26. Failure Handling

The engine must handle:

### External API failure

Use cached traffic data.

### MongoDB failure

Log the error and do not crash the scheduler process.

### Invalid pandal coordinates

Skip that pandal and log the validation problem.

### Empty pandal list

Complete the scheduler run without making traffic requests.

### Duplicate scheduler execution

Use refresh locking.

### Rate-limit response

Stop/slow further requests and use cached data.

---

# 27. Implementation Order

## Phase 1 — Existing data review

1. Review the existing Pandal model.
2. Confirm coordinates and `2dsphere` index.
3. Review current Crowd model/API.
4. Review current Check-in model/API.
5. Remove any one-request-per-pandal traffic logic.

## Phase 2 — Traffic layer

6. Create `TrafficZone` model.
7. Create traffic provider abstraction.
8. Implement TomTom provider.
9. Implement traffic cache.
10. Implement cache TTL.
11. Implement request queue.
12. Implement rate limiting.
13. Implement request deduplication.

## Phase 3 — Crowd engine

14. Implement crowd calculator.
15. Combine traffic and local crowd signals.
16. Implement Low/Moderate/High/Very High thresholds.
17. Store calculated results.
18. Add stale-data handling.

## Phase 4 — Scheduler

19. Implement the 15-minute scheduler.
20. Discover required zones.
21. Refresh only stale zones.
22. Calculate all pandal crowd statuses locally.
23. Add scheduler locking.
24. Add API budget protection.

## Phase 5 — API

25. Implement/standardize Crowd API.
26. Implement/verify Check-in API integration.
27. Standardize response format.
28. Add error handling.

## Phase 6 — Testing

29. Test with the current pandal dataset.
30. Test adding more pandals.
31. Confirm adding pandals does not create one external request per pandal.
32. Test expired cache.
33. Test provider failure.
34. Test rate limiting.
35. Test duplicate refresh prevention.
36. Test scheduler overlap.
37. Test Crowd API responses.

The project plan explicitly reserves the later project period for integration, testing, deployment and documentation, and includes API testing and crowd/check-in UI verification. fileciteturn2file0turn2file3

---

# 28. Acceptance Criteria

The implementation is considered successful when:

- [ ] Crowd statuses are available for pandals.
- [ ] Statuses support Low, Moderate, High and Very High.
- [ ] Crowd calculation is performed by the backend.
- [ ] Frontend reads stored crowd results through the Crowd API.
- [ ] External traffic API is never called directly by the frontend.
- [ ] Traffic data is cached.
- [ ] Fresh cached data is reused.
- [ ] Only stale/missing traffic zones are refreshed.
- [ ] Multiple pandals can reuse one traffic-data result.
- [ ] External requests are rate-limited.
- [ ] Duplicate traffic requests are prevented.
- [ ] Scheduler executions cannot overlap.
- [ ] Provider failures fall back to cached data.
- [ ] Adding more pandals does not automatically create one traffic request per pandal.
- [ ] Traffic provider logic is isolated from the crowd calculation.
- [ ] API responses are standardized.
- [ ] Crowd/check-in integration works end-to-end.

---

# 29. Final Architecture

The final design should follow this rule:

```text
                  NUMBER OF PANDALS
                         │
                         ▼
                  Local calculation
                         │
                         ▼
                    Crowd status
```

while external traffic usage follows:

```text
              GEOGRAPHIC COVERAGE
                       │
                       ▼
                Traffic zones
                       │
                       ▼
                 Cached traffic
                       │
                       ▼
              Limited API requests
```

Therefore:

> **Pandal growth should primarily increase local computation, not external traffic API calls.**

The 15-minute scheduler is responsible for keeping the crowd information reasonably fresh, while the traffic cache, geographic zones, queue, rate limiter, deduplication and stale-data fallback prevent unnecessary external requests.

This architecture preserves the existing PujoPath responsibilities—MongoDB, Crowd API, Check-in API and frontend crowd display—while adding a scalable traffic-data layer. The project plan identifies these crowd and check-in capabilities as core backend/frontend deliverables. fileciteturn2file0turn2file1
