# Quick Start Guide

Get Where2Meet running in 3 steps!

## Prerequisites

- Node.js 18+ installed
- pnpm package manager (`npm install -g pnpm`)
- Google Maps API key with Maps JavaScript API and Places API enabled

## Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure API Key

Create a `.env.local` file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your API key:

```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_API_KEY_HERE
```

**Getting an API Key:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Maps JavaScript API** and **Places API**
4. Create credentials (API key)
5. Restrict key by HTTP referrers: `http://localhost:3000/*`

### 3. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Usage Flow

1. **Add Locations** (at least 2):
   - **Type in the search box** - Start typing to see auto-suggestions for addresses and places
   - **Click on the map** - Click anywhere to add that location instantly

2. **View Analysis**:
   - Green marker = centroid (center point)
   - Blue circle = minimum enclosing circle
   - Blue markers = your locations

3. **Search for Venues**:
   - Enter keyword (e.g., "restaurant", "cafe")
   - Click "Search"
   - Orange markers = found venues

4. **Explore Results**:
   - Sort by Rating or Distance
   - Click venue to select (turns red)
   - Click "View on Maps" for directions

## Build for Production

```bash
pnpm build
pnpm start
```

## Troubleshooting

**Map not loading?**
- Check API key in `.env.local`
- Verify Maps JavaScript API is enabled
- Check browser console for errors

**No search results?**
- Ensure Places API is enabled
- Add more locations (need at least 1)
- Try different keywords
- Check API quota limits

**"API key missing" error?**
- Restart dev server after creating `.env.local`
- Ensure file is named exactly `.env.local`
- Check for typos in environment variable name

## Next Steps

- See `README.md` for detailed documentation
- Check `META/TODO.md` for upcoming milestones
- Read `META/DESIGN.md` for technical architecture
