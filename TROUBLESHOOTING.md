# Troubleshooting Guide

## Common Issues and Solutions

### 1. Autocomplete Not Showing Suggestions

**Symptoms:**
- Search box doesn't show dropdown suggestions when typing
- No auto-complete functionality

**Solutions:**

#### Check API Key
1. Verify `.env.local` exists and contains your API key:
   ```bash
   cat .env.local
   ```
   Should show: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here`

2. Restart dev server after adding/changing `.env.local`:
   ```bash
   # Stop server (Ctrl+C)
   pnpm dev
   ```

#### Check API Key Configuration in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services > Credentials**
4. Click on your API key
5. Verify these settings:

**API Restrictions:**
- Ensure **Places API** is enabled
- Ensure **Maps JavaScript API** is enabled

**Application Restrictions:**
- For development: Use "HTTP referrers"
- Add: `http://localhost:3001/*` (note: port might be 3000 or 3001)
- Add: `http://localhost:3000/*`
- For production: Add your domain

#### Check Browser Console

1. Open browser DevTools (F12 or Right-click > Inspect)
2. Go to Console tab
3. Look for errors related to:
   - `Google Maps API`
   - `RefererNotAllowedMapError`
   - `ApiNotActivatedMapError`

**Common Errors:**

**"Google Maps JavaScript API error: RefererNotAllowedMapError"**
- Solution: Add your localhost URL to API key restrictions

**"Google Maps JavaScript API error: ApiNotActivatedMapError"**
- Solution: Enable Places API in Google Cloud Console

**"This API key is not authorized to use this service or API"**
- Solution: Enable Maps JavaScript API and Places API

#### Wait for Google Maps to Load

If you see autocomplete not working immediately:
- Wait 2-3 seconds after page loads
- The app now auto-retries initialization every 100ms until Google Maps loads
- Check console for "Error initializing autocomplete" messages

### 2. Search Error: "An error occurred during search"

**Symptoms:**
- Clicking "Search" button shows error alert
- No venues appear on map

**Solutions:**

#### Check You Have Enough Locations
- Need at least **1 location** added (but recommend 2+)
- Check "Added Locations" count in sidebar

#### Verify Places API is Enabled
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services > Library**
3. Search for "Places API"
4. Click and ensure it's **ENABLED**

#### Check API Key Quota
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services > Dashboard**
3. Click on **Places API**
4. Check quota usage - you might have hit the limit

#### Try Different Search Terms
- Use simple keywords: "restaurant", "cafe", "park"
- Avoid very specific terms that might have no results
- Check the search radius (shown in Analysis Info section)

#### Check Console for Specific Error
Error messages now include specific reasons:
- `OVER_QUERY_LIMIT`: You've hit API quota limits
- `REQUEST_DENIED`: API key doesn't have permission
- `INVALID_REQUEST`: Search parameters are invalid
- `ZERO_RESULTS`: No places found (try different keyword)

### 3. Map Not Loading

**Symptoms:**
- Gray box instead of map
- "Loading map..." message persists

**Solutions:**

1. **Check API Key**:
   - See "Check API Key" section above

2. **Enable Maps JavaScript API**:
   - Go to Google Cloud Console
   - Enable "Maps JavaScript API"

3. **Hard Refresh Browser**:
   - Chrome/Firefox: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - This clears cached scripts

4. **Check Network Tab**:
   - Open DevTools > Network
   - Look for failed requests to `maps.googleapis.com`
   - Check the error response

### 4. Locations Not Saving

**Symptoms:**
- Added locations disappear on page refresh

**Solutions:**

1. **Check Browser Settings**:
   - Ensure localStorage is enabled
   - Disable "Clear cookies on exit" for localhost

2. **Check Console**:
   - Look for localStorage errors
   - Check if browser is in private/incognito mode

3. **Manual Reset**:
   ```javascript
   // In browser console:
   localStorage.removeItem('where2meet-locations');
   location.reload();
   ```

### 5. No Venues Found

**Symptoms:**
- Search completes but says "No results found"

**Solutions:**

1. **Expand Search Area**:
   - Add locations that are farther apart
   - This increases the search circle radius

2. **Try Generic Keywords**:
   - Instead of "pizza restaurant", try "restaurant"
   - Instead of "coffee shop", try "cafe"

3. **Check Location**:
   - Some areas have limited POI data
   - Try urban areas with more establishments

4. **Adjust Rating Filter**:
   - App filters out places with rating < 3.0
   - This is in `app/page.tsx:164` if you want to change it

### 6. Dev Server Issues

**Port Already in Use:**
```
⚠ Port 3000 is in use
```
- Solution: Server will auto-use port 3001
- Access at: http://localhost:3001

**Server Won't Start:**
```bash
# Kill all node processes
pkill -9 node

# Restart
pnpm dev
```

### Debug Mode

Enable detailed logging:

1. Open browser DevTools > Console
2. Check for error messages - they now include detailed status codes
3. All errors are logged with `console.error`

### Getting More Help

If issues persist:

1. **Check Browser Console** - Most errors appear there
2. **Check Terminal** - Server-side errors appear in terminal
3. **Verify API Key** - Most issues are API key related
4. **Check Google Cloud Quotas** - You might have exceeded free tier

### API Key Quick Setup Checklist

- [ ] Created Google Cloud Project
- [ ] Enabled **Maps JavaScript API**
- [ ] Enabled **Places API**
- [ ] Created API key
- [ ] Set HTTP referrer restriction to `http://localhost:*/*`
- [ ] Copied key to `.env.local`
- [ ] Restarted dev server
- [ ] Hard refreshed browser (Ctrl+Shift+R)

### Still Having Issues?

Open an issue with:
- Browser console errors (screenshot)
- Terminal output
- Steps to reproduce
- Browser and OS version
