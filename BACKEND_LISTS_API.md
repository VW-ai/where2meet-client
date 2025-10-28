# Backend Lists API Implementation Guide

## Overview
The frontend "Other People's Lists" feature is complete but requires backend API endpoints to be implemented. Currently, the app uses mock data as a fallback.

## Status
🟡 **Frontend**: ✅ Complete (using mock data fallback)
🔴 **Backend**: ❌ Not Implemented

---

## Required API Endpoints

### 1. Get Public Lists
**Endpoint**: `GET /api/v1/lists`

**Query Parameters**:
- `category` (optional): Filter by category (e.g., "Food & Drink", "Sports", "Entertainment")
- `limit` (optional): Number of results to return (default: 20)
- `offset` (optional): Pagination offset (default: 0)

**Headers**:
- `Authorization: Bearer <token>` (optional - for checking `is_liked` status)

**Response** (200 OK):
```json
[
  {
    "id": "uuid",
    "title": "Best Ramen in Tokyo",
    "description": "Top-rated ramen spots across Tokyo",
    "category": "Food & Drink",
    "user_id": "uuid",
    "user_name": "foodie_explorer",
    "item_count": 12,
    "like_count": 234,
    "is_liked": false,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
]
```

---

### 2. Get List Detail
**Endpoint**: `GET /api/v1/lists/:id`

**Path Parameters**:
- `id`: List UUID

**Headers**:
- `Authorization: Bearer <token>` (optional - for checking `is_liked` status)

**Response** (200 OK):
```json
{
  "id": "uuid",
  "title": "Best Ramen in Tokyo",
  "description": "Top-rated ramen spots across Tokyo",
  "category": "Food & Drink",
  "user_id": "uuid",
  "user_name": "foodie_explorer",
  "item_count": 12,
  "like_count": 234,
  "is_liked": false,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "items": [
    {
      "id": "uuid",
      "list_id": "uuid",
      "place_id": "ChIJN1t_tDeuEmsRUsoyG83frY4",
      "venue_name": "Ichiran Ramen",
      "venue_address": "Shibuya, Tokyo, Japan",
      "venue_lat": 35.6595,
      "venue_lng": 139.7004,
      "rating": 4.8,
      "notes": "Amazing tonkotsu broth!",
      "order_index": 0,
      "added_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**Error Responses**:
- `404`: List not found

---

### 3. Create List
**Endpoint**: `POST /api/v1/lists`

**Headers**:
- `Authorization: Bearer <token>` (required)
- `Content-Type: application/json`

**Request Body**:
```json
{
  "title": "Best Ramen in Tokyo",
  "description": "Top-rated ramen spots across Tokyo",
  "category": "Food & Drink",
  "items": [
    {
      "place_id": "ChIJN1t_tDeuEmsRUsoyG83frY4",
      "venue_name": "Ichiran Ramen",
      "venue_address": "Shibuya, Tokyo, Japan",
      "venue_lat": 35.6595,
      "venue_lng": 139.7004,
      "rating": 4.8,
      "notes": "Amazing tonkotsu broth!"
    }
  ]
}
```

**Validation**:
- `title`: Required, max 100 characters
- `description`: Optional, max 500 characters
- `category`: Required
- `items`: Required, minimum 1 item

**Response** (201 Created):
```json
{
  "id": "uuid",
  "title": "Best Ramen in Tokyo",
  "description": "Top-rated ramen spots across Tokyo",
  "category": "Food & Drink",
  "user_id": "uuid",
  "user_name": "foodie_explorer",
  "item_count": 1,
  "like_count": 0,
  "is_liked": false,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "items": [...]
}
```

---

### 4. Update List
**Endpoint**: `PATCH /api/v1/lists/:id`

**Path Parameters**:
- `id`: List UUID

**Headers**:
- `Authorization: Bearer <token>` (required)
- `Content-Type: application/json`

**Request Body** (all fields optional):
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "category": "Sports",
  "items": [...]
}
```

**Authorization**:
- Only the list owner can update

**Response** (200 OK):
Same as Create List response

**Error Responses**:
- `403`: Not authorized (not the owner)
- `404`: List not found

---

### 5. Delete List
**Endpoint**: `DELETE /api/v1/lists/:id`

**Path Parameters**:
- `id`: List UUID

**Headers**:
- `Authorization: Bearer <token>` (required)

**Authorization**:
- Only the list owner can delete

**Response** (204 No Content)

**Error Responses**:
- `403`: Not authorized (not the owner)
- `404`: List not found

---

### 6. Like List
**Endpoint**: `POST /api/v1/lists/:id/like`

**Path Parameters**:
- `id`: List UUID

**Headers**:
- `Authorization: Bearer <token>` (required)

**Response** (200 OK):
```json
{
  "message": "List liked successfully"
}
```

**Error Responses**:
- `404`: List not found
- `409`: Already liked (or just return success)

---

### 7. Unlike List
**Endpoint**: `DELETE /api/v1/lists/:id/like`

**Path Parameters**:
- `id`: List UUID

**Headers**:
- `Authorization: Bearer <token>` (required)

**Response** (200 OK):
```json
{
  "message": "List unliked successfully"
}
```

**Error Responses**:
- `404`: List not found

---

## Database Schema

### Table: `venue_lists`
```sql
CREATE TABLE venue_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    INDEX idx_lists_user_id (user_id),
    INDEX idx_lists_category (category),
    INDEX idx_lists_created_at (created_at DESC)
);
```

### Table: `list_items`
```sql
CREATE TABLE list_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    list_id UUID NOT NULL REFERENCES venue_lists(id) ON DELETE CASCADE,
    place_id VARCHAR(255) NOT NULL,
    venue_name VARCHAR(255) NOT NULL,
    venue_address TEXT,
    venue_lat DECIMAL(10, 7) NOT NULL,
    venue_lng DECIMAL(10, 7) NOT NULL,
    rating DECIMAL(2, 1),
    notes TEXT,
    order_index INTEGER NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    INDEX idx_list_items_list_id (list_id),
    INDEX idx_list_items_order (list_id, order_index)
);
```

### Table: `list_likes`
```sql
CREATE TABLE list_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    list_id UUID NOT NULL REFERENCES venue_lists(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    liked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE (list_id, user_id),
    INDEX idx_list_likes_user_id (user_id),
    INDEX idx_list_likes_list_id (list_id)
);
```

---

## Backend Implementation Checklist

### Models (Python/FastAPI example)
- [ ] Create `VenueList` model
- [ ] Create `ListItem` model
- [ ] Create `ListLike` model
- [ ] Add relationships between models

### Schemas (Pydantic)
- [ ] `VenueListSummary` - for list display
- [ ] `VenueListDetail` - with items included
- [ ] `CreateListRequest` - for creating lists
- [ ] `UpdateListRequest` - for updating lists
- [ ] `ListItemCreate` - for list items

### Routes
- [ ] `GET /api/v1/lists` - Get public lists with filtering
- [ ] `GET /api/v1/lists/:id` - Get list detail
- [ ] `POST /api/v1/lists` - Create list
- [ ] `PATCH /api/v1/lists/:id` - Update list
- [ ] `DELETE /api/v1/lists/:id` - Delete list
- [ ] `POST /api/v1/lists/:id/like` - Like list
- [ ] `DELETE /api/v1/lists/:id/like` - Unlike list

### Business Logic
- [ ] Authorization checks (only owner can update/delete)
- [ ] Calculate `item_count` for each list
- [ ] Calculate `like_count` for each list
- [ ] Determine `is_liked` for authenticated users
- [ ] Category filtering
- [ ] Pagination support
- [ ] Order items by `order_index`

### Additional Features (Nice to Have)
- [ ] Search lists by title
- [ ] Filter by user (get my lists)
- [ ] Popular lists (most liked)
- [ ] Recent lists (newest first)
- [ ] Duplicate list (fork/copy)

---

## Testing the Integration

Once the backend is implemented:

1. **Remove mock data fallback** from `app/page.tsx`:
   - Remove the try-catch mock data logic
   - Let real errors surface for debugging

2. **Test each endpoint**:
   ```bash
   # Get lists
   curl http://localhost:5001/api/v1/lists

   # Create list (with auth)
   curl -X POST http://localhost:5001/api/v1/lists \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"title":"Test List","category":"Food & Drink","items":[...]}'

   # Like list
   curl -X POST http://localhost:5001/api/v1/lists/UUID/like \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

3. **Verify frontend integration**:
   - Lists display on home page
   - Filtering works
   - Like/unlike updates immediately
   - Create list flow works
   - List detail page loads
   - Meeting point integration works

---

## Current Workaround

The frontend is currently using **mock data fallback**. This means:
- ✅ UI is fully functional for testing/demo
- ✅ All components render correctly
- ✅ Interactions work (except actual data persistence)
- ⚠️ Data resets on page refresh
- ⚠️ No real database persistence
- ⚠️ Like/unlike doesn't actually save

**Console message**: You'll see "⚠️ Using mock data for lists (API endpoint not implemented yet)" in the browser console.

---

## Next Steps

1. **Backend Team**: Implement the API endpoints following this spec
2. **Frontend**: Once backend is ready, remove mock data fallback
3. **Testing**: Test full integration end-to-end
4. **Deploy**: Ship the complete feature

---

## Questions?

If you need clarification on any endpoint or data structure, refer to:
- Frontend API types: `lib/api.ts`
- Component implementation: `app/page.tsx`, `app/lists/[id]/page.tsx`
- Documentation: `META/OTHERPEOPLE.md`
