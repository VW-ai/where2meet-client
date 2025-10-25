# Event Page - UX Refactoring Plan

**Focus**: Event page (`/app/event/page.tsx`) - The core experience
**Goal**: Frictionless interaction flow, not just visual redesign
**Priority**: UX flow changes > Visual styling

---

## 🎯 Core Problem Statement

**Current Event Page Issues**:
1. ❌ **Too many modals** - Nickname prompt, share link modal
2. ❌ **Hidden features** - Users don't know they can drag centroid
3. ❌ **Manual actions** - Must click "Search", must click "Publish"
4. ❌ **Unclear states** - What's the "top choice"? Who voted?
5. ❌ **Information overload** - Three tabs, too many buttons
6. ❌ **Unclear hierarchy** - What should I do next?

**What Users Actually Need**:
✅ Add location instantly
✅ See venues automatically
✅ Vote quickly
✅ Understand group consensus
✅ Get directions

---

## 📊 Current vs. New Flow Comparison

### **Flow 1: Adding Your Location**

**CURRENT (Friction-Full)**:
```
1. Open event page
2. See search box
3. Type address OR click map
   → If map click:
     4a. Confirm coordinates dialog
     5a. Click OK
     6a. Nickname modal opens
     7a. Type nickname
     8a. Click Confirm
     9a. Wait for API
     10a. Marker appears
   → If search:
     4b. Select from autocomplete
     5b. Confirm coordinates dialog
     6b. Click OK
     7b. Nickname modal opens
     8b. Type nickname
     9b. Click Confirm
     10b. Wait for API
     11b. Marker appears

Result: 8-10 steps, 2 modals, ~20 seconds
```

**NEW (Frictionless)**:
```
1. Open event page
2. Type address OR click map
   → Marker appears INSTANTLY with "swift_wolf"
   → Toast: "✓ Added as swift_wolf"
3. (Optional) Click name to edit inline

Result: 2 steps, 0 modals, ~3 seconds
```

**Improvement**: 80% fewer steps, 85% faster

---

### **Flow 2: Viewing Venues**

**CURRENT**:
```
1. Location added
2. See right panel with tabs
3. Click "Search" tab (default)
4. See keyword pre-filled
5. Adjust radius slider (?)
6. Toggle "only in circle" (?)
7. Click "Search" button
8. Wait 2 seconds
9. See results

Result: 9 steps, requires understanding "MEC" and "radius multiplier"
```

**NEW**:
```
1. Location added
2. Auto-search triggers immediately
3. Results appear (toast: "Found 23 restaurants nearby")

Result: 1 step (automatic), 0 user action needed
```

**Improvement**: 100% automated, instant gratification

---

### **Flow 3: Voting**

**CURRENT**:
```
1. Scroll through venue list
2. Click on a venue card
3. Card highlights orange
4. See route on map
5. Review info
6. Find "Vote" button (small, purple)
7. Click "Vote"
8. Vote count updates

Result: 7 steps, small target (vote button)
```

**NEW (Option A - Click to Vote)**:
```
1. Scroll through venue list
2. Click on venue card → Auto-votes
3. Heart fills, count updates
4. See route on map

Result: 2 steps, entire card is target
```

**NEW (Option B - Heart Button)**:
```
1. Scroll through venue list
2. Click heart icon ♥
3. Heart fills, count updates

Result: 2 steps, clear visual metaphor
```

**Improvement**: 70% fewer steps, larger tap target

---

### **Flow 4: Understanding Group Decision**

**CURRENT**:
```
1. Look at vote counts scattered across venue cards
2. Sort by "Votes" mode
3. Top venue in list = most votes
4. Host must manually "Publish Decision"
5. Green banner appears
6. Voting locks

Result: Manual process, requires host action, unclear until "published"
```

**NEW**:
```
1. Top of page ALWAYS shows:
   "🏆 Top Choice: Joe's Pizza (5 votes)"
2. Updates in real-time as votes come in
3. No publishing needed
4. Everyone sees consensus immediately

Result: Always visible, automatic, real-time
```

**Improvement**: Instant clarity, no manual step

---

## 🎨 Event Page Layout Redesign

### **Current Layout Problems**:
- ❌ Left panel only for host (participants see nothing)
- ❌ Right panel has 3 tabs (too much context switching)
- ❌ Header only shows event title
- ❌ Bottom route panel only appears on selection
- ❌ Map is cluttered with controls

### **New Layout Proposal**:

```
┌─────────────────────────────────────────────────────────────┐
│ HEADER (Always Visible)                                     │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🏠 Where2Meet  |  Team Lunch                           │ │
│ │                                                         │ │
│ │ 🏆 Top Choice: Joe's Pizza (5 votes) • 1.2km avg      │ │
│ │                                                         │ │
│ │          [📋 Copy Invite Link]  [🌐 EN/中文]          │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  MAP (Full Screen)                                          │
│  - User locations (green = you, teal = others)              │
│  - Centroid (draggable purple)                              │
│  - MEC circle (blue)                                        │
│  - Venue markers (amber)                                    │
│                                                             │
│  ┌─────────────────┐         ┌──────────────────────────┐  │
│  │ LEFT PANEL      │         │ RIGHT PANEL              │  │
│  │ (If no location)│         │ (Venues)                 │  │
│  │                 │         │                          │  │
│  │ Add Location:   │         │ 📍 Restaurants (23)     │  │
│  │ [Search box]    │         │                          │  │
│  │ or click map    │         │ [List of venues]         │  │
│  │                 │         │                          │  │
│  │ (After added:)  │         │ ✓ Sort by: Votes/Rating │  │
│  │ ✓ You           │         │                          │  │
│  │   swift_wolf    │         │ Each venue shows:        │  │
│  │   [Edit name]   │         │ - Name                   │  │
│  │                 │         │ - ♥ Vote count          │  │
│  │ 👥 Others (3)   │         │ - ★ Rating              │  │
│  │   brave_tiger   │         │ - 📏 Distance           │  │
│  │   clever_eagle  │         │ - 🚗 8 min              │  │
│  │   ...           │         │                          │  │
│  └─────────────────┘         └──────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Specific UX Changes (Priority Order)

### **Change 1: Remove All Modals** ⭐ **HIGH PRIORITY**

#### **1a. Remove Nickname Modal**
**File**: `/app/event/page.tsx`
**Lines**: ~1043-1078 (nickname prompt modal)

**Delete**:
```jsx
{showNicknamePrompt && (
  <div className="modal">
    <input placeholder="Enter nickname" />
    ...
  </div>
)}
```

**Replace** in `handleMapClick` and `handleAddLocation`:
```typescript
// Before
handleMapClick() {
  confirm() → setPendingLocation() → setShowNicknamePrompt(true)
}

// After
handleMapClick() {
  const anonymousName = generateUniqueName(participants);
  addParticipant({ lat, lng, name: anonymousName });
  // Instant marker + toast
}
```

**Test**: Click map → Marker appears instantly, no modal

---

#### **1b. Remove Share Link Modal**
**File**: `/app/event/page.tsx`
**Lines**: ~1014-1039 (share modal)

**Delete**:
```jsx
{showShareModal && (
  <div className="modal">
    <div>Share Event Link</div>
    ...
  </div>
)}
```

**Replace** with one-click copy:
```jsx
// Header button
<button onClick={copyJoinLink} className="btn-primary">
  <Copy className="w-5 h-5 mr-2" />
  Copy Invite Link
</button>

// Handler
const copyJoinLink = async () => {
  const link = `${window.location.origin}/event?id=${eventId}&token={joinToken}`;
  await navigator.clipboard.writeText(link);
  toast.success('✓ Link copied! Share with your group');
};
```

**Test**: Click button → Link copied, toast appears, no modal

---

### **Change 2: Automatic Search** ⭐ **HIGH PRIORITY**

**File**: `/app/event/page.tsx`

**Add** auto-search effect:
```typescript
// After locations loaded
useEffect(() => {
  // Auto-search when 2+ participants added
  if (locations.length >= 2 && !hasSearched && keyword) {
    console.log('🔍 Auto-searching for venues...');
    searchPlaces();
    setHasSearched(true);
  }
}, [locations.length, keyword, hasSearched]);
```

**Update** search button text:
```jsx
// Before: "Search"
// After: "Refresh Results"
<button onClick={() => { setHasSearched(false); searchPlaces(); }}>
  <RefreshCw className="w-5 h-5 mr-2" />
  Refresh Results
</button>
```

**Test**:
- Add 2 locations → Search triggers automatically
- Toast: "🔍 Found 23 restaurants nearby"
- Button changes to "Refresh Results"

---

### **Change 3: Click-to-Vote** ⭐ **HIGH PRIORITY**

**File**: `/components/CandidatesPanel.tsx`

**Current**: Separate "Vote" button
```jsx
<div className="venue-card">
  <h4>{name}</h4>
  <button onClick={() => onVote(id)}>Vote</button>
</div>
```

**New Option A**: Entire card is clickable
```jsx
<div
  className="venue-card cursor-pointer"
  onClick={() => onVote(id)}
>
  <div className="flex items-center justify-between">
    <h4>{name}</h4>
    <Heart
      className={`w-6 h-6 ${hasVoted ? 'fill-primary-600 text-primary-600' : 'text-neutral-400'}`}
    />
    <span className="text-sm">{voteCount}</span>
  </div>
  {hasVoted && <span className="text-xs text-primary-600">✓ You voted</span>}
</div>
```

**New Option B**: Large heart button
```jsx
<div className="venue-card">
  <div className="flex items-center justify-between">
    <div>
      <h4>{name}</h4>
      <p>{address}</p>
    </div>
    <button
      onClick={(e) => { e.stopPropagation(); onVote(id); }}
      className="p-3 hover:bg-primary-50 rounded-full"
    >
      <Heart className={`w-8 h-8 ${hasVoted ? 'fill-primary-600' : 'stroke-neutral-400'}`} />
      <span className="text-sm font-medium">{voteCount}</span>
    </button>
  </div>
</div>
```

**Add** vote toggle logic:
```typescript
const handleVote = async (candidateId: string) => {
  const hasVoted = /* check if user already voted for this */;

  if (hasVoted) {
    // Remove vote (unvote)
    await api.removeVote(eventId, participantId, candidateId);
    toast.success('Vote removed');
  } else {
    // Cast vote
    await api.castVote(eventId, participantId, candidateId);
    toast.success('✓ Voted!');
  }
};
```

**Test**:
- Click venue → Heart fills
- Click again → Heart unfills (toggle)
- Vote count updates real-time

---

### **Change 4: Remove Publish Button, Add Top Choice Display** ⭐ **HIGH PRIORITY**

**File**: `/app/event/page.tsx`

#### **4a. Delete Publish Button**
**Lines**: ~772-779

**Delete**:
```jsx
{selectedCandidate && !event.final_decision && (
  <button onClick={handlePublish}>
    Publish Decision
  </button>
)}
```

#### **4b. Add Top Choice Component**
**Add** to header (always visible):

```jsx
// Add this component
const TopChoiceDisplay = () => {
  // Get venue with most votes
  const topVenue = useMemo(() => {
    return [...candidates]
      .sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0))[0];
  }, [candidates]);

  if (!topVenue || topVenue.voteCount === 0) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg">
        <span className="text-neutral-600 text-sm">No votes yet</span>
      </div>
    );
  }

  // Check for ties
  const tiedVenues = candidates.filter(c => c.voteCount === topVenue.voteCount);
  const isTied = tiedVenues.length > 1;

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-primary-50 border border-primary-600 rounded-lg">
      <Trophy className="w-5 h-5 text-primary-600" />
      <div>
        {isTied ? (
          <>
            <p className="text-xs text-neutral-700">Tied</p>
            <p className="font-semibold text-primary-700">
              {tiedVenues.map(v => v.name).join(' & ')} ({topVenue.voteCount} votes)
            </p>
          </>
        ) : (
          <>
            <p className="text-xs text-neutral-700">Top Choice</p>
            <p className="font-semibold text-primary-700">
              {topVenue.name} ({topVenue.voteCount} votes)
            </p>
          </>
        )}
      </div>
    </div>
  );
};

// Add to header
<header>
  <h1>Team Lunch</h1>
  <TopChoiceDisplay />
  <button onClick={copyJoinLink}>Copy Link</button>
</header>
```

**Test**:
- 0 votes: Shows "No votes yet"
- 1 vote: "Leading: Joe's Pizza (1 vote)"
- 3 votes: "Top Choice: Joe's Pizza (3 votes)"
- Tie: "Tied: Joe's & Mario's (2 votes)"
- Updates in real-time via SSE

---

### **Change 5: Allow Host to Vote**

**File**: `/app/event/page.tsx`

**Find** vote handler:
```typescript
const handleVote = useCallback(async (candidateId: string) => {
  if (!eventId || !participantId || !event?.allow_vote) return;  // ❌ No role check

  // ... rest of code
}, [eventId, participantId, event]);
```

**Remove** any checks that prevent host from voting:
```typescript
// Before
if (role === 'host') return; // ❌ Remove this

// After - just check if they have a location
if (!participantId) return; // ✅ Host can vote if they added location
```

**Test**:
- Host adds location
- Host can click heart to vote
- Vote registers and counts

---

### **Change 6: Inline Name Editing**

**File**: Component showing participant names

**Add** inline editing:
```jsx
const ParticipantName = ({ participant, isOwn, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(participant.name);

  const handleSave = async () => {
    if (name.trim() && name !== participant.name) {
      await onUpdate(participant.id, { name: name.trim() });
      toast.success('✓ Name updated');
    }
    setIsEditing(false);
  };

  if (!isOwn && !isHost) {
    return <span>{participant.name}</span>;
  }

  return isEditing ? (
    <input
      value={name}
      onChange={(e) => setName(e.target.value)}
      onBlur={handleSave}
      onKeyDown={(e) => e.key === 'Enter' && handleSave()}
      autoFocus
      className="input-inline"
    />
  ) : (
    <span
      onClick={() => setIsEditing(true)}
      className="cursor-pointer hover:text-primary-600 hover:underline"
    >
      {participant.name}
    </span>
  );
};
```

**Test**:
- Click own name → Input appears
- Type new name → Press Enter
- Name updates everywhere (map, card, SSE)

---

### **Change 7: Simplify Tabs (Remove or Combine)**

**File**: `/app/event/page.tsx`

**Current**: 3 tabs
- 🔍 Search (23)
- ➕ Custom Add
- 💜 Added (5)

**Problem**: Context switching, unclear difference between "Search" and "Added"

**Option A**: Remove tabs, unified list with sections
```jsx
<div className="venue-list">
  {/* User-added venues always at top */}
  {userAddedVenues.length > 0 && (
    <section>
      <h3 className="text-sm font-semibold text-primary-700 mb-2">
        💚 Suggested by Group
      </h3>
      {userAddedVenues.map(venue => <VenueCard key={venue.id} {...venue} />)}
    </section>
  )}

  {/* Search results */}
  <section>
    <h3 className="text-sm font-semibold text-neutral-700 mb-2">
      📍 Nearby ({searchResults.length})
    </h3>
    {searchResults.map(venue => <VenueCard key={venue.id} {...venue} />)}
  </section>

  {/* Add custom venue - inline */}
  <div className="p-4 border-t border-neutral-200">
    <button onClick={() => setShowCustomAdd(true)} className="btn-ghost w-full">
      <Plus className="w-5 h-5 mr-2" />
      Add Specific Venue
    </button>
  </div>
</div>
```

**Option B**: Keep 2 tabs only
- 📍 All Venues (search + custom combined)
- 💚 Top Voted (sorted by votes)

**Test**: Easier navigation, less confusion

---

### **Change 8: Improve Search Area Controls** (Lower Priority)

**File**: `/app/event/page.tsx`

**Current**:
```jsx
<label>Search Area Size</label>
<input type="range" min={1.0} max={2.0} step={0.1} />
<span>1.5x MEC</span>
```

**Problem**: "MEC" and "multiplier" are technical jargon

**New Option A**: Remove entirely (use smart default)
```typescript
// Backend determines optimal radius based on participant spread
// No user control needed
```

**New Option B**: Simple toggle
```jsx
<div className="flex items-center gap-2">
  <button
    onClick={() => setRadius('nearby')}
    className={radius === 'nearby' ? 'btn-primary' : 'btn-secondary'}
  >
    Nearby
  </button>
  <button
    onClick={() => setRadius('wider')}
    className={radius === 'wider' ? 'btn-primary' : 'btn-secondary'}
  >
    Wider Area
  </button>
</div>
```

**Test**: Clearer options, no math

---

## 🎯 Implementation Order (Step-by-Step)

### **Week 1: Core UX Changes**
1. **Day 1**: Remove nickname modal + Add anonymous names
2. **Day 2**: Remove share modal + One-click copy
3. **Day 3**: Add auto-search on load
4. **Day 4**: Click-to-vote implementation
5. **Day 5**: Remove publish button + Add top choice display

### **Week 2: Polish & Secondary Changes**
1. **Day 1**: Allow host to vote
2. **Day 2**: Inline name editing
3. **Day 3**: Simplify tabs/sections
4. **Day 4**: Visual polish (green theme)
5. **Day 5**: Testing & bug fixes

---

## ✅ Success Metrics

### **Before (Current)**:
- Add location: 8-10 steps, 20 seconds
- See venues: 9 steps, manual search
- Vote: 7 steps, small button
- Understand decision: Requires manual publish

### **After (Target)**:
- Add location: 2 steps, 3 seconds ✅ **85% faster**
- See venues: 0 steps (automatic) ✅ **100% automated**
- Vote: 2 steps, large target ✅ **70% fewer steps**
- Understand decision: Always visible ✅ **Real-time**

---

## 🚀 Ready to Start?

**First Change to Implement**: Remove nickname modal + Add anonymous names

This single change:
- Removes biggest friction point
- Improves experience immediately
- Is isolated (low risk)
- Gives instant gratification

Want me to implement this first change? I can show you the exact code modifications needed.
