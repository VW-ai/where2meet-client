# Where2Meet Design Implementation TODO

This document tracks the implementation of design requirements from DESIGN-LAYOUT.md.

## Status Legend
- ✅ **Implemented** - Feature is complete and matches design spec
- 🚧 **Partial** - Feature exists but needs enhancement
- ❌ **Missing** - Feature not yet implemented
- 🔮 **Future** - Planned for future iterations

---

## 1. Layout Structure & Hierarchy

### Responsive Grid
- ✅ Desktop: Split layout with sidebar and main panel
- ✅ Mobile: Vertical stacking (via Tailwind responsive classes)
- ✅ Flexible grid system using Tailwind

### Cards & Sections
- ✅ Card-based layout for venue options
- ✅ Subtle shadows and spacing
- 🚧 **NEEDS WORK**: Content hierarchy could be clearer
  - Event title prominence
  - Current phase visibility
  - Visual separation between sections

### Modals & Overlays
- ✅ Event creation uses modals
- ✅ Nickname prompt modal
- ✅ Share link modal
- 🚧 **NEEDS WORK**:
  - Modals lack "social warmth" imagery
  - Background dimming could be more pronounced
  - Need welcoming icons (wave, handshake)

### Progress & Status Indicators
- ❌ **MISSING**: Event lifecycle progress bar
  - No "Planning" → "Voting" → "Finalized" indicator
  - No status tags (Draft, Voting Open, Finalized)
  - No countdown or "X people voted" display
- 🚧 **PARTIAL**: Final decision banner exists but basic

---

## 2. Imagery & Visual Elements

### Maps as Central Canvas
- ✅ Interactive map is centerpiece
- ✅ Custom pins for locations
- ✅ Real-time updates
- ✅ Side-by-side map and list on desktop
- ✅ Map pins highlight on hover
- 🚧 **NEEDS WORK**:
  - Custom pin styling (could be more branded)
  - Animation when pins are added

### Venue Cards with Photos
- ❌ **MISSING**: Venue photos/thumbnails
  - Currently only showing name, rating, distance
  - No venue images from Google Places
  - No fallback icons for venue types
- ❌ **MISSING**: Street View integration
- 🚧 **NEEDS WORK**:
  - Card visual appeal (add venue imagery)
  - Category icons (coffee cup, restaurant fork, etc.)

### Iconography
- ✅ Basic icons used (🔍, ⭐, ➕, 🗳️)
- 🚧 **NEEDS WORK**:
  - Inconsistent icon family (mixing emoji and SVG)
  - Need custom icon set with brand styling
  - Add more intuitive action icons
  - Pair all icons with text labels

### Social Avatars & Visual Feedback
- ❌ **MISSING**: Participant avatars/initials
  - No visual representation of who voted
  - No "who's online" indicator
  - No contributor attribution on venues
- ❌ **MISSING**: Real-time visual feedback
  - Vote count updates exist but not animated
  - No highlighting when votes come in
  - No celebratory animations
- 🚧 **NEEDS WORK**: Add human touches throughout

---

## 3. Event Flow & Page Layouts

### Event Creation (Home Page)
- ✅ Single-column centered form
- ✅ Minimal fields
- ✅ Generous spacing
- ✅ Prominent "Create Event" button
- 🚧 **NEEDS WORK**:
  - Could be more welcoming/friendly
  - Add visual warmth (illustrations, icons)
  - Optional: Multi-step wizard for future

### Participant Invitation & Join
- ✅ Shareable link with copy button
- ✅ Clean join interface
- ✅ Minimal friction (no login required)
- 🚧 **NEEDS WORK**:
  - Add social share icons
  - Add welcoming icon (wave/handshake)
  - Personalized greeting message
  - Optional: Avatar color picker
  - Friendly language enhancement

### Location Discovery (Map & List View)
- ✅ Two-pane desktop layout (list + map)
- ✅ Scrollable venue cards
- ✅ Search bar for adding locations
- ✅ Real-time updates
- ✅ Map pins highlight on hover
- 🚧 **NEEDS WORK**:
  - Venue cards need photos
  - Mobile map/list toggle
  - Better discovery experience
  - Thumbnail images on cards

### Voting & Suggestions
- ✅ Vote buttons on venue cards
- ✅ Vote count display
- ✅ "Add venue" functionality
- 🚧 **NEEDS WORK**:
  - ❌ Show participant avatars who voted
  - ❌ Visual indicators per voter
  - ❌ Banner showing voting status ("X of Y voted")
  - ❌ Tooltips/hints for new users
  - Better voting transparency

### Decision & Finalization
- ✅ Final decision banner
- 🚧 **NEEDS WORK**:
  - ❌ Celebratory visual treatment
  - ❌ Large venue photo/map snapshot
  - ❌ Confirmation icon (trophy/checkmark)
  - ❌ "Add to Calendar" link
  - ❌ "Get Directions" button
  - ❌ Participant acknowledgment ("Got it!")
  - De-emphasize previous options
  - Clear summary like Eventbrite

---

## 4. Priority Implementation Plan

### Phase 1: Quick Wins (Visual Polish)
1. ✅ **Add venue photos to cards** [HIGH PRIORITY]
   - Integrate Google Places photo API
   - Show thumbnail on each venue card
   - Fallback to category icons

2. ✅ **Add event lifecycle status** [HIGH PRIORITY]
   - Status badge in header (Planning/Voting/Finalized)
   - Progress indicator
   - Vote count display

3. ✅ **Improve modal warmth** [MEDIUM PRIORITY]
   - Add welcoming icons
   - Friendlier copy
   - Better visual hierarchy

4. ✅ **Add participant avatars** [MEDIUM PRIORITY]
   - Generate initials from names
   - Color-coded avatars
   - Show on vote indicators

### Phase 2: Enhanced Interactions
5. ⏳ **Real-time visual feedback** [MEDIUM PRIORITY]
   - Animate vote counts
   - Highlight cards on new votes
   - Celebrate final decision

6. ⏳ **Improve iconography** [LOW PRIORITY]
   - Replace emoji with consistent icon set
   - Brand-styled icons
   - Icon + label pattern

7. ⏳ **Enhanced venue cards** [MEDIUM PRIORITY]
   - Larger photos
   - Street View integration
   - Better information hierarchy

### Phase 3: Social Features
8. ⏳ **Social indicators** [MEDIUM PRIORITY]
   - Show who's online
   - Attribute venue suggestions
   - Show voting attribution

9. ⏳ **Finalization experience** [HIGH PRIORITY]
   - Celebratory UI
   - Calendar export
   - Directions integration
   - Acknowledgment system

### Phase 4: Future Enhancements (from DESIGN-LAYOUT.md)
10. 🔮 **Availability polling** [FUTURE]
    - Doodle-style date/time selection
    - Multi-step wizard
    - Calendar grid integration

11. 🔮 **Advanced lifecycle UI** [FUTURE]
    - Countdown timers
    - Urgency indicators
    - Enhanced progress tracking

---

## 5. Design System Considerations

### Color Palette
- Primary: `#08c605` (Green) - Currently used
- Secondary: `#000000` (Black) - Currently used
- Accent: Blue shades for interactive elements
- **NEEDS**: Warm social colors for avatars, celebrations

### Typography
- **CURRENT**: Using default sans-serif
- **NEEDS**: Define clear hierarchy
  - H1: Event titles
  - H2: Section headers
  - Body: Descriptions
  - Small: Metadata

### Spacing & Layout
- **CURRENT**: Using Tailwind spacing (good)
- **MAINTAIN**: Generous whitespace
- **ENHANCE**: Consistent card padding

### Imagery Style
- **NEEDS**: Welcoming illustrations for empty states
- **NEEDS**: Playful icons for actions
- **NEEDS**: Consistent photo treatment (rounded corners, aspect ratios)

---

## 6. Immediate Action Items (Next Sprint)

### Must Have (This Week)
- [ ] Integrate Google Places Photos API for venue thumbnails
- [ ] Add event status badge (Planning/Voting/Finalized)
- [ ] Create participant avatar component (initials + color)
- [ ] Show avatars on vote indicators
- [ ] Add welcoming icon to join modal

### Should Have (Next Week)
- [ ] Enhanced final decision screen with celebration
- [ ] Vote count progress indicator ("3 of 5 voted")
- [ ] Mobile map/list toggle button
- [ ] Category fallback icons for venues without photos
- [ ] Tooltip hints for new users

### Nice to Have (Future)
- [ ] Animated vote count updates
- [ ] Card highlighting on real-time updates
- [ ] Street View preview integration
- [ ] Calendar export functionality
- [ ] Social share buttons (Facebook, WhatsApp, etc.)

---

## 7. Technical Implementation Notes

### Venue Photos
```typescript
// Use Google Places Photo API
interface VenuePhoto {
  photo_reference: string;
  width: number;
  height: number;
}

// Construct photo URL
const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photo_reference}&key=${API_KEY}`;
```

### Participant Avatars
```typescript
// Generate avatar color from name
function getAvatarColor(name: string): string {
  const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-yellow-500'];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

// Get initials
function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}
```

### Event Status Component
```typescript
type EventStatus = 'planning' | 'voting' | 'finalized';

interface StatusBadgeProps {
  status: EventStatus;
  voteCount?: number;
  totalParticipants?: number;
}
```

---

## 8. Success Metrics

### User Experience
- Users should immediately understand event phase
- Venue options should feel tangible (photos help)
- Participants should feel connected (avatars help)
- Final decision should feel celebratory

### Visual Consistency
- All icons from same family
- Consistent card styling
- Unified color usage
- Clear hierarchy maintained

### Social Warmth
- Friendly copy throughout
- Welcoming imagery
- Human touches (avatars, names, acknowledgments)
- Collaborative feel

---

**Last Updated**: 2025-10-21
**Next Review**: After Phase 1 completion
