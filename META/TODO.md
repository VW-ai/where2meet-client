### 1) **10/15 — Client-side (Single User, Local)** ✅ COMPLETED (2025-10-10)

> Goal: one person can enter multiple addresses and compute recommended places.
>
- [x]  **M1-01 Input & Map** ✅
    - Single user can enter **multiple addresses/coordinates** (manual input / map click / search box).
    - Map displays all entered points; support delete/edit.
    - Auto-suggest
- [x]  **M1-02 Center Calculation (Centroid)** ✅
    - Compute the geometric center (respecting geographic coordinates) and show a **center marker** in real time.
- [x]  **M1-03 Minimum Enclosing Circle (MEC)** ✅
    - Compute the **Minimum Enclosing Circle**; visualize center and radius.
- [x]  **M1-04 In-circle POI Search (by keyword)** ✅
    - Within the MEC (or MEC × (1+ε)), use the Maps SDK (local key) to search by keyword (e.g., *basketball court*).
    - Do client-side de-duplication and basic filtering (open now / rating / distance).
- [x]  **M1-05 Candidate List & Ranking** ✅
    - Show **candidate venues** list and map markers; support **rating-first** / **distance-first** sorting.
- [x]  **M1-06 Route Travel Time** ✅
    - Organizer can see the time from each participant to the selected location when clicked on one location.

> Deliverables: ✅ single-page demo (local session storage), full flow from addresses → recommended candidates.
>
> **Status**: All M1 features implemented and tested. Build successful. Ready for deployment.

### UI/UX Refinements (2025-10-15) ✅ COMPLETED

> Goal: Optimize widget sizing, map layout, and user experience
>
- [x]  **Full-screen Map Layout** ✅
    - Transformed to floating widgets over full-screen map
    - Semi-transparent glassmorphism effect (60% opacity + backdrop blur)
- [x]  **Radius Control** ✅
    - Changed from MEC multiplier to absolute radius (500m-5km)
    - Default 1km, compact slider UI
- [x]  **Widget Optimization** ✅
    - Left panel: Shows 5+ locations without scrolling (max-h-80)
    - Right panel: Compact initially, expands when candidates exist
    - Reduced widths (w-72/w-80) and padding (p-3) for more map visibility
- [x]  **Map Zoom Behavior** ✅
    - Fixed aggressive zoom: Single location uses zoom level 11 (city view)
    - Multiple locations still use fitBounds for optimal view
- [x]  **Typography & Spacing** ✅
    - Reduced heading sizes for compact design
    - Adaptive auto-show/hide based on content

### M2 Frontend Integration (2025-10-15) ✅ COMPLETED

> Goal: Integrate frontend with M2 backend for real-time multi-user collaboration
>
**Phase 1: Core Integration** ✅
- [x]  **API Client Service** ✅ - Complete TypeScript client for all backend endpoints
- [x]  **Event Creation Flow (Host)** ✅ - Landing page with event creation form
- [x]  **Participant Join Flow (Guest)** ✅ - Join via shareable link
- [x]  **Real-time Updates (SSE)** ✅ - Server-Sent Events integration
- [x]  **Backend API Integration** ✅ - Migration from localStorage to API

**Phase 2: Collaborative Features** ✅
- [x]  **Multi-user Map View** ✅ - Distinguish own location (green) from others (blue)
- [x]  **Voting System** ✅ - Vote buttons and real-time vote counts
- [x]  **Final Decision** ✅ - Host publish button and participant notification banner

**Phase 3: Transportation & Routes** ✅
- [x]  **Transportation Mode Selector** ✅ - Integrated with route display
  - 4 modes: Driving (🚗), Walking (🚶), Transit (🚌), Bicycling (🚴)
  - Real-time route recalculation with mode-specific times and distances
  - Contextual placement in route info panel at bottom-center
- [x]  **Route Display Enhancement** ✅ - Visual improvements
  - Combined transportation selector with route statistics
  - Clear visual feedback for active mode
  - Border separator between controls and stats

### 2) **10/22 — Server-side (Multi-party Collaboration)** ✅ COMPLETED (2025-10-14)

> Goal: introduce a backend event model + realtime collab so multiple people can join the same event.
>
- [x]  **M2-01 Event Creation & Join** ✅
    - **As an organizer…** set title/category/deadline (Must); generate `eventId` + `joinLink` (signed/expiring).
    - Implemented in `server/app/api/v1/events.py:create_event`
    - JWT token generation in `server/app/core/security.py`
- [x]  **M2-02 Participant Location Submission (Anonymous)** ✅
    - **As a participant…** open the link to submit approximate coordinates; show anonymously on the map (no identity/exact point exposed).
    - Implemented in `server/app/api/v1/participants.py`
    - Privacy fuzzing in `server/app/services/algorithms.py:apply_fuzzing`
- [x]  **M2-03 Realtime Updates (SSE)** ✅
    - Push changes to positions/candidates/votes **in realtime**; frontend syncs without refresh.
    - SSE manager in `server/app/services/sse.py`
    - Stream endpoint in `server/app/api/v1/sse.py`
- [x]  **M2-04 MEC & In-circle POI (Server-side)** ✅
    - Server computes MEC from all participant locations; **keyword search** → in-circle POIs; unified filtering/de-dup/pagination/throttling/caching.
    - Welzl's algorithm in `server/app/services/algorithms.py:compute_mec`
    - Google Places integration in `server/app/services/google_maps.py`
    - Search endpoint in `server/app/api/v1/candidates.py:search_candidates`
- [x]  **M2-05 Candidate Ranking API** ✅
    - Support **sort by rating** / **sort by distance**; return `distanceFromCenter` / `inCircle`.
    - Implemented in `server/app/api/v1/candidates.py:get_candidates`
- [x]  **M2-06 Visibility & Voting Toggles** ✅
    - **As an organizer…** configure "allow voting" and "show candidates to participants" (on/off); can **manually add** candidates to the ballot.
    - Settings in `server/app/api/v1/events.py:update_event`
    - Manual add in `server/app/api/v1/candidates.py:add_candidate_manually`
- [x]  **M2-07 Voting (Basic)** ✅
    - **As a participant…** vote on candidates (single/multi-select configurable), one-person-one-vote, de-dup & rate-limit; show live counts.
    - Implemented in `server/app/api/v1/votes.py`
    - De-duplication via unique constraint in database schema
- [x]  **M2-08 Deadline & Publish** ✅
    - Auto-lock at deadline; allow manual early lock; write `finalDecision` and broadcast.
    - Implemented in `server/app/api/v1/events.py:publish_event`
- [x]  **M2-09 Data Lifecycle & Governance** ✅
    - Event **TTL** (e.g., configurable 14/30 days) → soft delete → hard delete; export & manual deletion.
    - TTL set on event creation with `expires_at` field
    - Soft delete in `server/app/api/v1/events.py:delete_event`
- [x]  **M2-10 Security & Observability (Basics)** ✅
    - HTTPS, signed tokens, rate limiting, structured logs (events/candidates/votes), error codes & retry strategy.
    - JWT tokens with expiry in `server/app/core/security.py`
    - Structured logging with structlog in `server/app/main.py`
    - Error handling in all API endpoints

> Deliverables: ✅ minimal backend (Event/Participant/Candidate/Vote 4 tables), REST + SSE API, Alembic migrations, Docker Compose setup.
>
> **Status**: All M2 features implemented. FastAPI server with PostgreSQL & Redis ready. Database schema complete. API documented at `/docs` endpoint.