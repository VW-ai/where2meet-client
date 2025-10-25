# Events Feed - Complete Feature Specification

## Overview
The Events Feed is a social discovery feature that allows users to:
- Browse public group meetings happening in their area
- Post their own events to find participants
- Join events to collaborate on finding meeting locations
- Filter events by date, location, and category

---

## Event Types

Where2Meet supports two distinct types of events to accommodate different planning scenarios:

### Type 1: Fixed Location Events
**Use Case:** The organizer already knows exactly where the event will take place.
- Example: "Basketball Game at Sunset Park Court 3"
- Example: "Team Dinner at Olive Garden Downtown"
- Example: "Study Session at Central Library"

**Characteristics:**
- ✅ Has a predetermined, specific venue
- ✅ Location is confirmed and displayed upfront
- ❌ No collaborative venue voting needed
- 👥 Participants join to attend, not to choose location

**Flow:**
```
Organizer posts event → Specifies exact venue upfront →
Participants see confirmed location → Join to attend
```

### Type 2: Collaborative Location Events
**Use Case:** The organizer wants to meet but needs help finding the best location.
- Example: "Weekend Brunch - Let's find a spot!"
- Example: "Coffee Chat - Downtown SF area"
- Example: "Pickup Soccer Game - Need a field"

**Characteristics:**
- 📍 Has a general area/neighborhood but no specific venue yet
- ✅ Collaborative venue finding & voting enabled
- 👥 Participants join to suggest and vote on locations
- 🗺️ Uses the full Where2Meet planning features

**Flow:**
```
Organizer posts event → Specifies area only →
Participants join → Suggest venues → Vote →
Most voted venue becomes meeting point
```

---

## User Flows

### 1. Browse Events Flow
```
User opens homepage
  → Sees Events Feed in right panel (35% width)
  → Views 7-day date selector (TODAY, TUE, WED, THU, FRI, SAT, SUN)
  → Clicks date to filter events for that day
  → Sees filter buttons (All, Near Me)
  → Scrolls through event cards
  → Clicks "Load More" to see additional events
```

### 2. Post Event Flow
```
User clicks "+ Post" button in Events Feed nav
  → Modal/Slide-out panel appears
  → Fills in event details:
     - Event title (required)
     - Description (optional)
     - Meeting time (required)
     - Location Type (required): Choose one:
       ○ "Fixed Location" - I know where we're meeting
       ○ "Find Together" - Let's decide as a group

     IF "Fixed Location" selected:
       → Search and select specific venue from Google Places
       → Venue name, address auto-filled
       → Map preview shown

     IF "Find Together" selected:
       → Enter general area/neighborhood (e.g., "Downtown SF")
       → No specific venue required
       → Collaborative planning enabled

     - Category (optional: food, sports, entertainment, etc.)
     - Participant limit (optional)
     - Visibility (public/private)
  → Clicks "Post Event"
  → Event appears in feed immediately
  → User is redirected to event detail page as host
  → Receives shareable link
```

### 3. View Event Detail Flow
```
User clicks "View" on event card
  → Opens event detail page (/event?id=EVENT_ID)
  → Sees full event information:
     - Title, description, time
     - Host information
     - Participant list with avatars
     - Current venue candidates
     - Map showing locations
     - Join button (if not joined)
     - Share button
  → Can join event if interested
```

### 4. Join Event Flow
```
User clicks "Join" on event card
  → Confirmation dialog appears
     "Join [Event Name]? You'll be able to suggest and vote on meeting locations."
  → Clicks "Confirm"
  → User is added to participants
  → Redirected to event page
  → Can now suggest venues and vote
  → Event appears in "My Events"
```

### 5. Leave Event Flow
```
Participant clicks "Leave Event" on event page
  → Confirmation dialog appears
     "Are you sure? Your votes and suggestions will be removed."
  → Clicks "Confirm"
  → Removed from participants
  → Returns to Events Feed
```

---

## UI Components

### Events Feed Layout (Current)

```
┌─────────────────────────────────────────┐
│  📅 Events Feed          [+ Post]       │ ← Nav Bar (sticky)
├─────────────────────────────────────────┤
│                                         │
│  [TODAY] [TUE] [WED] [THU] [FRI] [SAT]  │ ← Date Selector
│    21     22    23    24    25    26    │
│                                         │
│  [All] [Near Me]                        │ ← Filters
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 📅 Weekend Brunch Meetup        │   │ ← Event Card
│  │ Downtown Cafes                  │   │
│  │ 👥 12 people · ⭐ 4.5           │   │
│  │ 📍 2.3 km · ☕ Cafe             │   │
│  │ [View] [Join]                   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 🏀 Basketball Pickup Game       │   │
│  │ ...                             │   │
│  └─────────────────────────────────┘   │
│                                         │
│            [Load More]                  │
└─────────────────────────────────────────┘
```

### Event Card Component

**Default State:**
```tsx
<EventCard>
  <EventEmoji>📅</EventEmoji>
  <EventTitle>Weekend Brunch Meetup</EventTitle>
  <EventLocation>Downtown Cafes</EventLocation>
  <EventMeta>
    👥 12 people · ⭐ 4.5 rating
    📍 2.3 km away · ☕ Cafe
    🕐 Today at 11:00 AM
  </EventMeta>
  <EventStatus>
    <StatusBadge>Happening Soon</StatusBadge>
  </EventStatus>
  <EventActions>
    <Button variant="outline">View</Button>
    <Button variant="solid">Join</Button>
  </EventActions>
</EventCard>
```

**Card States:**
- **Default**: Show View + Join buttons
- **Joined**: Show "View" button only (highlight card with border)
- **Full**: Show "View" + "Full" badge (disable Join)
- **Past**: Show "View" only, grayed out
- **Hosting**: Show "View" + "Manage" button

**Card Variations by Location Type:**

**Fixed Location Events:**
```
┌─────────────────────────────────────────┐
│ 📅 Basketball Game                      │
│ 📍 Sunset Park Court 3                  │ ← Specific venue shown
│ 👥 8/12 · 🕐 Today at 4:00 PM          │
│ [View] [Join]                           │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 📅 Team Dinner                          │
│ 📍 Olive Garden Downtown                │ ← Specific venue
│ 👥 15/20 · ⭐ 4.2 · 🕐 Sat 7:00 PM     │
│ [View] [Join]                           │
└─────────────────────────────────────────┘
```

**Collaborative Location Events:**
```
┌─────────────────────────────────────────┐
│ 📅 Weekend Brunch Meetup                │
│ 📍 Downtown SF · 🗺️ Finding location   │ ← Area + indicator
│ 👥 12/20 · In Progress 12 · 3 venues   │ ← Shows progress
│ 🕐 Today at 11:00 AM                    │
│ [View] [Join]                           │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 📅 Coffee Chat                          │
│ 📍 Mission District · 🗺️ Vote on venue │ ← Shows voting active
│ 👥 5/10 · In Progress 5 · 2 venues     │
│ 🕐 Tomorrow at 10:00 AM                 │
│ [View] [Join to Vote]                   │ ← Different CTA
└─────────────────────────────────────────┘
```

**Card States (All Types):**
```
┌─────────────────────────────────┐
│ 📅 Weekend Brunch Meetup   ✓    │ ← Joined (show checkmark)
│ Downtown Cafes                  │
│ 👥 12/20 · ⭐ 4.5 · 📍 2.3 km  │
│ 🕐 Today at 11:00 AM            │
│ [View Event]                    │ ← Single button
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ 📅 Weekend Brunch Meetup [FULL] │ ← Full (badge)
│ Downtown Cafes                  │
│ 👥 20/20 · ⭐ 4.5 · 📍 2.3 km  │
│ 🕐 Today at 11:00 AM            │
│ [View]                          │ ← Join disabled
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ 📅 Weekend Brunch Meetup [HOST] │ ← Hosting (badge)
│ Downtown Cafes                  │
│ 👥 12/20 · ⭐ 4.5 · 📍 2.3 km  │
│ 🕐 Today at 11:00 AM            │
│ [View] [Manage]                 │
└─────────────────────────────────┘
```

**Visual Indicators:**
- Fixed Location: `📍 [Venue Name]` - Direct venue name
- Collaborative: `📍 [Area] · 🗺️ Finding location` or `🗺️ Vote on venue`
- Show venue count for collaborative: `3 venues` or `2 venues`
- Progress indicator only for collaborative events

### Post Event Modal

**Desktop: Modal (centered overlay)**
**Mobile: Full-screen slide-up panel**

```
┌─────────────────────────────────────────┐
│  Post Event                         [×] │
├─────────────────────────────────────────┤
│                                         │
│  Event Title *                          │
│  [Input field]                          │
│                                         │
│  Description                            │
│  [Textarea - optional]                  │
│                                         │
│  Meeting Time *                         │
│  [datetime-local picker]                │
│                                         │
│  Location Type *                        │
│  ○ Fixed Location                       │
│     I know where we're meeting          │
│  ○ Find Together                        │
│     Let's decide as a group             │
│                                         │
│  ──────────────────────────────────     │
│                                         │
│  ┌─ IF "Fixed Location" Selected ────┐ │
│  │                                    │ │
│  │  Venue *                           │ │
│  │  [Search for a place...]           │ │
│  │  🔍 Google Places autocomplete     │ │
│  │                                    │ │
│  │  📍 Selected: Blue Bottle Coffee   │ │
│  │     66 Mint St, San Francisco      │ │
│  │     [📍 View on map]               │ │
│  │                                    │ │
│  └────────────────────────────────────┘ │
│                                         │
│  ┌─ IF "Find Together" Selected ─────┐ │
│  │                                    │ │
│  │  General Area/Neighborhood *       │ │
│  │  [Input field]                     │ │
│  │  📍 e.g. "Downtown SF", "Brooklyn" │ │
│  │                                    │ │
│  │  ℹ️  Participants will help find   │ │
│  │     the best meeting spot          │ │
│  │                                    │ │
│  └────────────────────────────────────┘ │
│                                         │
│  Category                               │
│  [☕ Food] [🏀 Sports] [🎬 Entertainment]│
│  [💼 Work] [🎵 Music] [🌳 Outdoors]     │
│                                         │
│  Participant Limit                      │
│  [Number input] (optional)              │
│                                         │
│  Visibility                             │
│  ○ Public - Anyone can see and join     │
│  ○ Link Only - Only people with link    │
│                                         │
│  ─────────────────────────────────      │
│                                         │
│  [Cancel]              [Post Event]     │
│                                         │
└─────────────────────────────────────────┘
```

### Event Detail Page - Full Design Specification

**Route:** `/event?id=EVENT_ID`

**Overview:**
The Event Detail Page is a comprehensive view that shows all information about an event, including participants, venue suggestions, and interactive elements based on the user's role (host, participant, or guest).

**Important:** The page layout adapts based on the event's Location Type.

---

#### Location Type Differences

##### Fixed Location Events
**What Shows:**
- ✅ Event header with confirmed venue name and address
- ✅ About section
- ✅ Participants section
- ✅ Meeting Location section (instead of Venues)
  - Shows the confirmed venue details
  - Map with single venue marker
  - Venue rating, reviews, photos
  - "Get Directions" button
- ❌ No venue voting/suggestions
- ❌ No "Find Meeting Point" tab

**Join Button Text:** "Join Event" (join to attend at confirmed location)

##### Collaborative Location Events
**What Shows:**
- ✅ Event header with general area
- ✅ About section
- ✅ Participants section
- ✅ Suggested Venues section (full voting UI)
  - Tabs: All Venues | Top Voted | Map View
  - Vote on venues
  - Add new venues
  - Progress indicator
- ✅ "Find Meeting Point" tab (for collaborative planning)

**Join Button Text:** "Join to Vote" (join to help choose location)

---

#### Layout Structure (Collaborative Events)

```
┌──────────────────────────────────────────────────────────────────────┐
│  Where2Meet                              [My Events] [Profile] [☰]    │ ← Header
└──────────────────────────────────────────────────────────────────────┘
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                                                               │   │ ← Hero Image
│  │                 🖼️ EVENT PHOTO                               │   │   (Full-width,
│  │           (Full-width featured image)                         │   │    400px height)
│  │                                                               │   │
│  │      [← Back to Feed]  ←─── (Overlaid on image)             │   │   • Dark gradient
│  │                                                               │   │     overlay at
│  │                                                               │   │     bottom for
│  │                                                        [HOST] │   │     readability
│  │                                                               │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  📅 Weekend Brunch Meetup                                    │    │ ← Event Header
│  │                                                               │    │   Section
│  │  Hosted by @sarah_chen                                       │    │
│  │  🕐 Saturday, Oct 26, 2024 at 11:00 AM                      │    │
│  │  📍 Downtown SF, California                                  │    │
│  │                                                               │    │
│  │  [In Progress 12] 👤👤👤👤 (+8 more)                      │    │
│  │  /20                                                          │    │
│  │                                                               │    │
│  │  [Share Event] [Join Event]                                  │    │
│  │                                                               │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  ╔═══════════════════════════════════════════════════════╗  │    │
│  │  ║  About This Event                                      ║  │    │ ← About Section
│  │  ╚═══════════════════════════════════════════════════════╝  │    │
│  │  Let's find the perfect brunch spot! Looking for          │    │
│  │  somewhere cozy with good coffee and better vibes.         │    │
│  │  Bonus points if they have outdoor seating! 🌞            │    │
│  │                                                               │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  ╔═══════════════════════════════════════════════════════╗  │    │
│  │  ║  Participants (12/20)                  [Manage]        ║  │    │ ← Participants
│  │  ╚═══════════════════════════════════════════════════════╝  │    │   Section
│  │                                                               │    │
│  │  ┌─────────┬─────────┬─────────┬─────────┬─────────┐       │    │
│  │  │ 👤      │ 👤      │ 👤      │ 👤      │ 👤      │       │    │
│  │  │ Sarah   │ John    │ Emily   │ Mike    │ Lisa    │       │    │
│  │  │ (Host)  │         │         │         │         │       │    │
│  │  └─────────┴─────────┴─────────┴─────────┴─────────┘       │    │
│  │  ┌─────────┬─────────┬─────────┬─────────┬─────────┐       │    │
│  │  │ 👤      │ 👤      │ 👤      │ 👤      │ 👤      │       │    │
│  │  │ David   │ Amy     │ Tom     │ Kate    │ Ben     │       │    │
│  │  └─────────┴─────────┴─────────┴─────────┴─────────┘       │    │
│  │  ┌─────────┬─────────┐                                      │    │
│  │  │ 👤      │ 👤      │                                      │    │
│  │  │ Chris   │ Alex    │                                      │    │
│  │  └─────────┴─────────┘                                      │    │
│  │                                                               │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  ╔═══════════════════════════════════════════════════════╗  │    │
│  │  ║  📍 Suggested Venues (5)              [+ Add Venue]    ║  │    │ ← Venues Section
│  │  ╚═══════════════════════════════════════════════════════╝  │    │   (Use existing
│  │                                                               │    │    CandidatesPanel)
│  │  [Tabs: All Venues | Top Voted | Map View]                  │    │
│  │                                                               │    │
│  │  ┌───────────────────────────────────────────────────┐      │    │
│  │  │  ⭐ Blue Bottle Coffee                      ❤️ 8  │      │    │
│  │  │  📍 0.5 km away · ⭐ 4.5 (230 reviews)            │      │    │
│  │  │  $$ · Open now · Coffee, Pastries                 │      │    │
│  │  │  [View Details] [Vote]                            │      │    │
│  │  └───────────────────────────────────────────────────┘      │    │
│  │                                                               │    │
│  │  ┌───────────────────────────────────────────────────┐      │    │
│  │  │  Tartine Bakery                            ❤️ 7   │      │    │
│  │  │  📍 0.8 km away · ⭐ 4.7 (450 reviews)            │      │    │
│  │  │  $$ · Open now · Bakery, Brunch                   │      │    │
│  │  │  [View Details] [Vote]                            │      │    │
│  │  └───────────────────────────────────────────────────┘      │    │
│  │                                                               │    │
│  │  [...more venues...]                                         │    │
│  │                                                               │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  ╔═══════════════════════════════════════════════════════╗  │    │
│  │  ║  Event Settings                        (Host Only)     ║  │    │ ← Host Controls
│  │  ╚═══════════════════════════════════════════════════════╝  │    │   (Only for hosts)
│  │                                                               │    │
│  │  Visibility: 🌐 Public                                       │    │
│  │  Status: ✅ Active                                           │    │
│  │  Participant Limit: 20                                       │    │
│  │  Voting: ✅ Enabled                                          │    │
│  │                                                               │    │
│  │  [Edit Event] [Close Event] [Delete Event]                  │    │
│  │                                                               │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

---

#### Layout Structure (Fixed Location Events)

```
┌──────────────────────────────────────────────────────────────────────┐
│  Where2Meet                              [My Events] [Profile] [☰]    │ ← Header
└──────────────────────────────────────────────────────────────────────┘
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                 🖼️ EVENT PHOTO                               │   │ ← Hero Image
│  │      [← Back to Feed]                              [HOST]    │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  🏀 Basketball Game                                          │    │ ← Event Header
│  │                                                               │    │
│  │  Hosted by @mike_jordan                                      │    │
│  │  🕐 Saturday, Oct 26, 2024 at 4:00 PM                       │    │
│  │  📍 Sunset Park Court 3, San Francisco                       │    │ ← Fixed venue
│  │                                                               │    │
│  │  👤👤👤👤 (+4 more)  8/12 participants                     │    │ ← No "In Progress"
│  │                                                               │    │
│  │  [Share Event] [Join Event]                                  │    │
│  │                                                               │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  ╔═══════════════════════════════════════════════════════╗  │    │
│  │  ║  About This Event                                      ║  │    │
│  │  ╚═══════════════════════════════════════════════════════╝  │    │
│  │  Casual pickup game! Bring your own ball if you have      │    │
│  │  one. All skill levels welcome. Let's have fun! 🏀        │    │
│  │                                                               │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  ╔═══════════════════════════════════════════════════════╗  │    │
│  │  ║  Participants (8/12)                   [Manage]        ║  │    │
│  │  ╚═══════════════════════════════════════════════════════╝  │    │
│  │  [Grid of participant avatars...]                            │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  ╔═══════════════════════════════════════════════════════╗  │    │
│  │  ║  📍 Meeting Location                                   ║  │    │ ← Location Section
│  │  ╚═══════════════════════════════════════════════════════╝  │    │   (Not Venues)
│  │                                                               │    │
│  │  ┌───────────────────────────────────────────────────┐      │    │
│  │  │  🏀 Sunset Park Court 3                           │      │    │
│  │  │  📍 Sunset Park, 7th Ave & Irving St              │      │    │
│  │  │     San Francisco, CA 94122                       │      │    │
│  │  │  ⭐ 4.6 (128 reviews) · Park · Free entry        │      │    │
│  │  │  ⏰ Open 6:00 AM - 10:00 PM                       │      │    │
│  │  │                                                    │      │    │
│  │  │  📱 [Get Directions] [View Photos]                │      │    │
│  │  └───────────────────────────────────────────────────┘      │    │
│  │                                                               │    │
│  │  ┌─ Mini Map Preview ───────────────────────────────┐      │    │
│  │  │              🗺️                                   │      │    │
│  │  │          📍 Single marker                         │      │    │
│  │  │         (venue location)                          │      │    │
│  │  └───────────────────────────────────────────────────┘      │    │
│  │                                                               │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  ╔═══════════════════════════════════════════════════════╗  │    │
│  │  ║  Event Settings                        (Host Only)     ║  │    │
│  │  ╚═══════════════════════════════════════════════════════╝  │    │
│  │  [Event settings controls...]                                 │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

**Key Differences from Collaborative Events:**
- ✅ Shows confirmed venue name in header
- ✅ "Meeting Location" section replaces "Suggested Venues"
- ✅ Single venue card with full details
- ✅ "Get Directions" CTA instead of voting
- ❌ No venue tabs (All Venues | Top Voted | Map View)
- ❌ No "+ Add Venue" button
- ❌ No voting UI
- ❌ No "In Progress X" indicator
- ❌ No "Find Meeting Point" tab

---

#### Component Breakdown

##### 1. Hero Image Section
**Purpose:** Large, eye-catching featured image at the top of the page

**Specifications:**
- Full-width image (spans entire viewport width)
- Height: 400px on desktop, 300px on tablet, 250px on mobile
- Object-fit: cover (maintains aspect ratio)
- Dark gradient overlay at bottom (for text readability if needed)
- Back button overlaid in top-left corner
- Host/status badge overlaid in top-right corner

**Image Handling:**
- If event has `background_image`: Display the image
- If no image: Display category-themed placeholder:
  - Food: Unsplash food/restaurant image
  - Sports: Sports/activity image
  - Entertainment: Entertainment venue image
  - Work: Coworking/office image
  - Music: Concert/music venue image
  - Outdoors: Nature/park image
  - Default: Generic group meetup image

**Overlay Elements:**
```tsx
<HeroImage>
  <BackButton>← Back to Feed</BackButton>
  <StatusBadge position="top-right">[HOST]</StatusBadge>
  <GradientOverlay /> {/* Bottom fade for readability */}
</HeroImage>
```

##### 2. Event Header Section
**Purpose:** Display core event information and primary actions below the hero image

**Elements:**
- Event title with emoji (large, prominent heading)
- Host information with profile link
- Date/time with formatted, human-readable display
- Location with map link icon
- Progress indicator + avatar circles (same row)
- Primary action buttons (Join/Share/Leave based on role)

**Layout:**
- White background with padding
- Clean separation from hero image above
- Organized in logical reading order

**States:**
```tsx
// Guest (not logged in)
<HeroActions>
  <Button variant="outline" icon="share">Share Event</Button>
  <Button variant="solid">Sign Up to Join</Button>
</HeroActions>

// Guest (logged in, not joined)
<HeroActions>
  <Button variant="outline" icon="share">Share Event</Button>
  <Button variant="solid" icon="plus">Join Event</Button>
</HeroActions>

// Participant (joined)
<HeroActions>
  <Button variant="outline" icon="share">Share Event</Button>
  <Button variant="outline" icon="exit">Leave Event</Button>
</HeroActions>

// Host
<HeroActions>
  <Button variant="outline" icon="share">Share Event</Button>
  <Button variant="solid" icon="settings">Manage Event</Button>
</HeroActions>
```

##### 3. About Section
**Purpose:** Display event description with formatting

**Features:**
- Rich text support (line breaks, emojis)
- Expandable for long descriptions ("Read more" link if > 300 chars)
- Empty state: "No description provided"

##### 4. Participants Section
**Purpose:** Show who's attending and manage participants

**Layout:**
- Grid of participant cards (5 per row on desktop, 3 on tablet, 2 on mobile)
- Each card shows:
  - Avatar (profile picture or initials)
  - Name
  - Badge for host
- "Manage" button (host only)

**Host Controls:**
```
Click "Manage" → Modal appears:
┌─────────────────────────────────────┐
│  Manage Participants           [×]  │
├─────────────────────────────────────┤
│                                     │
│  Sarah Chen (You - Host)            │
│  ─────────────────────────────      │
│  John Doe                    [×]    │
│  Emily Smith                 [×]    │
│  Mike Johnson                [×]    │
│  ...                                │
│                                     │
│  [× Remove] removes participant     │
│  and their votes/suggestions        │
│                                     │
└─────────────────────────────────────┘
```

**Participant States:**
- Active: Full color
- Host: Gold border or crown icon
- Offline: Grayed out (future feature)

##### 5. Venues Section
**Purpose:** Display and manage venue suggestions

**Features:**
- Reuse existing `CandidatesPanel` component
- Tab navigation:
  - **All Venues**: Show all suggested venues
  - **Top Voted**: Sort by vote count
  - **Map View**: Show venues on map
- "+ Add Venue" button (participants only)
- Each venue card shows:
  - Photo (if available)
  - Name, rating, distance
  - Price level, hours
  - Vote count with heart icon
  - Action buttons: [View Details] [Vote/Unvote]

**Venue Card States:**
```tsx
// Not voted
<VenueCard>
  <VoteButton variant="outline">🤍 Vote</VoteButton>
</VenueCard>

// Voted by user
<VenueCard highlight>
  <VoteButton variant="solid">❤️ Voted</VoteButton>
</VenueCard>

// Top voted (most votes)
<VenueCard topVoted>
  <Badge>🏆 Top Choice</Badge>
</VenueCard>
```

##### 5.1 Map View (Venues Tab)
**Purpose:** Visualize participant locations and venue candidates on an interactive map

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  [All Venues] [Top Voted] [Map View ✓]                      │ ← Tabs
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────┬──────────────────────┐  │
│  │                                │  Venues on Map       │  │
│  │                                │  ─────────────────── │  │
│  │                                │                      │  │
│  │        🗺️ MAP AREA            │  ⭐ Blue Bottle      │  │
│  │                                │  📍 0.5 km · ❤️ 8   │  │
│  │     📍 Participant pins        │  [Vote]              │  │
│  │     (blue circles)             │                      │  │
│  │                                │  🍰 Tartine Bakery   │  │
│  │     ⭐ Venue markers           │  📍 0.8 km · ❤️ 7   │  │
│  │     (with vote count)          │  [Vote]              │  │
│  │                                │                      │  │
│  │     🎯 Center point            │  ☕ Sightglass       │  │
│  │     (geometric center)         │  📍 1.2 km · ❤️ 5   │  │
│  │                                │  [Vote]              │  │
│  │     ⭕ Search radius           │                      │  │
│  │     (dashed circle)            │  [...more venues]    │  │
│  │                                │                      │  │
│  └────────────────────────────────┴──────────────────────┘  │
│                                                              │
│  Legend: 👤 Participants | ⭐ Venues | 🎯 Center | ⭕ Radius│
│                                                              │
│  [📍 Show My Location] [🔍 Search Area] [+ Add Venue]      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Map Features:**

1. **Participant Markers**
   - Blue circle pins for each participant location
   - Clustered when zoomed out (show count: "12")
   - Expand to individual pins on zoom
   - Click pin → Show participant name in popup
   - Semi-transparent to avoid cluttering

2. **Venue Markers**
   - Custom markers with star icon ⭐
   - Color-coded by votes:
     - 🟢 Green: Top voted (most votes)
     - 🟡 Yellow: Some votes (2-5 votes)
     - ⚪ White: No votes yet
   - Show vote count badge on marker
   - Larger size for top-voted venues
   - Click marker → Show venue info card

3. **Center Point**
   - 🎯 Target icon showing geometric center of all participants
   - Different color (red/orange) to stand out
   - Label: "Meeting Point Center"
   - Cannot be moved manually

4. **Search Radius**
   - Dashed circle showing venue search area
   - Default: 5km radius from center
   - Adjustable via slider: 1km - 20km
   - Shaded area outside radius (semi-transparent)

5. **Info Cards (Popup on Click)**
   ```
   Click venue marker →
   ┌─────────────────────────────┐
   │  ⭐ Blue Bottle Coffee      │
   │  ──────────────────────────  │
   │  📍 0.5 km from center      │
   │  ⭐ 4.5 (230 reviews)       │
   │  $$ · Open now              │
   │  ❤️ 8 votes                 │
   │                             │
   │  Coffee, Pastries, Wifi     │
   │                             │
   │  [View Details] [Vote]      │
   │  [Get Directions]           │
   └─────────────────────────────┘
   ```

6. **Side Panel (Venue List)**
   - Scrollable list of venues on right side (30% width)
   - Synchronized with map
   - Click venue in list → Highlight on map
   - Hover venue in list → Preview on map
   - Shows distance, votes, and quick vote button
   - Filter toggle: "Show only venues in radius"

**Map Controls:**

1. **Zoom Controls**
   - Standard +/- buttons
   - Mouse wheel zoom
   - Pinch to zoom (mobile)

2. **Map Type Toggle**
   - [Roadmap] [Satellite] [Terrain]
   - Default: Roadmap

3. **Location Controls**
   - "Show My Location" button
   - Centers map on user's location
   - Adds user pin if sharing location

4. **Search Radius Slider**
   ```
   Search Radius: [1km ●──────────── 20km]
                       5km
   ```
   - Adjusts circle on map in real-time
   - Shows estimated venue count
   - "Updating venues..." while fetching

5. **Filter Toggles**
   - ☑ Show participants
   - ☑ Show all venues
   - ☐ Show only voted venues
   - ☐ Show only open now

**User Interactions:**

**As Guest (Not Logged In):**
- ✅ View map with all markers
- ✅ Click markers to see info
- ❌ Cannot vote
- ❌ Cannot add venues
- CTA: "Sign up to vote on venues"

**As Logged In User (Not Joined):**
- ✅ View map
- ✅ Click markers
- ❌ Cannot vote yet
- CTA: "Join event to vote and suggest venues"

**As Participant:**
- ✅ Full map access
- ✅ Vote by clicking venue markers
- ✅ Add new venues by clicking map
- ✅ See your own location (if sharing)
- ✅ Get directions to venues

**As Host:**
- ✅ All participant features
- ✅ Remove venue suggestions
- ✅ Adjust search radius
- ✅ See all participant locations

**Add Venue from Map:**
```
Click "+ Add Venue" → Enter "search mode"
  1. Click anywhere on map
  2. Modal appears showing nearby places
  3. Select a place or search by name
  4. Click "Add to Event"
  5. Venue appears on map and in list
```

**Mobile Map View:**
```
┌───────────────────────────────┐
│  [All] [Top] [Map ✓]          │
├───────────────────────────────┤
│                               │
│     🗺️ FULL-SCREEN MAP        │
│                               │
│     (No side panel)           │
│                               │
│                               │
│     [Bottom Sheet slides up]  │
│                               │
└───────────────────────────────┘
      ▲
      │
┌─────┴─────────────────────────┐
│  ⭐ Blue Bottle Coffee         │ ← Bottom sheet
│  📍 0.5 km · ❤️ 8             │   (swipe up to expand)
│  [Vote] [Details]             │
└───────────────────────────────┘
```

**Performance Optimizations:**
- Lazy load map only when "Map View" tab is clicked
- Cluster markers when zoomed out (50+ markers)
- Debounce search radius updates (500ms)
- Cache tile images
- Limit venue markers to 100 (show "Load More")
- Reduce marker complexity on slow devices

**Accessibility:**
- Keyboard navigation for venue list
- Announce marker selections to screen readers
- High-contrast mode for markers
- Text alternatives for map info
- Skip-to-venue-list button

---

##### 6. Host Settings Section
**Purpose:** Event management controls (host only)

**Features:**
- Event status display
- Quick settings view:
  - Visibility (Public/Link Only)
  - Status (Active/Full/Closed)
  - Participant limit
  - Voting enabled/disabled
- Action buttons:
  - **Edit Event**: Open modal to edit details
  - **Close Event**: Stop accepting new participants
  - **Delete Event**: Remove event (with confirmation)

**Edit Event Modal:**
```
┌─────────────────────────────────────┐
│  Edit Event                    [×]  │
├─────────────────────────────────────┤
│                                     │
│  Title                              │
│  [Weekend Brunch Meetup]            │
│                                     │
│  Description                        │
│  [Textarea...]                      │
│                                     │
│  Meeting Time                       │
│  [Oct 26, 2024 at 11:00 AM]        │
│                                     │
│  Participant Limit                  │
│  [20]                               │
│                                     │
│  Status                             │
│  ○ Active                           │
│  ○ Closed                           │
│                                     │
│  [Cancel]        [Save Changes]     │
│                                     │
└─────────────────────────────────────┘
```

---

#### User Role Views

##### Guest (Not Logged In)
**Can See:**
- ✅ Event details (title, description, time, location)
- ✅ Participant count (but not individual names)
- ✅ Venue suggestions (but can't vote)
- ✅ Share button

**Cannot See:**
- ❌ Participant avatars/names
- ❌ Join button (shows "Sign Up to Join")
- ❌ Vote buttons
- ❌ Add venue button

**CTA:** Prompt to sign up/login to join and participate

##### Logged In User (Not Joined)
**Can See:**
- ✅ Everything guests can see
- ✅ Join button
- ✅ Participant avatars

**Actions:**
- ✅ Join event
- ✅ Share event
- ❌ Cannot vote yet
- ❌ Cannot suggest venues yet

##### Participant (Joined)
**Can See:**
- ✅ Full event details
- ✅ All participants
- ✅ All venues with voting
- ✅ Leave button

**Actions:**
- ✅ Vote on venues
- ✅ Add venue suggestions
- ✅ Share event
- ✅ Leave event

##### Host
**Can See:**
- ✅ Everything participants can see
- ✅ Host settings section
- ✅ Manage participants button

**Actions:**
- ✅ All participant actions
- ✅ Edit event details
- ✅ Remove participants
- ✅ Close event
- ✅ Delete event
- ✅ View participant contact info (if available)

---

#### Interactive Elements

##### Share Event
**Click "Share Event" →**
```
┌─────────────────────────────────────┐
│  Share Event                   [×]  │
├─────────────────────────────────────┤
│                                     │
│  Copy Link                          │
│  [https://where2meet.app/event/...] │
│  [Copy]                             │
│                                     │
│  Or share via:                      │
│  [📱 WhatsApp] [📧 Email]          │
│  [🐦 Twitter]  [💬 Messages]       │
│                                     │
└─────────────────────────────────────┘
```

##### Join Event Confirmation
**Click "Join Event" →**
```
┌─────────────────────────────────────┐
│  Join Weekend Brunch Meetup?   [×]  │
├─────────────────────────────────────┤
│                                     │
│  You'll be able to:                 │
│  ✓ Suggest meeting venues           │
│  ✓ Vote on venue options            │
│  ✓ See other participants           │
│  ✓ Chat with the group (soon)       │
│                                     │
│  The host can see your profile.     │
│                                     │
│  [Cancel]          [Join Event]     │
│                                     │
└─────────────────────────────────────┘
```

##### Leave Event Confirmation
**Click "Leave Event" →**
```
┌─────────────────────────────────────┐
│  Leave Event?                  [×]  │
├─────────────────────────────────────┤
│                                     │
│  Are you sure you want to leave?    │
│                                     │
│  ⚠️  Your votes and venue           │
│  suggestions will be removed.       │
│                                     │
│  [Cancel]          [Leave Event]    │
│                                     │
└─────────────────────────────────────┘
```

---

#### Responsive Design

##### Desktop (> 1024px)
- Two-column layout option:
  - Left: Event info, participants
  - Right: Venues and map
- Full-width hero section
- 5 participant cards per row

##### Tablet (768px - 1024px)
- Single column layout
- 3 participant cards per row
- Collapsible sections

##### Mobile (< 768px)
- Full-width layout
- 2 participant cards per row
- Sticky action bar at bottom:
  ```
  ┌─────────────────────────────────┐
  │ [Share]      [Join Event]       │
  └─────────────────────────────────┘
  ```
- Tabs for venues become scrollable chips

---

#### Loading & Error States

##### Loading
```
Show skeleton UI:
- Hero: Gray blocks for text
- Participants: Empty avatar circles
- Venues: Card skeletons
```

##### Error States
```
Event not found:
  → "This event doesn't exist or has been deleted"
  → [Go to Events Feed]

Event closed:
  → Show event details but:
  → "This event is closed"
  → Disable Join button

Event full:
  → "This event is full (20/20)"
  → Disable Join button
  → Show waiting list option (future)

Permission denied:
  → "This is a private event"
  → [Request to Join] (future)
```

---

#### Animations & Transitions

**Page Load:**
- Fade in from bottom (hero section)
- Stagger participant avatars (50ms delay each)
- Slide in venue cards (100ms delay each)

**Join/Leave:**
- Smooth transition on participant count update
- Flash animation on progress indicator
- Add/remove participant with fade animation

**Vote:**
- Heart icon bounces when clicked
- Vote count increments with scale animation
- Move voted card to top with smooth reorder

---

#### Accessibility

**Keyboard Navigation:**
- Tab through all interactive elements
- Enter to activate buttons
- Escape to close modals

**Screen Readers:**
- Proper ARIA labels on all buttons
- Announce participant count changes
- Announce vote changes
- Role descriptions for host/participant

**Focus Management:**
- Focus trap in modals
- Return focus after modal close
- Visible focus indicators

---

#### Performance Considerations

**Optimization:**
- Lazy load venue photos
- Infinite scroll for large participant lists
- Cache event data in local storage
- Optimistic UI updates for votes
- Debounce venue search

**Data Management:**
- Real-time updates via WebSocket (future)
- Polling every 30s for participant changes
- Cache participant avatars
- Prefetch venue details on hover

---

**Updated**: 2025-10-22
**Next Steps**: Implement EventDetailPage component with all sections

---

## Data Model

### Event Schema

```typescript
interface Event {
  id: string;
  title: string;
  description?: string;

  // Host & Participants
  host_id: string;
  host_name: string;
  participant_ids: string[];
  participant_count: number;
  participant_limit?: number;

  // Time & Location
  meeting_time: string; // ISO 8601
  location_area: string; // "Downtown SF", "Brooklyn, NY"
  location_coords?: {
    lat: number;
    lng: number;
  };

  // Categorization
  category?: 'food' | 'sports' | 'entertainment' | 'work' | 'music' | 'outdoors' | 'other';

  // Settings
  visibility: 'public' | 'link_only';
  allow_vote: boolean;

  // Computed Fields
  venue_count: number;
  average_rating?: number;
  distance_km?: number; // Distance from user

  // Status
  status: 'active' | 'full' | 'closed' | 'past';

  // Timestamps
  created_at: string;
  updated_at: string;
}
```

### Event List Response

```typescript
interface EventsListResponse {
  events: Event[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}
```

---

## API Endpoints

### 1. List Events
```
GET /api/v1/events/feed

Query Parameters:
  - date: YYYY-MM-DD (filter by meeting date)
  - near_me: boolean (filter by user location)
  - category: string (food, sports, etc.)
  - page: number (default: 1)
  - page_size: number (default: 20)
  - lat: number (user latitude)
  - lng: number (user longitude)

Response:
{
  "events": [Event[]],
  "total": 45,
  "page": 1,
  "page_size": 20,
  "has_more": true
}
```

### 2. Create Event
```
POST /api/v1/events/feed

Request Body:
{
  "title": "Weekend Brunch Meetup",
  "description": "Let's find the perfect brunch spot!",
  "meeting_time": "2025-10-26T11:00:00Z",
  "location_area": "Downtown SF",
  "location_coords": { "lat": 37.7749, "lng": -122.4194 },
  "category": "food",
  "participant_limit": 20,
  "visibility": "public",
  "allow_vote": true
}

Response:
{
  "event": Event,
  "join_token": "abc123"
}
```

### 3. Get Event Details
```
GET /api/v1/events/feed/:event_id

Response:
{
  "event": Event,
  "participants": User[],
  "venues": Candidate[],
  "user_role": "host" | "participant" | "guest"
}
```

### 4. Join Event
```
POST /api/v1/events/feed/:event_id/join

Request Body: {}

Response:
{
  "success": true,
  "event": Event,
  "join_token": "abc123"
}
```

### 5. Leave Event
```
POST /api/v1/events/feed/:event_id/leave

Request Body: {}

Response:
{
  "success": true
}
```

### 6. Update Event (Host Only)
```
PATCH /api/v1/events/feed/:event_id

Request Body:
{
  "title"?: string,
  "description"?: string,
  "meeting_time"?: string,
  "participant_limit"?: number,
  "status"?: "active" | "closed"
}

Response:
{
  "event": Event
}
```

### 7. Delete Event (Host Only)
```
DELETE /api/v1/events/feed/:event_id

Response:
{
  "success": true
}
```

---

## State Management

### Frontend State

```typescript
// Events Feed State
interface EventsFeedState {
  events: Event[];
  loading: boolean;
  error: string | null;

  // Filters
  selectedDate: Date | null;
  filterNearMe: boolean;
  selectedCategory: string | null;

  // Pagination
  currentPage: number;
  hasMore: boolean;
  totalEvents: number;

  // User state
  joinedEventIds: string[];
  hostedEventIds: string[];
}

// Actions
type EventsFeedAction =
  | { type: 'FETCH_EVENTS_REQUEST' }
  | { type: 'FETCH_EVENTS_SUCCESS'; payload: EventsListResponse }
  | { type: 'FETCH_EVENTS_FAILURE'; error: string }
  | { type: 'SET_DATE_FILTER'; date: Date | null }
  | { type: 'SET_NEAR_ME_FILTER'; enabled: boolean }
  | { type: 'SET_CATEGORY_FILTER'; category: string | null }
  | { type: 'JOIN_EVENT_SUCCESS'; eventId: string }
  | { type: 'LEAVE_EVENT_SUCCESS'; eventId: string }
  | { type: 'LOAD_MORE' };
```

---

## User Permissions

### Guest (Not Logged In)
- ✅ Browse public events
- ✅ View event details
- ❌ Post events
- ❌ Join events
- ❌ Vote on venues
- ❌ Suggest venues

### Logged In User
- ✅ Browse public events
- ✅ View event details
- ✅ Post events (becomes host)
- ✅ Join events
- ✅ Leave events
- ✅ Vote on venues (if joined)
- ✅ Suggest venues (if joined)

### Event Host
- ✅ All logged-in user permissions
- ✅ Edit event details
- ✅ Close event
- ✅ Delete event
- ✅ Remove participants
- ✅ See participant contact info

### Event Participant
- ✅ View event details
- ✅ Vote on venues
- ✅ Suggest venues
- ✅ Leave event
- ❌ Edit event
- ❌ Delete event

---

## Event Status Flow

```
[Create Event]
      ↓
  [Active] ────────────────┐
      ↓                    │
  [Full] (limit reached)   │
      ↓                    │
  [Closed] (host closes)   │
      ↓                    │
  [Past] (time passed) ←───┘
```

**Active:**
- Accepting new participants
- Show in feed
- Allow joining

**Full:**
- Participant limit reached
- Show in feed with "FULL" badge
- Don't show Join button

**Closed:**
- Host manually closed
- Don't show in feed
- Still accessible via direct link
- Don't allow new joins

**Past:**
- Meeting time has passed
- Show in "Past Events" section
- Grayed out, read-only

---

## Filters & Sorting

### Date Filter
```typescript
const weekDays = getNext7Days(); // TODAY, TUE, WED, etc.

// Click date → filter events where meeting_time is on that date
// Click again → clear filter (show all)
```

### Location Filter (Near Me)
```typescript
// Request user location permission
// Send lat/lng to API
// API returns events sorted by distance
// Show distance on cards (2.3 km, 5.1 km, etc.)
```

### Category Filter
```typescript
const categories = [
  { id: 'food', emoji: '☕', label: 'Food & Drinks' },
  { id: 'sports', emoji: '🏀', label: 'Sports' },
  { id: 'entertainment', emoji: '🎬', label: 'Entertainment' },
  { id: 'work', emoji: '💼', label: 'Work & Study' },
  { id: 'music', emoji: '🎵', label: 'Music & Arts' },
  { id: 'outdoors', emoji: '🌳', label: 'Outdoors' },
];
```

### Sort Options (Future)
- Newest first (default)
- Closest to me
- Most participants
- Happening soon
- Highest rated

---

## Edge Cases & Error Handling

### 1. Empty States
```
No events found for this date
  → Show empty state illustration
  → "No events on this day. Be the first to post!"
  → [Post Event] button

No events near you
  → "No events near you yet"
  → "Try browsing all events or post your own"
  → [View All Events] [Post Event]

No events in category
  → "No [category] events yet"
  → [Post Event]
```

### 2. Error States
```
Network error
  → "Couldn't load events. Check your connection."
  → [Retry] button

Event full
  → User clicks Join on full event
  → "This event is full (20/20)"
  → Disable join, show "Full" badge

Event closed
  → User tries to join closed event
  → "This event is no longer accepting participants"
  → Show event details but disable join

User already joined
  → User clicks Join on event they're in
  → "You're already in this event"
  → Show [View Event] button instead

Unauthorized
  → Guest tries to join event
  → "Sign up to join events"
  → [Sign Up] [Log In]
```

### 3. Loading States
```
Initial load
  → Show skeleton cards (6-7 cards)

Load more
  → Show spinner at bottom
  → Append new cards

Join event
  → Show spinner on Join button
  → Disable button during request

Post event
  → Show spinner in modal
  → Disable submit during request
```

### 4. Validation
```
Post Event Form:
  - Title: required, max 100 chars
  - Description: optional, max 500 chars
  - Meeting time: required, must be future
  - Location: required, min 3 chars
  - Participant limit: optional, min 2, max 100
```

---

## Mobile Considerations

### Mobile Layout
```
On mobile (< 768px):
  - Events feed is a separate page (/events)
  - Full-width cards
  - Sticky date selector at top
  - Bottom navigation
  - Post button is FAB (floating action button)
```

### Mobile Interactions
```
- Pull to refresh
- Infinite scroll (no "Load More" button)
- Swipe date selector horizontally
- Tap card → go to detail page
- Long-press card → show context menu (share, save)
```

---

## Analytics & Metrics

### Track These Events:
```javascript
// Feed interactions
analytics.track('events_feed_viewed');
analytics.track('events_feed_filtered', { filter_type, value });
analytics.track('events_feed_sorted', { sort_by });

// Event actions
analytics.track('event_posted', { category, visibility });
analytics.track('event_viewed', { event_id, source });
analytics.track('event_joined', { event_id, participant_count });
analytics.track('event_left', { event_id });
analytics.track('event_shared', { event_id, share_method });

// Engagement
analytics.track('load_more_clicked', { page });
analytics.track('near_me_toggled', { enabled });
```

---

## SEO Considerations

### Public Event Pages
```html
<!-- Event detail pages should be SEO-friendly -->
<title>Weekend Brunch Meetup - Oct 26 in Downtown SF | Where2Meet</title>
<meta name="description" content="Join 12 people for Weekend Brunch Meetup on Saturday, Oct 26 at 11:00 AM in Downtown SF. Find the perfect meeting spot together.">
<meta property="og:title" content="Weekend Brunch Meetup">
<meta property="og:description" content="Join us for brunch in Downtown SF!">
<meta property="og:image" content="[Event preview image]">
```

### Events Feed Page
```html
<title>Discover Group Events Near You | Where2Meet</title>
<meta name="description" content="Browse public group events, find people to meet up with, and discover the perfect meeting locations together.">
```

---

## Future Enhancements

### Phase 2
- [ ] Event comments/chat
- [ ] RSVP system (yes/no/maybe)
- [ ] Event tags/hashtags
- [ ] Save/bookmark events
- [ ] Follow users
- [ ] Recommended events

### Phase 3
- [ ] Recurring events
- [ ] Event series
- [ ] Co-hosts
- [ ] Event photos/gallery
- [ ] Check-ins
- [ ] Event ratings/reviews

### Phase 4
- [ ] Paid/ticketed events
- [ ] Private groups
- [ ] Event invitations
- [ ] Calendar integration
- [ ] Email notifications
- [ ] Push notifications

---

## Implementation Summary: Two Event Types

### Key Database Schema Additions

**Events Table - New Field:**
```sql
location_type ENUM('fixed', 'collaborative') NOT NULL DEFAULT 'collaborative'
fixed_venue_id VARCHAR(255) NULL  -- Google Place ID for fixed location events
fixed_venue_name VARCHAR(255) NULL
fixed_venue_address TEXT NULL
fixed_venue_lat DECIMAL(10, 8) NULL
fixed_venue_lng DECIMAL(11, 8) NULL
```

### Frontend Logic Flow

**When Posting Event:**
```
1. User selects Location Type:
   - Fixed Location → Show Google Places search
   - Find Together → Show area/neighborhood input

2. On "Post Event":
   - Fixed: Save venue details, set location_type='fixed'
   - Collaborative: Save area only, set location_type='collaborative'
```

**When Displaying Event Card:**
```
if (event.location_type === 'fixed') {
  Show: "📍 [venue_name]"
  Show: participant count, time
  Hide: progress indicator, venue count
  Button: "Join"
} else {
  Show: "📍 [area] · 🗺️ Finding location"
  Show: "In Progress X · Y venues"
  Button: "Join to Vote"
}
```

**When Displaying Event Detail Page:**
```
if (event.location_type === 'fixed') {
  Components:
  - EventHeroImage
  - EventHeader (with venue name)
  - EventAbout
  - EventParticipants
  - MeetingLocation (single venue card + map)
  - EventHostSettings (if host)

  Hide:
  - EventVenues (voting section)
  - "Find Meeting Point" tab
} else {
  Components:
  - EventHeroImage
  - EventHeader (with area)
  - EventAbout
  - EventParticipants
  - EventVenues (full voting UI)
  - EventHostSettings (if host)

  Show:
  - "Find Meeting Point" tab
  - Progress indicators
  - Voting UI
}
```

### API Endpoint Modifications

**POST /events/feed**
```json
{
  "title": "Basketball Game",
  "description": "...",
  "meeting_time": "2024-10-26T16:00:00Z",
  "location_type": "fixed",  // NEW
  "fixed_venue_id": "ChIJ...",  // NEW - required if location_type='fixed'
  "fixed_venue_name": "Sunset Park Court 3",  // NEW
  "fixed_venue_address": "...",  // NEW
  "fixed_venue_lat": 37.7749,  // NEW
  "fixed_venue_lng": -122.4194,  // NEW
  "location_area": "Sunset Park, SF",  // Optional for fixed, required for collaborative
  "category": "sports",
  "participant_limit": 12,
  "visibility": "public"
}
```

**GET /events/feed Response:**
```json
{
  "id": "event-123",
  "title": "Basketball Game",
  "location_type": "fixed",  // NEW
  "fixed_venue_name": "Sunset Park Court 3",  // NEW - only if fixed
  "location_area": "Sunset Park, SF",
  "venue_count": 0,  // NEW - only for collaborative
  // ... other fields
}
```

### Component Checklist

**New Components Needed:**
- [ ] LocationTypeSelector (radio buttons in PostEventModal)
- [ ] VenueSearch (Google Places autocomplete for fixed events)
- [ ] MeetingLocationCard (single venue display for fixed events)
- [ ] LocationTypeBadge (🗺️ indicator for collaborative events)

**Modified Components:**
- [ ] PostEventModal - Add location type selection
- [ ] EventCard - Show different info based on location_type
- [ ] EventDetailPage - Conditional rendering based on location_type
- [ ] EventHeader - Show venue name vs. area

---

## Implementation Checklist

### Backend
- [ ] Create events_feed table in database
- [ ] Create event participants table
- [ ] Implement GET /events/feed endpoint
- [ ] Implement POST /events/feed endpoint
- [ ] Implement GET /events/feed/:id endpoint
- [ ] Implement POST /events/feed/:id/join endpoint
- [ ] Implement POST /events/feed/:id/leave endpoint
- [ ] Implement PATCH /events/feed/:id endpoint
- [ ] Implement DELETE /events/feed/:id endpoint
- [ ] Add distance calculation (PostGIS/geospatial)
- [ ] Add pagination
- [ ] Add filtering (date, location, category)
- [ ] Add permissions checks
- [ ] Add rate limiting

### Frontend
- [ ] Create EventCard component
- [ ] Create PostEventModal component
- [ ] Create EventDetailPage component
- [ ] Create DateSelector component (✅ Done)
- [ ] Create EventStatusBadge component
- [ ] Implement fetch events API call
- [ ] Implement post event API call
- [ ] Implement join event API call
- [ ] Implement leave event API call
- [ ] Add state management (Redux/Context)
- [ ] Add loading states
- [ ] Add error states
- [ ] Add empty states
- [ ] Add form validation
- [ ] Add infinite scroll / pagination
- [ ] Add geolocation for "Near Me"
- [ ] Add mobile responsive layout
- [ ] Add analytics tracking

### Testing
- [ ] Unit tests for API endpoints
- [ ] Integration tests for event flows
- [ ] E2E tests for user journeys
- [ ] Test permissions
- [ ] Test edge cases
- [ ] Test mobile layout
- [ ] Load testing

---

**Last Updated**: 2025-10-22
**Status**: Planning Complete - Ready for Implementation
**Next Steps**: Backend API implementation, then frontend components
