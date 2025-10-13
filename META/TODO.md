### 1) **10/15 — Client-side (Single User, Local)** ✅ COMPLETED (2025-10-10)

> Goal: one person can enter multiple addresses and compute recommended places.
>
- [x]  **M1-01 Input & Map** ✅
    - Single user can enter **multiple addresses/coordinates** (manual input / map click / search box).
    - Map displays all entered points; support delete/edit.
    - Auto-suggest
- [x]  **M1-02 Center Calculation (Centroid)** ✅
    - Compute the geometric center (respecting geographic coordinates) and show a **center marker** in real time.
- [x]  **M1-03 Minimum Enclosing Circle (MEC)** ✅
    - Compute the **Minimum Enclosing Circle**; visualize center and radius.
- [x]  **M1-04 In-circle POI Search (by keyword)** ✅
    - Within the MEC (or MEC × (1+ε)), use the Maps SDK (local key) to search by keyword (e.g., *basketball court*).
    - Do client-side de-duplication and basic filtering (open now / rating / distance).
- [x]  **M1-05 Candidate List & Ranking** ✅
    - Show **candidate venues** list and map markers; support **rating-first** / **distance-first** sorting.
- [x]  **M1-06 Route Travel Time** ✅
    - Organizer can see the time from each participant to the selected location when clicked on one location.

> Deliverables: ✅ single-page demo (local session storage), full flow from addresses → recommended candidates.
>
> **Status**: All M1 features implemented and tested. Build successful. Ready for deployment.