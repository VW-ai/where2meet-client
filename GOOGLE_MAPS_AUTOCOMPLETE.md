# 🗺️ Google Maps Autocomplete Integration

## Overview

The "Venue Name" field in the Post Event Modal now has **Google Maps Places Autocomplete** integrated!

Users can search for real venues and automatically get:
- ✅ Venue name
- ✅ Full address
- ✅ Geographic coordinates (lat/lng)

## How It Works

### User Experience

1. **Click "Fixed Location"** when creating an event
2. **Start typing in "Venue Name"** field
3. **See autocomplete suggestions** from Google Maps
4. **Select a venue** from the dropdown
5. **Address auto-fills** automatically!

### Example Flow

```
User types: "Blue Bottle Coffee"
          ↓
Google suggests:
  - Blue Bottle Coffee - Ferry Building
  - Blue Bottle Coffee - Hayes Valley
  - Blue Bottle Coffee - SOMA
          ↓
User selects: "Blue Bottle Coffee - SOMA"
          ↓
Auto-fills:
  - Venue Name: "Blue Bottle Coffee - SOMA"
  - Address: "66 Mint St, San Francisco, CA 94103"
  - Coordinates: (37.7807, -122.4073)
```

## Implementation Details

### Hook: `useGooglePlacesAutocomplete`

**Location:** `/hooks/useGooglePlacesAutocomplete.ts`

**Features:**
- Loads Google Maps JavaScript API automatically
- Initializes Places Autocomplete
- Filters to show only establishments (businesses/venues)
- Returns place details on selection

**Usage:**
```typescript
const { inputRef, isLoaded, error } = useGooglePlacesAutocomplete({
  onPlaceSelect: (place) => {
    console.log('Selected:', place.name);
    console.log('Address:', place.formatted_address);
    console.log('Lat/Lng:', place.geometry?.location);
  },
  types: ['establishment'], // Only show businesses
});
```

### Integration in PostEventModal

**What was added:**
1. Import hook
2. Added state for `venueLat` and `venueLng`
3. Connected input ref to autocomplete
4. Auto-fill venue details on selection
5. Updated helper text to show autocomplete status
6. Pass coordinates to backend on submit

**Code:**
```typescript
const { inputRef: venueInputRef, isLoaded: isGoogleMapsLoaded } =
  useGooglePlacesAutocomplete({
    onPlaceSelect: (place) => {
      setVenueName(place.name);
      setVenueAddress(place.formatted_address);

      if (place.geometry?.location) {
        setVenueLat(place.geometry.location.lat());
        setVenueLng(place.geometry.location.lng());
      }
    },
    types: ['establishment'],
  });
```

## API Key Setup

### Current Setup ✅

Already configured in `.env.local`:
```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyDpLI_clIdFWFvyc51JH1LgG1nD7dwFNak
```

### Production Setup

For production, you should:

1. **Get your own API key** at: https://console.cloud.google.com/
2. **Enable APIs:**
   - Places API
   - Maps JavaScript API
3. **Restrict the API key:**
   - Application restrictions → HTTP referrers
   - Add your domain: `https://where2meet.org/*`
4. **Set environment variable:**
   ```bash
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-production-key
   ```

## Features

### What's Included

✅ **Autocomplete suggestions** - Real venues from Google Maps
✅ **Auto-fill address** - No manual typing needed
✅ **Geographic coordinates** - For mapping/distance calculations
✅ **Filtered to establishments** - Only shows real businesses/venues
✅ **Loading indicator** - Shows when Google Maps is loading
✅ **Error handling** - Graceful fallback if API fails
✅ **Manual override** - Users can still type manually

### Autocomplete Options

Configured to show only **establishments** (businesses):
- Restaurants
- Coffee shops
- Gyms
- Parks
- Museums
- And all other business venues

**Not shown:**
- Street addresses (residential)
- Cities/regions
- Postal codes

## Testing

### Test the Feature

1. **Start your app:**
   ```bash
   ./start_all.sh
   ```

2. **Open http://localhost:4000**

3. **Create a new event:**
   - Click "+ Post"
   - Select "Fixed Location"
   - Start typing in "Venue Name" field

4. **Try these searches:**
   - "Blue Bottle Coffee"
   - "Sunset Park"
   - "SFMOMA"
   - "Ferry Building"

5. **Verify:**
   - Autocomplete dropdown appears
   - Selecting a venue auto-fills address
   - Event can be created successfully

### Expected Behavior

**Loading State:**
```
🔍 Loading Google Maps autocomplete...
```

**Ready State:**
```
✨ Start typing to search venues with Google Maps autocomplete
```

**User Types:**
- Dropdown appears with suggestions
- Each suggestion shows venue name + address

**User Selects:**
- Venue name fills in
- Address fills in automatically
- Coordinates captured (not visible to user)

## Troubleshooting

### "Loading Google Maps autocomplete..." never goes away

**Possible causes:**
1. API key missing or invalid
2. Network issues
3. API not enabled in Google Cloud Console

**Solution:**
```bash
# Check if API key is set
echo $NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

# Verify in browser console
console.log(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)

# Check browser console for errors
```

### No autocomplete suggestions

**Possible causes:**
1. API quota exceeded
2. Places API not enabled
3. API key restrictions too strict

**Solution:**
- Check Google Cloud Console
- Verify Places API is enabled
- Check API key restrictions

### Manual typing still works

This is **by design**! Users can:
- Ignore autocomplete and type manually
- Edit the auto-filled venue name
- Manually enter address

## Browser Console Commands

### Check if Google Maps is loaded

```javascript
console.log(window.google?.maps?.places ? 'Loaded' : 'Not loaded');
```

### Test autocomplete manually

```javascript
const input = document.querySelector('input[placeholder*="Sunset Park"]');
console.log('Input ref attached:', !!input);
```

## Backend Integration

### Data Sent to Backend

When a venue is selected via autocomplete:

```typescript
{
  title: "Coffee Meetup",
  location_type: "fixed",
  fixed_venue_name: "Blue Bottle Coffee - SOMA",
  fixed_venue_address: "66 Mint St, San Francisco, CA 94103",
  fixed_venue_lat: 37.7807,
  fixed_venue_lng: -122.4073,
  // ... other fields
}
```

### Backend Schema

The backend already supports these fields:
- `fixed_venue_name` - Venue name
- `fixed_venue_address` - Full address
- `fixed_venue_lat` - Latitude (NEW)
- `fixed_venue_lng` - Longitude (NEW)

**Note:** You may need to update your backend schema to accept `fixed_venue_lat` and `fixed_venue_lng`.

## Performance

### Script Loading

- Google Maps script loads **once** per session
- Cached by browser
- ~50KB compressed
- Loads asynchronously (doesn't block page)

### Autocomplete Requests

- Triggered on user input (debounced)
- ~1-2KB per request
- Very fast response (<100ms typically)
- Free tier: 1000 requests/day

## Cost Estimate

### Google Maps Pricing (as of 2024)

**Places Autocomplete:**
- First 1,000 requests/month: **FREE**
- $2.83 per 1,000 requests after

**Example monthly costs:**
- 1,000 events created: **$0**
- 10,000 events created: **~$25**
- 100,000 events created: **~$280**

Most startups stay in free tier for months!

## Future Enhancements

Potential improvements:
- [ ] Show venue photos in autocomplete
- [ ] Display venue on map preview
- [ ] Filter by category (restaurants, gyms, etc.)
- [ ] Save recent venues for quick selection
- [ ] Use coordinates for "near me" search

## Related Files

```
hooks/
└── useGooglePlacesAutocomplete.ts   # Main hook

components/
└── PostEventModal.tsx               # Integrated here

types/
└── google-maps.d.ts                 # TypeScript types

.env.local
└── NEXT_PUBLIC_GOOGLE_MAPS_API_KEY  # API key
```

## Resources

- [Places Autocomplete Docs](https://developers.google.com/maps/documentation/javascript/place-autocomplete)
- [Places API Pricing](https://developers.google.com/maps/billing-and-pricing/pricing#places)
- [Google Cloud Console](https://console.cloud.google.com/)
- [API Key Best Practices](https://developers.google.com/maps/api-security-best-practices)

---

**Enjoy autocomplete-powered venue search! 🗺️✨**
