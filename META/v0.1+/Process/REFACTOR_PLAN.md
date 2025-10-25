# Where2Meet - Incremental Refactoring Plan

**Strategy**: Refactor existing components step-by-step, not build from scratch
**Approach**: Small, testable changes that don't break functionality
**Goal**: Transform current design to green-themed, frictionless system

---

## 🎯 Refactoring Philosophy

### **Why Incremental?**
✅ **Less risky** - App stays functional throughout
✅ **Easier to test** - One component at a time
✅ **Easier to review** - Smaller diffs, clearer changes
✅ **Can deploy gradually** - Ship improvements faster
✅ **Learn as we go** - Adjust based on what works

### **Not a Rewrite**
❌ Don't: Create new folder, rebuild everything
✅ Do: Update files in place, preserve functionality
✅ Do: Test after each step
✅ Do: Commit frequently

---

## 📋 Refactoring Order (Dependency-First)

### **Phase 1: Foundation** (Week 1)
Setup design system foundations that all components will use

### **Phase 2: Core UI** (Week 2)
Update basic reusable components

### **Phase 3: Pages** (Week 3-4)
Refactor page-level components

### **Phase 4: Polish** (Week 5)
Fine-tune interactions, animations, edge cases

---

## 🔧 Phase 1: Foundation (Start Here)

### **Step 1.1: Update Tailwind Config** ⭐ **START HERE**
**File**: `/tailwind.config.ts`
**Time**: 30 minutes
**Risk**: Low (just config, doesn't affect UI yet)

**Changes**:
```typescript
// Add green color palette
extend: {
  colors: {
    primary: {
      DEFAULT: '#059669',
      50: '#ecfdf5',
      500: '#10b981',
      600: '#059669',
      700: '#047857',
    },
    secondary: {
      DEFAULT: '#0d9488',
      600: '#0d9488',
      700: '#0f766e',
    },
  },
}
```

**Test**: Run `npm run dev`, check no errors

---

### **Step 1.2: Update Global CSS**
**File**: `/app/globals.css`
**Time**: 15 minutes
**Risk**: Low

**Changes**:
1. Update font family (Arial → System UI)
2. Add CSS custom properties for colors
3. Keep existing Google Maps overrides

**Before**:
```css
body {
  font-family: Arial, Helvetica, sans-serif;
}
```

**After**:
```css
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;
}
```

**Test**: Check fonts look good, no layout shifts

---

### **Step 1.3: Create Anonymous Name Generator Utility**
**File**: `/lib/nameGenerator.ts` (NEW FILE)
**Time**: 45 minutes
**Risk**: Low (new file, doesn't affect existing code)

**Create**:
```typescript
const adjectives = ['brave', 'swift', 'clever', 'mighty', ...];
const animals = ['wolf', 'tiger', 'eagle', 'bear', ...];

export function generateUniqueName(existingNames: string[]): string {
  // Algorithm from FRICTION_ANALYSIS.md
}
```

**Test**: Unit tests for uniqueness

---

### **Step 1.4: Install Lucide Icons**
**Command**: `pnpm add lucide-react`
**Time**: 5 minutes
**Risk**: Low (just install, don't use yet)

**Don't change UI yet** - just make icons available

---

## 🎨 Phase 2: Core UI Components (Week 2)

### **Step 2.1: Refactor Button Components** ⭐ **HIGH IMPACT**
**Files**: All files with buttons
**Time**: 2 hours
**Risk**: Medium (touches many files)

**Strategy**: Create button utility classes, then apply

**Step 2.1a: Create Button Classes**
Add to `globals.css`:
```css
@layer components {
  .btn-primary {
    @apply px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-md transition-colors duration-200 shadow-sm hover:shadow-md;
  }

  .btn-secondary {
    @apply px-6 py-3 bg-neutral-50 hover:bg-neutral-100 text-neutral-950 font-medium border border-neutral-200 rounded-md transition-colors duration-200;
  }

  .btn-ghost {
    @apply px-4 py-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 font-medium rounded-md transition-colors duration-200;
  }
}
```

**Step 2.1b: Update Homepage Buttons**
**File**: `/app/page.tsx`

**Find**:
```jsx
className="w-full py-4 bg-gradient-to-r from-blue-600 to-green-600 text-white text-lg font-semibold rounded-lg hover:from-blue-700 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
```

**Replace**:
```jsx
className="btn-primary w-full text-lg disabled:opacity-50 disabled:cursor-not-allowed"
```

**Step 2.1c: Update Event Page Buttons**
**File**: `/app/event/page.tsx`

Update:
- "Share Link" button → `btn-primary`
- "Publish Decision" button → Remove (per redesign)
- Vote buttons → `btn-primary`

**Test**: All buttons look consistent, work correctly

---

### **Step 2.2: Refactor Card Components**
**Files**: All card-like components
**Time**: 1.5 hours
**Risk**: Low

**Step 2.2a: Create Card Classes**
Add to `globals.css`:
```css
@layer components {
  .card {
    @apply bg-white p-6 rounded-lg border border-neutral-200 shadow-md hover:shadow-lg transition-shadow duration-200;
  }

  .card-compact {
    @apply bg-white p-4 rounded-md border border-neutral-200;
  }

  .card-highlighted {
    @apply bg-primary-50 border-2 border-primary-600 p-6 rounded-lg;
  }
}
```

**Step 2.2b: Update Homepage Cards**
**File**: `/app/page.tsx`

**Find**:
```jsx
<div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
```

**Replace**:
```jsx
<div className="card">
```

**Test**: Cards render correctly

---

### **Step 2.3: Refactor Input Components**
**Files**: Input fields across app
**Time**: 1 hour
**Risk**: Low

**Create Input Class**:
```css
.input {
  @apply w-full px-4 py-3 text-neutral-950 placeholder:text-neutral-400 bg-white border border-neutral-200 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200;
}
```

**Update All Inputs**:
- Event title input
- Location search inputs
- Nickname input (before we remove it)

**Test**: Focus states work, typing works

---

### **Step 2.4: Replace Emoji with Lucide Icons**
**Files**: Multiple
**Time**: 2 hours
**Risk**: Low (visual change only)

**Replacements**:
| Emoji | Lucide Icon | Usage |
|-------|-------------|-------|
| 🔍 | `<Search />` | Search venues |
| ➕ | `<Plus />` | Add venue |
| 💜 | `<Heart />` | Vote/saved venues |
| 🗳️ | `<ThumbsUp />` | Vote count |
| 🚗 | `<Car />` | Drive mode |
| 🚶 | `<PersonStanding />` | Walk mode |
| 🚌 | `<Bus />` | Transit mode |
| 🚴 | `<Bike />` | Bike mode |
| 📋 | `<Copy />` | Copy link |
| 🔗 | `<Link />` | Share link |

**Example Update** (`app/event/page.tsx`):
```jsx
// Before
<button>🔗 Share Link</button>

// After
import { Link } from 'lucide-react';
<button>
  <Link className="w-5 h-5 mr-2" />
  Share Link
</button>
```

**Test**: Icons render, sizes are consistent

---

## 🎨 Phase 3: Page-Level Refactoring (Week 3-4)

### **Step 3.1: Refactor Homepage** ⭐ **USER-FACING**
**File**: `/app/page.tsx`
**Time**: 3 hours
**Risk**: Medium (main entry point)

#### **Step 3.1a: Update Color Scheme**
- Background gradient: `from-blue-50 to-green-50` → `from-emerald-50 via-white to-teal-50`
- Logo: Keep as is (or update if brand refresh)
- Navigation bar: Update button colors (blue → green)

#### **Step 3.1b: Simplify Event Creation Form**
**Changes**:
1. Remove privacy toggle (default: blur, add settings later)
2. Remove voting toggle (default: enabled)
3. Larger, clearer button: "Create & Copy Link"

**Before** (4 fields):
```jsx
- Title input
- Category dropdown
- Privacy checkbox
- Voting checkbox
- "Create Event" button
```

**After** (2 fields):
```jsx
- Title input
- Category dropdown
- "Create & Copy Link" button (auto-copies on success)
```

#### **Step 3.1c: Auto-Copy Link on Creation**
**Changes** in event creation handler:
```typescript
const response = await api.createEvent(request);

// NEW: Auto-copy link
const link = `${window.location.origin}/event?id=${response.event.id}&token=${response.join_token}`;
await navigator.clipboard.writeText(link);
toast.success('✓ Event created! Link copied - share with your group');

// Navigate to event
router.push(`/event?id=${response.event.id}`);
```

**Test**:
- Create event → Link copied automatically
- Toast shows success message
- Navigate to event page

---

### **Step 3.2: Refactor Event Page (Part 1: Header)**
**File**: `/app/event/page.tsx`
**Time**: 2 hours
**Risk**: Medium

#### **Step 3.2a: Update Header Colors**
- Background: Keep glassmorphism or switch to solid?
- Button: `bg-blue-600` → `bg-primary-600`
- Participant count display

#### **Step 3.2b: Remove "Publish Decision" Button**
**Delete**:
```jsx
{selectedCandidate && !event.final_decision && (
  <button onClick={handlePublish}>
    Publish Decision
  </button>
)}
```

#### **Step 3.2c: Add "Top Choice" Display**
**Add** (always visible):
```jsx
<div className="flex items-center gap-2 px-4 py-2 bg-primary-50 border border-primary-600 rounded-lg">
  <Trophy className="w-5 h-5 text-primary-600" />
  <div>
    <p className="text-xs text-neutral-700">Top Choice</p>
    <p className="font-semibold text-primary-700">
      {topVenue ? `${topVenue.name} (${topVenue.voteCount} votes)` : 'No votes yet'}
    </p>
  </div>
</div>
```

**Test**:
- Top choice updates in real-time
- Shows "No votes yet" initially
- Updates as votes come in

---

### **Step 3.3: Refactor Event Page (Part 2: Location Input)**
**File**: `/app/event/page.tsx`
**Time**: 2 hours
**Risk**: High (core functionality change)

#### **Step 3.3a: Remove Nickname Modal**
**Delete**:
```jsx
{showNicknamePrompt && (
  <NicknameModal />
)}
```

#### **Step 3.3b: Add Anonymous Name Generation**
**Update** `handleMapClick`:
```typescript
const handleMapClick = async (lat: number, lng: number) => {
  if (participantId && role !== 'host') return;

  // Generate unique anonymous name
  const existingNames = participants.map(p => p.name);
  const anonymousName = generateUniqueName(existingNames);

  // Add location immediately (no modal!)
  await api.addParticipant(eventId, {
    lat,
    lng,
    name: anonymousName,
  });

  toast.success(`✓ Location added as ${anonymousName}`);
};
```

#### **Step 3.3c: Add Inline Name Editing**
**Update** location cards to have editable names:
```jsx
<div className="location-card">
  {isEditing ? (
    <input
      value={editedName}
      onChange={(e) => setEditedName(e.target.value)}
      onBlur={handleSaveName}
      onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
      autoFocus
      className="input-inline"
    />
  ) : (
    <span onClick={() => setIsEditing(true)} className="cursor-pointer hover:text-primary-600">
      {participant.name}
    </span>
  )}
</div>
```

**Test**:
- Click map → Marker appears instantly with anonymous name
- No modal interruption
- Can edit name inline
- Name updates everywhere (map, card, SSE broadcast)

---

### **Step 3.4: Refactor Event Page (Part 3: Voting)**
**File**: `/app/event/page.tsx`
**Time**: 1.5 hours
**Risk**: Medium

#### **Step 3.4a: Allow Host to Vote**
**Remove check**:
```typescript
// Before
if (!participantId || role === 'host') return; // ❌ Host can't vote

// After
if (!participantId) return; // ✅ Host can vote if they have location
```

#### **Step 3.4b: Visual Vote Indicator**
**Update** venue cards:
```jsx
<div className={`venue-card ${hasVoted ? 'voted' : ''}`}>
  <div className="flex items-center justify-between">
    <h3>{venue.name}</h3>
    <button onClick={() => handleVote(venue.id)}>
      <Heart
        className={`w-5 h-5 ${hasVoted ? 'fill-primary-600 text-primary-600' : 'text-neutral-400'}`}
      />
      <span className="ml-1">{venue.voteCount}</span>
    </button>
  </div>
</div>
```

**Test**:
- Host can vote
- Heart fills on vote
- Click again removes vote (toggle)
- Vote count updates in real-time

---

### **Step 3.5: Refactor Event Page (Part 4: Search)**
**File**: `/app/event/page.tsx`
**Time**: 2 hours
**Risk**: Medium

#### **Step 3.5a: Auto-Search on Page Load**
**Add** to `useEffect`:
```typescript
useEffect(() => {
  if (locations.length >= 2 && !hasSearched && keyword) {
    // Auto-search once participants are added
    searchPlaces();
    setHasSearched(true);
  }
}, [locations.length, keyword]);
```

#### **Step 3.5b: Update Search Button**
Keep button but make it secondary:
```jsx
<button
  onClick={searchPlaces}
  className="btn-secondary"
  disabled={isSearching || !keyword.trim()}
>
  {isSearching ? (
    <>
      <Loader className="w-5 h-5 mr-2 animate-spin" />
      Searching...
    </>
  ) : (
    <>
      <Search className="w-5 h-5 mr-2" />
      Search Again
    </>
  )}
</button>
```

**Test**:
- Page loads → Auto-search triggers
- Results appear automatically
- Can manually search again
- Toast: "Found 23 restaurants nearby"

---

### **Step 3.6: Refactor CandidatesPanel**
**File**: `/components/CandidatesPanel.tsx`
**Time**: 2 hours
**Risk**: Medium

#### **Updates**:
1. Update colors: blue → green
2. Replace emoji with Lucide icons
3. Update sort buttons styling
4. Update venue card styling (green when selected)
5. Update vote button (heart icon)

**Test**:
- All venue cards render
- Sorting works
- Voting works
- Selection works

---

## 🎨 Phase 4: Polish & Fine-Tuning (Week 5)

### **Step 4.1: Animation Improvements**
**Files**: Multiple
**Time**: 3 hours

Replace all `transition-all` with specific transitions:
```jsx
// Before
className="transition-all"

// After
className="transition-colors duration-200"
// or
className="transition-shadow duration-200"
// or
className="transition-transform duration-200"
```

Add entrance animations:
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
```

---

### **Step 4.2: Mobile Optimization**
**Files**: All pages
**Time**: 4 hours

1. Update touch targets (44×44px minimum)
2. Test on actual mobile device
3. Fix any layout issues
4. Ensure text is readable

---

### **Step 4.3: Accessibility Audit**
**Time**: 2 hours

1. Check all contrast ratios
2. Add ARIA labels where missing
3. Test keyboard navigation
4. Test with screen reader

---

### **Step 4.4: Testing & Bug Fixes**
**Time**: Variable

1. Manual testing of all flows
2. Fix any issues found
3. Edge case testing
4. Performance check

---

## 📊 Refactoring Tracker

### **Completed**
- [ ] Step 1.1: Tailwind config
- [ ] Step 1.2: Global CSS
- [ ] Step 1.3: Name generator
- [ ] Step 1.4: Lucide icons
- [ ] Step 2.1: Button components
- [ ] Step 2.2: Card components
- [ ] Step 2.3: Input components
- [ ] Step 2.4: Icon replacements
- [ ] Step 3.1: Homepage refactor
- [ ] Step 3.2: Event header
- [ ] Step 3.3: Location input
- [ ] Step 3.4: Voting system
- [ ] Step 3.5: Search system
- [ ] Step 3.6: Candidates panel
- [ ] Step 4.1: Animations
- [ ] Step 4.2: Mobile
- [ ] Step 4.3: Accessibility
- [ ] Step 4.4: Testing

---

## 🎯 Quick Start: First 3 Steps

### **Today - Foundation Setup (1 hour)**
1. Update `tailwind.config.ts` - Add green colors
2. Update `app/globals.css` - Change font
3. Install Lucide: `pnpm add lucide-react`

### **Tomorrow - Buttons (2 hours)**
1. Add button classes to `globals.css`
2. Update homepage buttons
3. Update event page buttons

### **Day 3 - Cards & Inputs (2 hours)**
1. Add card classes
2. Update all cards
3. Add input class
4. Update all inputs

**After 3 days**: Foundation complete, visible improvements!

---

## 🚀 Deployment Strategy

### **After Each Phase**
1. Test thoroughly locally
2. Commit with clear message
3. Push to branch: `refactor/phase-N`
4. Create PR
5. Review
6. Merge to main
7. Deploy to staging
8. Test in staging
9. Deploy to production

### **Rollback Plan**
If something breaks:
1. Git revert the commit
2. Fix locally
3. Re-deploy

---

## 📝 Commit Message Format

```
refactor(component): brief description

- Specific change 1
- Specific change 2
- Specific change 3

Part of: Phase N, Step N.N
```

**Examples**:
```
refactor(tailwind): add green color palette

- Add primary (emerald) colors
- Add secondary (teal) colors
- Add semantic color tokens

Part of: Phase 1, Step 1.1
```

```
refactor(buttons): standardize button styles

- Create btn-primary, btn-secondary utility classes
- Replace gradient buttons with solid green
- Update all homepage buttons
- Update event page buttons

Part of: Phase 2, Step 2.1
```

---

## ⚠️ Risks & Mitigation

| Risk | Mitigation |
|------|-----------|
| **Break existing functionality** | Test after each step, small commits |
| **Git merge conflicts** | Work on one file at a time, commit often |
| **Design inconsistency** | Follow design system strictly |
| **Regression bugs** | Manual testing checklist per phase |
| **Performance degradation** | Check bundle size, profile after changes |

---

## ✅ Success Criteria

### **After Phase 1**
- [ ] Green colors available in Tailwind
- [ ] Font updated
- [ ] Icons library installed
- [ ] No visual changes yet (foundation only)

### **After Phase 2**
- [ ] All buttons use green
- [ ] All cards consistent
- [ ] All inputs have green focus
- [ ] Icons replaced (no emoji)

### **After Phase 3**
- [ ] Homepage simplified (2 fields)
- [ ] Event creation auto-copies link
- [ ] Anonymous names auto-generated
- [ ] No nickname modal
- [ ] Host can vote
- [ ] No publish button
- [ ] Auto-search on load

### **After Phase 4**
- [ ] Smooth animations (no transition-all)
- [ ] Mobile-friendly (44px targets)
- [ ] WCAG AA compliant
- [ ] No critical bugs

---

## 🎉 Final Outcome

**Before**: Blue, cluttered, friction-full
**After**: Green, calm, frictionless

**Metrics**:
- 75% fewer clicks (frictionless)
- 100% consistent design (green system)
- 44px+ touch targets (mobile-friendly)
- WCAG AA compliant (accessible)

---

**Ready to start?** Let's begin with **Phase 1, Step 1.1: Update Tailwind Config**! 🚀
