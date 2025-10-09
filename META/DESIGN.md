# TECHDESIGN.md — Where2Meet (FastAPI + Google Maps)

> **Goal:** Deliver a product that helps groups converge on fair meeting places, across three milestones: **10/15 (single‑user client)**, **10/22 (multi‑user server)**, **10/29 (Web & App complete experience)**. Frontend uses the **Google Maps Platform**; backend uses **FastAPI (Python)** with **PostgreSQL** for persistence and **Redis** for caching/rate‑limiting; real‑time starts with **SSE**, upgradeable to **WebSocket** later.

---

## 1. Scope & Milestones

### M1 (10/15) — Client‑side (Single User)

* Multiple inputs (typed address / map click / search Autocomplete) with map visualization.
* Frontend computes **Centroid** and **Minimum Enclosing Circle (MEC)**; render center and radius.
* **In‑circle POI search** via **Google Maps Places Library (JS)** using `nearbySearch` / `textSearch`; client‑side de‑dup & filtering (openNow/rating/distance).
* Candidate list and sorting (rating‑first / distance‑first); **route deeplink** to Google Maps.
* Errors & graceful degradation (e.g., location denied → manual pick; Places timeout → keep centroid/MEC shown).
* **Optional thin backend**: only for API key shielding / CORS / simple proxy (no business state persisted).

### M2 (10/22) — Server‑side (Multi‑party)

* Event creation & join (returns `eventId` + signed/expiring `joinLink`).
* Participants submit approximate coordinates (anonymous on map); **SSE** pushes live updates (positions/candidates/votes).
* Server aggregation: MEC from all participants; **Places API v1 (HTTP)** for circle‑biased POI search; unified de‑dup, sorting, pagination, throttling, caching.
* Voting (single/multi selectable), deadline & publish, TTL data governance; security & observability (rate limits, structured logs, error codes, retry policy).

### M3 (10/29) — Web & App (Full Experience)

* Vote visualization (bubble scaling/heatmap) with top‑N decluttering & subtle animation.
* Route visualization w/ ETA & distance (Routes API) with fallback to editable origin when permissions are limited.
* Outlier handling (IQR/distance thresholds) with explanations; visibility levels (exact/blur/heatmap); i18n (EN/中文); presence & anonymous activity.
* Performance & abuse protection (100+ candidates @ 60fps; server rate limits/anti‑abuse; cache & request coalescing).
* E2E test (create → join → vote → publish → route), SLO report, release & regression checklist; ship Web + App (uni‑app) parity.

---

## 2. System Architecture

```
where2meet (monorepo)
├─ apps/
│  ├─ web/                 # Next.js/Vite + TypeScript + Google Maps JS SDK + i18n
│  └─ server/              # FastAPI + PostgreSQL + Redis + SSE
├─ packages/
│  ├─ algos/               # Centroid, MEC (Welzl), scoring; pure functions, no DOM
│  ├─ map-adapters/        # google-js (M1), google-http (M2), mock (switchable)
│  ├─ shared/              # Types, Zod schemas, OpenAPI contract, utilities
│  ├─ ui/                  # Reusable UI (Map, bubbles, lists, toggles)
│  └─ testkit/             # Vitest, Playwright fixtures, contract tests
└─ infra/
   ├─ docker/              # docker-compose: postgres / redis / server
   └─ scripts/             # migrations, benchmarks, seeders
```

**Communication**

* Web ↔ Server: HTTPS (REST + **SSE** stream).
* Server ↔ Google: Places API v1 (HTTP) + Routes API (M3).

**Key Patterns**

* **Adapter pattern**: `poiAdapter` supports `local | google-js | google-http` for seamless data‑source swapping.
* **Contract‑first**: Freeze OpenAPI/Zod in `packages/shared/`; generate a typed client SDK consumed by web & tests.
* **Feature flags**: `serverMode` (local/api), `realtime`, `allowVote`, `visibility`, etc.

---

## 3. Frontend Design (Web / uni‑app)

**Stack**: TypeScript, React (Next.js or Vite), Google Maps **JavaScript API** + **Places Library**, Tailwind/UnoCSS, react‑i18next. Algorithms run in **Web Workers** to preserve 60fps rendering.

**Modules**

* `MapView`: base map, markers, circles, info windows, cluster, interactions (click/drag).
* `InputPanel`: Autocomplete search, coordinate entry, list add/remove/edit.
* `AnalysisPanel`: Centroid/MEC visualization and parameters (ε dilation).
* `CandidatesPanel`: Candidate list, sort toggle, **deeplink** to routes.
* `Toolbar`: language switch, visibility level, outlier toggle.

** UX & Perf **

* Autocomplete uses **Session Token** to bundle suggestions (cost control & latency).
* Marker clustering and virtualized lists for 100+ candidates.
* Accessibility: keyboard navigation, contrast, focusable markers; empty/error states.

---

## 4. Algorithm Module (`packages/algos`)

### 4.1 Centroid on a sphere

* Convert lat/lng to unit vectors on the sphere, average, then normalize back to lat/lng (avoids artifacts near poles & 180° crossings).

### 4.2 MEC (Minimum Enclosing Circle)

* Implement **Welzl’s algorithm** (expected O(n)), handle degenerates: duplicates, collinear sets, 2‑point/3‑point circle.

### 4.3 Tests

* Cases: 2/3/many points, duplicates, collinear, 180° meridian crossing, random clouds.
* Assertions: all points inside (epsilon tolerance), minimality (vs brute/approx checks).

---

## 5. Backend Design (FastAPI)

**Stack**: FastAPI (Uvicorn/Gunicorn), Pydantic v2, SQLAlchemy 2.0, Alembic; PostgreSQL; Redis; `httpx` for Google calls; `slowapi` or Redis token‑bucket for rate limiting; `structlog` JSON logs; OpenTelemetry tracing.

### 5.1 Data Model (4 core tables + governance)

* **Event**: `id, title, category, deadline, visibility, allow_vote, created_at, expires_at`
* **Participant**: `id, event_id, approx_lat, approx_lng, blur_level, created_at`
* **Candidate**: `id, event_id, place_id, name, lat, lng, rating, source, distance_from_center, in_circle, created_at`
* **Vote**: `id, event_id, candidate_id, voter_hash, created_at`
* **Governance**: soft‑delete `deleted_at`; periodic hard‑delete by TTL.

> **Anonymity**: `voter_hash = hash(ip/deviceSalt/eventId)`; no PII stored.

### 5.2 API Contract (Draft)

| Method | Path                         | Auth      | Description                                                 |           |
| ------ | ---------------------------- | --------- | ----------------------------------------------------------- | --------- |
| POST   | `/v1/events`                 | none      | Create event; returns `eventId`, signed/expiring `joinLink` |           |
| POST   | `/v1/events/{id}/join`       | signed    | Submit approximate coordinates (anonymous)                  |           |
| GET    | `/v1/events/{id}/center`     | signed    | Aggregated centroid & MEC for the event                     |           |
| GET    | `/v1/events/{id}/candidates` | signed    | List candidates; supports `kw`, pagination, `sort=rating    | distance` |
| POST   | `/v1/events/{id}/vote`       | signed    | Cast vote (single/multi configurable), dedupe & throttle    |           |
| GET    | `/v1/events/{id}/stream`     | signed    | **SSE** for positions/candidates/votes/status               |           |
| POST   | `/v1/events/{id}/lock`       | organizer | Lock early or at deadline, write `finalDecision`            |           |

**Signed joinLink**: JWT/HMAC embeds `eventId`, `exp`, `scope`; backend also validates origin and applies rate limits.

### 5.3 Server‑side POI Search (Places API v1 HTTP)

* Endpoint: `POST https://places.googleapis.com/v1/places:searchText`
* Use `locationBias.circle` with MEC center & radius × (1+ε).
* **Field mask** via header `X-Goog-FieldMask`: request only essential fields (`places.id,places.displayName,places.rating,places.userRatingCount,places.location`, ...).
* **Caching**: `cacheKey = sha1(textQuery + centerLatLng + radius + pageToken)`; TTL 5–15 min; **stale‑while‑revalidate**.
* **De‑dup & sort**: unique by `places.id`; compute `distance_from_center`; provide `in_circle`; support `rating` & `distance` sorting.

### 5.4 Real‑time (SSE)

```py
from fastapi import APIRouter, Request
from starlette.responses import StreamingResponse

router = APIRouter()

@router.get("/v1/events/{event_id}/stream")
async def stream(event_id: str, request: Request):
    async def event_generator():
        pubsub = redis_client.pubsub()
        await pubsub.subscribe(f"ev:{event_id}")
        try:
            async for msg in pubsub.listen():
                if await request.is_disconnected():
                    break
                if msg["type"] == "message":
                    yield f"data: {msg['data'].decode()}\n\n"
        finally:
            await pubsub.unsubscribe(f"ev:{event_id}")
    return StreamingResponse(event_generator(), media_type="text/event-stream")
```

### 5.5 Errors & Retries

* 4xx: `INVALID_TOKEN`, `EXPIRED_LINK`, `RATE_LIMITED`, `INVALID_PARAM`, `NOT_FOUND`.
* 5xx: `UPSTREAM_PLACES_ERROR`, `DB_TIMEOUT`, `CACHE_UNAVAILABLE`.
* Frontend: exponential backoff on `RATE_LIMITED`; on upstream errors, degrade gracefully (show centroid/MEC only).

---

## 6. Security & Privacy

* **Key separation**:

  * Browser key (Maps JS/Places Library) restricted by HTTP referrers.
  * Server key (Places/Routes HTTP) restricted by egress IP.
* **Signed links**: JWT/HMAC with expiry and scope; organizer actions require CSRF protection and confirmation.
* **Anonymization**: default `blur/heatmap`; no PII; irreversible `voter_hash`.
* **Quotas/abuse**: Redis token‑bucket; IP+eventId dimensions; suspicious traffic → greylisting/temporary bans.

---

## 7. Database Schema (PostgreSQL)

```sql
CREATE TABLE events (
  id              TEXT PRIMARY KEY,
  title           TEXT NOT NULL,
  category        TEXT NOT NULL,
  deadline        TIMESTAMPTZ,
  visibility      TEXT DEFAULT 'blur', -- exact|blur|heatmap
  allow_vote      BOOLEAN DEFAULT TRUE,
  final_decision  TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  expires_at      TIMESTAMPTZ,
  deleted_at      TIMESTAMPTZ
);

CREATE TABLE participants (
  id         TEXT PRIMARY KEY,
  event_id   TEXT REFERENCES events(id) ON DELETE CASCADE,
  approx_lat DOUBLE PRECISION NOT NULL,
  approx_lng DOUBLE PRECISION NOT NULL,
  blur_level INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE candidates (
  id         TEXT PRIMARY KEY,
  event_id   TEXT REFERENCES events(id) ON DELETE CASCADE,
  place_id   TEXT NOT NULL,
  name       TEXT NOT NULL,
  lat        DOUBLE PRECISION NOT NULL,
  lng        DOUBLE PRECISION NOT NULL,
  rating     DOUBLE PRECISION,
  source     TEXT,
  distance_from_center DOUBLE PRECISION,
  in_circle  BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE votes (
  id           TEXT PRIMARY KEY,
  event_id     TEXT REFERENCES events(id) ON DELETE CASCADE,
  candidate_id TEXT REFERENCES candidates(id) ON DELETE CASCADE,
  voter_hash   TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, candidate_id, voter_hash)
);

CREATE INDEX idx_participants_event ON participants(event_id);
CREATE INDEX idx_candidates_event ON candidates(event_id);
CREATE INDEX idx_votes_event ON votes(event_id);
```

---

## 8. Deployment & Operations

**Environment**

* `GMAPS_JS_API_KEY` (browser key)
* `GMAPS_SERVER_API_KEY` (server key)
* `DATABASE_URL` (Postgres)
* `REDIS_URL`
* `JWT_SECRET` / `LINK_SIGN_SECRET`
* `RATE_LIMIT_QPS` / `RATE_LIMIT_BURST`

**Docker Compose (dev)**

* `postgres:16`, `redis:7`, `server` (FastAPI)
* Local web via `pnpm dev`; server via `uvicorn app.main:app --reload`

**Monitoring**

* Metrics: Prometheus (qps/latency/cache‑hit/rate‑limit/places‑error)
* Logs: JSON structured; correlate by `event_id`
* Tracing: OpenTelemetry (e.g., `/candidates → Places → DB` spans)

---

## 9. Testing Strategy

* **Algorithms** (Vitest): centroid/MEC coverage.
* **Backend** (pytest): Pydantic validation, repos/DAOs, caching, rate limiting.
* **Contract tests**: generated client SDK against staging endpoints.
* **E2E** (Playwright): create → join → realtime → vote → publish → route (M3).
* **Benchmarks**:

  * MEC with N=1e3/1e4 points (latency)
  * `/candidates` QPS & P95 latency; cache hit rate
  * Frontend 60fps with 100+ candidates

---

## 10. Cost & Quota Controls

* Places: Autocomplete with **Session Token**; server requests with **FieldMask**.
* Caching: quantize center & radius (concentric ring buckets) for higher hit rates; cache pagination; extend TTL for hot queries (e.g., "cafe", "basketball court").
* Rate limiting: token‑bucket per IP+eventId; exponential backoff; graceful degradation on upstream failure.

---

## 11. Privacy & Visibility

* Levels: `exact | blur | heatmap` (default `blur`).
* Ranking explanation: expose rating/distance weights; when outliers are excluded (IQR/distance), show reason tags.
* Export: optional ICS calendar (M3). TTL pipeline: soft‑delete → hard‑delete.

---

## 12. Release Process

* Trunk‑based + PR reviews + feature flags.
* Tags per milestone: `v0.1-m1`, `v0.2-m2`, `v0.3-m3`.
* Regression checklist on the critical path (input → analysis → candidates → vote → publish → route).

---

## 13. Sample FastAPI Skeleton

```py
from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

app = FastAPI(title="Where2Meet API", version="0.1.0")

class CreateEventIn(BaseModel):
    title: str
    category: str
    deadline: Optional[str]

class EventOut(BaseModel):
    id: str
    join_link: str

@app.post("/v1/events", response_model=EventOut)
async def create_event(payload: CreateEventIn):
    # 1) insert DB  2) sign join token  3) return joinLink
    ...

class JoinIn(BaseModel):
    lat: float
    lng: float
    blur_level: int = 1

@app.post("/v1/events/{event_id}/join")
async def join_event(event_id: str, payload: JoinIn):
    # validate token / rate-limit / insert participant
    ...

@app.get("/v1/events/{event_id}/candidates")
async def list_candidates(event_id: str, kw: str = "", sort: str = "rating"):
    # read center/MEC → call Places v1 (FieldMask) → cache → compute distance & sort
    ...
```

---

## 14. Open Risks

* Routes API cost & call frequency (enable in M3 only).
* SSE connection limits under very high concurrency (consider WS or push‑gateway/Nginx/Redis streams if needed).
* Abuse on public join links: captcha/thresholds/greylisting.

---

## 15. Conclusion

* **FastAPI + PostgreSQL + Redis + Google Maps/Places** provides a clean path: M1 proves UX fast (frontend‑first + thin key‑shield), M2 introduces the event model, aggregation & realtime, and M3 polishes visualization, accessibility & performance.
* **Adapter + Contract‑first + Feature Flags** allow swapping data sources across milestones without rewrites, minimizing rework and enabling parallel development.
