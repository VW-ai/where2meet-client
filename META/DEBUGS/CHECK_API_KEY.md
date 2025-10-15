# API Key Diagnostic Guide

## The "Waiting for Google Maps" Issue

If you see "⏳ Waiting for Google Maps to load..." indefinitely, it's **definitely an API key issue**.

## Step-by-Step Fix

### 1. Check if `.env.local` exists

```bash
cat .env.local
```

**Expected output:**
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...your_key_here
```

**If file doesn't exist:**
```bash
echo "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_ACTUAL_KEY" > .env.local
```

### 2. Verify API Key Format

Your API key should:
- Start with `AIza`
- Be about 39 characters long
- Have NO quotes around it
- Have NO spaces

**❌ WRONG:**
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="AIzaSyC..."  ← Remove quotes
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = AIzaSyC...  ← Remove spaces around =
```

**✅ CORRECT:**
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyC...
```

### 3. Check Google Cloud Console

Visit: https://console.cloud.google.com/

#### Enable Required APIs

1. Go to **APIs & Services > Library**
2. Search and **ENABLE** these APIs:
   - ✅ **Maps JavaScript API**
   - ✅ **Places API**

#### Configure API Key

1. Go to **APIs & Services > Credentials**
2. Click on your API key
3. Check **API restrictions**:
   - Should be "Don't restrict key" OR
   - Should have "Maps JavaScript API" and "Places API" selected

4. Check **Application restrictions**:
   - Choose "HTTP referrers (web sites)"
   - Add: `http://localhost:4000/*`
   - Add: `http://localhost:*/*` (to cover all ports)
   - Click "Save"

### 4. Restart Development Server

**CRITICAL**: Must restart after changing `.env.local`

```bash
# Stop server (Ctrl+C in terminal)
pnpm dev
```

### 5. Hard Refresh Browser

After server restarts:
- Chrome/Edge: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Firefox: `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)

### 6. Check Browser Console

1. Open browser at http://localhost:4000
2. Press `F12` to open DevTools
3. Go to **Console** tab
4. Look for these messages:

**✅ GOOD - Working:**
```
Waiting for Google Maps Places library to load...
Google Maps Places library loaded, initializing autocomplete...
Autocomplete initialized successfully
```

**❌ BAD - API Key Error:**
```
Google Maps JavaScript API error: RefererNotAllowedMapError
Google Maps JavaScript API error: ApiNotActivatedMapError
Google Maps JavaScript API error: InvalidKeyMapError
```

### 7. Common Error Messages & Fixes

#### `RefererNotAllowedMapError`
**Problem:** HTTP referrer restriction doesn't include localhost:4000

**Fix:**
1. Go to Google Cloud Console > Credentials
2. Edit your API key
3. Application restrictions > HTTP referrers
4. Add: `http://localhost:4000/*`
5. Click "Save"
6. Wait 1-2 minutes for changes to propagate
7. Restart dev server and hard refresh browser

#### `ApiNotActivatedMapError`
**Problem:** Required APIs not enabled

**Fix:**
1. Go to Google Cloud Console > APIs & Services > Library
2. Enable **Maps JavaScript API**
3. Enable **Places API**
4. Wait 1-2 minutes
5. Restart dev server and hard refresh browser

#### `InvalidKeyMapError`
**Problem:** API key is wrong or doesn't exist

**Fix:**
1. Go to Google Cloud Console > Credentials
2. Create a new API key OR
3. Copy the correct existing key
4. Update `.env.local` with correct key
5. Restart dev server

### 8. Test in Console

Open browser console (F12) and type:

```javascript
console.log(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)
```

**Should show:** Your API key (starts with AIza...)
**If shows `undefined`:** `.env.local` not loaded, restart server

### 9. Verify Network Requests

1. Open DevTools > **Network** tab
2. Refresh page
3. Filter by "maps"
4. Look for requests to `maps.googleapis.com`

**Good:** Status 200
**Bad:** Status 403 (API key issue), 400 (bad request)

Click on the failed request to see error details.

### 10. Create a New API Key (Last Resort)

If nothing works, create a fresh API key:

1. Go to Google Cloud Console
2. **APIs & Services > Credentials**
3. Click **+ CREATE CREDENTIALS > API key**
4. A new key is created (copy it!)
5. Click "EDIT API KEY"
6. Name it "Where2Meet Dev"
7. **API restrictions**:
   - Select "Restrict key"
   - Check: Maps JavaScript API
   - Check: Places API
8. **Application restrictions**:
   - Select "HTTP referrers"
   - Add: `http://localhost:*/*`
9. Click "Save"
10. Update `.env.local` with new key
11. Restart server and hard refresh browser

## Quick Checklist

- [ ] `.env.local` file exists in project root
- [ ] API key in `.env.local` (no quotes, no spaces)
- [ ] Maps JavaScript API enabled in Google Cloud
- [ ] Places API enabled in Google Cloud
- [ ] API key has correct restrictions (HTTP referrers with localhost:4000)
- [ ] Dev server restarted after `.env.local` changes
- [ ] Browser hard refreshed (Ctrl+Shift+R)
- [ ] No errors in browser console
- [ ] See "Autocomplete initialized successfully" in console

## Still Not Working?

1. **Check console logs** - Most issues show specific error messages
2. **Try incognito mode** - Rules out browser cache/extension issues
3. **Check API quotas** - You might have hit free tier limits
4. **Wait 2-5 minutes** - API key changes take time to propagate

## Console Output You Should See

When everything works correctly:

```
Waiting for Google Maps Places library to load...
Google Maps Places library loaded, initializing autocomplete...
Autocomplete initialized successfully
```

The input field should:
1. Start disabled with "Loading autocomplete..."
2. After 1-2 seconds, become enabled
3. Show "Start typing an address, city, or place name..."
4. Display dropdown suggestions when you type

## Need More Help?

Include this info when asking for help:
1. Browser console screenshot (F12 > Console)
2. Network tab errors (F12 > Network > filter "maps")
3. Your `.env.local` file (hide the actual key!)
4. Google Cloud Console API configuration screenshot
