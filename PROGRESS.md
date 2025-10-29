# Where2Meet - Development Progress

## Latest Session: October 28, 2025 - Text Search Implementation for Specific Venues

### 🎯 Session Summary
**Focus:** Fixed venue search to support specific place names using Google Places Text Search API

**Problem Identified:**
- When users searched for specific venues (e.g., "Elmer Holmes Bobst Library"), the Nearby Search API couldn't find them
- Venues were being filtered out by the `only_in_circle` setting when found outside the MEC circle
- Users had to manually click search button after selecting from autocomplete

**Completed:**
1. ✅ Added Google Places Text Search API integration
2. ✅ Implemented smart fallback: Nearby Search → Text Search for specific venues
3. ✅ Disabled `in_circle` filter when using Text Search (specific venues may be outside circle)
4. ✅ Added metadata to search response (`used_text_search`, `has_out_of_circle_results`)
5. ✅ Auto-trigger search when user selects from autocomplete dropdown
6. ✅ Clean venue names from autocomplete (remove address components)
7. ✅ User notification when venues found outside the meetup circle
8. ✅ Added debug logging for troubleshooting

**Key Achievements:**
- Specific venue searches now work immediately without manual refresh
- Users are informed when selected venues are outside the optimal meetup area
- Seamless UX: selecting from autocomplete triggers search automatically
- Smart heuristic detection: multi-word or capitalized queries trigger Text Search

**Technical Implementation:**
- Backend: `search_places_text()` method in `google_maps.py`
- Backend: Text Search fallback logic in `candidates.py`
- Frontend: Autocomplete improvements in `SearchSubView.tsx`
- Frontend: Toast notifications in `event/page.tsx`
- Schema: Extended `SearchAreaInfo` with text search metadata

**Files Modified:**
- `server/server/app/services/google_maps.py` - Text Search API method
- `server/server/app/api/v1/candidates.py` - Search fallback logic
- `server/server/app/schemas/event.py` - Response schema updates
- `components/LeftPanel/SearchSubView.tsx` - Autocomplete enhancements
- `lib/api.ts` - TypeScript types
- `app/event/page.tsx` - User notifications

---

## Previous Session: October 28, 2025 - Brutalist/Techno Design Applied to Auth Pages

### 🎯 Session Summary
**Focus:** Applied brutalist/techno design system to login and signup pages for consistent branding

**Completed:**
1. ✅ Login page redesign - removed gradients, added hard borders and shadows
2. ✅ Signup page redesign - matching brutalist aesthetic
3. ✅ Logo component integration on both pages
4. ✅ UPPERCASE typography for all labels and buttons
5. ✅ Black border form cards with 8px hard drop shadow
6. ✅ Solid black buttons replacing gradient buttons
7. ✅ Error states with red borders (no rounded corners)

**Key Achievements:**
- Both auth pages now match the techno/brutalist design system
- Pure black/white color palette with high contrast
- No rounded corners anywhere (border-radius: 0)
- Hard drop shadows (`shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]`)
- Bold, uppercase labels matching homepage aesthetic
- Consistent brand experience from landing → auth → app

**Design Tokens Applied:**
- Borders: `border-4 border-black` (cards), `border-2 border-black` (inputs)
- Typography: `font-bold uppercase` for all labels/buttons
- Shadows: Hard 8px offset with no blur
- Backgrounds: Pure white with solid black accents

---

## Previous Session: October 26, 2025 - Mobile Event Page Enhancement

### 🎯 Session Summary
**Focus:** Comprehensive mobile event page implementation with header buttons, radius controls, and travel mode dropdown

**Completed:**
1. ✅ Mobile header buttons (copy link, publish/unpublish)
2. ✅ Final decision banner for mobile
3. ✅ Radius controller positioning and styling (mobile vs desktop)
4. ✅ Custom techno-style travel mode dropdown
5. ✅ Map controls repositioning (instruction button, focus on circle button)
6. ✅ Venue name truncation (30 characters)
7. ✅ Mobile venue detail modal with desktop design

**Key Achievements:**
- Mobile header now matches home screen thickness (py-3)
- Copy link button with visual feedback (turns white, shows "Copied!" message)
- Publish/unpublish functionality fully working on mobile with confirmation modal
- Separate radius controller implementations for mobile (left edge, vertical) and desktop (right side, horizontal)
- Black slider track with red thumb for consistent techno/brutalist design
- Custom dropdown replaces native select for better styling control

---

### ✅ Mobile Event Page Features

#### 18. Mobile Header Enhancement
**Status:** Complete ✅

**Changes Made:**
- **Header Thickness:** Changed from `py-2` to `py-3` to match home screen
- **Border Color:** Changed from `border-black` to `border-white` for consistency
- **Copy Link Button:**
  - Direct copy functionality (no modal)
  - Visual feedback: turns white on click, returns to black after 2 seconds
  - Shows "Copied!" message below button
  - Link icon (chain link symbol)
- **Publish Button (Host only):**
  - Shows when venue selected and no final decision
  - White background with black text
  - Opens confirmation modal
  - Calls `handlePublish` → `confirmPublish` → API
- **Unpublish Button (Host only):**
  - Shows when final decision exists
  - Black background with white text
  - Calls `handleUnpublish` → API

**Files Modified:**
- `app/event/page.tsx:1920-1977` - Mobile header with buttons
- `app/event/page.tsx:120` - Added `showCopiedMessage` state
- `app/event/page.tsx:984-997` - Updated `copyJoinLink` with visual feedback

---

#### 19. Final Decision Banner (Mobile)
**Status:** Complete ✅

**Features:**
- Banner appears between header and map when decision is published
- Black header with checkmark icon and "FINAL DECISION" text
- White content area showing venue name
- Matches desktop design, adapted for mobile layout

**Implementation:**
- Position: Between mobile header and map container
- Full-width design (no absolute positioning like desktop)
- Border styling: `border-b-4 border-black`
- Auto-shows when `event.final_decision` exists

**Files Modified:**
- `app/event/page.tsx:1979-1992` - Final decision banner component

---

#### 20. Map Controls Repositioning
**Status:** Complete ✅

**Desktop Changes:**
- **Instruction Button:** Moved from `bottom-48 right-4` to `bottom-4 right-20` (left of focus on circle button)
- **Focus on Circle Button:** Remains at `bottom-4 right-4`
- Both buttons now at bottom-right corner

**Files Modified:**
- `components/Instructions.tsx:95` - Updated button positioning
- `components/MapView.tsx:633` - Focus on circle button (already correct)

---

#### 21. Radius Controller - Separate Mobile/Desktop Implementations
**Status:** Complete ✅

**Mobile Implementation:**
- **Position:** Left edge of map (`left-0 top-1/2 -translate-y-1/2`)
- **Visibility:** Only in Search/Saved tabs
- **Design:** Vertical slider with +/- buttons
- **Styling:**
  - Black slider track (`bg-black`)
  - Red slider thumb (`bg-red-600`)
  - Black text for +/- buttons
  - Border-right-2 with brutalist shadow

**Desktop Implementation:**
- **Position:** Bottom right (`right-6 bottom-6`)
- **Visibility:** Shows when joined and no candidate selected
- **Design:** Horizontal slider with +/- buttons and Reset
- **Styling:**
  - Black slider track (`bg-black`)
  - Red slider thumb (`bg-red-600`)
  - Black text for all buttons
  - Border-2 on +/- buttons

**Technical Details:**
- Two completely separate components (mobile: lines 1984-2018, desktop: 1714-1768)
- Mobile: `block lg:hidden`, Desktop: `hidden lg:block`
- Both use same `handleCircleRadiusChange` function
- Custom Tailwind classes for slider thumb styling

**Files Modified:**
- `app/event/page.tsx:1984-2018` - Mobile vertical radius slider
- `app/event/page.tsx:1658-1712` - Desktop horizontal radius slider (kept for reference)
- `app/event/page.tsx:1714-1768` - Desktop horizontal radius slider (actual implementation)

---

#### 22. Custom Travel Mode Dropdown
**Status:** Complete ✅

**Problem:** Native browser `<select>` dropdowns can't be styled with custom techno/brutalist design

**Solution:** Built custom dropdown component with full styling control

**Features:**
- Button shows current mode with icon and label
- Dropdown menu appears on click
- Options shown as buttons (not native options)
- Selected option has black background with white text
- Unselected options have white background with black text
- Icons change color based on selection state
- Clicks outside close the dropdown
- Arrow icon rotates when open

**Implementation:**
- State: `showTravelModeDropdown` (boolean)
- Ref: `dropdownRef` for click-outside detection
- Helper functions: `getCurrentTravelMode()`, `getTravelModeIcon()`, `getTravelModeLabel()`
- Icons: Car, PersonStanding, Train, Bike from lucide-react
- Dropdown position: `absolute bottom-full` (appears above button)

**Files Modified:**
- `components/MapView.tsx:72-73` - State and ref
- `components/MapView.tsx:600-626` - Helper functions
- `components/MapView.tsx:628-643` - Click outside handler
- `components/MapView.tsx:706-750` - Custom dropdown UI
- `components/MapView.tsx:608-614` - Icon function with black text

**Styling:**
- Border: `border-2 border-black`
- Shadow: `shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`
- Selected: `bg-black text-white`
- Unselected: `bg-white text-black hover:bg-gray-100`

---

#### 23. Venue Name Truncation
**Status:** Complete ✅

**Problem:** Long restaurant names causing layout overflow

**Solution:** Manual character limit with ellipsis

**Implementation:**
- Character limit: 30 characters
- Applied to both Search and Saved tabs
- Ternary operator: `{candidate.name.length > 30 ? ${candidate.name.substring(0, 30)}... : candidate.name}`

**Files Modified:**
- `app/event/page.tsx:2180` - Search tab venue cards
- `app/event/page.tsx:2301` - Saved tab venue cards

---

#### 24. Mobile Venue Detail Modal
**Status:** Complete ✅

**Features:**
- Uses desktop venue detail design
- Rating and vote button on same line (rating left, vote right)
- About section (collapsible, editorial summary)
- Hours section (collapsible, opening hours)
- Google Map button at bottom
- Heart icon for voting (matches desktop)

**Layout:**
1. Header with photo and close button
2. Rating/Distance + Vote button
3. Address
4. About (collapsible with info icon)
5. Hours (collapsible with clock icon)
6. Google Map button

**Files Modified:**
- `app/event/page.tsx:2618-2730` - Mobile venue detail modal

---

### 🔧 Technical Improvements

**State Management:**
- Added `showCopiedMessage` for copy link visual feedback
- Separate mobile and desktop radius controllers with independent positioning
- Custom dropdown state with click-outside detection

**Component Architecture:**
- Fully separated mobile and desktop radius implementations
- Custom dropdown component replacing native select
- Reusable helper functions for travel mode management

**Styling:**
- Consistent techno/brutalist design across all new components
- Black borders, white/black contrast, brutalist shadows
- Red accent color for slider thumbs
- Proper z-index layering for dropdowns and modals

---

## Previous Session: October 24, 2025 - Typography & UX Improvements

### 🎯 Session Summary
**Focus:** Enhanced typography with Afacad Flux font and significantly improved readability across the entire application

**Completed:**
1. ✅ Changed entire application font to Afacad Flux (variable font)
2. ✅ Increased all font sizes significantly for better readability
3. ✅ Replaced browser's default `confirm()` dialog with custom brutalist-styled modal
4. ✅ Implemented automatic address snapping to nearest valid building/address
5. ✅ Backend geocoding enhancement to prevent water locations

**Key Achievements:**
- Modern variable font (Afacad Flux) with full weight support (100-900)
- All text sizes increased by 4-8px for dramatically improved readability
- Beautiful location confirmation modal with address snapping to real buildings

---

## Session: October 24, 2025 - Location Selection Modal & Typography

### ✅ Typography Overhaul

#### 16. Afacad Flux Font Implementation
**Status:** Complete ✅

**Changes Made:**
- Replaced Arial with Afacad Flux across entire application
- Imported via Next.js font optimization for performance
- All weights available (100-900) for design flexibility
- CSS variable `--font-afacad-flux` for consistent usage

**Files Modified:**
- `app/layout.tsx` - Added font import and configuration
- `app/globals.css` - Updated body and autocomplete font family
- `tailwind.config.ts` - Extended Tailwind font family

---

#### 17. Global Font Size Increase
**Status:** Complete ✅

**Font Size Changes (All Increased Significantly):**
- `text-xs`: 12px → **16px** (+4px)
- `text-sm`: 14px → **18px** (+4px)
- `text-base`: 16px → **20px** (+4px, default body text)
- `text-lg`: 18px → **24px** (+6px)
- `text-xl`: 20px → **28px** (+8px)
- `text-2xl`: 24px → **32px** (+8px)
- `text-3xl`: 30px → **40px** (+10px)
- All larger sizes scaled proportionally

**Additional Updates:**
- Toast notifications: 14px → **20px**
- Google Places autocomplete: 14px → **20px**
- Increased padding for better spacing

**Files Modified:**
- `tailwind.config.ts` - Completely replaced fontSize scale
- `app/event/page.tsx` - Updated toast notification size
- `app/globals.css` - Updated autocomplete dropdown size

**Impact:**
✅ Dramatically improved readability across all screens
✅ Afacad Flux renders beautifully at larger sizes
✅ Better accessibility for users
✅ Maintains brutalist aesthetic with bold, clear typography
✅ Consistent scaling across all text sizes

---

## Session: October 24, 2025 (Continued)

### ✅ Completed Features

#### 1. Per-Participant Visibility Control
**Status:** Frontend Complete (Backend Integration Pending)

**Changes Made:**
- Added `visibility` field to `Participant` interface and `AddParticipantRequest` (`lib/api.ts`)
- Deprecated event-level visibility - host no longer controls everyone's privacy
- Each participant now controls their own location visibility independently

**Implementation Details:**
- Visibility toggle available when joining event
- Visibility can be updated anytime after joining
- Two modes: `'blur'` (fuzzy ~500m) or `'show'` (exact location)
- Host is just another participant with no special visibility privileges

**Files Modified:**
- `lib/api.ts` - Added visibility to Participant and AddParticipantRequest interfaces
- `components/LeftPanel/InputSection.tsx` - Blur toggle functionality
- `app/event/page.tsx` - Handle visibility in join/update flows
- `components/LeftPanel/LeftPanel.tsx` - Updated props
- `app/page.tsx` - Removed event-level visibility from event creation

---

#### 2. UI/UX Improvements

**A. Address Input Enhancement**
- Address input now shows human-readable addresses instead of coordinates
- Separate state for coordinates and display address
- "Current Location" shows as text, not coordinates
- Proper initialization when editing existing location

**Files Modified:**
- `components/LeftPanel/InputSection.tsx` - Added coordinates state, improved address handling

**B. Participant List Two-Line Layout**
- Line 1: Name, blur indicator, remove button
- Line 2: Address or coordinates (toggleable)
- Address filtering: Removes "USA" and postal codes for cleaner display
- Added "Addr" toggle button to show/hide addresses

**Files Modified:**
- `components/LeftPanel/ParticipationSection.tsx` - Two-line cards, address filtering, toggle functionality

**C. Consistent Section Headers**
- All three sections (Input, Venues, Participants) now have matching UI patterns
- Chevron on far left, icon, title, action buttons on right
- Consistent collapse/expand behavior
- Visual hierarchy aligned across all sections

**Files Modified:**
- `components/LeftPanel/InputSection.tsx` - Updated header design
- `components/LeftPanel/VenuesSection.tsx` - Made section collapsible
- `components/LeftPanel/ParticipationSection.tsx` - Updated header alignment

---

#### 3. Auto-Collapse & Overflow Prevention

**Features:**
- Participants section auto-collapses when it would extend beyond screen bottom
- Checks on mount, resize, and when participant count changes
- Prevents UI overflow on smaller screens

**Files Modified:**
- `components/LeftPanel/ParticipationSection.tsx` - Added overflow detection with useEffect

---

#### 4. Circle Recalculation System

**Features:**
- Circle now properly updates when participants join/leave/move
- 2-second debounce delay prevents excessive recalculations
- Clears authoritative circle (from search) when participant locations change
- Uses actual coordinates (not fuzzy) for accurate meeting point calculation

**Implementation:**
- Debounced useEffect with 2-second timeout
- Auto-cancellation if locations change before timeout
- Comprehensive logging for debugging

**Files Modified:**
- `app/event/page.tsx` - Added debounce logic, clear authoritativeCircle on participant changes
- Uses actual `lat/lng` instead of fuzzy coordinates for circle calculation

---

### 🔧 Technical Improvements

**Data Flow Enhancements:**
- Changed InputSection to receive full `Participant` object instead of separate strings
- Proper initialization of form state from participant data
- Address now fetched via reverse geocoding on updates (not just joins)

**State Management:**
- Separate `coordinates` state for lat/lng storage
- Better handling of visibility state initialization
- Proper cleanup in useEffect hooks

**Debugging:**
- Added comprehensive console logging for circle updates
- Track participant visibility field
- Monitor location updates and recalculation triggers

---

### 🚧 Pending Backend Integration

**Required Backend Changes:**
1. Accept `visibility` field in participant creation/update endpoints
2. Store `visibility` in database
3. Return `visibility` field in participant response
4. Generate `fuzzy_lat/fuzzy_lng` based on visibility setting
5. Handle address field in update endpoint

---

### 📝 Code Quality

**Best Practices Applied:**
- Consistent TypeScript interfaces
- Proper React hooks usage (useEffect, useCallback, useState)
- Component prop cleanup and type safety
- Debouncing for performance optimization
- Comments explaining complex logic

---

#### 5. Manual Participant Addition (Host Feature)
**Status:** Complete ✅

**Features:**
- Host can now add other participants manually (not just update their own location)
- Toggle UI to switch between "Update Myself" and "Add Others" modes
- Form auto-clears after successfully adding a participant
- Dynamic button text (ADD/UPDATE/JOIN) based on current mode
- Matches venue toggle design (full-width, brutalist style)

**Implementation Details:**
- Two-button toggle with black/white contrast
- "Update Myself" mode: shows current data, updates host's location
- "Add Others" mode: fresh form with random name, adds new participants
- Reuses existing backend `addParticipant` endpoint

**Files Modified:**
- `components/LeftPanel/InputSection.tsx` - Added mode toggle, form reset logic, dynamic button text

---

#### 6. Address Display & Geocoding
**Status:** Complete ✅

**Backend:**
- Address field added to participants table via migration (`23ac77adfd6c`)
- Reverse geocoding endpoint implemented (`/geocode/reverse`)
- Address stored when privacy mode is OFF
- Geocoding service with water detection and snap-to-land features

**Frontend:**
- Addresses display automatically when `visibility = 'show'`
- Shows formatted address (removes "USA" and postal codes)
- Falls back to coordinates when privacy is ON or no address available
- Toggle button to show/hide addresses in participant list

**Files Modified:**
- `server/app/models/event.py` - Address field in Participant model (line 54)
- `server/app/api/v1/participants.py` - Reverse geocoding endpoint
- `server/app/services/google_maps.py` - Geocoding service
- `components/LeftPanel/ParticipationSection.tsx` - Address display logic (lines 215-227)
- `components/LeftPanel/InputSection.tsx` - Address fetching on join/update

---

#### 7. Animated Route Icons
**Status:** Complete ✅ (Major Feature!)

**Features:**
- Smooth animated icons moving along routes (car, bike, walk, transit)
- SVG icons with detailed paths for each travel mode
- Icons move at constant speed (0.1% per frame) regardless of zoom level
- Blue-grey route line (#4B5563) for better icon visibility

**Technical Implementation:**
- **Custom Polyline Approach:** DirectionsRenderer doesn't support animated offsets
- Created separate `google.maps.Polyline` overlay with invisible stroke
- Animation loop using `requestAnimationFrame` (60fps)
- Updates polyline's icon offset directly: `polyline.set('icons', icons)`
- Icons repeat every 150px along the route path

**SVG Icons Created:**
- 🚗 DRIVING: Detailed car icon with wheels
- 🚴 BICYCLING: Bicycle with rider
- 🚶 WALKING: Person walking
- 🚊 TRANSIT: Train/bus vehicle

**Files Modified:**
- `components/MapView.tsx` - Added:
  - `animatedPolylineRef` for separate polyline (line 71)
  - `getAnimatedIcon()` function with SVG paths (lines 94-136)
  - Animation loop updating polyline offset (lines 172-213)
  - Polyline creation in route callback (lines 256-280)
  - Route color changed to blue-grey for visibility (line 149)

**Performance:**
- Smooth 60fps animation
- Cleanup on route change/unmount
- No memory leaks with proper ref cleanup

---

#### 8. UI Design Improvements

**Venue Section:**
- Removed divider between header and sub-view toggles for cleaner look

**Route Visualization:**
- Changed from black to blue-grey (#4B5563) for better contrast
- Chart mode uses lighter grey (#9CA3AF)
- Icons have white stroke for visibility against any background

---

### 🔧 Technical Achievements

**Google Maps API Mastery:**
- Overcame DirectionsRenderer limitations
- Implemented custom Polyline animation
- Proper cleanup and memory management
- Animation frame optimization

**Animation Techniques:**
- RequestAnimationFrame for smooth 60fps
- Percentage-based offsets (zoom-independent)
- Proper state management with refs
- Cleanup on unmount/dependency changes

---

#### 9. Collapsible Travel Chart
**Status:** Complete ✅

**Features:**
- Travel Analysis section in venue detail card is now collapsible
- ChevronUp/ChevronDown icons indicate expand/collapse state
- Default state: expanded to show travel data immediately
- Matches design pattern of other collapsible sections

**Implementation:**
- Added `isTravelChartExpanded` state variable
- Toggle button with chevron icons
- Conditional rendering of chart content
- Mode selector only shows when expanded

**Files Modified:**
- `app/event/page.tsx` - Lines 1300-1340 (collapsible functionality with header button)

---

#### 10. Custom Publish Confirmation Modal
**Status:** Complete ✅

**Features:**
- Replaced browser's default `confirm()` with custom brutalist-styled modal
- Shows venue name in confirmation message
- Warning about irreversible action
- Two-button layout: Cancel (white) and Publish (black)

**Design:**
- Black/white high contrast brutalist theme
- 4px borders with 8px shadow offset
- Full-width button layout with gap
- Black header bar with white text
- Modal overlay with semi-transparent black background

**Implementation:**
- Split `handlePublish` into modal trigger and `confirmPublish` functions
- Added `showPublishConfirm` state
- Custom modal with proper z-index layering

**Files Modified:**
- `app/event/page.tsx` - Lines 755-776 (split publish logic), Lines 1420-1456 (modal UI)

---

#### 11. Voting UI on Venue Detail Card
**Status:** Complete ✅

**Features:**
- Heart icon voting button in venue detail card
- Inline with rating and distance (justify-between layout)
- Vote count displayed next to heart icon
- Filled heart when voted, outline when not voted

**Design Evolution:**
- Started with thumbs-up icon (too large)
- Changed to heart in separate box (too complex)
- Final: Simple heart + count inline with rating/distance
- Matches existing vote UI in venue list view

**Implementation:**
- Heart icon size: w-5 h-5
- Filled black when voted, neutral-400 outline when not
- Click handler reuses existing `handleVote` function
- Vote count from `selectedCandidate.voteCount`

**Files Modified:**
- `app/event/page.tsx` - Lines 1217-1232 (voting UI in venue detail card)

---

#### 12. Venue Editorial Summary (About Section)
**Status:** Complete ✅

**Features:**
- Displays Google Places editorial summary in venue detail card
- Collapsible "About" section with ChevronUp/ChevronDown icons
- Auto-fetches when venue is selected
- Only shows when editorial summary is available
- Default state: expanded

**Backend Implementation:**
- Updated Google Places API integration to fetch `editorial_summary` field
- New endpoint: `GET /events/{event_id}/candidates/{candidate_id}/details`
- Returns editorial summary and opening hours
- Extracts `overview` text from editorial_summary object

**Frontend Implementation:**
- Added `candidateEditorialSummary` and `isAboutExpanded` state
- useEffect to fetch details when candidate is selected
- Collapsible UI section with consistent styling
- Text styling: text-xs with leading-relaxed for readability

**Placement:**
- Between address and Google Map button
- Logical information flow: Address → About → Actions → Travel Chart

**Files Modified:**
- `server/app/services/google_maps.py:179-221` - Added editorial_summary to fields
- `server/app/api/v1/candidates.py:564-596` - New details endpoint
- `lib/api.ts:368-372` - getCandidateDetails() API method
- `app/event/page.tsx:108-109` - State variables
- `app/event/page.tsx:400-420` - Fetch effect
- `app/event/page.tsx:1266-1286` - About section UI

---

#### 13. Google Map Button Redesign
**Status:** Complete ✅

**Changes:**
- Moved button from above About section to below it
- Changed text from "Open in Google Maps" to "GOOGLE MAP"
- Added map pin icon on the left side of text
- Updated layout to flex with icon + text

**Design:**
- SVG map pin icon (w-4 h-4)
- Icon positioned left of text with gap-2
- Maintains brutalist button style (black bg, white text, thick borders)
- Hover state inverts colors

**Files Modified:**
- `app/event/page.tsx:1288-1299` - Repositioned and redesigned button

---

#### 14. Travel Analysis Restructure & Opening Hours Display
**Status:** Complete ✅

**Major Changes:**

**A. Travel Analysis Moved to Separate View**
- Removed travel chart from inline venue detail card
- Added chart button (bar chart icon) next to vote button in top-right
- Travel analysis now appears as independent floating panel when toggled
- Auto-closes when switching venues
- Button shows active state (black bg) when chart is visible

**B. Opening Hours Section (Replaced Travel Analysis)**
- Opening hours now displayed in collapsible section where travel chart was
- Fetches `opening_hours` data from Google Places API `/details` endpoint
- Shows `weekday_text` array (e.g., "Monday: 9:00 AM – 5:00 PM")
- Collapsible with ChevronUp/ChevronDown icons
- Clock icon added for visual identification
- Default state: expanded

**C. Travel Analysis Floating Panel**
- Brutalist design: white bg, black border-4, 8px shadow
- Black header bar with "TRAVEL ANALYSIS" title
- Close button (X icon) in header
- Transportation mode selector (DRIVING/TRANSIT/WALKING/BICYCLING)
- TravelChart component displays participant travel data
- Positioned at `top-16 right-6` below venue detail card
- z-index: 30 (above detail card)

**D. Section Icons Added**
- About section: Info icon (circle with 'i')
- Hours section: Clock icon
- Icons positioned between chevron and section title
- Size: w-4 h-4, strokeWidth 2

**E. Information Flow Reorganization**
New order in venue detail card:
1. Header (photo, close button)
2. Rating/Distance + Chart/Vote buttons
3. Address
4. About (editorial summary - collapsible, info icon)
5. Hours (opening hours - collapsible, clock icon)
6. Google Map button (moved to bottom)

**Technical Implementation:**
- State changes:
  - Removed: `isTravelChartExpanded`
  - Added: `showTravelChart` (boolean for panel visibility)
  - Added: `candidateOpeningHours` (stores opening hours data)
  - Added: `isHoursExpanded` (boolean for hours section)
  - Kept: `isAboutExpanded` (boolean for about section)
- useEffect updates opening_hours and editorial_summary together
- Auto-closes travel chart when changing venues

**Files Modified:**
- `app/event/page.tsx:106-111` - State variables
- `app/event/page.tsx:401-425` - Fetch effect for details
- `app/event/page.tsx:1247-1279` - Chart button added to header
- `app/event/page.tsx:1290-1340` - About and Hours sections with icons
- `app/event/page.tsx:1351-1416` - Separate travel analysis floating panel

**Benefits:**
✅ Cleaner venue detail card (no data overload)
✅ Opening hours in prominent, expected location
✅ Travel analysis available on-demand
✅ Better screen space utilization
✅ Visual icons improve section recognition

---

---

#### 15. Custom Location Selection Modal with Address Snapping
**Status:** Complete ✅

**Features:**
- Replaced browser's default `confirm()` dialog with custom brutalist-styled modal
- Automatic address snapping to nearest valid building/address
- Shows human-readable address instead of raw coordinates when available
- Consistent design with existing modals (publish confirmation)

**Backend Implementation:**
- Enhanced reverse geocoding endpoint to snap to nearest valid address
- Uses `find_nearest_land_point()` to locate nearest establishment within 5km
- Checks if location is water/unaddressable via `is_water_location()`
- Returns snapped coordinates and address for better UX
- Falls back to raw coordinates if no valid address found

**Frontend Implementation:**
- Custom modal with black header bar and white content area
- 4px borders with 8px shadow (brutalist design)
- Two-button layout: Cancel (white) and Confirm (black)
- Shows address prominently when available, coordinates as fallback
- Clicking map triggers geocoding API call before showing modal
- Modal state managed with `showLocationConfirm` and `clickedLocation`

**Technical Details:**
- Modal appears on map click (when user has no participant ID yet)
- Backend snaps coordinates if clicking on water or non-addressable location
- Frontend receives updated lat/lng from backend if snapping occurred
- Address displayed in modal for user confirmation
- Console logging for debugging snap operations

**Files Modified:**
- `app/event/page.tsx:112-113` - Added modal state variables
- `app/event/page.tsx:560-607` - Updated handleMapClick with geocoding
- `app/event/page.tsx:610-643` - Added confirmLocationSelection callback
- `app/event/page.tsx:1611-1654` - Location confirmation modal UI
- `server/app/api/v1/participants.py:246-301` - Enhanced reverse geocoding with snapping

**Benefits:**
✅ Consistent brutalist design across all modals
✅ Better UX with real addresses instead of coordinates
✅ Prevents users from setting location in water
✅ Snaps to nearest valid building automatically
✅ Clear confirmation UI before adding location

---

## Next Steps

Remaining TODO items:
1. ~~Opening hours display~~ ✅ COMPLETE
2. ~~Location selection modal styling~~ ✅ COMPLETE
3. ~~Address snapping functionality~~ ✅ COMPLETE
4. Vertical layout design for mobile
5. Tailwind breakpoints implementation
6. Mobile device testing
7. Add celebration effect after publishing
8. Test opacity/backdrop-blur visual effect (optional)
