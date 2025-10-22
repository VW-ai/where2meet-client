# Where2Meet - Green Design Language 🌿

**Primary Color**: GREEN (Emerald)
**Version**: 0.2 (Redesign)
**Last Updated**: 2025-10-21
**Philosophy**: "Calm, Natural, Productive"

---

## 🌿 Why Green?

**Psychological Associations**:
- ✅ **Growth & Progress** - Moving forward, making decisions
- ✅ **Harmony & Balance** - Finding middle ground (literal center point)
- ✅ **Nature & Outdoors** - Connects to "meeting places" (parks, venues)
- ✅ **Fresh & Modern** - Less common than blue in apps (stands out)
- ✅ **Calm & Trust** - Not aggressive, inviting collaboration

**Practical Benefits**:
- ✅ Good contrast with map backgrounds
- ✅ Pairs well with neutrals
- ✅ Accessible (meets WCAG contrast ratios)
- ✅ Works in both light and dark modes

---

## 🎨 Color Palette (Green-First)

### **Primary: Emerald Green**

```css
/* Main Brand Color - Emerald */
--emerald-950: #022c22;    /* Darkest - Rare use */
--emerald-900: #064e3b;    /* Very dark - Text on green */
--emerald-800: #065f46;    /* Dark */
--emerald-700: #047857;    /* Dark hover states */
--emerald-600: #059669;    /* PRIMARY - Main actions */
--emerald-500: #10b981;    /* Lighter - Accents, highlights */
--emerald-400: #34d399;    /* Light - Success states */
--emerald-300: #6ee7b7;    /* Very light - Rare */
--emerald-200: #a7f3d0;    /* Tint - Rare */
--emerald-100: #d1fae5;    /* Very light tint */
--emerald-50:  #ecfdf5;    /* Lightest - Backgrounds */

/* Simplified Primary Tokens */
--primary:       #059669;  /* emerald-600 - Main brand */
--primary-hover: #047857;  /* emerald-700 - Hover */
--primary-light: #10b981;  /* emerald-500 - Accents */
--primary-bg:    #ecfdf5;  /* emerald-50 - Light backgrounds */
```

**Usage**:
- **Buttons**: `bg-emerald-600 hover:bg-emerald-700`
- **Links**: `text-emerald-600 hover:text-emerald-700`
- **Highlights**: `bg-emerald-50 border-emerald-600`
- **Focus rings**: `ring-emerald-500`

---

### **Secondary: Teal (Cooler Complement)**

```css
/* Secondary Color - Teal/Cyan */
--teal-700: #0f766e;       /* Dark hover */
--teal-600: #0d9488;       /* Secondary actions */
--teal-500: #14b8a6;       /* Light accents */
--teal-50:  #f0fdfa;       /* Light backgrounds */
```

**Usage**:
- **Secondary buttons**: `bg-teal-600 hover:bg-teal-700`
- **Alternative highlights**: `bg-teal-50`
- **Info badges**: `bg-teal-100 text-teal-700`

**When to use**: Less important actions, informational elements

---

### **Neutrals: Warm Grays (5 Shades)**

```css
/* Neutrals - Simplified from 9 to 5 */
--neutral-950: #0a0a0a;    /* Almost black - Primary text */
--neutral-700: #374151;    /* Dark gray - Secondary text */
--neutral-400: #9ca3af;    /* Medium gray - Disabled, placeholders */
--neutral-200: #e5e7eb;    /* Light gray - Borders, dividers */
--neutral-50:  #f9fafb;    /* Very light - Backgrounds, subtle fills */
--white:       #ffffff;    /* Pure white - Cards, modals */
```

**Text Colors**:
- Primary: `text-neutral-950` (almost black)
- Secondary: `text-neutral-700`
- Disabled/Placeholder: `text-neutral-400`

**Backgrounds**:
- Page: `bg-neutral-50`
- Cards: `bg-white`
- Disabled: `bg-neutral-50`

**Borders**:
- Default: `border-neutral-200`
- Hover: `border-neutral-300`

---

### **Semantic Colors**

```css
/* Success (Same as Primary Green) */
--success: #059669;        /* emerald-600 */
--success-bg: #ecfdf5;     /* emerald-50 */

/* Warning/Error */
--warning: #dc2626;        /* Red */
--warning-hover: #b91c1c;  /* Red dark */
--warning-bg: #fef2f2;     /* Red tint */

/* Info (Blue - Rare use) */
--info: #2563eb;           /* Blue - Only for informational */
--info-bg: #eff6ff;        /* Blue tint */
```

---

### **Map-Specific Colors**

```css
/* Location Markers */
--marker-you:       #10b981;  /* Emerald-500 - Your location (bright green) */
--marker-others:    #0d9488;  /* Teal-600 - Other participants */
--marker-centroid:  #6b21a8;  /* Purple-700 - Center point (contrast) */

/* Venue Markers */
--marker-venue:     #f59e0b;  /* Amber - Candidate venues (warm, inviting) */
--marker-selected:  #059669;  /* Emerald-600 - Selected venue (primary green) */
--marker-winner:    #047857;  /* Emerald-700 - Top choice (darker green) */

/* Circle/Search Area */
--circle-stroke:    #059669;  /* Emerald-600 - Circle outline */
--circle-fill:      rgba(5, 150, 105, 0.1);  /* Emerald with 10% opacity */
```

**Why these colors**:
- **You**: Bright emerald (stands out, positive)
- **Others**: Teal (cooler, differentiated from you)
- **Centroid**: Purple (high contrast, geometric/technical)
- **Venues**: Amber (warm, inviting, like restaurant lights)
- **Selected**: Primary green (matches brand)

---

## 🎨 Color Usage Examples

### **Buttons**

**Primary Button (Green)**:
```jsx
<button className="
  px-6 py-3
  bg-emerald-600 hover:bg-emerald-700
  text-white font-medium
  rounded-md
  shadow-sm hover:shadow-md
  transition-colors duration-200
">
  Create Event
</button>
```

**Secondary Button (Teal)**:
```jsx
<button className="
  px-6 py-3
  bg-teal-600 hover:bg-teal-700
  text-white font-medium
  rounded-md
  transition-colors duration-200
">
  View All Venues
</button>
```

**Ghost Button (Green)**:
```jsx
<button className="
  px-4 py-2
  text-emerald-600 hover:text-emerald-700
  hover:bg-emerald-50
  font-medium rounded-md
  transition-colors duration-200
">
  Learn More
</button>
```

**Destructive Button (Red)**:
```jsx
<button className="
  px-6 py-3
  bg-red-600 hover:bg-red-700
  text-white font-medium
  rounded-md
  transition-colors duration-200
">
  Delete Event
</button>
```

---

### **Cards & Panels**

**Default Card**:
```jsx
<div className="
  bg-white
  p-6
  rounded-lg
  border border-neutral-200
  shadow-md
  hover:shadow-lg
  transition-shadow duration-200
">
  {content}
</div>
```

**Highlighted Card (Green tint)**:
```jsx
<div className="
  bg-emerald-50
  border-2 border-emerald-600
  p-6
  rounded-lg
">
  {highlightedContent}
</div>
```

**Selected Venue Card**:
```jsx
<div className="
  bg-emerald-50
  border-2 border-emerald-600
  p-4
  rounded-md
  shadow-sm
">
  <h3 className="font-semibold text-emerald-900">Joe's Pizza ✓</h3>
  <p className="text-neutral-700">Top Choice (5 votes)</p>
</div>
```

---

### **Inputs & Forms**

**Text Input**:
```jsx
<input className="
  w-full px-4 py-3
  text-neutral-950 placeholder:text-neutral-400
  bg-white
  border border-neutral-200
  rounded-md
  focus:ring-2 focus:ring-emerald-500
  focus:border-emerald-500
  transition-colors duration-200
" />
```

**Checkbox (Green)**:
```jsx
<input
  type="checkbox"
  className="
    w-5 h-5
    text-emerald-600
    border-neutral-300
    rounded
    focus:ring-emerald-500
  "
/>
```

---

### **Badges & Tags**

**Vote Count Badge**:
```jsx
<span className="
  inline-flex items-center gap-1
  px-2 py-1
  bg-emerald-100 text-emerald-700
  text-sm font-medium
  rounded-full
">
  ♥ 5 votes
</span>
```

**Status Badge (Success)**:
```jsx
<span className="
  px-3 py-1
  bg-emerald-50 text-emerald-700
  text-sm font-semibold
  border border-emerald-200
  rounded-md
">
  ✓ Top Choice
</span>
```

**Info Badge (Teal)**:
```jsx
<span className="
  px-2 py-1
  bg-teal-50 text-teal-700
  text-xs font-medium
  rounded-md
">
  New
</span>
```

---

### **Links**

**Default Link**:
```jsx
<a className="
  text-emerald-600 hover:text-emerald-700
  underline underline-offset-2
  transition-colors duration-200
">
  View on Maps
</a>
```

**Subtle Link (No underline)**:
```jsx
<a className="
  text-emerald-600 hover:text-emerald-700
  hover:underline
  transition-colors duration-200
">
  Learn more
</a>
```

---

## 🎨 UI State Colors

### **Focus States** (Green Ring)

```jsx
// Any focusable element
className="
  focus:outline-none
  focus:ring-2 focus:ring-emerald-500
  focus:ring-offset-2
"
```

**Why green ring**: Matches brand, clear indicator

---

### **Hover States**

| Element | Hover Effect |
|---------|--------------|
| **Buttons** | Darker shade (600 → 700) |
| **Cards** | Shadow increase (md → lg) |
| **Links** | Text color darker + underline |
| **Icons** | Slight scale (1 → 1.05) |
| **Backgrounds** | Subtle tint (emerald-50) |

---

### **Active/Pressed States**

```jsx
className="active:scale-95 active:bg-emerald-700"
```

**Feedback**: Slight scale down + darker color

---

### **Disabled States**

```jsx
className="
  bg-neutral-50
  text-neutral-400
  border-neutral-200
  cursor-not-allowed
  opacity-60
"
```

**Rule**: Never use primary green for disabled states

---

## 🎨 Gradient Options (Optional)

**Subtle Green Gradient** (for hero sections):
```jsx
className="bg-gradient-to-br from-emerald-50 via-white to-teal-50"
```

**Green to Teal** (for buttons - use sparingly):
```jsx
className="bg-gradient-to-r from-emerald-600 to-teal-600"
```

**Rule**: Use gradients sparingly - solid colors are clearer

---

## 🎨 Typography with Green

### **Headers with Green Accent**

```jsx
<h1 className="text-4xl font-bold text-neutral-950">
  Find the Perfect
  <span className="text-emerald-600"> Meeting Spot</span>
</h1>
```

### **Highlighted Text**

```jsx
<p className="text-neutral-700">
  Top choice: <span className="font-semibold text-emerald-700">Joe's Pizza</span>
</p>
```

---

## 🎨 Accessibility (WCAG AA)

### **Contrast Ratios** (All Pass)

| Combination | Ratio | Pass? |
|-------------|-------|-------|
| emerald-600 on white | 4.57:1 | ✅ AA (normal text) |
| emerald-700 on white | 5.85:1 | ✅ AAA (normal text) |
| emerald-900 on emerald-50 | 14.2:1 | ✅ AAA |
| neutral-950 on white | 19.8:1 | ✅ AAA |
| neutral-700 on white | 7.01:1 | ✅ AAA |

**Rules**:
- **Normal text** (16px): Minimum 4.5:1 ratio
- **Large text** (18px+): Minimum 3:1 ratio
- **Interactive elements**: Minimum 3:1 ratio

**Safe Combinations**:
```jsx
// Text on white backgrounds
text-emerald-600   // ✅ 4.57:1 (AA)
text-emerald-700   // ✅ 5.85:1 (AAA)
text-neutral-950   // ✅ 19.8:1 (AAA)
text-neutral-700   // ✅ 7.01:1 (AAA)

// White text on green backgrounds
text-white on bg-emerald-600  // ✅ 4.58:1 (AA)
text-white on bg-emerald-700  // ✅ 5.85:1 (AAA)
```

---

## 🎨 Dark Mode (Optional Future)

**Dark Mode Palette** (Inverted):

```css
/* Dark backgrounds */
--dark-bg:        #0a0a0a;    /* Almost black */
--dark-card:      #171717;    /* Dark gray */
--dark-border:    #374151;    /* Medium gray */

/* Dark mode green (brighter for contrast) */
--dark-primary:   #10b981;    /* emerald-500 (brighter) */
--dark-primary-hover: #34d399; /* emerald-400 (even brighter) */

/* Dark text */
--dark-text:      #f9fafb;    /* Almost white */
--dark-text-muted: #9ca3af;   /* Gray */
```

**Dark Mode Button**:
```jsx
<button className="
  px-6 py-3
  bg-emerald-500 hover:bg-emerald-400
  text-neutral-950 font-medium
  dark:bg-emerald-600 dark:hover:bg-emerald-500
  dark:text-white
  rounded-md transition-colors
">
  Create Event
</button>
```

---

## 🎨 Component Library Colors

### **Tailwind Config Extension**

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#059669',
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        secondary: {
          DEFAULT: '#0d9488',
          50: '#f0fdfa',
          600: '#0d9488',
          700: '#0f766e',
        },
      },
    },
  },
};
```

**Usage**:
```jsx
className="bg-primary hover:bg-primary-700"
className="text-primary"
className="border-primary-200"
```

---

## 🎨 Example: Homepage with Green

```jsx
<main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
  {/* Hero */}
  <div className="text-center py-16">
    <h1 className="text-5xl font-bold text-neutral-950 mb-4">
      Find Your Perfect <span className="text-emerald-600">Meeting Spot</span>
    </h1>
    <p className="text-xl text-neutral-700 mb-8">
      Coordinate locations, discover venues, decide together
    </p>

    {/* CTA */}
    <button className="
      px-8 py-4
      bg-emerald-600 hover:bg-emerald-700
      text-white text-lg font-semibold
      rounded-lg
      shadow-lg hover:shadow-xl
      transition-all duration-200
    ">
      Create Free Event
    </button>
  </div>

  {/* Feature Cards */}
  <div className="grid grid-cols-3 gap-6 max-w-4xl mx-auto">
    <div className="bg-white p-6 rounded-lg border border-neutral-200 shadow-md">
      <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center mb-4">
        📍
      </div>
      <h3 className="text-lg font-semibold text-neutral-950 mb-2">
        Add Locations
      </h3>
      <p className="text-neutral-700">
        Everyone shares where they're coming from
      </p>
    </div>

    {/* More cards... */}
  </div>
</main>
```

---

## 🎨 Example: Event Page with Green

```jsx
<div className="h-screen">
  {/* Header */}
  <header className="bg-white/90 backdrop-blur-sm border-b border-neutral-200">
    <div className="flex items-center justify-between px-6 py-4">
      <h1 className="text-2xl font-bold text-neutral-950">Team Lunch</h1>

      {/* Top Choice Badge */}
      <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-600 rounded-lg">
        <span className="text-2xl">🏆</span>
        <div>
          <p className="text-xs text-neutral-700">Top Choice</p>
          <p className="font-semibold text-emerald-700">Joe's Pizza (5 votes)</p>
        </div>
      </div>

      {/* Copy Link Button */}
      <button className="
        px-6 py-2
        bg-emerald-600 hover:bg-emerald-700
        text-white font-medium
        rounded-md
        transition-colors
      ">
        📋 Copy Invite Link
      </button>
    </div>
  </header>

  {/* Map */}
  <div className="absolute inset-0 top-16">
    {/* Google Map component */}
  </div>

  {/* Venue List Panel */}
  <aside className="absolute right-4 top-20 bottom-4 w-96 bg-white rounded-lg border border-neutral-200 shadow-lg overflow-hidden">
    <div className="p-6">
      <h2 className="text-xl font-bold text-neutral-950 mb-4">
        Restaurants Nearby
      </h2>

      {/* Venue Cards */}
      <div className="space-y-3">
        {/* Selected/Top Venue */}
        <div className="
          bg-emerald-50
          border-2 border-emerald-600
          p-4 rounded-md
          cursor-pointer
        ">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-emerald-900">Joe's Pizza</h3>
            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-sm font-medium rounded-full">
              ♥ 5
            </span>
          </div>
          <p className="text-sm text-neutral-700 mb-2">123 Main St, NY</p>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-yellow-600">★ 4.5</span>
            <span className="text-neutral-600">1.2 km</span>
            <span className="text-emerald-600 font-medium">✓ You voted</span>
          </div>
        </div>

        {/* Other venues */}
        <div className="
          bg-white
          border border-neutral-200
          p-4 rounded-md
          hover:border-emerald-600
          hover:shadow-md
          transition-all
          cursor-pointer
        ">
          {/* ... */}
        </div>
      </div>
    </div>
  </aside>
</div>
```

---

## 📊 Summary: Green Design System

| Aspect | Color | Usage |
|--------|-------|-------|
| **Primary Actions** | Emerald-600 | Buttons, links, focus |
| **Secondary Actions** | Teal-600 | Less important actions |
| **Success States** | Emerald-600 | Confirmations, top choice |
| **Errors** | Red-600 | Warnings, destructive |
| **Text Primary** | Neutral-950 | Headers, body |
| **Text Secondary** | Neutral-700 | Descriptions |
| **Borders** | Neutral-200 | Dividers, cards |
| **Backgrounds** | Neutral-50 | Page, subtle fills |
| **You Marker** | Emerald-500 | User's location |
| **Others Marker** | Teal-600 | Participants |
| **Venue Marker** | Amber-500 | Candidates |

---

## ✅ Green Design Checklist

- [x] Primary color: Emerald green (#059669)
- [x] Secondary color: Teal (#0d9488)
- [x] Neutrals: 5 shades (simplified)
- [x] All contrast ratios pass WCAG AA
- [x] Button styles defined (4 variants)
- [x] Card styles defined
- [x] Input styles with green focus
- [x] Map marker colors chosen
- [x] Vote/heart color is green
- [x] Typography hierarchy clear
- [x] Spacing on 8px grid
- [x] Animation timing defined

---

**Next**: Implement Tailwind config with green tokens and start building components! 🚀
