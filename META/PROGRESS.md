# Project Progress

## 2025-10-14: Milestone 2 (M2) Completed - Server-side Implementation

### ✅ Complete FastAPI Backend
- **Framework**: FastAPI 0.115 with Python 3.9+
- **Database**: PostgreSQL 16 with SQLAlchemy 2.0 ORM
- **Cache**: Redis 7 for rate limiting (future)
- **Migrations**: Alembic 1.13 for database version control
- **Real-time**: Server-Sent Events (SSE) for live updates

### ✅ M2-01: Event Creation & Join
- Event creation endpoint: `POST /api/v1/events`
- JWT-signed join tokens with configurable expiry (default: 30 days)
- Event model with title, category, deadline, visibility, voting settings
- Security module with token generation and verification in `server/app/core/security.py`

### ✅ M2-02: Participant Location Submission
- Anonymous participant submission: `POST /api/v1/events/{id}/participants`
- Privacy-preserving fuzzing for "blur" mode (adds ~500m random offset)
- Participant model with both actual and fuzzy coordinates
- List participants endpoint with visibility-aware coordinate filtering

### ✅ M2-03: Real-time Updates (SSE)
- SSE stream endpoint: `GET /api/v1/events/{id}/stream`
- SSE manager with connection pooling in `server/app/services/sse.py`
- Broadcasts: participant_joined, candidate_added, vote_cast, event_updated, etc.
- Keepalive mechanism (30s timeout) to maintain connections
- Automatic cleanup of disconnected clients

### ✅ M2-04: Server-side MEC & POI Search
- Welzl's algorithm implementation (O(n) expected time)
- Server-side geometric calculations in `server/app/services/algorithms.py`:
  - Spherical centroid computation
  - Minimum Enclosing Circle with proper edge cases
  - Haversine distance calculations
- Google Maps Places API integration in `server/app/services/google_maps.py`
- POI search endpoint: `POST /api/v1/events/{id}/candidates/search`
- Client-side de-duplication and filtering (rating, distance, opening hours)

### ✅ M2-05: Candidate Ranking API
- Get candidates endpoint: `GET /api/v1/events/{id}/candidates`
- Query parameter sorting: `?sort_by=rating` or `?sort_by=distance`
- Includes vote counts via SQL aggregation
- Returns distance_from_center and in_circle boolean

### ✅ M2-06: Visibility & Voting Toggles
- Event update endpoint: `PATCH /api/v1/events/{id}`
- Organizer controls:
  - `visibility`: "blur" (fuzzy coordinates) or "show" (exact)
  - `allow_vote`: enable/disable voting
- Manual candidate addition: `POST /api/v1/events/{id}/candidates`
- Candidate tracking with `added_by` field (system vs organizer)

### ✅ M2-07: Voting System
- Vote casting endpoint: `POST /api/v1/events/{id}/votes`
- One-person-one-vote per candidate (unique constraint in DB)
- Vote removal endpoint for changing votes
- Real-time vote count broadcasting via SSE
- List votes endpoint with optional participant filtering

### ✅ M2-08: Deadline & Publish
- Publish final decision: `POST /api/v1/events/{id}/publish`
- Auto-locks voting when final_decision is set
- Broadcasts event_published event to all connected clients
- Deadline field in event model (auto-lock not yet implemented)

### ✅ M2-09: Data Lifecycle & Governance
- Configurable event TTL (default: 30 days) via `EVENT_TTL_DAYS`
- Soft delete support with `deleted_at` timestamp
- Hard delete option: `DELETE /api/v1/events/{id}?hard_delete=true`
- Expires_at field set on event creation
- Soft delete retention configurable via `SOFT_DELETE_RETENTION_DAYS`

### ✅ M2-10: Security & Observability
- JWT token authentication with python-jose
- Secret key configuration via environment variables
- Structured logging with structlog (JSON format)
- Error handling with proper HTTP status codes
- CORS middleware with configurable allowed origins
- Input validation with Pydantic schemas
- Database connection pooling (size: 10, max_overflow: 20)

### Database Schema
**4 Tables implemented in `server/app/models/event.py`:**

1. **Events** - Main event coordination records
   - Fields: id, title, category, deadline, visibility, allow_vote, final_decision
   - Timestamps: created_at, expires_at, deleted_at
   - Indexes on: id, created_at, deleted_at, expires_at

2. **Participants** - Anonymous participant locations
   - Fields: id, event_id (FK), lat, lng, fuzzy_lat, fuzzy_lng, name
   - Timestamp: joined_at
   - Index on: event_id

3. **Candidates** - Potential meeting venues
   - Fields: id, event_id (FK), place_id, name, address, lat, lng, rating, user_ratings_total
   - Computed: distance_from_center, in_circle
   - Metadata: opening_hours, added_by
   - Indexes on: event_id, place_id

4. **Votes** - Participant votes for candidates
   - Fields: id, event_id (FK), participant_id (FK), candidate_id (FK)
   - Timestamp: voted_at
   - Unique constraint: (participant_id, candidate_id)

### API Endpoints Summary
**20+ REST endpoints across 5 routers:**

- **Events**: create, get, update, publish, delete, analysis (6 endpoints)
- **Participants**: add, list, remove (3 endpoints)
- **Candidates**: search, list, add manually, remove (4 endpoints)
- **Votes**: cast, list, remove (3 endpoints)
- **SSE**: event stream (1 endpoint)
- **Health**: root, health check (2 endpoints)

### Development Tools
- **Docker Compose**: PostgreSQL 16 + Redis 7 setup
- **Alembic**: Database migration management
- **Setup Script**: `setup.sh` for automated environment setup
- **API Documentation**: Auto-generated at `/docs` (Swagger UI)
- **Configuration**: Pydantic Settings with `.env` support

### Files Created (Server)
```
server/
├── app/
│   ├── api/v1/
│   │   ├── events.py (190 lines) - Event CRUD + analysis
│   │   ├── participants.py (120 lines) - Participant management
│   │   ├── candidates.py (280 lines) - Venue search & ranking
│   │   ├── votes.py (160 lines) - Voting system
│   │   └── sse.py (50 lines) - Real-time stream
│   ├── core/
│   │   ├── config.py (50 lines) - Settings management
│   │   └── security.py (70 lines) - JWT & token utils
│   ├── db/
│   │   └── base.py (30 lines) - Database session
│   ├── models/
│   │   └── event.py (130 lines) - SQLAlchemy models
│   ├── schemas/
│   │   └── event.py (120 lines) - Pydantic schemas
│   ├── services/
│   │   ├── algorithms.py (180 lines) - MEC & centroid
│   │   ├── google_maps.py (110 lines) - Places API
│   │   └── sse.py (100 lines) - SSE manager
│   └── main.py (80 lines) - FastAPI app
├── alembic/ - Migration framework
├── docker-compose.yml - Database services
├── requirements.txt - Python dependencies
├── setup.sh - Setup automation
├── README.md (350 lines) - Server documentation
└── .gitignore
```

**Total Server Code**: ~1,800 lines of Python
**Documentation**: ~400 lines

### Next Steps
- [x] Frontend integration with M2 API - **COMPLETED** (Phase 1 & 2 below)
- [x] Transportation mode selector - **COMPLETED** (2025-10-15)
- [ ] Test multi-user scenarios
- [ ] Deploy to staging environment
- [ ] Performance testing with concurrent users

---

## 2025-10-15: Transportation Mode & Route Enhancement

### ✅ Enhanced Route Display with Transportation Options
- **Integrated transportation mode selector** directly in route info display
  - Moved from separate top-right widget to bottom route panel for better UX
  - **4 transportation modes** with real-time route recalculation:
    - 🚗 **Drive** - Car/driving directions
    - 🚶 **Walk** - Pedestrian directions
    - 🚌 **Transit** - Public transportation (bus, subway, train)
    - 🚴 **Bike** - Bicycle directions
  - Mode-specific travel time and distance calculations
  - Visual feedback: Active mode highlighted in blue with scale effect

- **Contextual placement** in `components/MapView.tsx:333-404`
  - Transportation selector shown above route stats
  - Only visible when route is displayed (participant with selected candidate)
  - Automatic route recalculation when mode changes
  - Smooth transitions with 300ms animation

- **Google Directions API integration**
  - Dynamic route calculation in `MapContent` component (line 59-102)
  - Travel mode parameter: `travelMode: travelMode || google.maps.TravelMode.DRIVING`
  - Real-time route rendering on map with color-coded paths
  - Distance and duration extracted from route legs

### Technical Implementation
- **Improved button styling** with text labels + emojis
  - Clear labeling: "Drive", "Walk", "Transit", "Bike"
  - Rounded corners (`rounded-lg`) for modern look
  - Scale animation on active state (`scale-105`)
  - Hover effects for better interactivity

- **Safe Google Maps loading**
  - `isGoogleLoaded` state prevents errors before API ready
  - Helper functions with proper null checks:
    - `isModeActive()` - Safely checks active transportation mode
    - `handleTravelModeClick()` - Safely handles mode changes
  - Default mode: Driving (fallback before Google loads)

- **Route info layout** enhanced with visual separator
  - Travel mode selector in top section
  - Border separator between selector and stats
  - Stats remain prominent with large font sizes
  - Duration in green, distance in blue for quick scanning

### Files Modified
- `components/MapView.tsx` (lines 280-404) - Enhanced route display with transportation selector
  - Removed old top-right floating widget
  - Added integrated transportation mode selector in route info
  - Improved styling and layout

### User Experience
- ✅ **Contextual controls**: Transportation modes appear exactly when needed (route viewing)
- ✅ **Real-time updates**: Route recalculates instantly when changing mode
- ✅ **Clear visual feedback**: Active mode clearly highlighted in blue
- ✅ **Mode-specific info**: Travel time and distance adjust for each transportation type
- ✅ **Better positioning**: Bottom-center placement doesn't obscure map

### Use Cases
**Scenario 1: Urban commute**
- Participant selects venue candidate
- Route shows 15 min by car
- Switches to 🚌 Transit: sees 25 min via subway
- Switches to 🚶 Walk: sees 45 min on foot
- Can compare all modes before deciding

**Scenario 2: Environmental choice**
- Group wants eco-friendly options
- Check 🚴 Bike: 10 min, 2.5 km
- Compare to 🚗 Drive: 5 min, 2.8 km (longer route)
- Choose biking for health and environment

**Scenario 3: Accessibility**
- Participant without car checks 🚌 Transit
- Sees 30 min with 1 transfer
- Group can accommodate transit users in decision

---

## 2025-10-15: M2 Frontend Integration - Phase 1 & 2 Complete

### 🎉 Phase 1: Core Integration (COMPLETED)

#### 1. API Client Service (`lib/api.ts`)
- ✅ **Complete TypeScript API client** with 300+ lines
  - All M2 backend endpoints: Events, Participants, Candidates, Votes, SSE
  - Type-safe interfaces matching backend schemas
  - Error handling and proper HTTP status codes
  - Singleton pattern for easy import: `import { api } from '@/lib/api'`

#### 2. Event Creation Flow (Host)
- ✅ **New landing page** at `/` (`app/page.tsx`)
  - Event creation form with:
    - Title input (required)
    - Category selector (restaurant, cafe, bar, park, basketball court, etc.)
    - Privacy toggle (blur/show exact locations)
    - Voting toggle (enable/disable)
  - Generates shareable join link with JWT token
  - Stores host role and event ID in sessionStorage
  - Auto-redirects to event page after creation

#### 3. Participant Join Flow (Guest)
- ✅ **Join via link** functionality (`app/event/page.tsx`)
  - URL format: `/event?id=EVENT_ID&token=TOKEN`
  - Automatic role detection (host vs participant)
  - Join dialog on landing page ("Join Existing Event" button)
  - Participant ID stored in sessionStorage after first location submission
  - Privacy-aware: fuzzy coordinates displayed when privacy=blur

#### 4. Real-time Updates (SSE)
- ✅ **Server-Sent Events integration** in event page
  - Auto-connect on page load with reconnection logic (5s delay)
  - Event types handled:
    - `participant_joined` - Reload participant list
    - `candidate_added` - Refresh venue list
    - `vote_cast` - Update vote counts in real-time
    - `event_updated` - Refresh event settings
    - `event_published` - Show final decision banner
  - Automatic cleanup on component unmount
  - Error handling with auto-reconnect

#### 5. Backend API Integration
- ✅ **Complete migration from localStorage to API**
  - Location submission via `POST /api/v1/events/{id}/participants`
  - Participant list via `GET /api/v1/events/{id}/participants`
  - Candidate search via `POST /api/v1/events/{id}/candidates/search`
  - Event data via `GET /api/v1/events/{id}`
  - Real-time sync across all connected clients

### 🎉 Phase 2: Collaborative Features (COMPLETED)

#### 4. Multi-user Map View (`components/MapView.tsx`)
- ✅ **Participant distinction on map**
  - **Own location**: Emerald green marker (larger) with "You" label
  - **Other participants**: Blue markers with name labels
  - **Centroid**: Purple marker (center point)
  - **Candidates**: Orange markers (red when selected)
  - Visual ring around own marker for emphasis
  - Hover tooltips showing participant names/addresses

- ✅ **Privacy-aware display**
  - Fuzzy coordinates shown when event visibility="blur"
  - Exact coordinates shown when visibility="show"
  - Host can toggle privacy settings in event update

#### 5. Voting System
- ✅ **Vote UI in CandidatesPanel** (`components/CandidatesPanel.tsx`)
  - Purple "Vote" button on each venue card (when voting enabled)
  - Real-time vote count display with 🗳️ emoji
  - Vote button only shown to participants with ID
  - Disabled when allow_vote=false
  - One-person-one-vote enforced by backend

- ✅ **Real-time vote counts**
  - Vote counts update via SSE when anyone votes
  - Displayed as "🗳️ X votes" badge on each venue
  - Color-coded: purple for vote information

#### 6. Final Decision
- ✅ **Host controls** in event header
  - "Publish Decision" button (only visible to host)
  - Requires venue selection first
  - Confirmation dialog before publishing
  - Broadcasts via SSE to all participants

- ✅ **Final decision display**
  - Green banner at top of screen: "🎉 Final Decision: [Venue Name]"
  - Visible to all participants instantly via SSE
  - Alert notification on publish
  - Banner persists after page reload (stored in event.final_decision)

### Technical Implementation Details

#### Files Created/Modified:
- **NEW**: `lib/api.ts` (300 lines) - Complete API client
- **NEW**: `app/page.tsx` (200 lines) - Landing page with event creation
- **MAJOR REWRITE**: `app/event/page.tsx` (520 lines) - Event collaboration page
- **MODIFIED**: `components/MapView.tsx` - Added participant distinction
- **MODIFIED**: `components/CandidatesPanel.tsx` - Added voting UI
- **MODIFIED**: `types/index.ts` - Added voteCount to Candidate
- **MODIFIED**: `.env.local` - Added NEXT_PUBLIC_API_URL

#### Architecture:
```
Landing Page (/)
   └─> Create Event → Backend API → Event Page (/event?id=X)
   └─> Join Link → Event Page (/event?id=X&token=Y)
                      ↓
               Load Event Data
                      ↓
              Connect to SSE ←─────┐
                      ↓            │
        ┌────────────┴────────────┤
        ↓                         │
   Map Display              Real-time
   (multi-user)              Updates
        ↓                         ↑
   Add Location → API → SSE ─────┘
   Search Venues → API → SSE ─────┘
   Cast Vote → API → SSE ──────────┘
   Publish Decision → API → SSE ───┘
```

#### User Flows:

**Host Flow:**
1. Create event on landing page
2. Get shareable link
3. Share link with participants
4. See participants join in real-time
5. Search for venues
6. See live vote counts
7. Select winner and publish decision

**Participant Flow:**
1. Receive join link from host
2. Open link in browser
3. Add own location (shows as green "You" marker)
4. See other participants' locations (blue markers)
5. View venue candidates
6. Cast votes on preferred venues
7. Receive final decision notification

#### Color Scheme:
- 🟢 **Emerald** (own location) - `bg-emerald-500`
- 🔵 **Blue** (other participants) - `bg-blue-500`
- 🟣 **Purple** (centroid / voting) - `bg-purple-600`
- 🟠 **Orange** (venue candidates) - `bg-orange-500`
- 🔴 **Red** (selected venue) - `bg-red-600`
- 🟢 **Green** (final decision) - `bg-green-500`

### Environment Configuration
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Testing Checklist
- [x] Create event as host
- [x] Copy and open join link in incognito window
- [x] Add locations from both host and participant
- [x] Verify real-time location updates
- [x] Search for venues (host)
- [x] Cast votes (participant)
- [x] Verify real-time vote updates
- [x] Publish final decision (host)
- [x] Verify all participants see decision banner

### Known Limitations
- SSE reconnection has 5-second delay (could be improved)
- No offline support (requires constant backend connection)
- Participant can only add one location (by design)
- Vote removal requires API call (no UI button yet)
- No participant kick/ban functionality
- No event expiration UI (backend has TTL)

---

## 2025-10-15: UI/UX Refinements - Full-screen Map & Widget Optimization

### Full-screen Map Layout
- ✅ **Transformed layout to full-screen map** with floating semi-transparent widgets
  - Map now takes entire viewport (`absolute inset-0`)
  - All input and search panels float over map with glassmorphism effect
  - Widgets have 60% opacity with backdrop blur for better visibility

### Radius Control Enhancement
- ✅ **Added manual radius control** in `app/page.tsx:26`
  - Changed from MEC-based multiplier to absolute radius control
  - Range: 500m to 5km with 100m steps
  - Default: 1km radius
  - Compact radius slider in left panel showing "Radius: X.Xkm"
  - Real-time visual feedback on map circle

### Widget Sizing & Auto-show/hide
- ✅ **Left Panel (Add Locations)** - Adaptive behavior
  - Auto-hides when 5+ locations added (threshold increased from 3)
  - Width reduced from `w-80` to `w-72` for more map visibility
  - Padding reduced from `p-4` to `p-3` for compact design
  - Location list height increased from `max-h-48` to `max-h-80` - shows 5+ locations without scrolling
  - Removed `bottom-4` constraint to allow natural height adaptation

- ✅ **Right Panel (Search Venues)** - Compact initially, expands when needed
  - Auto-shows when `locations.length > 0`
  - Initially compact (no `bottom-4` constraint) - only shows search input
  - Expands to full height (`bottom-4`) when candidates exist
  - Width reduced from `w-96` to `w-80` matching left panel
  - Padding reduced from `p-4` to `p-3`

### Map Zoom Behavior
- ✅ **Fixed aggressive zoom on first location** in `components/MapView.tsx:72-78`
  - Single location now zooms to level 11 (city view) instead of auto-fitting (street view)
  - Multiple locations or candidates still use `fitBounds` for optimal view
  - Prevents disorienting close-up when adding first location

### Typography & Spacing
- ✅ **Reduced heading sizes** for compact widgets
  - Panel titles: `text-lg` → `text-base` (InputPanel.tsx:105, CandidatesPanel.tsx:39)
  - Section titles: `text-lg` → `text-sm` (CandidatesPanel.tsx:98)
  - More efficient use of space in floating panels

### Files Modified
- `app/page.tsx` - Full-screen layout, radius control, adaptive panels
- `components/InputPanel.tsx` - Increased location list height, reduced heading size
- `components/CandidatesPanel.tsx` - Removed padding (moved to parent), reduced heading sizes
- `components/MapView.tsx` - Fixed zoom behavior for single locations

### User Experience Improvements
- ✅ **Better map visibility**: Semi-transparent widgets show more of the map
- ✅ **Less scrolling**: Location list shows 5+ items without scrolling
- ✅ **Appropriate zoom**: First location doesn't zoom in too aggressively
- ✅ **Adaptive sizing**: Widgets grow/shrink based on content and state
- ✅ **Smooth transitions**: 300ms duration for all panel state changes
- ✅ **Cleaner design**: Compact widgets with glassmorphism effect

---

## 2025-10-14: Post-M1 Refinements & Bug Fixes

### Configuration Updates
- ✅ **Port changed to 4000**: Updated all scripts and documentation to use port 4000
  - Updated `package.json` dev and start scripts
  - Updated README.md, QUICKSTART.md, TROUBLESHOOTING.md references
- ✅ **Places Library explicit loading**: Added `libraries={['places', 'marker']}` to APIProvider in `MapView.tsx`
  - Fixes autocomplete initialization timing issues
  - Ensures Places API loads correctly before use

### Autocomplete Improvements
- ✅ **Robust initialization**: Complete rewrite of autocomplete initialization in `InputPanel.tsx`
  - Auto-retry mechanism every 100ms until Google Maps loads
  - Proper cleanup with `isCleanedUp` flag to prevent race conditions
  - Instance tracking in ref for proper cleanup
  - Loading state management with visual feedback
- ✅ **User feedback enhancements**:
  - Loading indicator: "⏳ Waiting for Google Maps to load..."
  - Success indicator: Input becomes enabled when ready
  - Console logging for debugging: "Autocomplete initialized successfully"
  - Disabled state while loading with gray background

### Error Handling Enhancements
- ✅ **Better search error messages** in `app/page.tsx`:
  - Specific error codes: `OVER_QUERY_LIMIT`, `REQUEST_DENIED`, `INVALID_REQUEST`, `ZERO_RESULTS`
  - User-friendly explanations for each error type
  - Google Maps loading check before search
  - Try-catch wrapper in search callback for robustness
- ✅ **Empty results handling**: Alert when no venues found with helpful suggestions

### Documentation Added
- ✅ **TROUBLESHOOTING.md**: Comprehensive 200+ line guide covering:
  - Autocomplete not showing solutions
  - Search error troubleshooting
  - Map loading issues
  - API key configuration steps
  - Browser console debugging
  - Common error messages and fixes
- ✅ **CHECK_API_KEY.md**: Detailed API key diagnostic guide with:
  - Step-by-step verification process
  - Google Cloud Console configuration screenshots guide
  - Console commands for testing
  - Common errors and specific fixes
  - Quick checklist for setup verification

### Files Modified
- `package.json` - Port 4000 configuration
- `components/MapView.tsx` - Places library explicit loading
- `components/InputPanel.tsx` - Robust autocomplete initialization
- `app/page.tsx` - Enhanced error handling
- `README.md` - Port 4000 updates
- `QUICKSTART.md` - Port 4000 updates
- `TROUBLESHOOTING.md` - Created comprehensive guide
- `CHECK_API_KEY.md` - Created diagnostic guide

### Current Status
- ✅ All M1 features functional
- ✅ Better error messages and user feedback
- ✅ Comprehensive troubleshooting documentation
- ✅ Running on http://localhost:4000
- ✅ Production build successful
- ⚠️  Awaiting user API key configuration for full testing

---

## 2025-10-10: Milestone 1 (M1) Completed

### ✅ M1-01: Input & Map
- Implemented smart auto-suggest search box:
  - Google Maps Autocomplete with real-time suggestions in `InputPanel.tsx`
  - Supports addresses, cities, landmarks, and businesses
  - Automatic field cleanup after selection
  - Event listener cleanup to prevent memory leaks
- Click-to-add functionality on map
- Created interactive map visualization with Google Maps JavaScript API
- Added delete functionality for all entered locations
- UI built with Tailwind CSS and responsive design
- **Note**: Removed manual lat/lng input as per user requirement - auto-suggest only

### ✅ M1-02: Center Calculation (Centroid)
- Implemented spherical centroid algorithm in `lib/algorithms.ts:30`
  - Converts lat/lng to 3D unit vectors
  - Averages vectors and normalizes back to coordinates
  - Handles edge cases (poles, 180° meridian)
- Real-time center marker (green) updates on map as locations change
- Display centroid coordinates in Analysis Info section

### ✅ M1-03: Minimum Enclosing Circle (MEC)
- Implemented Welzl's algorithm in `lib/algorithms.ts:153`
  - Expected O(n) time complexity
  - Handles degenerate cases (duplicates, collinear points, 1/2/3 points)
- Blue circle overlay visualizes MEC on map
- Circle expands by 10% (epsilon) for POI search radius
- Display circle radius in Analysis Info section

### ✅ M1-04: In-circle POI Search
- Integrated Google Maps Places Library (nearbySearch)
- Keyword-based search within expanded MEC
- Client-side de-duplication by `place_id`
- Basic filtering:
  - Minimum rating threshold (3.0)
  - Distance calculation from center
  - Open/closed status
- Search implemented in `app/page.tsx:107`

### ✅ M1-05: Candidate List & Ranking
- Comprehensive candidate display in `CandidatesPanel.tsx`:
  - Name, address, rating, user ratings count
  - Distance from center (km)
  - Opening hours status (Open Now / Closed)
- Dual sorting modes:
  - **Rating-first**: Higher rated venues prioritized
  - **Distance-first**: Closer venues prioritized
- Interactive selection:
  - Click candidate in list to highlight on map (red marker)
  - Hover effects and visual feedback
- Orange markers for all candidates, red for selected

### ✅ M1-06: Route Travel Time
- "View on Maps" button for each venue
- Deeplink to Google Maps with route planning
- Format: `https://www.google.com/maps/search/?api=1&query={lat},{lng}&query_place_id={placeId}`
- Opens in new tab for directions

### ✅ Error Handling & Graceful Degradation
- API key validation with helpful error message
- Empty state handling for all lists
- Try-catch blocks for Places API calls
- User feedback for search failures
- localStorage persistence for entered locations
- Minimum radius (100m) for single-point MEC

### Technical Implementation
- **Framework**: Next.js 15 (App Router) with TypeScript
- **Styling**: Tailwind CSS v3
- **Maps**: @vis.gl/react-google-maps (1.5.5)
- **Algorithms**: Pure TypeScript in `lib/algorithms.ts`
- **State Management**: React hooks (useState, useCallback, useEffect)
- **Data Persistence**: Browser localStorage
- **Build System**: Successfully builds and type-checks

### Files Created
```
app/
  page.tsx              # Main application with state management
  layout.tsx            # Root layout
  globals.css           # Global styles with Tailwind
components/
  MapView.tsx           # Google Maps integration
  InputPanel.tsx        # Location input controls
  CandidatesPanel.tsx   # Venue search & list
lib/
  algorithms.ts         # Centroid, MEC, distance calculations
types/
  index.ts              # TypeScript type definitions
```

### Deliverables
✅ Single-page demo (http://localhost:4000)
✅ Full flow: addresses → centroid → MEC → POI search → candidates
✅ Local session storage for persistence
✅ Production build ready (`pnpm build` successful)
✅ Comprehensive troubleshooting documentation

### Next Steps (M2)
Per `TODO.md`, next milestone focuses on:
- Server-side implementation with FastAPI
- Multi-user event creation and joining
- Real-time updates via SSE
- PostgreSQL persistence
- Redis caching

---

## 2025-10-09: Project Initialization
- Created repository structure
- Wrote META documentation (PRODUCT.md, DESIGN.md, TODO.md)
- Defined three-milestone roadmap
