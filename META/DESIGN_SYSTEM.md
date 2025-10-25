# Where2Meet Design System

Last Updated: 2025-10-22

## Typography Hierarchy

### Principle
Use size, weight, and color to create clear information hierarchy. The venue view is our reference implementation.

### Levels

#### Level 1: Section Headers
**Usage**: Main section titles (e.g., "Join Event", "Participants")
- **Font Size**: `text-xs` (12px)
- **Font Weight**: `font-bold` (700)
- **Color**: `text-neutral-900` (#171717)
- **Icon Size**: `w-4 h-4` (16px)
- **Icon Color**: `text-emerald-600` (#059669)
- **Spacing**: `gap-1.5` with icon

**Example**:
```tsx
<h3 className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
  <Icon className="w-4 h-4 text-emerald-600" />
  Section Title
</h3>
```

#### Level 2: Primary Labels
**Usage**: Form labels, important field names
- **Font Size**: `text-xs` (12px)
- **Font Weight**: `font-semibold` (600)
- **Color**: `text-neutral-700` (#404040)
- **Spacing**: `mb-1.5` below label

**Example**:
```tsx
<label className="block text-xs font-semibold text-neutral-700 mb-1.5">
  Field Name
</label>
```

#### Level 3: Content Text (Primary)
**Usage**: Venue names, participant names, important data
- **Font Size**: `text-xs` (12px)
- **Font Weight**: `font-semibold` (600)
- **Color**: `text-neutral-900` (#171717)

**Example**:
```tsx
<h5 className="text-xs font-semibold text-neutral-900">
  Venue Name
</h5>
```

#### Level 4: Content Text (Secondary)
**Usage**: Addresses, descriptions, metadata
- **Font Size**: `text-xs` (12px)
- **Font Weight**: `font-normal` (400)
- **Color**: `text-neutral-500` (#737373)

**Example**:
```tsx
<p className="text-xs text-neutral-500">
  123 Main Street, City
</p>
```

#### Level 5: Metric Text
**Usage**: Ratings, distances, vote counts
- **Font Size**: `text-xs` (12px)
- **Font Weight**: `font-medium` (500)
- **Color**: `text-neutral-700` (#404040)

**Example**:
```tsx
<span className="text-xs font-medium text-neutral-700">
  4.5
</span>
```

#### Level 6: Tab Labels
**Usage**: Navigation tabs
- **Font Size**: `text-xs` (12px)
- **Font Weight**: `font-semibold` (600)
- **Color Active**: `text-emerald-700` (#047857)
- **Color Inactive**: `text-neutral-600` (#525252)

**Example**:
```tsx
<button className="text-xs font-semibold text-emerald-700">
  Search
</button>
```

## Icon Sizes

### Primary Icons (Section Headers)
- **Size**: `w-4 h-4` (16px)
- **Color**: `text-emerald-600` (#059669)

### Secondary Icons (Inline with text)
- **Size**: `w-3 h-3` (12px) or `w-3.5 h-3.5` (14px)
- **Color**: Contextual (neutral-400/500/600, emerald-600, yellow-400)

### Action Icons (Buttons)
- **Size**: `w-3.5 h-3.5` (14px) for small actions
- **Size**: `w-4 h-4` (16px) for primary actions
- **Color**: Inherits from button state

## Color System

### Primary Colors
- **Emerald 600**: `#059669` - Primary actions, brand color
- **Teal 600**: `#0d9488` - Secondary actions
- **Emerald 700**: `#047857` - Active states, selected text
- **Emerald 50**: `#ecfdf5` - Active backgrounds

### Neutral Scale
- **Neutral 900**: `#171717` - Primary text (headings, important content)
- **Neutral 700**: `#404040` - Labels, metric text
- **Neutral 600**: `#525252` - Inactive tab text, icons
- **Neutral 500**: `#737373` - Secondary text, muted content
- **Neutral 400**: `#a3a3a3` - Placeholder text, disabled icons
- **Neutral 200**: `#e5e5e5` - Borders, dividers
- **Neutral 100**: `#f5f5f5` - Background accents
- **Neutral 50**: `#fafafa` - Hover states, subtle backgrounds

### Semantic Colors
- **Yellow 400**: `#facc15` - Star ratings
- **Red 600**: `#dc2626` - Delete actions
- **Red 50**: `#fef2f2` - Delete hover backgrounds

## Spacing System

### Padding
- **Section Padding**: `px-4 py-3` (16px horizontal, 12px vertical)
- **Compact Padding**: `px-3 py-2` (12px horizontal, 8px vertical)
- **Card Padding**: `p-1.5` (6px all sides)
- **Button Padding**: `px-3 py-1.5` (12px horizontal, 6px vertical)

### Gaps
- **Between Elements**: `gap-1.5` (6px)
- **Between Sections**: `space-y-2` (8px)
- **Between List Items**: `space-y-0.5` (2px)
- **Inline Elements**: `gap-1` (4px)

### Margins
- **Below Labels**: `mb-1.5` (6px)
- **Below Headers**: `mb-3` (12px)
- **Between Form Fields**: `mb-3` (12px)

## Component Standards

### Buttons

#### Primary Button
```tsx
<button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded transition-all">
  Action
</button>
```

#### Secondary Button
```tsx
<button className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded transition-colors">
  Secondary Action
</button>
```

#### Icon Button
```tsx
<button className="p-1.5 text-neutral-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors">
  <Icon className="w-3.5 h-3.5" />
</button>
```

### Input Fields

#### Text Input
```tsx
<input className="px-3 py-1.5 text-sm text-neutral-900 border border-neutral-300 rounded focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600" />
```

#### Checkbox
```tsx
<input type="checkbox" className="w-3.5 h-3.5 text-emerald-600 border-neutral-300 rounded focus:ring-emerald-500" />
```

### Dividers
```tsx
<div className="h-px bg-neutral-200" />
```

### Tabs
```tsx
<button className={`px-3 py-2 text-xs font-semibold ${
  active
    ? 'bg-emerald-50 text-emerald-700 border-b-2 border-emerald-600'
    : 'text-neutral-600 hover:bg-neutral-50'
}`}>
  Tab Label
</button>
```

## Information Hierarchy Guidelines

### Use Color to Signal Importance
1. **Critical Info** (Black): Venue names, section headers, primary content
2. **Supporting Info** (Gray 700): Labels, metrics
3. **Secondary Info** (Gray 500): Addresses, descriptions
4. **Tertiary Info** (Gray 400): Placeholders, hints

### Use Weight to Signal Hierarchy
1. **Bold** (700): Section headers only
2. **Semibold** (600): Primary content, labels
3. **Medium** (500): Metrics, numbers
4. **Normal** (400): Secondary text, descriptions

### Use Size Sparingly
- Keep most text at `text-xs` (12px)
- Use `text-sm` (14px) only for buttons and form inputs
- Never go larger than `text-sm` in the left panel

## Examples from Venue View

### Search Result Card (2-line)
```tsx
<div className="p-1.5 rounded cursor-pointer hover:bg-neutral-50">
  {/* Line 1: Name + Rating + Distance */}
  <div className="flex items-center justify-between gap-1 mb-0.5">
    <h5 className="text-xs font-semibold text-neutral-900 truncate">
      Venue Name
    </h5>
    <div className="flex items-center gap-1.5 text-xs">
      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
      <span className="font-medium text-neutral-700">4.5</span>
      <MapPin className="w-3 h-3 text-neutral-500" />
      <span className="text-neutral-600">1.2km</span>
    </div>
  </div>

  {/* Line 2: Address + Actions */}
  <div className="flex items-center justify-between gap-1">
    <p className="text-xs text-neutral-500 truncate">
      123 Main Street
    </p>
    <button className="p-0.5 hover:bg-emerald-100 rounded">
      <Heart className="w-3.5 h-3.5 text-neutral-400" />
    </button>
  </div>
</div>
```

### Participant Card (1-line)
```tsx
<div className="flex items-center gap-1.5 p-1 rounded hover:bg-neutral-50">
  <div style={{borderBottom: '6px solid #10b981', ...}} />
  <span className="text-xs font-medium text-neutral-900">
    → participant_name
  </span>
  <span className="text-neutral-400 text-xs">•</span>
  <span className="text-xs text-neutral-600">
    123.45, -89.01
  </span>
  <EyeOff className="w-3 h-3 text-neutral-400" />
</div>
```

## Migration Checklist

When updating a component to match this design system:

- [ ] Replace all section headers with Level 1 typography
- [ ] Update all labels to Level 2 typography
- [ ] Update primary content to Level 3 typography
- [ ] Update secondary text to Level 4 typography
- [ ] Standardize icon sizes (w-4 h-4 for headers, w-3.5 h-3.5 for actions)
- [ ] Use consistent padding (px-4 py-3 for sections)
- [ ] Use neutral-900 for primary text, neutral-700 for labels, neutral-500 for secondary
- [ ] Ensure emerald-600 is used for all primary brand colors
- [ ] Use h-px bg-neutral-200 for all dividers
- [ ] Remove redundant rounded backgrounds (panel container handles this)
