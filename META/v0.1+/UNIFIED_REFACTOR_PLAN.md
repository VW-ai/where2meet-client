# Unified Event Page Refactor Plan

**Combining**: PANEL_DESIGN.md (layout restructure) + EVENT_PAGE_REFACTOR.md (UX flow improvements)

**Goal**: Create a streamlined, single-panel interface on the left with frictionless interactions

---

## Design Philosophy

### Core Principles
1. **Single Left Panel** - All controls in one vertical stack (no more floating panels on both sides)
2. **Progressive Disclosure** - Show only what's relevant to current step
3. **Direct Manipulation** - Click to act, no confirmation dialogs
4. **Smart Defaults** - Auto-generate names, auto-search, auto-blur for privacy
5. **Always Visible Status** - Top choice, participant count, search area always shown

### Visual Language (from DESIGN_LANGUAGE_GREEN.md)
- **Primary**: Emerald Green (#059669) - Actions, selections, voting
- **Secondary**: Teal (#0d9488) - Secondary actions, participant markers
- **Neutrals**: 5-shade system for text/borders/backgrounds
- **Typography**: System font stack, 8px grid spacing

---

## Layout Overview

```
┌─────────────────────────────────────────────────────────────────┐
│ HEADER (Compact)                                                │
│ Logo | Event Title | Participants: 5 | Top Choice: Joe's Pizza │
│                                              [Search Area: 1.5x] │
└─────────────────────────────────────────────────────────────────┘
│                                                                  │
│                                                                  │
│                      FULL-SCREEN MAP                            │
│   ┌─────────────┐                                               │
│   │ LEFT PANEL  │                                               │
│   │─────────────│                                               │
│   │ 1. Input    │  (Collapsed after joining)                    │
│   │─────────────│                                               │
│   │ 2. Venues   │  [Search | Venue List]                        │
│   │   • Search  │                                               │
│   │   • Filter  │                                               │
│   │   • Results │                                               │
│   │─────────────│                                               │
│   │ 3. People   │  Participant list with votes                  │
│   │   • You     │                                               │
│   │   • Others  │                                               │
│   └─────────────┘                                               │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Panel 1: Input View (Join Event)

### Current Problems
- Nickname modal interrupts flow (8-10 steps)
- Name required before seeing map
- No privacy control
- Autocomplete doesn't show you're "joining"

### New Design

**State 1: Before Joining** (First-time visitor)
```
┌───────────────────────────────────┐
│ 🎯 Join This Event                │
├───────────────────────────────────┤
│                                   │
│ Your Name (Optional)              │
│ [swift_wolf          ] 🔄 Shuffle │ ← Auto-generated, can edit or shuffle
│                                   │
│ Your Location                     │
│ [Search address...   ]            │ ← Google autocomplete
│ [📍 Use Current Location]         │ ← One-click geolocation
│                                   │
│ Privacy                           │
│ ☑ Blur my location (~500m)        │ ← On by default
│                                   │
│ [✓ Join Event]                    │ ← Big green button
│                                   │
└───────────────────────────────────┘
```

**State 2: After Joining** (Collapse to compact view)
```
┌───────────────────────────────────┐
│ ✓ You: swift_wolf      [Edit] ❌  │ ← Inline edit + remove
├───────────────────────────────────┤
│ (Panel collapses, shows Venues)   │
```

### Design Ideas & Rationale

**Idea 1: Auto-generated name shown upfront**
- **Why**: Eliminates modal interruption, user sees they'll join as "swift_wolf" before committing
- **Refinement**: Add shuffle button (🔄) to let users regenerate if they don't like first name
- **UX Flow**: Pre-populated → User can keep it, edit it, or shuffle → Join

**Idea 2: Privacy toggle on by default**
- **Why**: Most users want privacy; making it opt-out protects them by default
- **Benefit**: No need to explain what "fuzzy coordinates" means - just "blur my location" with checkbox

**Idea 3: Collapse after joining**
- **Why**: Once you've joined, you don't need this panel anymore - maximize space for Venues
- **Benefit**: Single click to expand if you want to edit your name or location later

**Idea 4: Remove "Confirm" button concept**
- **Why**: "Join Event" is the confirmation - no need for multi-step flow
- **Benefit**: 1 button instead of 3 (blur, confirm, join)

### Implementation Notes
- Use `generateUniqueName()` on page load to pre-populate name field ✅ (Already done)
- Add shuffle button that calls `generateUniqueName()` again
- Default privacy toggle to `checked`
- Collapse panel state managed by `showInputPanel` boolean
- Host can always see this panel (to add more locations)

---

## Panel 2: Venues View

### Current Problems
- Search hidden in tab
- Manual search button required
- Filter toggles (only_in_circle) unclear
- No distinction between "search results" and "user-added venues"
- Voting requires small button click (hard to tap)

### New Design

**Two Sub-Views: "Search" | "Venue List"**

#### Sub-View A: Search

```
┌───────────────────────────────────┐
│ 🔍 Search Venues                  │
├───────────────────────────────────┤
│ Search By: ⚫ Type  ⚪ Name        │ ← Toggle (NEW)
│                                   │
│ [restaurant          ]            │ ← If Type: suggested chips below
│                                   │
│ 🍕 Pizza  🍔 Burger  ☕ Cafe      │ ← Quick select chips
│ 🍜 Ramen  🍺 Bar    ➕ Custom     │
│                                   │
│ Sort: ⚫ Rating  ⚪ Distance       │ ← Radio buttons (compact)
│                                   │
│ ☐ Only show within circle         │ ← Clear checkbox
│                                   │
│ [Auto-searching...] or [Refresh]  │ ← Auto-search on load, or manual refresh
│                                   │
├─ Results (12) ────────────────────┤
│                                   │
│ ┌─────────────────────────────┐   │
│ │ 🍕 Joe's Pizza         ★ 4.5 │   │ ← Click card to select + vote
│ │ 📍 0.8 km • 234 reviews      │   │
│ │ ❤️ 3 votes                   │   │ ← Vote count visible
│ └─────────────────────────────┘   │
│                                   │
│ ┌─────────────────────────────┐   │
│ │ 🍕 Mario's                 ★ 4.3│
│ │ 📍 1.2 km • 89 reviews       │
│ │ 🤍 0 votes        [+ Add to │   │ ← "Add to List" if not voted
│ └───────────────────── List]─┘   │
│                                   │
│ (Scrollable list)                 │
│                                   │
└───────────────────────────────────┘
```

#### Sub-View B: Venue List (Voted/Saved Venues)

```
┌───────────────────────────────────┐
│ 💚 Venue List (5)                 │
├───────────────────────────────────┤
│                                   │
│ 🏆 TOP CHOICE                     │ ← Always show winner
│ ┌─────────────────────────────┐   │
│ │ 🍕 Joe's Pizza         ★ 4.5 │   │
│ │ 📍 0.8 km                    │   │
│ │ ❤️❤️❤️ 3 votes              │   │ ← Visual hearts (filled)
│ │ swift_wolf, brave_tiger, ... │   │ ← Who voted
│ │                              │   │
│ │ [View Details ↗]             │   │ ← Expands to full card
│ └─────────────────────────────┘   │
│                                   │
│ ┌─────────────────────────────┐   │
│ │ 🍔 Burger King         ★ 4.2 │   │
│ │ 📍 1.5 km                    │   │
│ │ ❤️🤍 1 vote                  │   │ ← Mixed filled/empty hearts
│ │ clever_eagle                 │   │
│ └─────────────────────────────┘   │
│                                   │
│ (Scrollable, sorted by votes)     │
│                                   │
└───────────────────────────────────┘
```

### Design Ideas & Rationale

**Idea 1: Search Type Toggle (Type vs. Name)**
- **Why**: Users often know the TYPE of place they want (pizza, cafe) but not specific name
- **Benefit**: Typing "pizza" is faster than "pizza restaurant near me"
- **Chips**: Pre-populate common categories with emoji for quick selection
- **Google API**: Use `type` parameter for category search, `query` for name search

**Idea 2: Auto-search when 2+ participants**
- **Why**: Users join event → expect to see venues immediately
- **When**: Trigger when `participants.length >= 2` AND `keyword` exists (from event category)
- **Button**: Changes from "Search" to "Refresh Results" after first auto-search

**Idea 3: Click card to vote (no separate button)**
- **Why**: Reduces steps from 7 to 2 (see EVENT_PAGE_REFACTOR.md)
- **Visual**: Card border changes to green + heart fills
- **Toggle**: Click again to unvote (toggle behavior)

**Idea 4: "Add to List" vs. "Remove Vote"**
- **Why**: Make it clear what clicking does - if not voted, show "+ Add to List" button
- **Benefit**: Users understand the action before clicking

**Idea 5: Expanded venue card (on "View Details")**
```
┌─────────────────────────────────────────────┐
│ 🍕 Joe's Pizza                     [✕ Close]│
├─────────────────────────────────────────────┤
│                                             │
│ [Photo carousel - 3 images]                 │
│                                             │
│ ★★★★☆ 4.5 (234 reviews)                    │
│ 📍 123 Main St, 0.8 km from center          │
│ 🕒 Open until 10 PM                         │
│ 💰 $$ • Pizza, Italian                      │
│                                             │
│ ───────────────────────────────             │
│                                             │
│ 📝 Top Reviews:                             │
│ "Amazing pizza! Wood-fired oven..."         │
│ "Great atmosphere, a bit crowded..."        │
│                                             │
│ (Scrollable reviews)                        │
│                                             │
│ [🔗 Google Maps] [🌐 Website] [📞 Call]    │
│                                             │
└─────────────────────────────────────────────┘
```

**Idea 6: Visual hearts for vote count**
- **Why**: More engaging than just "3 votes"
- **Design**: ❤️❤️❤️ (filled hearts) or ❤️❤️🤍 (mixed) up to 5 max, then "+2 more"
- **Benefit**: Quickly see voting popularity at a glance

### Implementation Notes
- Add `searchType` state: `'type' | 'name'`
- Create chip component for quick category selection
- Use Google Places API `type` parameter for category search
- Add `useEffect` for auto-search (from EVENT_PAGE_REFACTOR.md) ✅
- Create expandable card modal for venue details
- Click-to-vote on entire card (toggle behavior)

---

## Panel 3: Participation View

### Current Problems
- No clear visual identity per person
- Can't see who voted for what
- Hard to focus on one person's location

### New Design

```
┌───────────────────────────────────┐
│ 👥 Participants (5)               │
├───────────────────────────────────┤
│                                   │
│ ┌─────────────────────────────┐   │
│ │ ▲ You (swift_wolf)          │   │ ← Green triangle (you)
│ │ 📍 123 Main St (blurred)    │   │
│ │ ❤️ Voted: Joe's Pizza       │   │ ← Shows current vote
│ │                     [Edit ❌]│   │ ← Edit name or remove
│ └─────────────────────────────┘   │
│                                   │
│ ┌─────────────────────────────┐   │
│ │ ▲ brave_tiger               │   │ ← Teal triangle (other)
│ │ 📍 456 Oak Ave              │   │
│ │ ❤️ Voted: Joe's Pizza       │   │
│ └─────────────────────────────┘   │
│                                   │
│ ┌─────────────────────────────┐   │
│ │ ▲ clever_eagle              │   │ ← Different color
│ │ 📍 789 Elm St               │   │
│ │ 🤍 No vote yet              │   │
│ └─────────────────────────────┘   │
│                                   │
│ (Scrollable list)                 │
│                                   │
└───────────────────────────────────┘
```

### Design Ideas & Rationale

**Idea 1: Show current vote in participant card**
- **Why**: See who voted for what at a glance
- **Benefit**: Creates social proof ("oh, swift_wolf voted for that too!")
- **Design**: Small venue name below location

**Idea 2: Click to focus on participant's location**
- **Why**: "Where is brave_tiger again?" - click to see their location
- **Map Behavior**: Pan to their location, zoom to comfortable level (not too close)
- **Visual**: Marker grows slightly larger, pulses once

**Idea 3: Colored triangles with consistent mapping**
- **Why**: Visual identity helps distinguish participants on map
- **Colors**: Pre-defined palette (not random) - emerald, teal, amber, purple, pink
- **Limit**: If 6+ participants, reuse colors with different shades

**Idea 4: Show privacy status**
- **Why**: Transparency about who has blurred location
- **Design**: If blurred, show "(blurred)" next to address in lighter gray
- **Benefit**: Users understand why some markers aren't exact

### Implementation Notes
- Create color palette for participant markers (5-6 distinct colors)
- Add vote display to participant card (join with candidates data)
- Add click handler to pan/zoom to participant location
- Show "(blurred)" indicator if `fuzzy_lat` differs from `lat`

---

## Top Panel (Header) - Compact Redesign

### Current Issues
- Too much wasted space (large logo, big buttons, verbose text)
- Venue count and radius redundant (shown in left panel)
- Share button takes 3 clicks (modal)

### New Design

```
┌─────────────────────────────────────────────────────────────────┐
│ 🎯 Where2Meet | Weekend Brunch Planning          [Share Link 🔗]│
│ 👥 5 participants • 🏆 Joe's Pizza (3 votes)                    │
│                                   Search Area: [1.0x ──●── 2.0x]│
└─────────────────────────────────────────────────────────────────┘
```

**Compact, single-row design:**
- Logo (small icon) + Event Title
- Participant count + Top Choice (winner with vote count)
- Share Link button (one-click copy, no modal)
- Search Area slider (moved from left panel)

### Design Ideas & Rationale

**Idea 1: Single-row header (max 64px height)**
- **Why**: Maximize map space, reduce visual clutter
- **Benefit**: More map = easier to see venue locations and routes

**Idea 2: Always show top choice in header**
- **Why**: Group decision is THE goal - keep it visible at all times
- **Design**: 🏆 Trophy icon + venue name + vote count
- **Update**: Real-time via SSE (no manual publish needed)

**Idea 3: One-click share link (no modal)**
- **Why**: Share modal takes 3 clicks (open modal → copy → close)
- **New**: Click button → auto-copy to clipboard → toast confirmation
- **Code**: `navigator.clipboard.writeText(link)` + `toast.success('Link copied!')`

**Idea 4: Search Area slider in header**
- **Why**: Host needs this frequently when searching, but participants don't
- **Benefit**: Keeps left panel cleaner, only shows controls relevant to current user
- **Visibility**: Only show if `role === 'host'`

### Implementation Notes
- Reduce header padding from `py-4` to `py-2`
- Create `TopChoiceDisplay` component (shows winner with trophy)
- Remove share modal, replace with direct clipboard copy
- Move radius multiplier slider to header (host only)

---

## Implementation Plan (4 Weeks)

### Week 1: Foundation + Input Panel
- [x] ✅ **DONE**: Anonymous name generation (Change 1)
- [ ] Add shuffle button to regenerate name
- [ ] Create collapsible Input Panel component
- [ ] Add privacy toggle (default: checked)
- [ ] Add "Use Current Location" geolocation button
- [ ] Implement collapse-after-join behavior
- [ ] **Test**: Join event flow (should be 1 click, no modals)

### Week 2: Venues Panel - Search Sub-View
- [ ] Create search type toggle (Type vs. Name)
- [ ] Create category chips UI (Pizza, Burger, Cafe, etc.)
- [ ] Update API call to use `type` parameter for category search
- [ ] Implement auto-search on load (when 2+ participants)
- [ ] Add click-to-vote on entire venue card
- [ ] Create vote count visual (heart icons)
- [ ] **Test**: Search by type, search by name, auto-search, click-to-vote

### Week 3: Venues Panel - Venue List Sub-View + Expanded Card
- [ ] Create Venue List sub-view with sorted venues
- [ ] Show who voted for each venue
- [ ] Add "View Details" expansion for full venue card
- [ ] Integrate Google Places Photos API for images
- [ ] Add reviews display (top 3 reviews)
- [ ] Add external links (Google Maps, Website, Call)
- [ ] **Test**: Venue list sorting, expansion, photo loading

### Week 4: Participation Panel + Header + Polish
- [ ] Create Participation View with colored triangles
- [ ] Show current vote in participant card
- [ ] Add click-to-focus-location behavior
- [ ] Redesign compact header (single row, 64px)
- [ ] Add Top Choice display in header (real-time update)
- [ ] Replace share modal with one-click copy
- [ ] Move search area slider to header (host only)
- [ ] Final testing: Full flow from join → search → vote → decision
- [ ] **Test**: Complete user journey (host + 2 participants)

---

## Metrics: Before vs. After

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Steps to join** | 8-10 | 2 | **80% faster** |
| **Steps to search** | 9 | 0 (auto) | **100% auto** |
| **Steps to vote** | 7 | 1 | **85% faster** |
| **Clicks to share** | 3 | 1 | **66% faster** |
| **Panels on screen** | 3 (left, right, header) | 2 (left, header) | **Cleaner** |
| **Modal interruptions** | 3 (nickname, share, confirm) | 0 | **Zero friction** |

---

## Design Refinements Summary

### Key Ideas Added
1. **Shuffle button** for anonymous names - let users regenerate without typing
2. **Privacy on by default** - protect users by default, opt-out if needed
3. **Collapsible Input Panel** - maximize space after joining
4. **Search Type Toggle** - category vs. name search (new feature)
5. **Category chips** - quick-select common types (pizza, cafe, bar)
6. **Click-to-vote cards** - entire card clickable, toggle behavior
8. **Expanded venue cards** - photos, reviews, links (rich detail)
9. **Vote display in participant cards** - see who voted for what
10. **Click-to-focus** - click participant to see their location
11. **Colored triangle system** - consistent visual identity per person
12. **One-click share** - no modal, instant clipboard copy
13. **Top Choice in header** - always visible, real-time update
14. **Search Area slider in header** - cleaner left panel

### Preserving Good Ideas from Original Designs
- ✅ Anonymous name generation (EVENT_PAGE_REFACTOR.md)
- ✅ Auto-search (EVENT_PAGE_REFACTOR.md)
- ✅ Click-to-vote (EVENT_PAGE_REFACTOR.md)
- ✅ Remove publish button (EVENT_PAGE_REFACTOR.md)
- ✅ Single left panel (PANEL_DESIGN.md)
- ✅ Three-section vertical stack (PANEL_DESIGN.md)
- ✅ Search type toggle (PANEL_DESIGN.md)
- ✅ Enhanced venue cards (PANEL_DESIGN.md)
- ✅ Compact header (PANEL_DESIGN.md)

---

## Next Step: Which to Implement First?

**Option A: Continue EVENT_PAGE_REFACTOR.md sequence**
- Change 2: Auto-search (easiest, already planned)
- Change 3: Click-to-vote (medium difficulty)
- Change 4: Top Choice display (easy)

**Option B: Start PANEL_DESIGN.md restructure**
- Build Input Panel component (collapse behavior)
- Build Venues Panel with two sub-views
- Build Participation Panel

**My Recommendation**: **Option A** (finish quick wins first)

**Why**:
1. Auto-search, click-to-vote, top choice are **high-impact, low-risk**
2. Get immediate UX improvements without major restructure
3. Test ideas before committing to full panel redesign
4. Panel restructure is a **bigger refactor** - needs more planning

Let me know which direction you prefer, or if you want to merge both approaches differently!
