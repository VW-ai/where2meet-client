# Where2Meet - Complete Product & Interaction Documentation

**Version**: 0.1 → 0.2 (Redesign)
**Last Updated**: 2025-10-21
**Purpose**: Comprehensive reference for product redesign - every feature, interaction, and user flow documented in detail

---

## 🔄 **KEY DESIGN CHANGES FOR REDESIGN**

### **1. Host Can Vote** ✅
- **OLD**: Host cannot vote (artificial constraint)
- **NEW**: Host can vote like any other participant
- **Reason**: Why restrict? Host has preferences too

### **2. No "Publish Decision" Feature** ✅
- **OLD**: Host manually publishes final decision → Locks voting → Green banner
- **NEW**: Winner automatically determined by votes
  - Display: "Top Choice: Joe's Pizza (3 votes)"
  - No manual publish button
  - No locking mechanism
- **Reason**: Voting IS the decision - no ceremony needed

### **3. Anonymous Name Generation** ✅
- **OLD**: Force user to enter nickname in modal before adding location
- **NEW**: Auto-generate unique anonymous names
  - Examples: `brave_tiger`, `swift_wolf`, `clever_eagle`
  - Algorithm ensures uniqueness within event
  - User can edit inline (optional)
- **Reason**: Removes friction - let users add location instantly

### **4. Frictionless Keyword: Remove Unnecessary Steps**
- Every interaction reviewed to eliminate clicks, dialogs, decisions
- See [FRICTION_ANALYSIS.md](./FRICTION_ANALYSIS.md) for complete redesign

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [User Roles & Permissions](#2-user-roles--permissions)
3. [Complete Feature Inventory](#3-complete-feature-inventory)
4. [Detailed Interaction Catalog](#4-detailed-interaction-catalog)
5. [Complete User Flows](#5-complete-user-flows)
6. [UI Components Breakdown](#6-ui-components-breakdown)
7. [Data Model & State Management](#7-data-model--state-management)
8. [API Integration Points](#8-api-integration-points)

---

## 1. Product Overview

### 1.1 What is Where2Meet?

**Where2Meet** is a collaborative web application that helps groups decide on optimal meeting locations by:
- Collecting participant locations anonymously
- Computing geometric center points
- Discovering nearby venues (restaurants, parks, etc.)
- Enabling democratic voting on venue choices
- Visualizing routes with multiple transportation modes

### 1.2 Core Value Proposition

**Problem Solved**: When planning group meetups, deciding "where to meet" is difficult because:
- Everyone is coming from different locations
- Manual discussion is inefficient
- Hard to find places convenient for everyone
- No easy way to visualize travel times

**Solution**: Where2Meet automates this by:
- Collecting everyone's location in one place
- Finding venues equidistant from all participants
- Showing routes and travel times for everyone
- Enabling group voting on final choice

### 1.3 Target Users

1. **Social Groups**: Friends planning dinners, outings
2. **Teams**: Colleagues planning team lunches, happy hours
3. **Event Organizers**: Meetup groups, sports teams
4. **Families**: Planning family gatherings

### 1.4 Key Differentiators

- **Real-time collaboration** via SSE (not polling)
- **Privacy-aware** location sharing with fuzzing
- **No app install required** (web-based)
- **Anonymous participation** (no signup needed)
- **Mobile-responsive** interface

---

## 2. User Roles & Permissions

### 2.1 Host (Event Organizer)

**Capabilities:**
- ✅ Create events
- ✅ Share join links
- ✅ View all participant locations
- ✅ Add multiple locations
- ✅ **Vote on venues (like any participant)**
- ✅ Remove any participant
- ✅ Search for venues
- ✅ Remove any venue
- ✅ Adjust search center point (drag centroid)
- ✅ Adjust search radius multiplier
- ✅ View routes from any participant
- ✅ Change event settings (privacy, voting)
- ✅ Delete event

**Constraints:**
- Cannot edit participant nicknames (only remove)

**DESIGN CHANGE:** Host can now vote - removed the artificial constraint

### 2.2 Participant (Guest)

**Capabilities:**
- ✅ Join via link (no signup)
- ✅ Add own location (once)
- ✅ Update own location
- ✅ View all participants (respecting privacy settings)
- ✅ View venue search results
- ✅ Vote on venues (if voting enabled)
- ✅ View routes from own location
- ✅ Add venues manually (via Custom Add)
- ✅ Save search results to Added list

**Constraints:**
- Cannot add multiple locations
- Cannot remove other participants
- Cannot change event settings
- Cannot publish final decision
- Cannot view routes from other participants

### 2.3 Anonymous User (Not Logged In)

**Same as Participant + Host**, with:
- Events stored in browser localStorage
- No persistent cross-device access
- Option to sign up to save event history

---

## 3. Complete Feature Inventory

### 3.1 Event Management

| Feature | Description | Who Can Use |
|---------|-------------|-------------|
| **Create Event** | Initialize new event with title, category, settings | Anyone |
| **Join Event** | Access event via shareable link | Anyone with link |
| **Share Link** | Generate and copy join URL with JWT token | Host |
| **Update Settings** | Change privacy mode, voting toggle | Host |
| **Delete Event** | Soft/hard delete event | Host |
| **Set Deadline** | Auto-lock voting at specific time | Host (backend ready, UI pending) |

### 3.2 Location Management

| Feature | Description | Interaction Details |
|---------|-------------|---------------------|
| **Add Location via Search** | Google Autocomplete address lookup | Type → dropdown → select → coordinates auto-fill |
| **Add Location via Map Click** | Click map to add coordinates | Click → confirm dialog → nickname prompt → submit |
| **View User Location** | Browser geolocation request | One-time prompt → center map on location |
| **Edit Location** | Update participant coordinates | Host only, via location list |
| **Remove Location** | Delete participant | Host only, confirmation dialog |
| **Location Privacy** | Fuzzy coordinates display (~500m offset) | Host toggles visibility mode |

### 3.3 Geometric Calculations

| Feature | Algorithm | Visual Representation |
|---------|-----------|----------------------|
| **Centroid** | Spherical centroid (3D vector averaging) | Purple marker with crosshair icon |
| **MEC (Minimum Enclosing Circle)** | Welzl's algorithm (O(n) expected) | Blue circle overlay |
| **Custom Center** | Host-draggable centroid | Purple marker becomes draggable |
| **Distance Calculation** | Haversine formula (great-circle distance) | Shown in km on venue cards |

### 3.4 Venue Discovery

| Feature | Description | User Interaction |
|---------|-------------|------------------|
| **Keyword Search** | Google Places API search within MEC | Type keyword → click Search → results appear |
| **Radius Multiplier** | 1.0x - 2.0x search area expansion | Drag slider → circle preview updates |
| **Only In Circle Filter** | Show venues inside MEC only | Toggle checkbox → results filter |
| **Land Snapping** | Adjust center if in water | Automatic → toast notification |
| **Manual Venue Add** | Custom place search | Type venue name → autocomplete → select → added |
| **Save to Added** | Move search result to saved list | Click "Save" button on venue card |
| **Remove from Added** | Unsave venue from list | Click "Remove" button (host only) |

### 3.5 Venue Display & Sorting

| Feature | Description | Options |
|---------|-------------|---------|
| **Sort by Rating** | Highest rated venues first | Google ratings 1-5 stars |
| **Sort by Distance** | Closest venues first | Distance from centroid in km |
| **Sort by Votes** | Most voted venues first | Vote count descending |
| **Tabbed Organization** | 3 tabs for venue lists | Search, Custom Add, Added |

### 3.6 Voting System

| Feature | Mechanics | Constraints |
|---------|-----------|-------------|
| **Cast Vote** | One vote per venue per participant | Database unique constraint |
| **Vote Count** | Real-time aggregation | Shown as "🗳️ X" badge |
| **Vote Visibility** | Public to all participants | No anonymous voting |
| **Vote Removal** | API supports, UI pending | Backend only currently |

### 3.7 Route Visualization

| Feature | Details | User Control |
|---------|---------|--------------|
| **Route Calculation** | Google Directions API | Auto-triggers on venue selection |
| **Transportation Modes** | 4 modes: Drive, Walk, Transit, Bike | Click icon to switch |
| **Route Display** | Blue polyline on map (6px, 100% opacity) | Auto-updates on mode change |
| **Travel Info** | Distance (km) + Duration (min) | Shown in bottom route panel |
| **View on Maps** | External link to Google Maps | Opens directions in new tab |
| **Route From** | Host can select any participant | Dropdown in left panel |

### 3.8 Real-time Collaboration (SSE)

| Event Type | Trigger | Effect on All Clients |
|------------|---------|----------------------|
| `participant_joined` | New participant adds location | Toast notification, reload participants |
| `participant_updated` | Location edited | Reload event data |
| `candidate_added` | Venue discovered via search | Reload candidates |
| `candidate_saved` | Venue moved to Added | Reload candidates |
| `candidate_unsaved` | Venue removed from Added | Reload candidates |
| `vote_cast` | Participant votes | Update vote counts |
| `event_updated` | Settings or center changed | Reload event, update map |
| `event_published` | Final decision set | Green banner, disable voting |

### 3.9 UI/UX Features

| Feature | Description | Behavior |
|---------|-------------|----------|
| **Language Switcher** | EN / 中文 toggle | Flag dropdown, instant switch |
| **Toast Notifications** | Contextual messages | 3-4 sec auto-dismiss, color-coded |
| **Loading States** | Animated indicators | Spinner on search, pulsing logo on load |
| **Empty States** | Helpful prompts | "No locations yet" with icon + message |
| **Error Handling** | User-friendly errors | Toast + specific message |
| **Instructions** | Contextual help | "?" button, toggleable panel |
| **Responsive Layout** | Mobile-adaptive | Floating panels, max-width constraints |

---

## 4. Detailed Interaction Catalog

This section documents EVERY single user interaction in exhaustive detail.

---

### 4.1 Homepage - Event Creation

#### **Interaction 4.1.1: Event Title Input**

**Trigger**: User clicks into "Event Title" text field

**Visual Feedback**:
- Input border: gray → blue (focus ring appears)
- Border: `border-gray-300` → `focus:ring-2 focus:ring-blue-500`
- Cursor appears in field

**Input Mechanics**:
- User types characters
- No auto-complete
- No character limit enforced in UI (backend may have)
- Placeholder text: "e.g., Team Lunch Friday"
- Text color: `text-black` (Tailwind)

**Validation**:
- ✅ Valid: Any non-empty trimmed string
- ❌ Invalid: Empty or whitespace-only
- Validation trigger: On "Create Event" button click

**Error States**:
- If empty → Red alert box appears above button
- Message: "Please enter an event title"
- Border remains gray (no red border on input itself)

**Success States**:
- Valid input → No visual change to input
- Success occurs when event created successfully

**Example Flow**:
```
1. User clicks input → blue focus ring
2. Types "Team Lunch" → characters appear
3. Clicks Create Event → validation passes
4. Event created → redirect to event page
```

---

#### **Interaction 4.1.2: Category Dropdown**

**Trigger**: User clicks on category `<select>` dropdown

**Visual Feedback**:
- Dropdown expands, showing all options
- Native OS dropdown UI (browser default)
- Selected option highlighted

**Options**:
1. Restaurant (default selected)
2. Cafe
3. Bar
4. Park
5. Basketball Court
6. Gym
7. Library
8. Movie Theater

**Input Mechanics**:
- Click to expand
- Click option to select
- Keyboard: Arrow keys to navigate, Enter to select
- Selected value shown in collapsed state

**Validation**:
- Always valid (pre-selected default: "restaurant")
- Cannot be empty

**Visual States**:
- Default: White background, gray border
- Focus: Blue ring
- Selected: Option text displayed

**Backend Impact**:
- Category becomes default keyword for venue search
- Stored in `event.category` field

**Example Flow**:
```
1. Click dropdown → expands
2. See "Cafe" option
3. Click "Cafe" → dropdown closes, "Cafe" shown
4. Create event → category = "cafe"
5. On event page → keyword pre-filled with "cafe"
```

---

#### **Interaction 4.1.3: Privacy Toggle (Blur Locations)**

**Trigger**: User clicks checkbox next to "Blur participant locations"

**Visual Feedback**:
- Checkbox: unchecked ☐ ↔️ checked ☑️
- Checkmark appears/disappears
- Blue accent color when checked

**States**:
- Default: ☑️ Checked (blur enabled)
- Unchecked: Exact coordinates shown

**Input Mechanics**:
- Click anywhere on label or checkbox to toggle
- Keyboard: Space to toggle when focused

**Backend Impact**:
- Checked: `visibility: "blur"`
  - Participants see fuzzy coordinates (~500m random offset)
  - Backend stores both exact + fuzzy coordinates
  - Map displays fuzzy markers
- Unchecked: `visibility: "show"`
  - Exact coordinates displayed
  - No fuzzing applied

**Visual on Event Page**:
- Blur mode: Blue participant markers at offset positions
- Show mode: Blue markers at exact positions

**Example Flow**:
```
1. Default: ☑️ Blur enabled
2. User unchecks → ☐ exact coordinates will show
3. Creates event with visibility: "show"
4. Participants join → see exact locations on map
```

---

#### **Interaction 4.1.4: Voting Toggle**

**Trigger**: User clicks "Allow voting" checkbox

**Visual Feedback**:
- Checkbox toggles ☐ ↔️ ☑️
- Same visual style as privacy toggle

**States**:
- Default: ☑️ Checked (voting enabled)
- Unchecked: Voting disabled

**Backend Impact**:
- Checked: `allow_vote: true`
  - "Vote" buttons appear on venue cards
  - Vote counts displayed
  - "Votes" sorting mode enabled
- Unchecked: `allow_vote: false`
  - No vote buttons
  - Vote counts hidden
  - "Votes" sort mode hidden

**Can Be Changed Later**:
- Host can toggle during event via Settings (future UI)
- Currently: Set once at creation

**Example Flow**:
```
1. Default: ☑️ Voting enabled
2. User unchecks → voting will be disabled
3. Creates event
4. Participants see venue list but NO vote buttons
```

---

#### **Interaction 4.1.5: Create Event Button**

**Trigger**: User clicks "Create Event" button

**Visual Feedback - Normal State**:
- Large button, full width
- Gradient background: `bg-gradient-to-r from-blue-600 to-green-600`
- White text, bold
- Shadow: `shadow-lg`
- Hover: Gradient darkens (`hover:from-blue-700 hover:to-green-700`)
- Cursor: `cursor-pointer`

**Visual Feedback - Loading State**:
- Text changes: "Create Event" → "Creating Event..."
- Button disabled
- Opacity: 50%
- Cursor: `cursor-not-allowed`
- No gradient animation (could be added)

**Validation Checks**:
1. Title is non-empty (trimmed)
2. If empty → Show error alert

**Success Flow**:
```
1. Click button
2. Button enters loading state
3. API call: POST /api/v1/events
4. Response received:
   - event: { id, title, category, ... }
   - join_token: "eyJ..."
   - join_link: "https://..."
5. Store in sessionStorage:
   - eventId
   - role: "host"
   - joinToken
6. Store in localStorage (if anonymous):
   - my_events array
7. Navigate to: /event?id={eventId}
```

**Error Flow**:
```
1. Click button → loading state
2. API error (network, 500, etc.)
3. Catch error
4. Show toast: "Failed to create event"
5. Button returns to normal state
6. User can retry
```

**Example**:
```
User inputs:
  Title: "Weekend Brunch"
  Category: "Cafe"
  Privacy: ☑️ Blur
  Voting: ☑️ Allow

Click "Create Event" →
  Loading: "Creating Event..."
  API success →
  Redirect: /event?id=abc123
```

---

#### **Interaction 4.1.6: Join Existing Event Button**

**Trigger**: User clicks "Join Existing Event" button in bottom card

**Visual Feedback**:
- Button: Gray background, hover → slightly darker gray
- Full width, medium padding

**Action**:
- Opens JavaScript `prompt()` dialog
- Native browser dialog (not custom modal)

**Prompt Text**: "Paste the event join link:"

**Input Mechanics**:
- User pastes: `https://where2meet.org/event?id=abc123&token=eyJ...`
- Or types manually
- Click OK or Cancel

**Validation**:
```javascript
1. Parse as URL
2. Extract searchParams:
   - id (required)
   - token (optional but expected)
3. If no ID → Error: "Invalid join link: missing event ID"
```

**Success Flow**:
```
1. Paste link
2. Click OK
3. Extract: id=abc123
4. Store in sessionStorage:
   - eventId: "abc123"
   - role: "participant"
   - joinToken: "eyJ..." (if present)
5. Navigate: /event?id=abc123
```

**Error Flow**:
```
1. Paste invalid link: "hello world"
2. Try-catch fails
3. Show error alert: "Invalid join link format"
4. User can try again
```

---

### 4.2 Event Page - Header & Navigation

#### **Interaction 4.2.1: Logo Click (Back to Home)**

**Trigger**: User clicks logo in top-left header

**Visual Element**:
- Logo icon (no text)
- Size: `md` (medium)
- Position: Absolute top-left

**Visual Feedback**:
- Hover: Opacity 80% (`hover:opacity-80`)
- Transition: `transition-opacity`
- Cursor: pointer

**Action**:
- Navigate to: `/` (homepage)
- No confirmation dialog
- Leaves event page

**Use Case**: User wants to create new event or go back home

---

#### **Interaction 4.2.2: Language Switcher**

**Trigger**: User clicks language flag dropdown

**Visual States**:
- Compact flag icon + language code
- Dropdown expands on click
- Options: 🇺🇸 EN | 🇨🇳 中文

**Input Mechanics**:
- Click to expand dropdown
- Click language to select
- Dropdown closes automatically

**Effect**:
- Entire UI text changes instantly
- No page reload
- Language stored in localStorage
- Persists across sessions

**Translations Affected**:
- All labels, buttons, placeholders
- Toast messages
- Error messages
- Help text

**Example**:
```
Current: EN
Click dropdown → See "中文"
Click "中文" →
  - "Create Event" becomes "创建活动"
  - "Search Venues" becomes "搜索场地"
  - All UI updates in <100ms
```

---

#### **Interaction 4.2.3: Event Title Display**

**Visual**:
- Large bold text: `text-2xl font-bold`
- Color: `text-gray-900`
- Non-interactive (display only)

**Content**: Event title from creation (e.g., "Team Lunch Friday")

**No interaction**: Cannot be edited on this page

---

#### **Interaction 4.2.4: Role & Participant Count Display**

**Visual**:
- Small text below title
- Format: "Host • 4 Participants" or "Participant • 4 Participants"
- Updates in real-time via SSE

**Real-time Update**:
```
Initial: "Host • 1 Participants" (just host)
Bob joins → SSE event → "Host • 2 Participants"
Carol joins → "Host • 3 Participants"
```

**No interaction**: Display only

---

#### **Interaction 4.2.5: Share Link Button (Host Only)**

**Trigger**: User clicks "🔗 Share Link" button

**Visibility**: Only shown if `role === 'host'`

**Visual States**:
- Normal: Blue background (`bg-blue-600`), white text
- Hover: Darker blue (`hover:bg-blue-700`), slight scale (`hover:scale-105`)
- Shadow expands on hover: `hover:shadow-xl`

**Special Visual - First Time**:
- If participants.length <= 1:
  - Animated arrow appears to left of button
  - Pulsing blue message: "Invite people with a link!"
  - Arrow icon: `→` pointing at button
  - Animation: `animate-pulse`
- Disappears once 2+ participants

**Tooltip on Hover**:
- Bottom-positioned tooltip
- Text: "Share link to invite participants"
- Black background, white text
- Fades in on hover

**Action**:
- Opens modal overlay
- Modal appears centered on screen
- Background darkens (black 50% opacity)

**Modal Contents**:
- Title: "Share Event Link"
- Description: "Share this link with participants to invite them to join"
- **Link Display**:
  - Gray box, rounded corners
  - Full URL: `https://where2meet.org/event?id=abc123&token=eyJ...`
  - Text breaks on long URL (word-wrap)
  - Text size: small
- **Buttons**:
  - "Copy Link": Blue, primary
  - "Close": Gray, secondary

**Interaction Flow**:
```
1. Click "Share Link"
2. Modal opens, page darkens
3. See link in gray box
4. Click "Copy Link" →
   - Link copied to clipboard
   - Toast: "Join link copied to clipboard!"
5. Click "Close" or click outside modal →
   - Modal closes
   - Page returns to normal
```

---

#### **Interaction 4.2.6: Copy Link Button (in Modal)**

**Trigger**: Click "Copy Link" button in share modal

**Visual**: Blue button, white text

**Action**:
```javascript
1. Get full URL: window.location.origin + /event?id={eventId}&token={joinToken}
2. navigator.clipboard.writeText(link)
3. Show toast: "Join link copied to clipboard!"
4. Modal remains open (user can copy again if needed)
```

**Edge Case**: If clipboard API fails (rare), fallback to alert with link

---

#### **Interaction 4.2.7: ~~Publish Decision Button~~ → Automatic Winner Display** 🔄 **REDESIGNED**

**OLD DESIGN (REMOVED):**
```
❌ "Publish Decision" button - host manually publishes winner
❌ Locks voting after publish
❌ Green banner appears
❌ Adds ceremony/friction to simple voting process
```

**NEW DESIGN (AUTOMATIC):**

**Winner Determined by Votes**:
```
No manual publish button needed!

Header automatically shows:
┌─────────────────────────────────────┐
│ Top Choice: Joe's Pizza (3 votes)   │ ← Always visible
└─────────────────────────────────────┘

Real-time updates as votes come in:
- 0 votes: "No votes yet"
- 1 vote: "Leading: Joe's Pizza (1 vote)"
- Tie: "Tied: Joe's Pizza & Mario's (2 votes each)"
- Clear winner: "Top Choice: Joe's Pizza (5 votes)"
```

**Tie-Breaking (if needed)**:
```
If multiple venues have same vote count:
1. Primary: Show all tied venues
2. Optional tie-breaker: Average distance from all participants
   "Tied on votes, Joe's Pizza is 0.3km closer on average"
3. Group can continue voting or decide among tied options
```

**No Locking Mechanism**:
```
Voting never locks - group can continue voting anytime
Winner updates dynamically as votes change
No ceremony, no manual action needed
Data speaks for itself
```

**Visual Display**:
```
Top of page (always visible):
┌─────────────────────────────────────┐
│ 🏆 Top Choice: Joe's Pizza (5 votes)│
│ 📍 1.2 km avg distance              │
│ 🚗 8 min avg travel time            │
└─────────────────────────────────────┘

Subtle, informative, no blocking banner
```

**Benefits**:
- No friction - automatic determination
- No manual publish step
- Voting continues naturally
- Clear winner always visible
- Group can change their mind
- Simpler mental model: Most votes = winner

---

### 4.3 Event Page - Left Panel (Input & Controls)

#### **Interaction 4.3.1: Google Autocomplete Search Box**

**Component**: InputPanel.tsx

**Trigger**: User clicks into search input field

**Visual Feedback - Focus**:
- Input border: gray → blue focus ring
- Placeholder disappears
- Cursor appears

**Placeholder Text**:
- English: "Search for a location..."
- Chinese: "搜索位置..."

**Input Mechanics - Typing**:
```
User types: "123 M"

After ~100ms delay:
1. Google Autocomplete API called
2. Session token used (cost optimization)
3. Suggestions fetched

Dropdown appears below input:
┌────────────────────────────────────┐
│ 123 Main St, New York, NY          │ ← First suggestion
│ 123 Market St, San Francisco, CA   │
│ 123 Madison Ave, New York, NY      │
└────────────────────────────────────┘

Visual:
- White background
- Each suggestion: hover → light blue background
- Icon: 📍 before each
- Main text: bold (street address)
- Secondary text: gray (city, state)
```

**Interaction - Selecting Suggestion**:
```
1. User hovers over "123 Main St, New York, NY"
   → Background: light blue

2. User clicks
   → Dropdown closes
   → Input value clears (ready for next search)
   → Coordinates extracted: { lat: 40.7128, lng: -74.0060 }

3. Nickname prompt appears (modal)
```

**Loading State**:
- While waiting for Google API:
  - Subtle loading indicator (optional)
  - Dropdown shows "Loading..."

**Error State**:
- If Google API fails:
  - No dropdown shown
  - Console error logged
  - User can try again

**Auto-Complete Initialization**:
```
On component mount:
1. Wait for google.maps to load
2. Create Autocomplete instance
3. Attach to input element
4. Listen for 'place_changed' event
5. Show loading indicator: "⏳ Waiting for Google Maps to load..."
6. When ready: Enable input, hide loading indicator
```

---

#### **Interaction 4.3.2: Map Click to Add Location**

**Trigger**: User clicks anywhere on the map

**Preconditions**:
- If participant AND already added location → Ignored (no action)
- If host OR participant without location → Allowed

**Visual Feedback - Click**:
- No immediate marker (confirmation required first)

**Confirmation Dialog (Step 1)**:
```
Native confirm() dialog:
┌─────────────────────────────────────────┐
│  Add location at:                        │
│  40.712800, -74.006000?                  │
│                                           │
│  Click OK to confirm this location.      │
│                                           │
│         [Cancel]  [OK]                   │
└─────────────────────────────────────────┘
```

**If Cancel**: Nothing happens, dialog closes

**If OK**: Nickname prompt modal appears

---

#### **Interaction 4.3.3: ~~Nickname Prompt Modal~~ → Anonymous Name Generation** 🔄 **REDESIGNED**

**OLD DESIGN (REMOVED):**
```
❌ Nickname prompt modal - forced user to enter name before adding location
❌ 2-step process: Confirm coordinates → Enter nickname
❌ High friction: Interrupted flow, forced decision
```

**NEW DESIGN (FRICTIONLESS):**

**Auto-Generated Anonymous Names**:
```
User adds location → Marker appears INSTANTLY with unique auto-generated name

Examples:
- brave_tiger
- swift_wolf
- clever_eagle
- mighty_bear
- silent_fox

Algorithm ensures NO DUPLICATES within event
```

**Name Generation Algorithm**:
```javascript
const adjectives = [
  'brave', 'swift', 'clever', 'mighty', 'silent', 'fierce',
  'wise', 'bold', 'quick', 'strong', 'agile', 'bright',
  // ~20 adjectives
];

const animals = [
  'wolf', 'tiger', 'eagle', 'bear', 'fox', 'hawk',
  'lion', 'panda', 'otter', 'raven', 'lynx', 'deer',
  // ~30 animals
];

function generateUniqueName(existingParticipants) {
  // Strategy 1: Try adjective_animal combinations
  for (const adj of shuffled(adjectives)) {
    for (const animal of shuffled(animals)) {
      const name = `${adj}_${animal}`;
      if (!existingParticipants.includes(name)) {
        return name; // Found unique name
      }
    }
  }

  // Strategy 2: If all combos used (600+ participants), add number
  let counter = 1;
  while (true) {
    const name = `anonymous_${counter}`;
    if (!existingParticipants.includes(name)) {
      return name;
    }
    counter++;
  }
}

// Example usage:
// Event has: brave_tiger, swift_wolf
// New participant joins → generates: clever_eagle (unique)
```

**Capacity**: 20 adjectives × 30 animals = **600 unique combinations** before falling back to numbers

**Optional Inline Editing**:
```
User wants custom name?
Click "brave_tiger" text → Inline input appears
Type "Alice" → Auto-saves on Enter/blur
Updates everywhere: map marker, card, routes, SSE broadcast
```

**No validation needed**:
- Auto-generated names are always valid
- User can always edit later (optional)
- No blocking dialogs
- Instant location addition

**Action Flow (NEW - Instant):**
```
1. User clicks map OR selects from autocomplete
2. Frontend:
   - Generate unique anonymous name: clever_eagle
   - Show marker IMMEDIATELY with temp name
   - Show location card in panel
3. API call (non-blocking): POST /api/v1/events/{eventId}/participants
   Body: {
     lat: 40.7128,
     lng: -74.0060,
     name: "clever_eagle" // auto-generated
   }
4. Backend:
   - Creates participant
   - Applies fuzzing if visibility=blur
   - Returns participant ID: "p_abc123"
   - Broadcasts SSE: participant_joined
5. Frontend (on API success):
   - Stores participant ID in sessionStorage
   - Updates marker with permanent data
   - Purple centroid updates
   - Blue MEC circle updates (if 2+ locations)
6. Toast: "✓ Location added as clever_eagle" (subtle, 2sec)

Total time: ~1 second (instant visual feedback, API in background)
```

**Optional: User Edits Name (Inline)**:
```
1. Click "clever_eagle" text in location card
2. Text becomes editable input (inline)
3. Type: "Alice"
4. Press Enter or blur
5. API call: PATCH /api/v1/events/{eventId}/participants/{id}
   Body: { name: "Alice" }
6. Updates everywhere:
   - Map marker label
   - Location card
   - Route display
   - SSE broadcast to all participants
7. Toast: "✓ Name updated to Alice"
```

**No Cancel Flow**: If user made mistake, they can:
- Click "Remove" button on location card
- Edit name inline
- No modal interruptions

---

#### **Interaction 4.3.4: Location List (Left Panel)**

**Visual Layout**:
```
┌─────────────────────────────────────┐
│  Add Your Location                  │ ← Header
├─────────────────────────────────────┤
│  [Search box with autocomplete]     │
├─────────────────────────────────────┤
│  Your Locations:                    │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ 🟢 You                        │ │ ← Own location (green)
│  │    Alice (Downtown)           │ │
│  │    📍 40.7128, -74.0060       │ │
│  │    [View Route]  [Edit]       │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ 🔵 Participant                │ │ ← Other participant (blue)
│  │    Bob                        │ │
│  │    📍 40.7580, -73.9855       │ │
│  │    [View Route]               │ │ ← Host can remove
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ 🔵 Carol                      │ │
│  │    📍 40.7489, -73.9680       │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Color Coding**:
- 🟢 Green: Your own location
- 🔵 Blue: Other participants
- Larger marker for own location

**Coordinates Display**:
- If `visibility=blur`: Show fuzzy coordinates
- If `visibility=show`: Show exact coordinates
- Format: "40.7128, -74.0060" (6 decimals)

**Scrolling**:
- If 5+ locations: List scrolls
- Max height: `max-h-80` (prevents overflow)
- Scrollbar appears on right

---

#### **Interaction 4.3.5: View Route Button (in Location Card)**

**Trigger**: Click "View Route" button on a location

**Visibility**:
- Shown if `selectedCandidate !== null` (venue selected)
- Shows for all participants

**Action (Host)**:
```
1. Click "View Route" on Bob's location
2. Dropdown in panel changes to: "View route from: Bob"
3. Route recalculates from Bob's location to selected venue
4. Blue polyline appears on map
5. Route info panel shows distance + duration
```

**Action (Participant)**:
```
1. Can only view own route
2. "View Route" button for own location
3. Route already showing if venue selected
4. Button may highlight or scroll to route info
```

---

#### **Interaction 4.3.6: Edit Location Button (Host Only)**

**Trigger**: Click "Edit" button on a participant location

**Visual**: Small button, gray background

**Action**:
- Opens edit modal (similar to nickname prompt)
- Pre-filled with current nickname
- Option to change coordinates? (Current: No - only nickname)

**Current Implementation**: Host can only remove, not edit

**Future Feature**: Allow host to update participant name/coordinates

---

#### **Interaction 4.3.7: Remove Location (Host Only)**

**Trigger**: Click "×" or "Remove" button on participant card

**Confirmation**:
```
confirm("Remove this participant?")
```

**Action Flow**:
```
1. Click Remove
2. Confirm dialog → OK
3. API call: DELETE /api/v1/events/{eventId}/participants/{participantId}
4. Backend:
   - Deletes participant
   - Broadcasts SSE: participant_removed (if implemented)
5. Frontend:
   - Reloads event data
   - Blue marker disappears from map
   - Centroid recalculates
   - MEC circle updates
6. Toast: "Participant removed"
```

---

#### **Interaction 4.3.8: Search Area Size Slider (Host Only)**

**Component**: Event page, left panel, below input panel

**Visual**:
```
┌─────────────────────────────────────┐
│  Search Area Size                   │ ← Header
│                                     │
│  1.0x    [══●════════] 2.0x        │ ← Slider
│          1.5x MEC                   │ ← Current value
│                                     │
│  Controls how far beyond the        │
│  optimal meeting point to search    │
└─────────────────────────────────────┘
```

**Slider Details**:
- Type: `<input type="range">`
- Min: 1.0
- Max: 2.0
- Step: 0.1
- Default: 1.0
- Current value shown: "1.5x MEC"

**Visual Feedback - Dragging**:
```
1. User drags slider thumb right
2. Value updates in real-time: 1.0 → 1.1 → 1.2 ... → 1.5
3. Blue MEC circle on map expands/contracts IMMEDIATELY
4. Radius in header updates: "2.34 km" → "3.51 km"
```

**Circle Preview**:
- Shows what search area WILL BE before search
- Blue circle expands/contracts smoothly
- No API call until search button clicked

**After Search**:
- Slider locked to value used for search? (Current: No, can still adjust)
- "Authoritative circle" from backend overrides preview
- Adjusting slider again clears authoritative circle → shows preview

**Tooltip (? icon)**:
```
Hover over "?" icon:
┌──────────────────────────────────────┐
│ Adjust search radius multiplier.    │
│ 1.0x searches exactly within the    │
│ MEC circle. 2.0x doubles the        │
│ search area for more results.       │
└──────────────────────────────────────┘
```

---

#### **Interaction 4.3.9: Reset Center Point Button (Host Only)**

**Visibility**:
- Only shown if `customCentroid !== null`
- Appears below slider, separated by border

**Visual**:
```
┌─────────────────────────────────────┐
│  ────────────────────────           │ ← Border separator
│                                     │
│  [↺ Reset Center Point]            │ ← Purple button
│                                     │
│  Restore auto-calculated center     │ ← Help text
└─────────────────────────────────────┘
```

**Button Style**:
- Background: `bg-purple-100`
- Text: `text-purple-700`
- Icon: ↺ (circular arrow)
- Hover: `hover:bg-purple-200`

**Action**:
```
1. Click "Reset Center Point"
2. API call: PATCH /api/v1/events/{eventId}
   Body: {
     custom_center_lat: null,
     custom_center_lng: null
   }
3. Backend:
   - Clears custom center
   - Broadcasts SSE: event_updated
4. Frontend:
   - Sets customCentroid = null
   - Centroid recalculates to geometric center
   - Purple marker moves to auto-calculated position
   - Circle re-centers
5. Toast: "Center point reset to auto-calculated position"
6. Reset button disappears (no custom center anymore)
```

---

### 4.4 Event Page - Right Panel (Tabbed Interface)

#### **Interaction 4.4.1: Tab Navigation**

**Visual Layout**:
```
┌─────────────────────────────────────────┐
│  [🔍 Search (23)] [➕ Custom] [💜 Added (5)] │ ← Tab headers
├─────────────────────────────────────────┤
│                                         │
│  [Tab content area]                     │
│                                         │
│                                         │
│                                         │
└─────────────────────────────────────────┘
```

**Tab States**:
- **Inactive**: Gray text, no background
- **Active**: Blue underline, bold text
- **Badge**: Number in parentheses (candidate count)

**Tab Switching**:
```
1. Click "Custom Add" tab
2. Immediate transition (no animation)
3. Content swaps instantly
4. Previous tab content hidden
5. New tab content visible
```

**Badge Updates**:
- Real-time via state updates
- Search tab: Count of `candidates.filter(c => c.added_by !== 'organizer')`
- Added tab: Count of `candidates.filter(c => c.added_by === 'organizer')`

---

#### **Interaction 4.4.2: Search Tab - Keyword Input**

**Component**: CandidatesPanel.tsx

**Visual**:
```
┌─────────────────────────────────────┐
│  Search Venues                      │ ← Header
├─────────────────────────────────────┤
│  Venue Type:                        │ ← Label
│  ┌─────────────────────────────┐   │
│  │ restaurant                   │   │ ← Input (pre-filled)
│  └─────────────────────────────┘   │
│                                     │
│  [Search]                           │ ← Green button
└─────────────────────────────────────┘
```

**Pre-filled Value**:
- Auto-filled with `event.category` on page load
- Example: If category = "cafe", input shows "cafe"

**Input Mechanics**:
- User can edit/clear
- Type anything: "basketball court", "pizza", "gym"
- No autocomplete (freeform text)
- Placeholder: "e.g., restaurant, cafe, basketball court"

**Validation**:
- Cannot search with empty keyword
- Search button disabled if `keyword.trim() === ''`

**Enter Key**:
```
1. Type "pizza"
2. Press Enter
3. Same as clicking "Search" button
```

---

#### **Interaction 4.4.3: Search Button**

**Visual States**:

**Normal State**:
- Green background: `bg-green-600`
- White text: "Search"
- Hover: Darker green `hover:bg-green-700`
- Enabled: If keyword is non-empty

**Loading State**:
```
┌──────────────────────┐
│  ⟳ Searching...      │ ← Spinner icon + text
└──────────────────────┘

- Blue background: `bg-blue-600`
- Animated spinner (rotating)
- Pulsing animation: `animate-pulse`
- Disabled: Cannot click again
```

**Action Flow**:
```
1. User types "restaurant"
2. Clicks "Search"
3. Button → Loading state
4. Backend calculation:
   a. Compute centroid from all participants
   b. Compute MEC radius
   c. Apply radius multiplier (e.g., 1.5x)
   d. Custom center if dragged
   e. Google Places API query:
      - Location bias: circle center
      - Radius: MEC radius × multiplier
      - Keyword: "restaurant"
   f. Filter by in_circle if toggle ON
   g. Calculate distance from center
   h. Sort by rating (default)
5. Response: { candidates: [...], search_area: {...} }
6. Frontend:
   a. Sets candidates state
   b. Sets authoritative circle (from search_area)
   c. Orange markers appear on map
   d. Results populate in Search tab list
   e. Button returns to normal state
7. Toast (if 0 results): "No results found for 'restaurant'. Try different search."
```

**Special Toast - Land Snapping**:
```
If search_area.was_snapped === true:
  Toast (blue, info):
  "Search center adjusted to nearby land for better results"
  Duration: 4 seconds
```

---

#### **Interaction 4.4.4: "Only in Circle" Toggle**

**Visual**:
```
┌─────────────────────────────────┐
│  ☑️ Only show venues in circle  │ ← Checkbox + label
└─────────────────────────────────┘
```

**States**:
- Default: ☑️ Checked (ON)
- Unchecked: Show all results from Google API

**Effect on Search**:
- Checked: Backend returns only venues where `in_circle === true`
- Unchecked: Backend returns all, frontend displays all

**Real-time Filter** (Current: No, requires new search):
- Toggle does NOT filter existing results
- Must click "Search" again after toggle

**Future Enhancement**: Filter existing results client-side without re-search

---

#### **Interaction 4.4.5: Sort Mode Toggle**

**Visual**:
```
┌────────────────────────────────────┐
│  Sort by:  [Rating] [Distance] [Votes] │
└────────────────────────────────────┘
```

**Button States**:
- **Active**: Blue background, white text, bold
- **Inactive**: Gray background, dark text
- All buttons: Rounded, medium padding

**Sorting Logic**:

**Rating Mode** (Default):
```javascript
sorted.sort((a, b) => {
  const ratingA = a.rating || 0;
  const ratingB = b.rating || 0;
  return ratingB - ratingA; // Highest rating first
});
```

**Distance Mode**:
```javascript
sorted.sort((a, b) => {
  const distA = a.distanceFromCenter || Infinity;
  const distB = b.distanceFromCenter || Infinity;
  return distA - distB; // Closest first
});
```

**Votes Mode**:
```javascript
sorted.sort((a, b) => {
  const voteA = a.voteCount || 0;
  const voteB = b.voteCount || 0;
  return voteB - voteA; // Most votes first
});
```

**Interaction**:
```
1. Click "Distance" button
2. Button → Active (blue)
3. "Rating" button → Inactive (gray)
4. List re-sorts INSTANTLY (no API call)
5. Venue cards reorder
6. Scroll position: stays at top
```

**Votes Button Visibility**:
- Only shown if `event.allow_vote === true`
- Hidden if voting disabled

---

#### **Interaction 4.4.6: Venue Card (Search Results)**

**Visual Layout**:
```
┌───────────────────────────────────────┐
│  Joe's Pizza                          │ ← Name (bold)
│  123 Main St, New York, NY            │ ← Address
│                                       │
│  ★ 4.5  (234 reviews)  1.2 km  ✅    │ ← Info row
│  🗳️ 3 votes                           │ ← Vote count (if voting)
│                                       │
│  [Vote] [Save to Added] [View Maps]  │ ← Action buttons
└───────────────────────────────────────┘
```

**Visual States**:

**Unselected**:
- Background: White
- Border: Gray, 2px
- Hover: Light orange background

**Selected**:
- Background: Orange (`bg-orange-100`)
- Border: Orange, 2px (`border-orange-600`)
- No hover effect (already selected)

**Info Row Details**:
- **Rating**: ★ 4.5 (yellow star)
- **Reviews**: (234 reviews) - gray text
- **Distance**: 1.2 km - from centroid
- **Status**: ✅ "In Circle" or ⚠️ "Outside Circle"

---

#### **Interaction 4.4.7: Click Venue Card to Select**

**Trigger**: Click anywhere on venue card

**Visual Feedback**:
```
1. Card background: white → orange
2. Border: gray → orange, bold
3. Map marker: orange → red (selected)
4. Previous selected card: orange → white
5. Previous selected marker: red → orange
```

**Map Effects**:
```
1. Red marker appears at venue location
2. Orange marker for previous selection
3. Map pans to show selected venue (optional)
4. If participant has location:
   - Route calculation begins
   - Blue polyline appears
   - Route info panel shows at bottom
```

**Route Calculation**:
```
Participant selects "Joe's Pizza":
1. Origin: Participant's location (40.7128, -74.0060)
2. Destination: Joe's Pizza (40.7489, -73.9680)
3. Travel mode: Current mode (e.g., DRIVING)
4. Google Directions API call
5. Response: { distance: "3.2 km", duration: "8 min" }
6. Blue route polyline renders on map
7. Route info panel appears at bottom:
   ┌────────────────────────────────┐
   │  🚗 Drive  🚶 Walk  🚌 Transit │
   │  ────────────────────────────  │
   │  3.2 km • 8 min               │
   └────────────────────────────────┘
```

---

#### **Interaction 4.4.8: Vote Button on Venue Card**

**Visibility**:
- Only shown if:
  - `event.allow_vote === true` AND
  - `participantId !== null` (user has submitted location)

**Visual**:
- Purple background: `bg-purple-500`
- White text: "Vote"
- Small button, rounded
- Hover: Darker purple

**Action**:
```
1. Click "Vote" on "Joe's Pizza"
2. API call: POST /api/v1/events/{eventId}/votes
   Body: {
     participant_id: "participant-123",
     candidate_id: "candidate-456"
   }
3. Backend:
   - Checks unique constraint (participant_id, candidate_id)
   - If duplicate: Error "Already voted"
   - If new: Insert vote, broadcast SSE
4. Frontend:
   - Reloads event data
   - Vote count updates: 🗳️ 2 → 🗳️ 3
   - Toast: "Vote cast successfully"
```

**Duplicate Vote Handling**:
```
User clicks "Vote" on same venue again:
1. API call
2. Backend: Unique constraint violation
3. Response: 400 error "Already voted on this candidate"
4. Frontend: Toast (error): "You already voted for this venue"
```

**Vote Count Display**:
- Updates in real-time via SSE
- Other participants' votes → count increments immediately
- Shown as: "🗳️ 3 votes"

---

#### **Interaction 4.4.9: Save to Added Button**

**Visual**: Blue button, white text: "💾 Save"

**Purpose**: Move venue from Search results to Added (saved) list

**Action**:
```
1. Click "Save to Added" on "Joe's Pizza"
2. API call: POST /api/v1/events/{eventId}/candidates/{candidateId}/save
3. Backend:
   - Updates candidate.added_by = "organizer"
   - Broadcasts SSE: candidate_saved
4. Frontend:
   - Reloads candidates
   - "Joe's Pizza" moves from Search tab to Added tab
   - Badge updates: Search (22) / Added (6)
5. Toast: "Venue saved to added list"
```

**Visual Indicator**:
- Button changes to "Saved" (disabled state)?
- Or disappears from Search tab?
- Current: Disappears (only shows in Added tab)

---

#### **Interaction 4.4.10: View on Maps Link**

**Visual**:
- Link button or icon
- Text: "🗺️ View on Maps"
- Blue text, underlined on hover

**Action**:
```
1. Click "View on Maps"
2. Construct URL:
   - If user has location:
     https://www.google.com/maps/dir/?api=1&origin=USER_LAT,USER_LNG&destination=VENUE_LAT,VENUE_LNG
   - If no user location:
     https://www.google.com/maps/search/?api=1&query=VENUE_LAT,VENUE_LNG&query_place_id=PLACE_ID
3. window.open(url, '_blank')
4. New tab opens with Google Maps
5. Shows route or venue details
```

**Use Case**:
- User wants detailed directions
- Check traffic conditions
- Street view of venue
- Save directions to phone

---

#### **Interaction 4.4.11: Custom Add Tab - Venue Search**

**Component**: VenueSearchBox.tsx

**Visual**:
```
┌─────────────────────────────────────┐
│  Add Specific Venue                 │ ← Header
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐   │
│  │ [Search for venue...]       │   │ ← Google Places Autocomplete
│  └─────────────────────────────┘   │
│                                     │
│  Search and add any venue by name  │ ← Help text
└─────────────────────────────────────┘
```

**Input Behavior**:
```
1. User clicks input → focus
2. Types: "Mario's Tra"
3. Google Places Autocomplete triggers
4. Dropdown appears:
   ┌────────────────────────────────┐
   │ 📍 Mario's Trattoria           │
   │    456 Elm St, New York        │
   │                                │
   │ 📍 Mario's Pizza               │
   │    789 Oak St, Brooklyn        │
   └────────────────────────────────┘
5. User clicks "Mario's Trattoria"
6. Dropdown closes
```

**On Selection**:
```
1. Extract place details:
   - place_id
   - name
   - address
   - lat/lng
   - rating (optional)
2. API call: POST /api/v1/events/{eventId}/candidates/manual
   Body: {
     place_id: "ChIJ...",
     name: "Mario's Trattoria",
     address: "456 Elm St, New York",
     lat: 40.7489,
     lng: -73.9680,
     rating: 4.7
   }
3. Backend:
   - Creates candidate with added_by = "organizer"
   - Broadcasts SSE: candidate_added
4. Frontend:
   - Reloads candidates
   - Venue appears in Added tab
   - Badge updates: Added (6)
   - Orange marker appears on map
5. Toast: "Venue added successfully"
6. Input clears (ready for next search)
```

**Use Case**:
- User knows specific restaurant name
- Want to add venue outside search circle
- Bypass automated search

---

#### **Interaction 4.4.12: Added Tab - Saved Venues List**

**Visual**:
```
┌─────────────────────────────────────┐
│  💜 User-Added Venues               │
├─────────────────────────────────────┤
│  ┌───────────────────────────────┐ │
│  │ Joe's Pizza                   │ │
│  │ 123 Main St                   │ │
│  │ ★ 4.5  🗳️ 3                  │ │
│  │ [Vote] [Remove]               │ │ ← Host can remove
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ Mario's Trattoria             │ │
│  │ 456 Elm St                    │ │
│  │ ★ 4.7  🗳️ 1                  │ │
│  │ [Vote]                        │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Sorting**: Always by vote count (highest first)

**Purple Theme**:
- Selected card: Purple background
- Border: Purple
- Vote buttons: Purple

**Remove Button (Host Only)**:
```
1. Click "Remove"
2. API call: POST /api/v1/events/{eventId}/candidates/{candidateId}/unsave
3. Backend:
   - Sets added_by = null (or deletes if search result)
   - Broadcasts SSE: candidate_unsaved
4. Frontend:
   - Venue disappears from Added tab
   - If was search result: Returns to Search tab
   - If was manual add: Removed completely
   - Badge updates: Added (5)
5. Toast: "Venue removed from added list"
```

**Empty State**:
```
┌─────────────────────────────────────┐
│          💜                         │
│                                     │
│  No User-Added Venues Yet           │
│                                     │
│  Use the Search tab to find venues, │
│  or Custom Add to add specific ones │
└─────────────────────────────────────┘
```

---

### 4.5 Event Page - Map Interactions

#### **Interaction 4.5.1: Centroid Marker Drag (Host Only)**

**Visual**: Purple marker with crosshair icon

**Draggable**: Only if `isHost === true`

**Interaction Flow**:
```
1. Hover over purple centroid marker
   → Cursor changes to hand/grab icon
   → Marker slightly enlarges (scale: 1.1)

2. Click and hold (mousedown)
   → Cursor: grab → grabbing
   → Marker: outline appears (blue)

3. Drag across map
   → Marker follows cursor in real-time
   → Blue circle re-centers on marker position
   → Circle radius stays same (follows marker)
   → Smooth animation (60fps)

4. Release (mouseup)
   → Cursor: grabbing → grab
   → Marker settles at new position
   → API call: PATCH /api/v1/events/{eventId}
     Body: {
       custom_center_lat: 40.7500,
       custom_center_lng: -74.0000
     }
   → Backend saves, broadcasts SSE
   → Toast: "Center point adjusted"
   → "Reset Center Point" button appears in left panel
```

**Visual Feedback During Drag**:
- Centroid marker: purple, larger, outlined
- Circle: Follows marker smoothly
- Other markers: Stay in place (don't move)

**Edge Cases**:
- If dragged far from participants: Circle still centered on marker
- MEC radius calculation: Based on participants, not custom center
- Search uses custom center + MEC radius

---

#### **Interaction 4.5.2: Venue Marker Click**

**Visual**: Orange marker (or red if selected)

**Trigger**: Click on venue marker on map

**Action**:
```
1. Click orange marker for "Joe's Pizza"
2. Same effect as clicking venue card in list
3. Marker: orange → red
4. Card in list: highlights (orange background)
5. List scrolls to selected card (smooth)
6. Route calculation begins
7. Info window appears on map (optional)
```

**Info Window** (Optional Enhancement):
```
┌─────────────────────────┐
│  Joe's Pizza            │
│  ★ 4.5 • 1.2 km        │
│  [View Details]         │
└─────────────────────────┘
```

**Current Implementation**:
- Click → selection only
- No info window (could be added)

---

#### **Interaction 4.5.3: Participant Marker Hover**

**Visual**: Blue marker (or green for own)

**Hover Effect**:
```
1. Move mouse over blue marker (Bob)
2. Tooltip appears above marker:
   ┌──────────────┐
   │  Bob         │
   │  📍 Address  │
   └──────────────┘
3. Marker slightly enlarges (scale: 1.1)
4. Move mouse away
5. Tooltip disappears
6. Marker returns to normal size
```

**Tooltip Content**:
- Participant name
- Address (if available)
- Coordinates (if visible per privacy setting)

---

#### **Interaction 4.5.4: MEC Circle Visual**

**Visual**:
- Blue circle outline: `#3B82F6`
- Fill: Blue, 20% opacity
- Stroke width: 2px
- No interaction (display only)

**Updates**:
- When locations added/removed
- When center dragged
- When radius multiplier changed
- When search performed (authoritative circle)

**Preview vs Authoritative**:

**Preview Mode** (before search):
```
- Circle computed from:
  - Center: Custom centroid OR auto-centroid
  - Radius: MEC radius × multiplier
- Updates in real-time as slider moves
- Blue, semi-transparent
```

**Authoritative Mode** (after search):
```
- Circle from backend search_area:
  - center_lat, center_lng
  - radius_km
- Shows ACTUAL search area used
- Locked (doesn't change with slider)
- Blue, semi-transparent (same style)
```

**Reset to Preview**:
- Adjust slider → clears authoritative → preview mode

---

#### **Interaction 4.5.5: Route Polyline**

**Visual**:
- Thick blue line (6px width)
- 100% opacity (solid)
- Follows roads (Google's route)
- Curves smoothly

**Trigger**: Selecting a venue when user has location

**Updates**:
- When different venue selected
- When transportation mode changed
- When "View Route From" dropdown changed (host)

**Animation**:
- Appears instantly (no draw animation currently)
- Could add: Polyline draws from origin → destination

---

### 4.6 Event Page - Bottom Panel (Route Info)

#### **Interaction 4.6.1: Transportation Mode Selector**

**Visual**:
```
┌────────────────────────────────────┐
│  🚗 Drive  🚶 Walk  🚌 Transit  🚴 Bike │ ← Buttons
├────────────────────────────────────┤
│  3.2 km  •  8 min                  │ ← Distance & duration
└────────────────────────────────────┘
```

**Button States**:

**Active** (e.g., Drive):
- Background: Blue (`bg-blue-600`)
- Text: White, bold
- Scale: 1.05 (slightly larger)

**Inactive**:
- Background: White
- Text: Gray
- Border: Gray
- Hover: Light blue background

**Interaction**:
```
1. Currently: 🚗 Drive selected (blue)
   - Route shows: 3.2 km, 8 min

2. Click 🚶 Walk
   - Drive button: blue → gray
   - Walk button: gray → blue
   - Route recalculates IMMEDIATELY:
     a. Google Directions API call
     b. Travel mode: WALKING
     c. New polyline on map
     d. New distance: 3.5 km
     e. New duration: 42 min
   - Panel updates: "3.5 km • 42 min"
   - Transition: Smooth (300ms)

3. Click 🚌 Transit
   - Walk → gray, Transit → blue
   - Route recalculates
   - Shows: "4.1 km • 25 min (2 transfers)"
   - Polyline may show multiple colors (bus lines)
```

**Transportation Modes**:

| Icon | Mode | API Value | Typical Use |
|------|------|-----------|-------------|
| 🚗 | Drive | `DRIVING` | Car, default mode |
| 🚶 | Walk | `WALKING` | Pedestrian |
| 🚌 | Transit | `TRANSIT` | Public transport (bus, subway, train) |
| 🚴 | Bike | `BICYCLING` | Bicycle routes |

**Route Calculation Details**:

**TRANSIT Mode**:
- Shows transfer information
- Departure times (if available)
- Transit agencies (e.g., MTA)
- Wait times

**BICYCLING Mode**:
- Uses bike-friendly routes
- Avoids highways
- Shows bike lanes

---

#### **Interaction 4.6.2: Route Info Display**

**Visual**:
```
Bottom-center panel:
┌────────────────────────────────────┐
│  🚗 3.2 km  •  8 min               │
│                                    │
│  Joe's Pizza                       │
│  123 Main St, New York, NY         │
│                                    │
│  [View on Maps]                    │
└────────────────────────────────────┘
```

**Colors**:
- Distance: Blue text (large, bold)
- Duration: Green text (large, bold)
- Venue name: Black, bold
- Address: Gray

**Visibility**:
- Only shown when:
  - Venue selected AND
  - Participant has location (or host viewing route)

**Updates**:
- Real-time when mode changes
- Instant (no fade/animation)

---

### 4.7 Real-Time Updates (SSE)

#### **Interaction 4.7.1: New Participant Joins**

**Trigger**: Someone opens join link, adds location

**SSE Message**:
```json
{
  "event": "participant_joined",
  "data": {
    "participant_id": "p123",
    "name": "Bob"
  }
}
```

**Frontend Effect** (All Clients):
```
1. Receive SSE message
2. Toast appears:
   "Bob joined the event!" (green, success)
   Duration: 3 seconds
3. Reload event data:
   - Fetch participants
   - Update locations state
4. Map updates:
   - New blue marker appears for Bob
   - Centroid recalculates (purple marker moves)
   - MEC circle resizes/repositions
5. Header updates:
   "Host • 3 Participants" → "Host • 4 Participants"
6. Smooth transition (no flash/flicker)
```

**For Host**:
- Same as above +
- Left panel: New location card added to list

---

#### **Interaction 4.7.2: Vote Cast**

**Trigger**: Participant clicks Vote button

**SSE Message**:
```json
{
  "event": "vote_cast",
  "data": {
    "candidate_id": "c456",
    "candidate_name": "Joe's Pizza",
    "voter_id": "p123"
  }
}
```

**Frontend Effect** (All Clients):
```
1. Receive SSE
2. Reload candidates (to get updated vote counts)
3. Venue card updates:
   🗳️ 2 votes → 🗳️ 3 votes
4. If "Sort by Votes" mode:
   - List re-sorts
   - Joe's Pizza may move up
5. No toast (silent update)
```

**Visual**:
- Vote count animates (count-up animation)?
- Current: Instant update

---

#### **Interaction 4.7.3: Event Published**

**Trigger**: Host clicks "Publish Decision"

**SSE Message**:
```json
{
  "event": "event_published",
  "data": {
    "final_decision": "Joe's Pizza"
  }
}
```

**Frontend Effect** (All Clients):
```
1. Receive SSE
2. Toast appears:
   "Final decision published!" (green, success)
   Duration: 4 seconds
3. Green banner appears at top:
   ┌─────────────────────────────────────┐
   │ 🎉 Final Decision: Joe's Pizza      │
   └─────────────────────────────────────┘
4. Voting disabled:
   - All "Vote" buttons disappear
   - Vote counts remain visible
5. "Publish Decision" button disappears (host)
6. Event locked (no more changes)
```

**Banner Style**:
- Background: Green `bg-green-500`
- Text: White, large, bold
- Icon: 🎉
- Full-width
- Sticky (stays visible on scroll)

---

### 4.8 Mobile Responsive Behaviors

#### **Interaction 4.8.1: Mobile Layout (Screen < 768px)**

**Changes from Desktop**:

**Header**:
- Logo: Smaller
- Title: Truncated if too long
- Buttons: Stacked vertically or icons only

**Left Panel**:
- Width: 90% of screen (not fixed 288px)
- Position: May slide in from left
- Collapsible (tap to hide)

**Right Panel**:
- Full width on mobile
- Tabs: Scrollable horizontally
- List: Full height

**Map**:
- Still visible behind panels
- Reduced visibility (more covered)

**Bottom Route Panel**:
- Full width
- Transportation icons: Smaller
- Text: Smaller font

**Modal Dialogs**:
- Full width on mobile
- Padding: Reduced

---

#### **Interaction 4.8.2: Touch Interactions**

**Tap to Add Location**:
```
1. Tap map (instead of click)
2. Confirmation dialog (native)
3. Nickname modal: Full screen on mobile
4. Keyboard appears for input
5. Submit → Marker added
```

**Swipe to Dismiss Modals**:
- Swipe down on modal → Close
- iOS-style gesture (optional enhancement)

**Pinch to Zoom Map**:
- Two-finger pinch → Zoom in/out
- Native Google Maps behavior

---

## 5. Complete User Flows

### 5.1 Flow: Host Creates Event & Invites Team

**Actors**: Alice (host), Bob, Carol, Dave (participants)

**Step-by-Step**:

#### **Phase 1: Event Creation (Alice)**

```
1. Alice opens: https://where2meet.org
2. Sees homepage with large logo
3. Fills form:
   - Title: "Team Lunch Friday"
   - Category: "Restaurant"
   - Privacy: ☑️ Blur
   - Voting: ☑️ Allow
4. Clicks "Create Event"
5. Button → "Creating Event..." (loading)
6. Backend:
   - Creates event ID: evt_abc123
   - Generates JWT token: eyJhbG...
   - Returns join link
7. Redirect: /event?id=evt_abc123
8. Event page loads:
   - Header: "Team Lunch Friday"
   - Role: "Host • 1 Participants"
   - Animated arrow: "Invite people with a link!" → 🔗 Share Link button
```

#### **Phase 2: Alice Adds Location**

```
9. Alice clicks search box in left panel
10. Types: "350 5th Ave, New York"
11. Autocomplete dropdown appears
12. Selects: "350 Fifth Ave, New York, NY (Empire State Building)"
13. Nickname modal appears
14. Types: "Alice - Office"
15. Clicks "Confirm"
16. API call: POST /participants
17. Green "You" marker appears on map
18. Purple centroid appears (same location, 1 point)
19. Blue circle: 1km radius (minimum)
```

#### **Phase 3: Share Link**

```
20. Alice clicks "🔗 Share Link" button
21. Modal opens:
    ┌────────────────────────────────────┐
    │ Share Event Link                   │
    │                                    │
    │ https://where2meet.org/event?id=   │
    │ evt_abc123&token=eyJhbG...         │
    │                                    │
    │ [Copy Link]  [Close]               │
    └────────────────────────────────────┘
22. Clicks "Copy Link"
23. Toast: "Join link copied to clipboard!"
24. Opens Slack
25. Pastes in #team-lunch channel:
    "Hey team! Let's decide where to eat Friday.
     Add your location: https://where2meet.org/event?..."
26. Closes modal
```

#### **Phase 4: Bob Joins**

```
27. Bob sees Slack message
28. Clicks link on phone
29. Opens in mobile browser
30. Page loads: "Team Lunch Friday"
31. Role: "Participant • 1 Participants"
32. Sees Alice's location (blue marker - fuzzy coordinates)
33. Clicks search box
34. Types: "Penn Station New York"
35. Selects from autocomplete
36. Nickname modal: "Bob - Penn Station"
37. Submits
38. Green "You" marker for Bob
39. Blue marker for Alice
40. Purple centroid: Moves to midpoint
41. Blue circle: Expands to enclose both

Alice's screen (real-time):
42. Toast: "Bob - Penn Station joined the event!"
43. Header updates: "Host • 2 Participants"
44. Blue marker appears for Bob
45. Centroid shifts
46. Circle resizes
```

#### **Phase 5: Carol & Dave Join**

```
47-60. Same flow as Bob:
   - Carol joins from "Times Square"
   - Dave joins from "Brooklyn Bridge"

Final state (all 4 locations):
- 4 markers on map (1 green Alice, 3 blue others)
- Centroid: Center of all 4
- Circle: ~5 km radius (covering everyone)
- Header: "Host • 4 Participants"
```

---

### 5.2 Flow: Host Searches Venues

**Continuing from above...**

#### **Phase 6: Adjust Search Area**

```
61. Alice (host) sees left panel "Search Area Size"
62. Default: 1.0x MEC
63. Circle radius: 5.0 km
64. Drags slider to 1.5x
65. Circle expands in real-time: 5.0 → 7.5 km
66. No API call yet (preview only)
```

#### **Phase 7: Drag Center Point**

```
67. Alice notices centroid is in middle of East River (water)
68. Drags purple centroid marker west onto land (Manhattan)
69. Circle re-centers as she drags
70. Releases at new position
71. API call: PATCH /events/{id} (custom_center_lat/lng)
72. Toast: "Center point adjusted"
73. "Reset Center Point" button appears
```

#### **Phase 8: Search**

```
74. Alice clicks "🔍 Search" tab (right panel)
75. Keyword pre-filled: "restaurant" (from category)
76. ☑️ "Only in Circle" checked
77. Clicks green "Search" button
78. Button → "⟳ Searching..." (blue, spinning)
79. Backend:
    - Computes centroid (custom center Alice dragged)
    - Computes MEC radius: 5.0 km
    - Multiplies: 5.0 × 1.5 = 7.5 km
    - Detects center was in water → snaps to land
    - Google Places API:
      - Location: Custom center (snapped)
      - Radius: 7500 meters
      - Keyword: "restaurant"
    - Returns 47 restaurants
    - Filters: Only 23 are in circle
80. Response:
    - candidates: [23 restaurants]
    - search_area: { center, radius: 7.5, was_snapped: true }
81. Frontend:
    - 23 orange markers appear on map
    - Right panel: List shows 23 restaurants
    - Authoritative circle: 7.5 km (from backend)
    - Toast: "Search center adjusted to nearby land for better results"
    - Button → "Search" (normal)
82. Badge updates: "🔍 Search (23)"
```

---

### 5.3 Flow: Participants Vote

#### **Phase 9: Bob Explores Venues**

```
83. Bob (participant) sees 23 restaurants in Search tab
84. Default sort: Rating
85. Top result: "Joe's Pizza" ★ 4.8
86. Clicks on "Joe's Pizza" card
87. Card: white → orange (selected)
88. Map: Orange marker → red
89. Route calculation:
    - Origin: Bob's location (Penn Station)
    - Destination: Joe's Pizza
    - Mode: DRIVING (default)
90. Blue polyline appears on map
91. Bottom panel appears:
    ┌────────────────────────────────┐
    │ 🚗 Drive 🚶 Walk 🚌 Transit    │
    │ ──────────────────────────────│
    │ 2.1 km  •  9 min              │
    └────────────────────────────────┘
92. Bob switches to 🚶 Walk
93. Route recalculates: 2.3 km, 28 min
94. Switches back to 🚌 Transit: 2.5 km, 15 min (1 transfer)
95. Likes this option
96. Clicks purple "Vote" button
97. API call: POST /votes
98. Toast: "Vote cast successfully"
99. Vote count: 🗳️ 0 → 🗳️ 1
```

#### **Phase 10: Carol Votes**

```
100. Carol opens event on her laptop
101. Sees 23 restaurants
102. Clicks "Sort by: Votes"
103. Joe's Pizza appears first (1 vote)
104. Clicks to see route from Times Square
105. Route: 1.8 km, 7 min (🚗 Drive)
106. Good distance, votes
107. Vote count: 🗳️ 1 → 🗳️ 2

Bob's screen (real-time via SSE):
108. Vote count updates: 🗳️ 1 → 🗳️ 2
109. No toast (silent)
```

#### **Phase 11: Dave Adds Custom Venue**

```
110. Dave clicks "➕ Custom Add" tab
111. Types: "Mario's Trattoria Brooklyn"
112. Autocomplete shows results
113. Selects "Mario's Trattoria, 456 Elm St, Brooklyn"
114. API call: POST /candidates/manual
115. Venue added to "💜 Added" tab
116. Orange marker appears on map
117. Toast: "Venue added successfully"

Everyone's screen (SSE):
118. Badge updates: "💜 Added (1)"
119. Toast: "Dave added a venue"
```

#### **Phase 12: Dave Votes for His Venue**

```
120. Dave clicks "💜 Added" tab
121. Sees "Mario's Trattoria"
122. Clicks to select
123. Route: 0.5 km, 6 min (🚴 Bike)
124. Votes
125. Vote count: 🗳️ 0 → 🗳️ 1
```

---

### 5.4 Flow: Host Publishes Decision

#### **Phase 13: Alice Reviews Routes**

```
126. Alice (host) clicks "Sort by: Votes"
127. Top result: "Joe's Pizza" (🗳️ 2 votes)
128. Second: "Mario's Trattoria" (🗳️ 1 vote)
129. Clicks "Joe's Pizza"
130. Left panel dropdown: "View route from:"
131. Options: Alice, Bob, Carol, Dave
132. Selects "Dave" (outlier in Brooklyn)
133. Route shows: 4.5 km, 23 min (🚗 Drive)
134. Acceptable distance
135. Selects "Carol"
136. Route: 1.8 km, 7 min
137. Decides: Joe's Pizza is best overall
```

#### **Phase 14: Publish**

```
138. "Publish Decision" button visible (green)
139. Clicks button
140. Confirm dialog:
    "Publish this as the final decision?
     This will notify all participants."
141. Clicks OK
142. API call: POST /events/{id}/publish
    Body: { final_decision: "Joe's Pizza" }
143. Backend:
    - Sets event.final_decision = "Joe's Pizza"
    - Broadcasts SSE: event_published
144. Toast: "Final decision published!"
145. Green banner appears at top:
    "🎉 Final Decision: Joe's Pizza"
146. Publish button disappears
147. Voting disabled

All participants (Bob, Carol, Dave):
148. Green banner appears (SSE)
149. Toast: "Final decision published!"
150. Vote buttons disappear
151. Can still view routes
152. Can click "View on Maps" for directions
```

---

## 6. UI Components Breakdown

### 6.1 Buttons

#### **Primary Button** (e.g., Create Event)
- **Normal**: `bg-gradient-to-r from-blue-600 to-green-600 text-white font-semibold rounded-lg px-6 py-4 shadow-lg`
- **Hover**: `hover:from-blue-700 hover:to-green-700 hover:shadow-xl`
- **Disabled**: `disabled:opacity-50 disabled:cursor-not-allowed`
- **Loading**: Opacity 50%, text changes, spinner icon

#### **Secondary Button** (e.g., Cancel)
- **Normal**: `bg-gray-200 text-gray-900 font-medium rounded-lg px-4 py-2`
- **Hover**: `hover:bg-gray-300`

#### **Vote Button**
- **Normal**: `bg-purple-500 text-white text-xs px-2 py-1 rounded`
- **Hover**: `hover:bg-purple-600`

#### **Tab Button**
- **Active**: `bg-blue-600 text-white font-bold border-b-2 border-blue-600`
- **Inactive**: `bg-gray-100 text-gray-700`

---

### 6.2 Inputs

#### **Text Input**
```css
className: "
  w-full
  px-4 py-3
  text-black
  border-2 border-gray-300
  rounded-lg
  focus:ring-2 focus:ring-blue-500
  focus:border-transparent
"
```

**States**:
- Default: Gray border
- Focus: Blue ring, no border
- Error: Red border (optional, not currently used)
- Disabled: Gray background, lighter text

#### **Dropdown (Select)**
```css
className: "
  w-full
  px-4 py-3
  text-black
  border border-gray-300
  rounded-lg
  focus:ring-2 focus:ring-blue-500
"
```

#### **Checkbox**
- **Unchecked**: `w-5 h-5 border-2 border-gray-300 rounded`
- **Checked**: `bg-blue-600 border-blue-600` with white checkmark

#### **Range Slider**
```css
className: "
  w-full
  h-2
  bg-gray-200
  rounded-lg
  appearance-none
  cursor-pointer
  accent-blue-600
"
```

**Thumb**: Blue circle, larger on hover

---

### 6.3 Modals

#### **Base Modal**
```
Overlay:
- Position: fixed inset-0
- Background: bg-black/50 (50% opacity)
- Z-index: 50

Container:
- Position: Centered (flex items-center justify-center)
- Background: bg-white
- Rounded: rounded-lg
- Padding: p-6
- Max-width: max-w-md
- Shadow: shadow-2xl
```

#### **Share Modal**
- Title: text-xl font-bold
- Description: text-sm text-gray-700
- Link box: bg-gray-100 p-3 rounded
- Buttons: Flex row, gap-2

#### **Nickname Modal**
- Auto-focus on input
- Enter to submit
- Escape to cancel

---

### 6.4 Cards

#### **Venue Card**
```
Border: 2px
Rounded: rounded-md
Padding: p-2
Cursor: cursor-pointer
Transition: transition-all

Unselected:
- bg-white
- border-gray-300
- hover:bg-orange-50

Selected:
- bg-orange-100
- border-orange-600
```

#### **Location Card**
```
Background: bg-white OR bg-emerald-50 (own)
Border: 1px solid gray
Padding: p-3
Rounded: rounded-lg
```

---

### 6.5 Toasts (Sonner)

**Success** (Green):
```
- Icon: ✓ checkmark
- Duration: 3 seconds
- Example: "Vote cast successfully"
```

**Info** (Blue):
```
- Icon: ℹ️ info
- Duration: 4 seconds
- Example: "Search center adjusted to nearby land"
```

**Warning** (Yellow):
```
- Icon: ⚠️ warning
- Duration: 4 seconds
- Example: "No results found"
```

**Error** (Red):
```
- Icon: ✗ X
- Duration: 5 seconds
- Example: "Failed to create event"
```

---

### 6.6 Panels

#### **Floating Panel** (Left/Right)
```
Position: absolute
Background: bg-white/70 backdrop-blur-md
Rounded: rounded-lg
Shadow: shadow-2xl
Padding: p-3
Width: w-72 (left) or w-80 (right)
```

**Glassmorphism Effect**:
- Opacity: 70%
- Backdrop filter: blur(12px)
- Semi-transparent

#### **Header**
```
Position: absolute top-0 left-0 right-0
Background: bg-white/80 backdrop-blur-md
Shadow: shadow-lg
Padding: px-6 py-4
Z-index: 10
```

---

## 7. Data Model & State Management

### 7.1 Frontend State (React)

```typescript
// Event state
const [eventId, setEventId] = useState<string | null>(null);
const [event, setEvent] = useState<APIEvent | null>(null);
const [role, setRole] = useState<'host' | 'participant' | null>(null);
const [participantId, setParticipantId] = useState<string | null>(null);

// Map state
const [locations, setLocations] = useState<Location[]>([]);
const [participants, setParticipants] = useState<Participant[]>([]);
const [centroid, setCentroid] = useState<{ lat: number; lng: number } | null>(null);
const [customCentroid, setCustomCentroid] = useState<{ lat: number; lng: number } | null>(null);
const [circle, setCircle] = useState<Circle | null>(null);
const [candidates, setCandidates] = useState<Candidate[]>([]);
const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

// UI state
const [sortMode, setSortMode] = useState<SortMode>('rating');
const [keyword, setKeyword] = useState('');
const [isSearching, setIsSearching] = useState(false);
const [radiusMultiplier, setRadiusMultiplier] = useState(1.0);
const [travelMode, setTravelMode] = useState<TravelMode>('DRIVING');
```

### 7.2 SessionStorage (Persistent)

```
Key: "eventId"
Value: "evt_abc123"

Key: "role"
Value: "host" | "participant"

Key: "joinToken"
Value: "eyJhbGc..."

Key: "participantId"
Value: "p_123" (if participant added location)
```

### 7.3 LocalStorage (Anonymous Users)

```
Key: "my_events"
Value: ["evt_abc123", "evt_def456", ...]
(Array of event IDs)

Key: "language"
Value: "en" | "zh"
```

---

## 8. API Integration Points

### 8.1 Event Endpoints

```
POST   /api/v1/events
GET    /api/v1/events/{id}
PATCH  /api/v1/events/{id}
POST   /api/v1/events/{id}/publish
DELETE /api/v1/events/{id}
```

### 8.2 Participant Endpoints

```
POST   /api/v1/events/{id}/participants
GET    /api/v1/events/{id}/participants
PATCH  /api/v1/events/{id}/participants/{pid}
DELETE /api/v1/events/{id}/participants/{pid}
```

### 8.3 Candidate Endpoints

```
POST   /api/v1/events/{id}/candidates/search
GET    /api/v1/events/{id}/candidates
POST   /api/v1/events/{id}/candidates/manual
POST   /api/v1/events/{id}/candidates/{cid}/save
POST   /api/v1/events/{id}/candidates/{cid}/unsave
DELETE /api/v1/events/{id}/candidates/{cid}
```

### 8.4 Vote Endpoints

```
POST   /api/v1/events/{id}/votes
GET    /api/v1/events/{id}/votes
DELETE /api/v1/events/{id}/votes/{vid}
```

### 8.5 SSE

```
GET    /api/v1/events/{id}/stream
(Server-Sent Events connection)
```

---

## Summary

This document provides **exhaustive detail** on every interaction, feature, and flow in the Where2Meet application. It serves as the **single source of truth** for the redesign project.

**Key Sections**:
1. ✅ Product overview & value proposition
2. ✅ User roles & permissions
3. ✅ Complete feature inventory
4. ✅ Detailed interaction catalog (every click, hover, input)
5. ✅ Complete user flows (step-by-step scenarios)
6. ✅ UI components breakdown (buttons, inputs, modals, etc.)
7. ✅ Data model & state management
8. ✅ API integration points

**Next Steps for Redesign**:
- Use this as reference for new UI design
- Identify pain points to improve
- Sketch wireframes/mockups
- Plan component architecture
- Implement with unit tests

---

**Document Version**: 1.0
**Last Updated**: 2025-10-21
**Maintained By**: Where2Meet Team
