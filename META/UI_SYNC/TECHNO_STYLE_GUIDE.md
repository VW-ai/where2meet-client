# Where2Meet - Techno/Brutalist Style Guide

**Version:** 1.0
**Last Updated:** October 25, 2024
**Applies To:** Event Page (Primary Reference), Home Page, Login, Events Feed, All Pages

---

## 🎨 **Design Philosophy**

**Techno-Brutalist Aesthetic:**
- Sharp, geometric shapes (no rounded corners except where noted)
- High contrast black & white with selective color accents
- Bold borders (2px-4px) with offset shadows
- Uppercase text for emphasis
- Functional, minimal design with clear hierarchy

---

## 📐 **Core Design Tokens**

### **Base Font Size**
```css
html {
  font-size: 14px; /* Global base - all rem units derive from this */
}
```

### **Color Palette**

#### **Primary Colors (Brutalist Black/White)**
```css
--black: #000000;           /* Primary borders, backgrounds, text */
--white: #ffffff;           /* Backgrounds, text on dark */
--gray-50: #fafafa;         /* Subtle hover states */
--gray-100: #f5f5f5;        /* Light hover backgrounds */
--gray-200: #e5e5e5;        /* Dividers, borders */
--gray-300: #d4d4d4;        /* Secondary borders */
--gray-400: #a3a3a3;        /* Placeholder text, disabled icons */
--gray-500: #737373;        /* Secondary text */
--gray-600: #525252;        /* Inactive text */
--gray-700: #404040;        /* Labels, metrics */
--gray-900: #171717;        /* Primary headings */
```

#### **Accent Colors (Participant Markers)**
```css
--emerald: #10b981;         /* Participant color 1 */
--teal: #0d9488;            /* Participant color 2 */
--amber: #f59e0b;           /* Participant color 3 */
--purple: #9333ea;          /* Participant color 4 */
--pink: #ec4899;            /* Participant color 5 */
--blue: #3b82f6;            /* Participant color 6 */
```

#### **Semantic Colors (Venue Markers & Actions)**
```css
--red-400: #f87171;         /* Venue marker 1 */
--red-500: #ef4444;         /* Venue marker 2 */
--red-600: #dc2626;         /* Venue marker 3, delete actions */
--orange-400: #fb923c;      /* Venue marker 4 */
--orange-500: #f97316;      /* Venue marker 5 */
--orange-600: #ea580c;      /* Venue marker 6 */
--yellow-400: #facc15;      /* Star ratings */
```

### **Border Weights**
```css
--border-thin: 2px;         /* Standard borders (inputs, cards) */
--border-medium: 3px;       /* Emphasized elements (modals, toasts) */
--border-heavy: 4px;        /* Critical UI (final decision banner) */
```

### **Box Shadows (Brutalist Offset)**
```css
--shadow-sm: 2px 2px 0px 0px rgba(0,0,0,1);   /* Small cards */
--shadow-md: 4px 4px 0px 0px rgba(0,0,0,1);   /* LeftPanel, modals */
--shadow-lg: 6px 6px 0px 0px rgba(0,0,0,1);   /* Toasts, banners */
--shadow-xl: 8px 8px 0px 0px rgba(0,0,0,1);   /* Large modals */
```

---

## 🔤 **Typography System**

### **Font Sizes**
```css
text-xs:   12px (0.857rem)  /* Body text, labels, buttons */
text-sm:   14px (1rem)      /* Inputs, larger buttons */
text-base: 16px (1.143rem)  /* Headings, important text */
text-lg:   18px (1.286rem)  /* Section headers (desktop) */
text-xl:   20px (1.429rem)  /* Page titles (rarely used) */
```

### **Font Weights**
```css
font-normal:   400  /* Secondary text, descriptions */
font-medium:   500  /* Metrics, numbers */
font-semibold: 600  /* Primary content, labels */
font-bold:     700  /* Headers, emphasis */
```

### **Text Hierarchy**

#### **Level 1: Section Headers**
```tsx
<h3 className="text-xs font-bold text-black uppercase flex items-center gap-1.5">
  <Icon className="w-4 h-4 text-black" />
  SECTION TITLE
</h3>
```
**Usage:** Main section titles (Venues, Participants, Input)

#### **Level 2: Primary Content**
```tsx
<h5 className="text-xs font-semibold text-black">
  Venue Name / Participant Name
</h5>
```
**Usage:** Item names, important data

#### **Level 3: Secondary Text**
```tsx
<p className="text-xs text-gray-600">
  123 Main Street, City
</p>
```
**Usage:** Addresses, descriptions, metadata

#### **Level 4: Metrics/Numbers**
```tsx
<span className="text-xs font-medium text-black">
  4.5 ★ | 1.2km | 3 votes
</span>
```
**Usage:** Ratings, distances, counts

#### **Level 5: Labels**
```tsx
<label className="block text-sm font-medium text-black mb-2">
  Field Name
</label>
```
**Usage:** Form labels

#### **Level 6: Buttons**
```tsx
<button className="text-xs font-bold uppercase">
  ACTION
</button>
```
**Usage:** All buttons (uppercase for emphasis)

---

## 🎛️ **Component Patterns**

### **1. Buttons**

#### **Primary Button (Black)**
```tsx
<button className="px-4 py-2 bg-black text-white border-2 border-black hover:bg-gray-900 transition-all font-bold text-xs uppercase">
  PRIMARY ACTION
</button>
```
**Usage:** Main CTAs (JOIN, SEARCH, PUBLISH)

#### **Secondary Button (White/Outline)**
```tsx
<button className="px-3 py-1.5 bg-white text-black border-2 border-black hover:bg-gray-100 transition-all font-bold text-xs uppercase">
  SECONDARY
</button>
```
**Usage:** Cancel, alternative actions

#### **Icon Button (Small)**
```tsx
<button className="p-1.5 border-2 border-black bg-white text-black hover:bg-gray-100 transition-all">
  <Icon className="w-3.5 h-3.5" />
</button>
```
**Usage:** Inline actions (delete, edit, toggle)

#### **Toggle Button (Active State)**
```tsx
<button className={`px-2 py-0.5 text-xs font-bold uppercase border-2 border-black transition-all ${
  isActive
    ? 'bg-black text-white'
    : 'bg-white text-black hover:bg-gray-100'
}`}>
  TOGGLE
</button>
```
**Usage:** Names/Address toggle, filters

---

### **2. Input Fields**

#### **Text Input (Sharp Borders)**
```tsx
<input className="w-full px-3 py-2 text-sm text-black border-2 border-black focus:border-black outline-none placeholder:text-gray-400" />
```
**Key Features:**
- No rounded corners
- 2px solid black border
- No focus ring (border stays black)
- Gray placeholder text

#### **Search Input (with Icon)**
```tsx
<div className="relative">
  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black" />
  <input className="w-full pl-8 pr-2 py-1.5 text-xs text-black border-2 border-black focus:border-black outline-none placeholder:text-gray-400" />
</div>
```

#### **Input with Inline Button**
```tsx
<div className="flex gap-2">
  <input className="flex-1 px-3 py-1.5 text-sm border-2 border-black" />
  <button className="p-1.5 border-2 border-black bg-white hover:bg-gray-100">
    <Icon className="w-4 h-4" />
  </button>
</div>
```
**Usage:** Name field with shuffle button

#### **Checkbox**
```tsx
<input
  type="checkbox"
  className="w-4 h-4 border-2 border-gray-300"
  style={{ accentColor: '#000000' }}
/>
```

---

### **3. Cards & Lists**

#### **2-Line Venue Card (Search Results)**
```tsx
<div className="p-1.5 border-2 border-black bg-white hover:bg-gray-100 cursor-pointer transition-all">
  {/* Line 1: Name + Rating + Distance */}
  <div className="flex items-center justify-between gap-1 mb-0.5">
    <h5 className="text-xs font-semibold text-black truncate">
      Venue Name
    </h5>
    <div className="flex items-center gap-1.5 text-xs flex-shrink-0">
      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
      <span className="font-medium text-black">4.5</span>
      <MapPin className="w-3 h-3 text-gray-600" />
      <span className="text-gray-600">1.2km</span>
    </div>
  </div>

  {/* Line 2: Address + Action */}
  <div className="flex items-center justify-between gap-1">
    <p className="text-xs text-gray-600 truncate">
      123 Main Street
    </p>
    <button className="p-0.5 hover:bg-gray-200 transition-colors">
      <Heart className="w-3.5 h-3.5 text-gray-400" />
    </button>
  </div>
</div>
```

#### **2-Line Venue Card (Saved List with Color Tag)**
```tsx
<div className="relative p-1.5 border-2 border-black bg-white hover:bg-gray-100 cursor-pointer transition-all overflow-hidden">
  {/* Line 1 & 2 content here */}

  {/* Color Tag - Rightmost 25% with angled left edge */}
  <div
    className="absolute right-0 top-0 bottom-0 w-[25%]"
    style={{
      backgroundColor: '#ef4444',
      clipPath: 'polygon(20% 0%, 100% 0%, 100% 100%, 0% 100%)',
    }}
  />
</div>
```

#### **Participant Card (2-Line with Color Tag)**
```tsx
<div className={`relative flex border-2 border-black cursor-pointer transition-all overflow-hidden ${
  isMe ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'
}`}>
  {/* Content Area */}
  <div className="flex-1 min-w-0 p-1.5 pr-2">
    {/* Line 1: Name + Indicators */}
    <div className="flex items-center gap-1.5 mb-0.5">
      <span className={`text-xs font-bold ${isMe ? 'text-white' : 'text-black'}`}>
        → Participant Name
      </span>
      <EyeOff className="w-3 h-3 text-gray-400" />
    </div>

    {/* Line 2: Address or Coordinates */}
    <div className="flex items-center">
      <span className={`text-xs truncate ${isMe ? 'text-gray-300' : 'text-gray-600'}`}>
        123 Main Street
      </span>
    </div>
  </div>

  {/* Color Tag */}
  <div
    className="absolute right-0 top-0 bottom-0 w-[25%]"
    style={{
      backgroundColor: '#10b981',
      clipPath: 'polygon(20% 0%, 100% 0%, 100% 100%, 0% 100%)',
    }}
  />
</div>
```

---

### **4. Tabs**

#### **Full-Width Tabs (Black/White)**
```tsx
<div className="flex border-b-2 border-black">
  <button className={`flex-1 px-3 py-2 font-bold text-xs transition-all border-r border-black ${
    activeTab === 'search'
      ? 'bg-black text-white'
      : 'bg-white text-black hover:bg-gray-100'
  }`}>
    SEARCH
  </button>
  <button className={`flex-1 px-3 py-2 font-bold text-xs transition-all ${
    activeTab === 'saved'
      ? 'bg-black text-white'
      : 'bg-white text-black hover:bg-gray-100'
  }`}>
    SAVED
  </button>
</div>
```
**Key Features:**
- Full-width split
- Active = black background, white text
- Inactive = white background, black text
- Border separator between tabs

---

### **5. Modals & Overlays**

#### **Modal Container**
```tsx
<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
  <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md w-full mx-4">
    {/* Header */}
    <div className="bg-black text-white px-4 py-3 border-b-4 border-black">
      <h3 className="text-sm font-bold uppercase">Modal Title</h3>
    </div>

    {/* Content */}
    <div className="px-4 py-4">
      {/* Modal content */}
    </div>

    {/* Actions */}
    <div className="px-4 py-4 flex gap-3">
      <button className="flex-1 px-4 py-3 border-2 border-black bg-white text-black hover:bg-gray-100 font-bold text-xs uppercase">
        CANCEL
      </button>
      <button className="flex-1 px-4 py-3 border-2 border-black bg-black text-white hover:bg-gray-900 font-bold text-xs uppercase">
        CONFIRM
      </button>
    </div>
  </div>
</div>
```

#### **Toast Notification (Brutalist)**
```tsx
<Toaster
  position="top-center"
  toastOptions={{
    style: {
      background: 'white',
      color: 'black',
      border: '3px solid black',
      boxShadow: '6px 6px 0px 0px rgba(0,0,0,1)',
      fontWeight: 'bold',
      fontSize: '14px',
      textTransform: 'uppercase',
      padding: '12px 16px',
    },
  }}
/>
```

#### **Banner (Final Decision)**
```tsx
<div className="bg-white border-3 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
  <div className="bg-black text-white px-4 py-2 border-b-3 border-black flex items-center gap-2">
    <svg className="w-3.5 h-3.5" />
    <p className="font-bold text-xs uppercase tracking-wider">FINAL DECISION</p>
  </div>
  <div className="px-4 py-3">
    <p className="font-bold text-base text-black uppercase text-center">
      Venue Name
    </p>
  </div>
</div>
```

---

### **6. Panels & Containers**

#### **Left Panel (Main Container)**
```tsx
<div className="w-96 max-w-[calc(50vw-2rem)] bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col">
  {/* Sections go here */}
</div>
```

#### **Section with Collapsible Header**
```tsx
<div className="px-4 py-3">
  {/* Header */}
  <button
    onClick={() => setIsExpanded(!isExpanded)}
    className="flex items-center gap-1.5 hover:opacity-70 transition-opacity mb-2"
  >
    {isExpanded ? (
      <ChevronUp className="w-3 h-3 text-black" />
    ) : (
      <ChevronDown className="w-3 h-3 text-black" />
    )}
    <Icon className="w-4 h-4 text-black" />
    <h3 className="text-xs font-bold text-black uppercase">
      SECTION TITLE (Count)
    </h3>
  </button>

  {/* Collapsible Content */}
  {isExpanded && (
    <div className="space-y-0.5">
      {/* Content */}
    </div>
  )}
</div>
```

#### **Section Divider**
```tsx
<div className="h-0.5 bg-black" />
```
**Usage:** Between major sections (Input → Venues → Participants)

---

### **7. Form Patterns**

#### **Standard Form Field**
```tsx
<div className="space-y-4">
  <div>
    <label className="block text-sm font-medium text-black mb-2">
      Field Name
    </label>
    <input
      type="text"
      className="w-full px-3 py-2 text-sm text-black border-2 border-black focus:border-black outline-none"
    />
  </div>
</div>
```

#### **Form with Inline Icon Button**
```tsx
<div className="flex items-center gap-2">
  <div className="flex items-center flex-1 gap-2 px-3 py-1.5 border-2 border-black">
    <Icon className="w-4 h-4 text-black" />
    <input className="flex-1 text-sm text-black outline-none bg-transparent" />
  </div>
  <button className="p-1.5 border-2 border-black hover:bg-black hover:text-white transition-all">
    <Icon className="w-4 h-4" />
  </button>
</div>
```
**Usage:** Name input with shuffle button

---

## 🎨 **Icon System**

### **Icon Library**
All icons from **Lucide React**:
```tsx
import {
  Users, Store, Search, Heart, MapPin, Star,
  EyeOff, Eye, Trash2, ChevronUp, ChevronDown,
  Navigation, RefreshCw, Copy, Globe, Trophy,
  Info, Check, X
} from 'lucide-react';
```

### **Icon Sizes**

#### **Section Headers**
```tsx
<Icon className="w-4 h-4 text-black" />
```
**Size:** 16px | **Usage:** Participants, Venues, Input section icons

#### **Inline Icons (Metrics)**
```tsx
<Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
<MapPin className="w-3 h-3 text-gray-600" />
<EyeOff className="w-3 h-3 text-gray-400" />
```
**Size:** 12px | **Usage:** Ratings, locations, privacy indicators

#### **Action Icons**
```tsx
<Heart className="w-3.5 h-3.5 text-gray-400" />
<Trash2 className="w-3 h-3 text-black" />
<Copy className="w-3.5 h-3.5 text-white" />
```
**Size:** 12-14px | **Usage:** Vote, delete, copy actions

#### **Collapse Icons**
```tsx
<ChevronUp className="w-3 h-3 text-black" />
<ChevronDown className="w-3 h-3 text-black" />
```
**Size:** 12px | **Usage:** Collapse/expand sections

### **Icon Colors**

#### **Primary Icons (Headers)**
- `text-black` - Section icons (Users, Store, etc.)

#### **Accent Icons (Interactive)**
- `text-yellow-400 fill-yellow-400` - Star ratings (filled)
- `text-gray-400` - Heart (un-voted), EyeOff, inactive icons
- `fill-black text-black` - Heart (voted)
- `text-gray-600` - MapPin, distance icons

---

## 🔄 **Interactive States**

### **Hover States**

#### **Cards/Buttons**
```tsx
hover:bg-gray-100  /* White backgrounds */
hover:bg-gray-900  /* Black backgrounds */
hover:bg-gray-200  /* Icon buttons */
```

#### **Opacity Changes**
```tsx
hover:opacity-70   /* Section headers, collapse buttons */
```

### **Active/Selected States**

#### **Selected Card**
```tsx
className={`border-2 border-black ${
  isSelected
    ? 'bg-black text-white'
    : 'bg-white text-black hover:bg-gray-100'
}`}
```

#### **Active Tab**
```tsx
className={`${
  isActive
    ? 'bg-black text-white'
    : 'bg-white text-black hover:bg-gray-100'
}`}
```

#### **Toggle Button**
```tsx
className={`border-2 border-black ${
  isToggled
    ? 'bg-black text-white'
    : 'bg-white text-black hover:bg-gray-100'
}`}
```

### **Disabled States**
```tsx
disabled:opacity-50
disabled:cursor-not-allowed
disabled:cursor-wait  /* For loading inputs */
```

---

## 📏 **Spacing System**

### **Component Spacing**

#### **Padding**
```css
px-4 py-3    /* Section padding (16px h, 12px v) */
p-1.5        /* Card padding (6px all sides) */
px-3 py-1.5  /* Button padding (12px h, 6px v) */
px-3 py-2    /* Input padding (12px h, 8px v) */
```

#### **Gaps**
```css
gap-1        /* 4px - Inline icons + text */
gap-1.5      /* 6px - Section header icon + title */
gap-2        /* 8px - Form fields, buttons */
space-y-0.5  /* 2px - List items (ultra-compact) */
space-y-2    /* 8px - Sections */
space-y-4    /* 16px - Form fields */
```

#### **Margins**
```css
mb-0.5       /* 2px - Between card lines */
mb-1         /* 4px - Below compact headers */
mb-2         /* 8px - Below labels */
mb-4         /* 16px - Below section headers */
```

---

## 🎯 **Interaction Patterns**

### **1. Toggles**

#### **Privacy Toggle (Eye/EyeOff)**
```tsx
<button className={`p-2 border-2 border-black transition-all ${
  isBlurred
    ? 'bg-black text-white'
    : 'bg-white text-black hover:bg-gray-100'
}`}>
  {isBlurred ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
</button>
```

#### **Two-State Toggle (Names/Addresses)**
```tsx
<button className={`px-2 py-0.5 text-xs font-bold uppercase border-2 border-black ${
  isActive ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
}`}>
  LABEL
</button>
```

### **2. Vote/Like Interactions**

#### **Heart Button (Vote)**
```tsx
<button onClick={(e) => { e.stopPropagation(); handleVote(); }}>
  <Heart className={`w-3.5 h-3.5 ${
    hasVoted
      ? 'fill-black text-black'
      : 'text-gray-400 hover:text-black'
  }`} />
</button>
```

### **3. Search Interactions**

#### **Search on Enter Key**
```tsx
<input
  onKeyDown={(e) => e.key === 'Enter' && onSearch()}
  className="..."
/>
```

#### **Search Button**
```tsx
<button
  onClick={onSearch}
  disabled={isSearching}
  className="px-4 py-2 bg-black text-white border-2 border-black font-bold text-xs uppercase"
>
  {isSearching ? 'SEARCHING...' : 'SEARCH'}
</button>
```

### **4. Collapse/Expand**

#### **Section Collapse Pattern**
```tsx
const [isExpanded, setIsExpanded] = useState(true);

<button onClick={() => setIsExpanded(!isExpanded)}>
  {isExpanded ? <ChevronUp /> : <ChevronDown />}
  SECTION TITLE
</button>

{isExpanded && (
  <div>{/* Content */}</div>
)}
```

### **5. Auto-scroll to Selected**

#### **Scroll into View on Selection**
```tsx
const candidateRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

useEffect(() => {
  if (selectedCandidate && candidateRefs.current[selectedCandidate.id]) {
    candidateRefs.current[selectedCandidate.id]?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    });
  }
}, [selectedCandidate]);

<div ref={(el) => { candidateRefs.current[candidate.id] = el; }}>
  {/* Card content */}
</div>
```

---

## 📱 **Responsive Patterns**

### **Mobile vs Desktop**

#### **Hide on Mobile**
```tsx
className="hidden lg:block"  /* Desktop only */
```

#### **Hide on Desktop**
```tsx
className="block lg:hidden"  /* Mobile only */
```

#### **Responsive Text**
```tsx
className="text-sm sm:text-base lg:text-lg"
```

#### **Responsive Padding**
```tsx
className="px-4 sm:px-6 lg:px-8"
```

### **Panel Width**
```tsx
className="w-96 max-w-[calc(50vw-2rem)]"
```
**Logic:** Fixed 384px (w-96) on large screens, max 50% viewport width minus margin on smaller screens

---

## ✅ **Implementation Checklist**

When implementing a new page/component in this style:

### **Typography**
- [ ] Use `text-xs` for 90% of text
- [ ] Use `text-sm` only for inputs and large buttons
- [ ] All buttons use `uppercase` + `font-bold`
- [ ] Section headers use `uppercase` + `font-bold` + `text-xs`
- [ ] Primary content uses `font-semibold`
- [ ] Secondary text uses `text-gray-600`

### **Colors**
- [ ] Primary borders are `border-black` with `border-2`
- [ ] Primary backgrounds are `bg-black` or `bg-white`
- [ ] Hover states use `hover:bg-gray-100` (white) or `hover:bg-gray-900` (black)
- [ ] Selected states use `bg-black text-white`
- [ ] Icons use `text-black`, `text-gray-400`, or `text-gray-600`

### **Borders & Shadows**
- [ ] All borders are `border-2` minimum (no `border` or `border-1`)
- [ ] No rounded corners (remove all `rounded` classes)
- [ ] Modals/toasts use offset shadows: `shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]`
- [ ] Panels use: `shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`

### **Spacing**
- [ ] Section padding is `px-4 py-3`
- [ ] Card padding is `p-1.5`
- [ ] Button padding is `px-3 py-1.5` (small) or `px-4 py-2` (large)
- [ ] List items have `space-y-0.5` (ultra-compact)
- [ ] Sections have `space-y-2`

### **Icons**
- [ ] Section headers use `w-4 h-4`
- [ ] Inline icons use `w-3 h-3` or `w-3.5 h-3.5`
- [ ] Stars use `fill-yellow-400 text-yellow-400`
- [ ] Heart (voted) uses `fill-black text-black`
- [ ] Heart (un-voted) uses `text-gray-400`

### **Interactions**
- [ ] All cards are `cursor-pointer` with `hover:bg-gray-100`
- [ ] Toggle buttons switch between `bg-black text-white` and `bg-white text-black`
- [ ] Active tabs use `bg-black text-white`
- [ ] Selected cards use `bg-black text-white`
- [ ] Collapse buttons use `ChevronUp`/`ChevronDown` with `hover:opacity-70`

### **Forms**
- [ ] All inputs have `border-2 border-black`
- [ ] No rounded corners on inputs
- [ ] Placeholders use `placeholder:text-gray-400`
- [ ] Focus removes outline: `focus:border-black outline-none`
- [ ] Checkboxes use `accentColor: '#000000'`

---

## 📋 **Common Mistakes to Avoid**

1. **DO NOT use rounded corners** (`rounded`, `rounded-lg`, etc.) - Keep sharp edges
2. **DO NOT use thin borders** (`border-1`, `border`) - Always use `border-2` or thicker
3. **DO NOT use shadow-sm/md/lg** - Use brutalist offset shadows instead
4. **DO NOT use color backgrounds** (green, blue, etc.) - Stick to black/white/gray
5. **DO NOT use large text sizes** - `text-xs` is standard, `text-sm` is large
6. **DO NOT mix font weights randomly** - Follow hierarchy (bold headers, semibold content, normal secondary)
7. **DO NOT use lowercase buttons** - All buttons are `uppercase`
8. **DO NOT forget hover states** - All interactive elements need hover feedback
9. **DO NOT use neutral-* colors** - Use gray-* for consistency
10. **DO NOT use soft transitions** - Keep transitions sharp and fast

---

## 🎯 **Quick Reference**

### **Most Used Classes**
```tsx
/* Buttons */
"px-4 py-2 bg-black text-white border-2 border-black hover:bg-gray-900 font-bold text-xs uppercase"

/* Input */
"w-full px-3 py-2 text-sm text-black border-2 border-black focus:border-black outline-none"

/* Card */
"p-1.5 border-2 border-black bg-white hover:bg-gray-100 cursor-pointer transition-all"

/* Section Header */
"text-xs font-bold text-black uppercase flex items-center gap-1.5"

/* Section Padding */
"px-4 py-3"

/* List Spacing */
"space-y-0.5"
```

---

**End of Style Guide** ✦
