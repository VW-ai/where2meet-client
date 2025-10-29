# TODO

## Mobile Event Page

### Header Buttons
- [x] Match header thickness to home screen (py-3)
- [x] Add copy link button with visual feedback
  - [x] Button turns white on click
  - [x] Shows "Copied!" message
  - [x] Returns to black after 2 seconds
- [x] Add publish/unpublish button for host
  - [x] Shows "Publish" when venue selected and no decision
  - [x] Shows "Unpublish" when decision published
  - [x] Publish confirmation modal
  - [x] Final decision banner after publishing

### Map & Controls
- [x] Radius controller positioned at left edge on mobile
- [x] Radius slider styling (black track, red thumb, black text)
- [x] Custom techno-style dropdown for travel mode
- [x] Instruction button repositioned (desktop only)

## Search & Discovery

### Advanced Autocomplete (Deferred)
- [ ] Fix one-click venue addition from autocomplete dropdown
  - **Current behavior:** Requires two clicks due to Google Autocomplete timing issues
  - **Root cause:** Google doesn't reliably return geometry fields on first selection
  - **Workaround:** Users can type venue name and press search button instead
  - **Technical notes:**
    - PlacesService.getDetails() sometimes returns incomplete data on first call
    - Lazy initialization replaced with eager initialization (partially helps)
    - May need to migrate to new PlaceAutocompleteElement API (Google's recommended replacement)
  - **Priority:** Low (Text Search works well as alternative)
  - **Files involved:** [SearchSubView.tsx](components/LeftPanel/SearchSubView.tsx)

## Future Improvements
- [ ] Travel Chart popup on mobile venue detail
- [ ] Participant map marker click interaction (switch to tab + scroll)
- [ ] Language toggle functionality in mobile header
- [ ] Test on various mobile screen sizes
