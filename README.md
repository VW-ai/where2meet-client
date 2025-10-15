# Where2Meet - Client (Milestone 1)

A location coordination platform to help groups find optimal meeting places. This is the **M1 (Milestone 1)** client-side implementation featuring single-user functionality.

## Features (M1)

### ✅ M1-01: Input & Map
- **Smart auto-suggest search box**:
  - Google Maps Autocomplete with real-time suggestions
  - Start typing to see address and place suggestions
  - Supports addresses, cities, landmarks, and businesses
- **Click-to-add**: Click anywhere on the map to add a location
- Interactive map visualization with all entered points
- Delete functionality for entered locations

### ✅ M1-02: Center Calculation (Centroid)
- Computes geometric center using spherical coordinates
- Real-time center marker updates as locations are added/removed
- Handles edge cases (poles, 180° meridian crossings)

### ✅ M1-03: Minimum Enclosing Circle (MEC)
- Implements Welzl's algorithm (O(n) expected time)
- Visualizes circle center and radius on map
- Handles degenerate cases (duplicates, collinear points)

### ✅ M1-04: In-circle POI Search
- Google Maps Places API integration
- Keyword-based search within MEC (with 10% epsilon expansion)
- Client-side de-duplication by place_id
- Basic filtering (minimum rating 3.0)

### ✅ M1-05: Candidate List & Ranking
- Displays candidate venues with:
  - Name, address, rating, distance
  - Opening hours status
  - User ratings count
- Sorting options:
  - **Rating-first**: Higher rated venues first
  - **Distance-first**: Closer venues first
- Click to select and highlight on map

### ✅ M1-06: Route Travel Time
- "View on Maps" deeplink for each venue
- Opens Google Maps with route from current location

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Maps**: Google Maps JavaScript API + Places Library
- **Map Components**: @vis.gl/react-google-maps

## Project Structure

```
where2meet-client/
├── app/                    # Next.js app router
│   ├── page.tsx           # Main page with state management
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── MapView.tsx       # Google Maps integration
│   ├── InputPanel.tsx    # Location input controls
│   └── CandidatesPanel.tsx # Venue search & list
├── lib/                   # Core algorithms
│   └── algorithms.ts     # Centroid, MEC, distance calculations
├── types/                 # TypeScript types
│   └── index.ts          # Shared type definitions
├── META/                  # Project documentation
│   ├── TODO.md           # Task tracker
│   ├── DESIGN.md         # Technical design
│   └── PRODUCT.md        # Product specs
└── package.json
```

## Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Google Maps API Key

Create a `.env.local` file in the root directory:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your Google Maps API key:

```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

**API Key Requirements:**
- Enable **Maps JavaScript API**
- Enable **Places API**
- Restrict by HTTP referrers (e.g., `http://localhost:4000/*`)

### 3. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:4000](http://localhost:4000) in your browser.

## Usage

1. **Add Locations**:
   - **Type in the search box**: Start typing any address, city, or place name to see auto-suggestions
   - **Click on the map**: Click anywhere to add that location
   - Add at least 2 locations to see the analysis

2. **View Analysis**:
   - The green marker shows the centroid (center point)
   - The blue circle shows the minimum enclosing circle
   - Blue markers are your entered locations

3. **Search for Venues**:
   - Enter a keyword (e.g., "restaurant", "cafe", "basketball court")
   - Click "Search"
   - Orange markers appear for found venues

4. **Sort & Select**:
   - Toggle between "Rating" and "Distance" sorting
   - Click on a venue to select it (turns red)
   - Click "View on Maps" to get directions

## Algorithms

### Centroid Calculation
- Converts lat/lng to 3D unit vectors on sphere
- Averages vectors and normalizes back to lat/lng
- Avoids artifacts at poles and 180° meridian

### Minimum Enclosing Circle (Welzl's Algorithm)
- Randomized incremental algorithm
- Expected O(n) time complexity
- Handles edge cases: 1-point, 2-point, 3-point circles
- Falls back gracefully for collinear points

### Distance Calculation
- Haversine formula for great-circle distance
- Returns distance in meters
- Used for filtering and sorting candidates

## Data Persistence

- Locations are saved to browser `localStorage`
- Persists across page refreshes
- Stored as JSON under key `where2meet-locations`

## Next Steps (M2 & M3)

See `META/TODO.md` for upcoming milestones:
- **M2** (10/22): Multi-user server with real-time updates
- **M3** (10/29): Full web & app experience with voting

## License

ISC
