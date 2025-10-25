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

### UI/UX Improvements - In Progress

**Left Panel Refactor (2025-10-22)** ✅ COMPLETED
- [x] **Unified Left Panel** ✅ - Three-section vertical stack (Input, Venues, Participation)
- [x] **Anonymous Name Generation** ✅ - Auto-generate names (e.g., "swift_wolf") with shuffle button
- [x] **Privacy Toggle** ✅ - Blur location on by default (~500m offset)
- [x] **Search Type Toggle** ✅ - Search by Type (with category chips) or by Name
- [x] **Click-to-Vote** ✅ - Entire venue card clickable for voting
- [x] **Top Choice Banner** ✅ - Always show winner with trophy icon in Venue List
- [x] **Colored Participant Markers** ✅ - 6-color palette with triangle indicators
- [x] **Collapsible Input** ✅ - Input section collapses after joining event
- [x] **Lucide Icons** ✅ - All icons replaced with Lucide React (no emojis)

**Phase 1: Core UX Polish (HIGH PRIORITY)** 🔥

1. [ ] **Expandable Venue Cards** ⭐ TOP PRIORITY
   - Click venue card → Expands to show full details
   - Include: Photos carousel (Google Places Photos API), top reviews, rating breakdown
   - External links: Google Maps, Website, Phone number
   - Scrollable content for long descriptions
   - Smooth animation (slide down / modal overlay)
   - Estimated: 1 day

2. [ ] **Compact List View - Space Optimization** ⭐ TOP PRIORITY
   - **Search Results**: Max 2 lines per venue
     - Line 1: Name + Rating + Distance (inline)
     - Line 2: Address (truncated with ellipsis)
     - Remove verbose labels, use icons only
   - **Participants**: Max 1 line each
     - Format: `▲ swift_wolf • 123.45, -89.01 (blurred)`
     - Remove extra padding/spacing
   - Goal: Show 10+ venues without scrolling on laptop screen (1440px height)
   - Estimated: 3-4 hours

3. [ ] **Top Panel (Header) Refactor** ⭐ TOP PRIORITY
   - Single row, max 64px height
   - Layout: `[Logo] [Event Title] [Participants: 5] [🏆 Top Choice: Joe's Pizza (3 votes)] [Share Link]`
   - Remove: Venue count, Radius display (move to left panel if needed)
   - Make responsive: Stack on mobile
   - Estimated: 3-4 hours

4. [ ] **Event Cards on Homepage**
   - Show list of user's events with status (active/completed)
   - Click card → Expandable detail view
   - Include: Title, Participant count, Top venue, Created date, Status badge
   - Actions: Join, View, Delete
   - Estimated: 4-6 hours

5. [ ] **Typography & Design System Update**
   - Replace Arial with modern system font stack: `Inter` or `-apple-system`
   - Establish type scale: `text-xs (10px)`, `text-sm (12px)`, `text-base (14px)`, `text-lg (16px)`
   - Consistent spacing: Use only 4/8/12/16/24/32px increments
   - Color consistency: Strictly use emerald-600, teal-600, neutral-50/200/400/700/950
   - Remove all custom colors and random values
   - Estimated: 2-3 hours

6. [ ] **Less Text, More Visual Hints**
   - Remove instructional text labels where icons are sufficient
   - Examples:
     - "Search by Type" → Just show toggle with icons
     - "Only show within circle" → Icon + checkbox (no label)
     - "Sort by: Rating Distance Votes" → Just icon buttons
   - Use tooltips on hover instead of permanent labels
   - Estimated: 2 hours

7. [ ] **Route Distance/Time Panel Refactor**
   - Current: Bottom-center panel with transportation modes
   - New: Compact floating pill
   - Show: Travel mode icon + time + distance (e.g., `🚗 15 min • 8.2 km`)
   - Click to expand: All modes comparison table
   - Auto-hide when no route selected
   - Estimated: 2-3 hours

**Phase 2: Quick Wins (MEDIUM PRIORITY)** 🎯

8. [ ] **Auto-search on 2+ Participants**
   - Effect already coded (line 482-494)
   - Just needs testing and connection
   - Estimated: 30 mins

9. [ ] **Host Can Vote**
   - Remove `role === 'host'` check in `handleVote`
   - Simple one-line change
   - Estimated: 5 mins

10. [ ] **Remove Publish Button**
    - Delete publish button from header
    - Top Choice updates automatically via SSE
    - Estimated: 10 mins

11. [ ] **One-click Share Link**
    - Replace modal with `navigator.clipboard.writeText()` + toast
    - Location: Share button in header
    - Estimated: 20 mins

12. [ ] **Nicer Confirmation Dialog**
    - Replace browser `confirm()` with custom styled modal
    - Show coordinates preview, "Are you sure?" text
    - Green/gray buttons (Confirm/Cancel)
    - Animated entrance (fade + scale)
    - Estimated: 1-2 hours

13. [ ] **Top Choice in Header (Always Visible)**
    - Move from Venue List tab to header
    - Format: `🏆 Top Choice: Joe's Pizza (3 votes)`
    - Real-time update via SSE
    - Estimated: 2 hours

**Phase 3: Advanced Features (LOWER PRIORITY)** 📋

14. [ ] **Google Autocomplete for Address**
    - Integrate with InputSection address field
    - Replace manual coordinate entry
    - Estimated: 2-3 hours

15. [ ] **Map Pan to Participant**
    - Click participant → Map pans/zooms to their location
    - Marker pulses to indicate focus
    - Estimated: 1-2 hours

16. [ ] **Search Area Slider to Header**
    - Move radius multiplier control to header (host only)
    - Compact slider: `1.0x ──●── 2.0x`
    - Estimated: 1 hour

17. [ ] **Remove Right Panel**
    - All features migrated to left panel
    - Delete old Tabs/CandidatesPanel components
    - Estimated: 2-3 hours

18. [ ] **Mobile Responsive Design**
    - Touch targets: 44×44px minimum
    - Bottom sheet layout for panels
    - Test on iPhone/Android devices
    - Estimated: 1-2 days

19. [ ] **Accessibility (A11y)**
    - ARIA labels for all interactive elements
    - Keyboard navigation (Tab, Enter, Escape)
    - Screen reader support
    - Focus indicators
    - Estimated: 1 day

20. [ ] **Unit Tests**
    - Test all LeftPanel components
    - Test anonymous name generation
    - Test vote/save/remove actions
    - Estimated: 2-3 days