# Mobile Layout Optimization Plan for Where2Meet

## Current Issues on Mobile

### 1. **Layout Problems**
- Side panels (left & right) take up 50% of viewport width each on small screens
- Header is overcrowded with buttons, title, language switcher, and stats
- "Invite people" instruction arrow overflows on narrow screens
- Map is obscured by overlapping panels
- No dedicated mobile navigation pattern

### 2. **Usability Issues**
- Small tap targets for buttons and controls
- Difficult to access map underneath panels
- Hard to scroll through venue lists with limited space
- Route info popup at bottom can cover important map areas
- No easy way to toggle between map and panels

### 3. **Visual Issues**
- Text too small in condensed spaces
- Controls are cramped
- Modals work but could be optimized as bottom sheets

---

## Mobile-First Design Strategy

### Breakpoints
```css
/* Tailwind breakpoints */
sm: 640px   // Small tablets (portrait)
md: 768px   // Tablets (landscape) / Small laptops
lg: 1024px  // Laptops
xl: 1280px  // Desktops
```

**Mobile target:** < 768px (md breakpoint)

---

## Proposed Mobile Layout

### 1. **Header (Mobile < 768px)**

**Current:**
```
[Home] [Lang] [Event Title + Role] | [Radius] [Venues] [Share] [Publish]
```

**Mobile Design:**
```
┌─────────────────────────────────┐
│ [☰] Where2Meet     [Lang] [🔗] │
│ Event Title • 3 participants     │
└─────────────────────────────────┘
```

**Changes:**
- Replace "Home" button with hamburger menu icon (☰)
- Stack event title on second row
- Hide radius/venues stats (show in bottom sheet instead)
- Keep only essential buttons: Language, Share
- Publish button moves to floating action button (FAB)

---

### 2. **Bottom Navigation / Tab Bar**

**New Component** (sticky at bottom on mobile):
```
┌─────────────────────────────────┐
│  [🔍 Search]  [➕ Add]  [💜 Saved] │
└─────────────────────────────────┘
```

**Behavior:**
- Fixed at bottom of screen (z-index: 50)
- Each tab opens a bottom sheet/drawer
- Active tab highlighted
- Badge indicators for counts (e.g., "5" venues found)

---

### 3. **Bottom Sheet / Drawer Pattern**

Replace side panels with mobile-optimized bottom sheets:

#### **Sheet States:**
1. **Collapsed** (peek view) - Shows minimal preview
2. **Half-expanded** - 50% of screen height
3. **Fully expanded** - 80% of screen height
4. **Hidden** - Only map visible

#### **Sheet Content Areas:**

**A. Search Tab:**
```
┌─────────────────────────────────────┐
│ 🔍 Search Venues                    │
├─────────────────────────────────────┤
│ [Search input: restaurants...]      │
│ [🔍 Search Button]                  │
│                                     │
│ Sort by: [⭐ Rating ▼]             │
│ ☑ Only show venues in circle       │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ 🍕 Pizza Place          4.5★│   │
│ │ 123 Main St                 │   │
│ │ [Vote] [Save]               │   │
│ └─────────────────────────────┘   │
│                                     │
│ [... scrollable venue list ...]    │
└─────────────────────────────────────┘
```

**B. Add Tab:**
```
┌─────────────────────────────────────┐
│ ➕ Add Venue                         │
├─────────────────────────────────────┤
│ Search for a specific place:        │
│ [Google Places search box...]       │
│                                     │
│ OR                                  │
│                                     │
│ Tap on the map to add your location│
└─────────────────────────────────────┘
```

**C. Saved Tab (Host-added venues):**
```
┌─────────────────────────────────────┐
│ 💜 Saved Venues (3)                 │
├─────────────────────────────────────┤
│ ┌─────────────────────────────┐    │
│ │ ⭐ Selected Venue      4.8★  │    │
│ │ 456 Oak Ave           🗳️ 5   │    │
│ │ [Vote] [Remove]              │    │
│ └─────────────────────────────┘    │
│                                     │
│ [... scrollable saved venues ...]   │
└─────────────────────────────────────┘
```

---

### 4. **Host Controls (Mobile)**

**Move to Hamburger Menu:**
- Circle Display Radius (slider)
- Participants list
- Route viewer selector
- Reset center point button

**Hamburger Menu Content:**
```
┌─────────────────────────────────────┐
│ Menu                           [✕]  │
├─────────────────────────────────────┤
│ 📊 Circle Display Radius            │
│ ─────●──────── 2.0 km              │
│                                     │
│ 👥 Participants (3)                 │
│ • Alice                        [×] │
│ • Bob                          [×] │
│ • Charlie                      [×] │
│                                     │
│ 🗺️ View Route From                 │
│ [Select participant ▼]             │
│                                     │
│ [🏠 Home] [❓ Help]                 │
└─────────────────────────────────────┘
```

---

### 5. **Map View (Mobile)**

**Full-screen when sheets are collapsed:**
- Map takes entire viewport
- Only header visible at top
- Bottom nav bar at bottom
- Floating elements:
  - Locate Me button (bottom-right, above nav bar)
  - Floating Action Button for Publish (host only)

**Locate Me Button:**
```
Position: absolute bottom-20 right-4
(20 = 5rem to clear bottom nav)
```

**Floating Action Button (FAB):**
```
Position: absolute bottom-20 right-4
Only visible when:
  - User is host
  - Venue is selected
  - No final decision published
```

---

### 6. **Route Information Display**

**Current:** Fixed at bottom-center, can obstruct map

**Mobile Design:**
```
┌─────────────────────────────────────┐
│ Route to Pizza Place           [×] │
│ ─────────────────────────────────  │
│ Travel: [🚗] [🚶] [🚌] [🚴]        │
│                                     │
│  ⏱️ 15 min    📏 3.2 km            │
└─────────────────────────────────────┘
```

**Changes:**
- Add close button (×)
- Make dismissible
- Position just above bottom nav bar
- Smaller, more compact design
- Single row for mode selector

---

### 7. **Modals (Mobile Optimization)**

#### **Share Link Modal:**
Convert to bottom sheet on mobile:
```
┌─────────────────────────────────────┐
│ Share Event Link              [✕]  │
├─────────────────────────────────────┤
│ Invite people with this link:       │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ https://where2meet.app/... │   │
│ └─────────────────────────────┘   │
│                                     │
│ [📋 Copy Link]                     │
│ [✉️ Share via SMS]                 │
│ [📱 Share via Email]               │
└─────────────────────────────────────┘
```

#### **Nickname Prompt:**
Keep as modal but optimize sizing:
- Full-width on very small screens
- Larger tap targets for buttons
- Auto-focus input with mobile keyboard

---

### 8. **Instructions Component**

**Current:** Fixed overlay with instructions

**Mobile Design:**
- Move to first-time user tutorial (overlay)
- Add "?" help button in hamburger menu
- Use toast notifications for tips instead of persistent overlay

---

## Implementation Plan

### Phase 1: Header Optimization (Priority: HIGH)
- [ ] Add hamburger menu icon for mobile
- [ ] Stack header title on mobile
- [ ] Hide non-essential buttons (Home becomes hamburger, stats hidden)
- [ ] Optimize "Invite" arrow to be responsive

**Files to modify:**
- `app/event/page.tsx` (lines 676-746)

**Implementation:**
```tsx
<header className="...">
  <div className="px-3 py-3 md:px-6 md:py-4">
    {/* Mobile: < 768px */}
    <div className="md:hidden flex items-center justify-between">
      <button onClick={() => setShowMobileMenu(true)}>☰</button>
      <LanguageSwitcher />
      {role === 'host' && (
        <button onClick={() => setShowShareModal(true)}>🔗</button>
      )}
    </div>
    <div className="md:hidden text-center mt-2">
      <h1 className="text-lg font-bold">{event.title}</h1>
      <p className="text-xs">{role} • {participants.length} participants</p>
    </div>

    {/* Desktop: >= 768px */}
    <div className="hidden md:flex ...">
      {/* Current desktop layout */}
    </div>
  </div>
</header>
```

---

### Phase 2: Bottom Navigation (Priority: HIGH)
- [ ] Create BottomNav component
- [ ] Add tab state management
- [ ] Implement tab switching logic

**New file:** `components/BottomNav.tsx`

```tsx
interface BottomNavProps {
  activeTab: 'search' | 'add' | 'saved';
  onTabChange: (tab: 'search' | 'add' | 'saved') => void;
  searchCount: number;
  savedCount: number;
}

export default function BottomNav({ activeTab, onTabChange, searchCount, savedCount }: BottomNavProps) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around py-2">
        <button
          onClick={() => onTabChange('search')}
          className={`flex flex-col items-center px-4 py-2 ${activeTab === 'search' ? 'text-blue-600' : 'text-gray-600'}`}
        >
          <span className="text-xl">🔍</span>
          <span className="text-xs mt-1">Search</span>
          {searchCount > 0 && (
            <span className="absolute top-1 right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {searchCount}
            </span>
          )}
        </button>
        {/* Add and Saved tabs */}
      </div>
    </div>
  );
}
```

---

### Phase 3: Bottom Sheet Component (Priority: HIGH)
- [ ] Create BottomSheet component
- [ ] Implement drag gestures (react-spring or framer-motion)
- [ ] Add snap points (collapsed, half, full)

**New file:** `components/BottomSheet.tsx`

```tsx
interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  snapPoints?: number[]; // [0.2, 0.5, 0.8] for collapsed, half, full
}

export default function BottomSheet({ isOpen, onClose, children, snapPoints = [0.2, 0.5, 0.8] }: BottomSheetProps) {
  // Implementation with drag handling
  return (
    <div className={`md:hidden fixed inset-x-0 bottom-0 z-40 transition-transform ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}>
      <div className="bg-white rounded-t-2xl shadow-2xl">
        {/* Drag handle */}
        <div className="py-3 flex justify-center">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Content */}
        <div className="px-4 pb-20 overflow-y-auto" style={{ maxHeight: '80vh' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
```

---

### Phase 4: Hamburger Menu (Priority: MEDIUM)
- [ ] Create MobileMenu component (drawer from left)
- [ ] Move host controls to menu
- [ ] Add Home and Help links

**New file:** `components/MobileMenu.tsx`

---

### Phase 5: Responsive Adjustments (Priority: MEDIUM)
- [ ] Update map container to account for mobile header height
- [ ] Adjust Locate Me button position
- [ ] Make route info dismissible
- [ ] Optimize marker label font sizes

**Adjustments needed:**
```tsx
// Locate Me Button
<button className="absolute bottom-20 md:bottom-32 right-4 ...">
  {/* 20 = 5rem to clear mobile bottom nav */}
</button>

// Route Info
{routeInfo && (
  <div className="absolute bottom-16 md:bottom-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:right-auto ...">
    {/* Mobile: bottom-16 to clear nav, full width */}
    {/* Desktop: centered at bottom */}
  </div>
)}
```

---

### Phase 6: Touch Optimizations (Priority: LOW)
- [ ] Increase button min-height to 44px (iOS standard)
- [ ] Add touch feedback (active states)
- [ ] Improve scrolling performance
- [ ] Add swipe gestures for sheets

---

## Responsive CSS Utilities Needed

```tsx
// Hide on mobile, show on desktop
className="hidden md:block"

// Hide on desktop, show on mobile
className="md:hidden"

// Full width on mobile, constrained on desktop
className="w-full md:w-80"

// Stack on mobile, row on desktop
className="flex flex-col md:flex-row"

// Different padding
className="px-3 md:px-6"

// Different positioning
className="bottom-20 md:bottom-4"
```

---

## Testing Checklist

### Mobile Devices to Test
- [ ] iPhone SE (375px width) - Smallest modern phone
- [ ] iPhone 12/13 (390px width) - Standard
- [ ] iPhone 14 Pro Max (428px width) - Large phone
- [ ] iPad Mini (768px width) - Tablet boundary
- [ ] Android (360px width) - Common Android size

### Interaction Tests
- [ ] Can tap all buttons comfortably
- [ ] Can scroll venue lists smoothly
- [ ] Can drag bottom sheet
- [ ] Can pan/zoom map without triggering buttons
- [ ] Keyboard doesn't obscure input fields
- [ ] Share links work with native share sheet
- [ ] Modals are dismissible by tapping outside

### Visual Tests
- [ ] No horizontal scrolling
- [ ] No text truncation issues
- [ ] Images/icons load correctly
- [ ] Animations perform smoothly
- [ ] Dark mode compatibility (if implemented)

---

## Performance Considerations

1. **Lazy load components:**
   ```tsx
   const BottomSheet = dynamic(() => import('@/components/BottomSheet'), {
     ssr: false,
   });
   ```

2. **Debounce sheet dragging:**
   - Use `useDebouncedValue` for smooth updates

3. **Virtualize long lists:**
   - For 50+ venues, use `react-window` or `@tanstack/react-virtual`

4. **Optimize re-renders:**
   - Memo venue list items
   - Use `useCallback` for handlers

---

## Progressive Enhancement Strategy

**Mobile-first approach:**

1. **Core (all devices):**
   - View map
   - Add location
   - See venues
   - Vote on venues

2. **Enhanced (desktop):**
   - Side-by-side panels
   - Drag to adjust center
   - Multi-column layouts
   - Hover states

3. **Advanced (PWA):**
   - Offline support
   - Install as app
   - Push notifications

---

## Accessibility Notes

- [ ] All interactive elements have min 44×44px touch target
- [ ] Color contrast meets WCAG AA standards
- [ ] Focus states visible for keyboard navigation
- [ ] Screen reader labels for icon buttons
- [ ] Semantic HTML (nav, main, header)
- [ ] ARIA labels for bottom sheet state

---

## Future Enhancements

1. **Gesture Controls:**
   - Swipe up to expand sheet
   - Swipe down to collapse
   - Swipe left/right to switch tabs

2. **Haptic Feedback:**
   - Vibrate on button press (mobile only)
   - Feedback when venue selected

3. **Native Features:**
   - Share via native share sheet
   - Save to calendar
   - Get directions in native maps app

4. **Offline Mode:**
   - Cache event data
   - Service worker for PWA

---

## Priority Order Summary

**Week 1:**
1. Header optimization (mobile hamburger menu)
2. Hide side panels on mobile (< 768px)
3. Create BottomNav component

**Week 2:**
4. Create BottomSheet component
5. Implement tab content in sheets
6. Adjust map controls positioning

**Week 3:**
7. Create MobileMenu drawer
8. Move host controls to menu
9. Testing on real devices

**Week 4:**
10. Polish animations and transitions
11. Optimize performance
12. Accessibility audit

---

## Files to Create/Modify

### New Files:
- `components/BottomNav.tsx` - Bottom navigation bar
- `components/BottomSheet.tsx` - Bottom sheet/drawer
- `components/MobileMenu.tsx` - Hamburger menu drawer
- `hooks/useMediaQuery.ts` - Responsive breakpoint hook

### Files to Modify:
- `app/event/page.tsx` - Main layout restructure
- `components/MapView.tsx` - Adjust control positioning
- `components/CandidatesPanel.tsx` - Mobile-optimized layout
- `components/VenueSearchBox.tsx` - Touch-friendly inputs
- `components/Tabs.tsx` - Make mobile-compatible (or replace with BottomNav)

---

## References

- [Material Design Bottom Sheets](https://m3.material.io/components/bottom-sheets/overview)
- [iOS Human Interface Guidelines - Modality](https://developer.apple.com/design/human-interface-guidelines/modality)
- [Tailwind Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [React Spring - Drag Gestures](https://www.react-spring.dev/docs/utilities/use-gesture)
