# Where2Meet - Homepage Layout Design

## Overview
The homepage is divided into **3 main sections**:
1. **Create New Event** (Top Left) - For organizers planning group meetings
2. **Venue Lists** (Bottom Left) - For users sharing and viewing favorite venue collections
3. **Events Feed** (Right Panel) - For users browsing and posting public events

---

## Desktop Layout (> 1024px)

```
┌───────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    NAVIGATION BAR                                             │
│  Logo │ Language Switcher │ My Events │ Login/Signup (or User Menu)                          │
└───────────────────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┬──────────────────────────┐
│                                                                    │                          │
│         📝 CREATE NEW EVENT                                        │    📅 EVENTS FEED        │
│         (Top Left - 65% width)                                     │    (Right - 35% width)   │
│                                                                    │    Full Height           │
│  ┌────────────────────────────────────────┐  │                                                │
│  │ Event Title                            │  │  ┌──────────────────────────────────────────┐  │
│  │ [Input field]                          │  │  │  [Post New Event] [Browse All]           │  │
│  └────────────────────────────────────────┘  │  └──────────────────────────────────────────┘  │
│                                              │                                                │
│  ┌────────────────────────────────────────┐  │  ┌──────────────────────────────────────────┐  │
│  │ Category                               │  │  │ 📅 Weekend Brunch Meetup                │  │
│  │ [Dropdown: Restaurant, Cafe, Park...   │  │  │ Downtown Cafes                          │  │
│  └────────────────────────────────────────┘  │  │ 👥 12 people · ⭐ 4.5 rating          │  │
│                                              │  │ 📍 2.3 km away · ☕ Cafe               │  │
│  ☑️ Allow Voting                            │  │ [View Details] [Join Event]             │  │
│                                              │  └──────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────┐  │                                                │
│  │       [Create Event Button]            │  │  ┌──────────────────────────────────────────┐  │
│  └────────────────────────────────────────┘  │  │ 🏀 Basketball Pickup Game               │  │
│                                              │  │ Central Park Courts                     │  │
│  ───────────────────────────────────────     │  │ 👥 8 people · ⭐ 4.8 rating           │  │
│                                              │  │ 📍 0.8 km away · 🏀 Sports             │  │
│  [Join Event with Link]                      │  │ [View Details] [Join Event]             │  │
│                                              │  └──────────────────────────────────────────┘  │
├────────────────────────────────────────────────────────────────────┤                          │
│                                                                    │  ┌────────────────────┐  │
│      ⭐ OTHER PEOPLE'S LISTS                                       │  │ 🎬 Movie Night     │  │
│      (Bottom Left - 65% width)                                     │  │ This Friday        │  │
│                                              │  │ 👥 15 people · ⭐ 4.6 rating          │  │
│  ┌────────────────────────────────────────┐  │  │ 📍 3.5 km away · 🎭 Entertainment      │  │
│  │ 🍜 Best Ramen in Tokyo                 │  │  │ [View Details] [Join Event]             │  │
│  │ by @foodie_explorer                    │  │  └──────────────────────────────────────────┘  │
│  │ 📍 12 venues · ❤️ 234 likes           │  │                                                │
│  │                                        │  │  ┌──────────────────────────────────────────┐  │
│  │ Preview:                               │  │  │ ☕ Coffee & Code Meetup                 │  │
│  │ 1. Ichiran Ramen ⭐ 4.8               │  │  │ Tech Hub Cafe                           │  │
│  │ 2. Ippudo ⭐ 4.7                      │  │  │ 👥 6 people · ⭐ 4.9 rating           │  │
│  │ 3. Afuri ⭐ 4.6                       │  │  │ 📍 1.2 km away · 💻 Tech               │  │
│  │                                        │  │  │ [View Details] [Join Event]             │  │
│  │ [View Full List] [Save]                │  │  └──────────────────────────────────────────┘  │
│  └────────────────────────────────────────┘  │                                                │
│                                              │  ┌──────────────────────────────────────────┐  │
│  ┌────────────────────────────────────────┐  │  │ 🍕 Pizza Tour & Tasting                 │  │
│  │ ☕ Best Coffee Shops - NYC             │  │  │ Little Italy District                   │  │
│  │ by @coffee_addict                      │  │  │ 👥 10 people · ⭐ 4.7 rating          │  │
│  │ 📍 18 venues · ❤️ 567 likes           │  │  │ 📍 4.1 km away · 🍕 Food               │  │
│  │                                        │  │  │ [View Details] [Join Event]             │  │
│  │ Preview:                               │  │  └──────────────────────────────────────────┘  │
│  │ 1. Blue Bottle ⭐ 4.9                 │  │                                                │
│  │ 2. La Colombe ⭐ 4.8                  │  │  ┌──────────────────────────────────────────┐  │
│  │ 3. Stumptown ⭐ 4.7                   │  │  │ 🏋️ Morning Workout Group                │  │
│  │                                        │  │  │ FitLife Gym                             │  │
│  │ [View Full List] [Save]                │  │  │ 👥 20 people · ⭐ 5.0 rating          │  │
│  └────────────────────────────────────────┘  │  │ 📍 0.5 km away · 💪 Fitness            │  │
│                                              │  │ [View Details] [Join Event]             │  │
│  ┌────────────────────────────────────────┐  │  └──────────────────────────────────────────┘  │
│  │ 🏋️ Best Gyms for CrossFit             │  │                                                │
│  │ by @fitness_freak                      │  │  ┌──────────────────────────────────────────┐  │
│  │ 📍 8 venues · ❤️ 123 likes            │  │  │ 🎵 Jazz Night at Blue Note              │  │
│  │                                        │  │  │ Blue Note Jazz Club                     │  │
│  │ [View Full List] [Save]                │  │  │ 👥 25 people · ⭐ 4.8 rating          │  │
│  └────────────────────────────────────────┘  │  │ 📍 2.8 km away · 🎶 Music              │  │
│                                              │  │ [View Details] [Join Event]             │  │
│  [Create Your List] [View All Lists]         │  └──────────────────────────────────────────┘  │
│                                              │                                                │
│                                              │              [Load More Events]                │
│                                              │                                                │
└──────────────────────────────────────────────┴────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────────────────────────┐
│                                        FOOTER                                                 │
│                   About │ Help │ Privacy │ Terms │ Contact                                   │
└───────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Tablet Layout (768px - 1024px)

```
┌─────────────────────────────────────────────────────┐
│             NAVIGATION BAR (Condensed)              │
│  ☰ Menu │ Logo │ Login                             │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│               TABBED INTERFACE                      │
│  [📝 Create] [📅 Events] [⭐ Lists]                │
│  ┌───────────────────────────────────────────────┐  │
│  │                                               │  │
│  │          Active Tab Content                   │  │
│  │       (Full width, swap on tab)               │  │
│  │                                               │  │
│  │                                               │  │
│  │                                               │  │
│  │                                               │  │
│  │                                               │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## Mobile Layout (< 768px)

### Each Feature is a Separate Page

**Homepage (/):**
```
┌─────────────────────────────────┐
│  ☰  Where2Meet         [Login]  │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│                                 │
│      🌍 Where2Meet Logo         │
│                                 │
│   Find the perfect place to     │
│           meet                  │
│                                 │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│   CHOOSE YOUR ACTION            │
│                                 │
│  ┌───────────────────────────┐  │
│  │    🎯 ORGANIZER           │  │
│  │                           │  │
│  │  Create Group Event       │  │
│  │  Plan the perfect meetup  │  │
│  │                           │  │
│  │  [Get Started →]          │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │    🔍 EXPLORER            │  │
│  │                           │  │
│  │  Discover Events          │  │
│  │  Join activities near you │  │
│  │                           │  │
│  │  [Browse Events →]        │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │    ⭐ SOCIAL              │  │
│  │                           │  │
│  │  Share Your Lists         │  │
│  │  Discover venue guides    │  │
│  │                           │  │
│  │  [Explore Lists →]        │  │
│  └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

**Create Event Page (/create):**
```
┌─────────────────────────────────┐
│  ← Back    Create Event         │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│                                 │
│  📝 New Event                   │
│                                 │
│  ┌───────────────────────────┐  │
│  │ Event Title               │  │
│  │ [Input field]             │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │ Category                  │  │
│  │ [Dropdown ▼]              │  │
│  └───────────────────────────┘  │
│                                 │
│  ☑️ Allow Voting               │
│                                 │
│  ┌───────────────────────────┐  │
│  │   [Create Event]          │  │
│  └───────────────────────────┘  │
│                                 │
│  ─────────────────────────────  │
│                                 │
│  Already have a link?           │
│  [Join Event with Link]         │
│                                 │
└─────────────────────────────────┘
```

**Events Feed Page (/events):**
```
┌─────────────────────────────────┐
│  ← Back    Discover Events      │
│                    [+ Post]     │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  🔍 [Search events...]          │
│  [Filter ▼] [Sort ▼]            │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  ┌───────────────────────────┐  │
│  │ 📅 Weekend Brunch Meetup  │  │
│  │ Downtown Cafes            │  │
│  │ 👥 12 · ⭐ 4.5 · 📍 2.3km│  │
│  │                           │  │
│  │ [View] [Join]             │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │ 🏀 Basketball Pickup Game │  │
│  │ Central Park Courts       │  │
│  │ 👥 8 · ⭐ 4.8 · 📍 0.8km │  │
│  │                           │  │
│  │ [View] [Join]             │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │ 🎬 Movie Night            │  │
│  │ AMC Theater & Dinner      │  │
│  │ 👥 15 · ⭐ 4.6 · 📍 3.5km│  │
│  │                           │  │
│  │ [View] [Join]             │  │
│  └───────────────────────────┘  │
│                                 │
│          [Load More]            │
│                                 │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  [Home] [Events] [Lists] [Me]   │
└─────────────────────────────────┘
```

**Venue Lists Page (/lists):**
```
┌─────────────────────────────────┐
│  ← Back    Venue Lists          │
│                    [+ Create]   │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  🔍 [Search lists...]           │
│  [Category ▼] [Sort ▼]          │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  ┌───────────────────────────┐  │
│  │ 🍜 Best Ramen in Tokyo    │  │
│  │ by @foodie_explorer       │  │
│  │ 📍 12 venues · ❤️ 234     │  │
│  │                           │  │
│  │ Preview:                  │  │
│  │ 1. Ichiran ⭐ 4.8        │  │
│  │ 2. Ippudo ⭐ 4.7         │  │
│  │ 3. Afuri ⭐ 4.6          │  │
│  │                           │  │
│  │ [View] [Save]             │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │ ☕ Best Coffee Shops NYC  │  │
│  │ by @coffee_addict         │  │
│  │ 📍 18 venues · ❤️ 567     │  │
│  │                           │  │
│  │ Preview:                  │  │
│  │ 1. Blue Bottle ⭐ 4.9    │  │
│  │ 2. La Colombe ⭐ 4.8     │  │
│  │ 3. Stumptown ⭐ 4.7      │  │
│  │                           │  │
│  │ [View] [Save]             │  │
│  └───────────────────────────┘  │
│                                 │
│          [Load More]            │
│                                 │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  [Home] [Events] [Lists] [Me]   │
└─────────────────────────────────┘
```

---

## Layout Breakdown

### Desktop Layout

#### Dimensions
- **Container Max Width**: `1400px` (wider layout)
- **Left Column**: 65% width
  - Top: Create Event (50% height, min 400px)
  - Bottom: Venue Lists (50% height, scrollable)
- **Right Panel**: 35% width
  - Events Feed (100% height, scrollable)
- **Column Gap**: `3rem` (48px)
- **Row Gap**: `2rem` (32px)

#### Left Column - Top: 📝 CREATE NEW EVENT
**Purpose:** Quick event creation for organizers

**Content:**
- Event Title Input
- Category Dropdown (restaurant, cafe, bar, park, gym, library, movie theater, basketball court)
- Allow Voting Checkbox
- **[Create Event]** Button (Primary CTA)
- Divider line
- **[Join Event with Link]** Button (Secondary action)

**Visual Style:**
- White card with shadow
- Gradient blue-to-green CTA button
- Compact vertical form
- Clear spacing between elements

---

#### Left Column - Bottom: ⭐ OTHER PEOPLE'S LISTS
**Purpose:** Discover curated venue collections from the community

**Content:**
- 3-4 Featured venue lists (scrollable)
- Each list card shows:
  - List emoji/icon + Title
  - Creator username (@username)
  - Venue count + Like count
  - Preview of top 3 venues with ratings
  - **[View Full List]** and **[Save]** buttons
- **[Create Your List]** Button (Primary CTA)
- **[View All Lists]** Link

**Visual Style:**
- Stacked cards with borders
- Orange accent color (#f59e0b)
- User attribution prominent
- Preview venue items with star ratings
- Scroll overflow for more lists

---

#### Right Panel: 📅 EVENTS FEED (Full Height)
**Purpose:** Browse and join public events, or post your own

**Header:**
- **[Post New Event]** Button (Primary CTA)
- **[Browse All]** Link
- Filter/Sort options (dropdown or toggles)

**Content:**
- Scrollable feed of event cards
- Each event card shows:
  - Event emoji/icon + Title
  - Location/Area name
  - Participant count + Average rating
  - Distance from user + Category tag
  - **[View Details]** and **[Join Event]** buttons
- Infinite scroll or **[Load More]** button

**Visual Style:**
- Purple accent color (#9333ea)
- Card-based layout with hover effects
- Category badges with different colors
- Clear visual hierarchy
- Vertical scroll

---

### Mobile Layout

#### Navigation Structure
Each feature is a **separate page** with its own route:

1. **Homepage (/)** - Landing page with 3 cards to choose action
2. **Create Event Page (/create)** - Event creation form
3. **Events Feed Page (/events)** - Browse and join events
4. **Venue Lists Page (/lists)** - Browse and save venue lists

#### Bottom Navigation Bar
- **[Home]** - Go to homepage
- **[Events]** - Go to events feed
- **[Lists]** - Go to venue lists
- **[Me]** - User profile / My events

#### Top Navigation Bar
- **← Back** button (on sub-pages)
- **Page Title** (center)
- **Action Button** (right) - context-specific (Login, + Post, + Create, etc.)

---

## Color Scheme

### Section Colors
- **Create Event (Top Left)**: Blue-Green gradient `#2563eb → #08c605`
- **Venue Lists (Bottom Left)**: Orange accent `#f59e0b`
- **Events Feed (Right Panel)**: Purple accent `#9333ea`

### Primary Colors
- **Where2Meet Green**: `#08c605` (Primary CTA, accents)
- **Black**: `#000000` (Text, backgrounds)
- **White**: `#FFFFFF` (Cards, text on dark)

### Background
- Desktop: Light gradient `from-blue-50 via-white to-green-50`
- Mobile: White background for better readability

---

## Interactive Elements

### Desktop Navigation
- All 3 sections are visible on the homepage
- Users can scroll within each section independently
- CTAs in each section navigate to dedicated full pages when needed

### Mobile Navigation
- Homepage shows 3 action cards to choose your path
- Each card navigates to a dedicated full-screen page
- Bottom navigation for quick switching between sections
- Back button returns to previous page

---

## Responsive Behavior

### Desktop (> 1024px)
- 2-column layout (Left 35%, Right 65%)
- Left column split into top/bottom (50/50)
- All sections visible simultaneously
- Max width: `1400px` (centered with auto margins)
- Hover effects and animations active
- Sticky navigation bar on scroll

### Tablet (768px - 1024px)
- Tabbed interface with 3 tabs: [📝 Create] [📅 Events] [⭐ Lists]
- Full-width single column
- Swipe gestures between tabs
- Larger touch targets (min 44px)
- Simplified animations
- Sticky tab bar

### Mobile (< 768px)
- **Separate pages for each feature**
- Full-width single column layout
- Top navigation bar with back button
- Bottom navigation bar for quick access
- One section visible at a time
- Infinite scroll for feeds
- No complex animations
- Touch-optimized interactions

---

## User Flows

### Desktop Flow: Create Event
1. Navigate to homepage
2. See Create Event form in top left
3. Fill in event title
4. Select category
5. Configure settings (voting)
6. Click **[Create Event]**
7. Redirect to event page

### Mobile Flow: Create Event
1. Open homepage
2. Click **"🎯 ORGANIZER"** card → Navigate to `/create`
3. Fill in event title
4. Select category
5. Toggle voting setting
6. Click **[Create Event]**
7. Redirect to event page

### Desktop Flow: Join Event
1. Navigate to homepage
2. Browse Events Feed in right panel
3. Scroll through event cards
4. Click **[View Details]** to see full event info
5. Click **[Join Event]**
6. Redirect to event page

### Mobile Flow: Join Event
1. Open homepage
2. Click **"🔍 EXPLORER"** card → Navigate to `/events`
3. Browse event feed
4. Filter/search for events
5. Click event card to expand details
6. Click **[Join Event]**
7. Redirect to event page

### Desktop Flow: Save Venue List
1. Navigate to homepage
2. Browse Venue Lists in bottom left panel
3. Scroll through featured lists
4. Click **[View Full List]** to see all venues
5. Click **[Save]** to add to saved lists
6. Access saved lists from profile

### Mobile Flow: Save Venue List
1. Open homepage
2. Click **"⭐ SOCIAL"** card → Navigate to `/lists`
3. Browse venue lists feed
4. Filter by category
5. Click list card to expand preview
6. Click **[View]** for full details or **[Save]** to bookmark
7. Access saved lists from profile (bottom nav **[Me]**)

---

## Implementation Notes

### Phase 1 (Current)
- ✅ MagicBento component created (but removed from layout)
- ✅ Create Event section (top left) fully functional
- ⏳ Events Feed (right panel) shows placeholder/demo data
- ⏳ Venue Lists (bottom left) shows placeholder/demo data

### Phase 2 (Next)
- [ ] Remove MagicBento from homepage (desktop/tablet)
- [ ] Keep MagicBento concept for mobile homepage cards
- [ ] Implement real Events Feed with API integration
- [ ] Add event filtering and search
- [ ] Implement "Post New Event" functionality
- [ ] Build mobile pages: `/create`, `/events`, `/lists`
- [ ] Implement bottom navigation bar for mobile

### Phase 3 (Future)
- [ ] Build Venue Lists functionality
- [ ] Implement list creation and editing
- [ ] Add social features (follow, like, comment)
- [ ] User profiles and saved items
- [ ] Mobile gestures (swipe, pull-to-refresh)

---

## Technical Requirements

### Desktop Layout (CSS Grid)
```css
.homepage-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
}

.homepage-main {
  display: grid;
  grid-template-columns: 65% 35%;
  gap: 3rem;
  margin-top: 2rem; /* Space after nav bar */
}

.left-column {
  display: grid;
  grid-template-rows: 1fr 1fr;
  gap: 2rem;
}

.create-event-section {
  overflow-y: auto;
  max-height: 50vh;
  min-height: 400px;
}

.venue-lists-section {
  overflow-y: auto;
  max-height: 50vh;
}

.events-feed-section {
  overflow-y: auto;
  max-height: calc(100vh - 200px);
}
```

### Mobile Layout (Routes)
```typescript
// App routing structure
const routes = [
  { path: '/', component: HomePage },           // Landing with 3 cards
  { path: '/create', component: CreatePage },   // Event creation
  { path: '/events', component: EventsPage },   // Events feed
  { path: '/lists', component: ListsPage },     // Venue lists
  { path: '/profile', component: ProfilePage }, // User profile
];
```

### Responsive Breakpoints
```css
/* Desktop - Wide Layout - No Hero Cards */
@media (min-width: 1024px) {
  .homepage-main {
    display: grid;
    grid-template-columns: 65% 35%;
    max-width: 1400px;
  }
  .hero-cards {
    display: none; /* Hide MagicBento on desktop */
  }
}

/* Tablet - Tabbed Interface */
@media (min-width: 768px) and (max-width: 1023px) {
  .homepage-main {
    display: flex;
    flex-direction: column;
  }
  .tab-interface {
    display: block;
  }
  .hero-cards {
    display: none; /* Hide MagicBento on tablet */
  }
}

/* Mobile - Separate Pages with Action Cards */
@media (max-width: 767px) {
  .homepage-main {
    display: none; /* Use routing instead */
  }
  .hero-cards {
    display: block; /* Show action cards on mobile homepage */
  }
  .mobile-page {
    display: block;
    padding: 1rem;
  }
  .bottom-nav {
    position: fixed;
    bottom: 0;
    width: 100%;
    height: 60px;
  }
}
```

---

## Accessibility

- High contrast text (WCAG AA compliant)
- Keyboard navigation support
- ARIA labels on all interactive elements
- Screen reader friendly structure
- Focus indicators on all buttons
- Skip links to main sections
- Semantic HTML (nav, main, section, article)
- Alt text for all images
- Touch targets min 44x44px on mobile

---

## Performance

- Lazy load event feed items
- Lazy load venue lists
- Infinite scroll with virtualization
- Image optimization for venue photos
- Debounced search/filter inputs
- Cached API responses
- Code splitting for mobile pages
- Prefetch on hover (desktop)
- Service worker for offline support

---

**Last Updated**: 2025-10-21
**Status**: Layout Design Complete - Desktop (35/65 split, No Hero) + Mobile Pages
**Next Steps**: Remove MagicBento from desktop, Implement Events Feed and Venue Lists
