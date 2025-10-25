# Event Feed Backend Implementation

**Created**: 2025-10-22
**Status**: Complete ✅

---

## Overview

This document describes the backend implementation for the Event Feed feature. Event Feed is **completely separate** from the Find Meeting Point feature, allowing users to create, browse, and join social events.

## Separation from Find Meeting Point

### Find Meeting Point (Original)
- **Purpose**: Coordinate meeting locations for existing groups
- **Tables**: `events`, `participants`, `candidates`, `votes`
- **Use Case**: "My friends and I need to find a place to meet"

### Event Feed (New)
- **Purpose**: Create and discover public social events
- **Tables**: `feed_events`, `feed_participants`, `feed_venues`, `feed_votes`
- **Use Case**: "I want to organize a brunch and find participants"

## Database Schema

### Table: `feed_events`

Main table for Event Feed events.

```sql
CREATE TABLE feed_events (
    id VARCHAR PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,

    -- Host & Participants
    host_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
    host_name VARCHAR(100) NOT NULL,
    participant_limit INTEGER,

    -- Time & Location
    meeting_time TIMESTAMP WITH TIME ZONE NOT NULL,
    location_area VARCHAR(255) NOT NULL,
    location_coords_lat FLOAT,
    location_coords_lng FLOAT,

    -- Location Type (Fixed vs Collaborative)
    location_type VARCHAR(20) NOT NULL DEFAULT 'collaborative',
    fixed_venue_id VARCHAR(255),
    fixed_venue_name VARCHAR(255),
    fixed_venue_address TEXT,
    fixed_venue_lat FLOAT,
    fixed_venue_lng FLOAT,

    -- Categorization & Visual
    category VARCHAR(100),
    background_image VARCHAR(500),

    -- Settings
    visibility VARCHAR(20) NOT NULL DEFAULT 'public',
    allow_vote BOOLEAN NOT NULL DEFAULT true,

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'active',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX ix_feed_events_created_at ON feed_events(created_at);
CREATE INDEX ix_feed_events_meeting_time ON feed_events(meeting_time);
CREATE INDEX ix_feed_events_status ON feed_events(status);
CREATE INDEX ix_feed_events_visibility ON feed_events(visibility);
CREATE INDEX ix_feed_events_host_id ON feed_events(host_id);
CREATE INDEX ix_feed_events_deleted_at ON feed_events(deleted_at);
```

### Table: `feed_participants`

Participants who have joined Event Feed events.

```sql
CREATE TABLE feed_participants (
    id VARCHAR PRIMARY KEY,
    event_id VARCHAR NOT NULL REFERENCES feed_events(id) ON DELETE CASCADE,
    user_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    avatar VARCHAR(500),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX ix_feed_participants_event_id ON feed_participants(event_id);
CREATE INDEX ix_feed_participants_user_id ON feed_participants(user_id);
```

### Table: `feed_venues`

Venue suggestions for collaborative location events.

```sql
CREATE TABLE feed_venues (
    id VARCHAR PRIMARY KEY,
    event_id VARCHAR NOT NULL REFERENCES feed_events(id) ON DELETE CASCADE,
    place_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    vicinity TEXT,
    lat FLOAT NOT NULL,
    lng FLOAT NOT NULL,
    rating FLOAT,
    user_ratings_total INTEGER DEFAULT 0,
    distance_from_center FLOAT,
    in_circle BOOLEAN DEFAULT true,
    open_now BOOLEAN,
    types TEXT,
    photo_reference VARCHAR(500),
    added_by VARCHAR(20) DEFAULT 'system',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX ix_feed_venues_event_id ON feed_venues(event_id);
CREATE INDEX ix_feed_venues_place_id ON feed_venues(place_id);
```

### Table: `feed_votes`

Votes for venue preferences.

```sql
CREATE TABLE feed_votes (
    id SERIAL PRIMARY KEY,
    event_id VARCHAR NOT NULL REFERENCES feed_events(id) ON DELETE CASCADE,
    participant_id VARCHAR NOT NULL REFERENCES feed_participants(id) ON DELETE CASCADE,
    venue_id VARCHAR NOT NULL REFERENCES feed_venues(id) ON DELETE CASCADE,
    voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(participant_id, venue_id)
);

-- Indexes
CREATE INDEX ix_feed_votes_event_id ON feed_votes(event_id);
CREATE UNIQUE INDEX ix_feed_votes_participant_venue ON feed_votes(participant_id, venue_id);
```

## API Endpoints

### Event Management

#### Create Event
```http
POST /api/v1/feed/events
Authorization: Bearer {token} (optional)

{
  "title": "Weekend Brunch Meetup",
  "description": "Let's find the perfect brunch spot!",
  "meeting_time": "2025-10-25T11:00:00Z",
  "location_area": "Downtown SF",
  "location_type": "collaborative",
  "category": "food",
  "participant_limit": 20,
  "visibility": "public",
  "allow_vote": true,
  "background_image": "https://..."
}

Response: 201 Created
{
  "id": "evt_...",
  "title": "Weekend Brunch Meetup",
  "host_name": "user123",
  "status": "active",
  ...
}
```

#### List Events
```http
GET /api/v1/feed/events?category=food&date=2025-10-25&page=1&page_size=20

Response: 200 OK
{
  "events": [...],
  "total": 42,
  "page": 1,
  "page_size": 20,
  "has_more": true
}
```

#### Get Event Details
```http
GET /api/v1/feed/events/{event_id}
Authorization: Bearer {token} (optional)

Response: 200 OK
{
  "event": {...},
  "participants": [...],
  "venues": [...],
  "user_role": "guest"
}
```

#### Update Event (Host Only)
```http
PATCH /api/v1/feed/events/{event_id}
Authorization: Bearer {token}

{
  "title": "Updated Title",
  "status": "closed"
}

Response: 200 OK
```

#### Delete Event (Host Only)
```http
DELETE /api/v1/feed/events/{event_id}
Authorization: Bearer {token}

Response: 204 No Content
```

### Participation

#### Join Event
```http
POST /api/v1/feed/events/{event_id}/join
Authorization: Bearer {token} (optional)

{
  "name": "John Doe",
  "email": "john@example.com",
  "avatar": "https://..."
}

Response: 201 Created
{
  "id": "prt_...",
  "name": "John Doe",
  "joined_at": "2025-10-22T..."
}
```

#### Leave Event
```http
DELETE /api/v1/feed/events/{event_id}/leave
Authorization: Bearer {token}

Response: 204 No Content
```

### Venues & Voting

#### Add Venue
```http
POST /api/v1/feed/events/{event_id}/venues
Authorization: Bearer {token}

{
  "place_id": "ChIJ...",
  "name": "Blue Bottle Coffee",
  "lat": 37.7750,
  "lng": -122.4200,
  "rating": 4.5,
  ...
}

Response: 201 Created
```

#### Vote on Venue
```http
POST /api/v1/feed/events/{event_id}/votes
Authorization: Bearer {token}

{
  "venue_id": "ven_..."
}

Response: 201 Created
```

### User Events

#### Get My Posts
```http
GET /api/v1/feed/my-posts?page=1&page_size=20
Authorization: Bearer {token}

Response: 200 OK
{
  "events": [...],
  "total": 5,
  "page": 1,
  "page_size": 20,
  "has_more": false
}
```

## Models

### File Structure
```
server/app/models/
├── __init__.py         # Updated with feed models
├── event.py            # Original Find Meeting Point models
├── feed.py             # NEW - Event Feed models
└── user.py             # User model
```

### Feed Models
- `FeedEvent` - Main event model
- `FeedParticipant` - Event participants
- `FeedVenue` - Venue suggestions
- `FeedVote` - Votes on venues

## Schemas

### File Structure
```
server/app/schemas/
├── __init__.py
├── event.py            # Original schemas
├── feed.py             # NEW - Event Feed schemas
└── user.py
```

### Feed Schemas
- `FeedEventCreate` - Create event request
- `FeedEventUpdate` - Update event request
- `FeedEventResponse` - Event response
- `FeedEventDetailResponse` - Detailed event with participants/venues
- `FeedEventsListResponse` - Paginated list
- `FeedParticipantResponse` - Participant data
- `FeedVenueResponse` - Venue data
- `FeedVoteCreate` - Vote request
- `FeedEventFilters` - Query filters

## Migration

### File
`alembic/versions/2025_10_22_2208-add_event_feed_tables.py`

### Apply Migration
```bash
cd server/server
alembic upgrade head
```

### Rollback Migration
```bash
alembic downgrade -1
```

## Running the Backend

### 1. Start Database Services
```bash
cd server/server
docker-compose up -d
```

### 2. Apply Migrations
```bash
source venv/bin/activate
alembic upgrade head
```

### 3. Start Server
```bash
uvicorn app.main:app --reload --port 8000
```

### 4. Access API
- **API**: http://localhost:8000
- **Docs**: http://localhost:8000/docs
- **Health**: http://localhost:8000/health

## Key Features

### Two Event Types

#### Fixed Location Events
- Organizer knows exact venue beforehand
- No voting/venue discovery needed
- Example: "Basketball Game at Sunset Park Court 3"
- Fields: `fixed_venue_name`, `fixed_venue_address`, etc.

#### Collaborative Location Events
- Group finds location together
- Venue suggestions and voting enabled
- Example: "Weekend Brunch - Let's find a spot!"
- Uses `feed_venues` and `feed_votes` tables

### Event Status States
- `active` - Open for participants
- `full` - Reached participant limit
- `closed` - Host closed event
- `past` - Meeting time has passed
- `cancelled` - Event cancelled
- `completed` - Event finished

### Visibility Options
- `public` - Visible in public feed
- `link_only` - Only accessible via direct link

### Authorization
- **Guest**: Can view public events
- **Participant**: Can vote, suggest venues
- **Host**: Can edit, close, delete event

## Frontend Integration

### Headers Updated

#### Main Header (Header.tsx)
- ✅ Removed "My Events" link

#### Find Meeting Point Section
- ✅ Added "My Events" button

#### Event Feed Section
- ✅ Added "My Posts" button

### API Integration Points

```typescript
// lib/api.ts additions needed:

// List events
export async function getFeedEvents(filters?: {
  category?: string;
  date?: string;
  nearMe?: boolean;
  userLat?: number;
  userLng?: number;
  page?: number;
  pageSize?: number;
}) {
  const params = new URLSearchParams();
  if (filters?.category) params.append('category', filters.category);
  if (filters?.date) params.append('date', filters.date);
  // ... etc

  const res = await fetch(`${API_BASE}/api/v1/feed/events?${params}`);
  return res.json();
}

// Create event
export async function createFeedEvent(data: FeedEventCreate) {
  const res = await fetch(`${API_BASE}/api/v1/feed/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify(data)
  });
  return res.json();
}

// Join event
export async function joinFeedEvent(eventId: string, data: {
  name: string;
  email?: string;
  avatar?: string;
}) {
  const res = await fetch(`${API_BASE}/api/v1/feed/events/${eventId}/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify(data)
  });
  return res.json();
}
```

## Testing

### Manual Testing with cURL

#### Create Event
```bash
curl -X POST http://localhost:8000/api/v1/feed/events \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Event",
    "meeting_time": "2025-10-25T11:00:00Z",
    "location_area": "Downtown SF",
    "location_type": "collaborative",
    "visibility": "public",
    "allow_vote": true
  }'
```

#### List Events
```bash
curl http://localhost:8000/api/v1/feed/events
```

#### Join Event
```bash
curl -X POST http://localhost:8000/api/v1/feed/events/{event_id}/join \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com"
  }'
```

## Next Steps

### Backend Enhancements
- [ ] Add real-time updates via WebSockets
- [ ] Implement event search/filtering by distance
- [ ] Add event recommendations
- [ ] Implement notification system
- [ ] Add event comments/chat

### Frontend Integration
- [ ] Connect PostEventModal to API
- [ ] Implement event list fetching
- [ ] Add join/leave functionality
- [ ] Implement "My Posts" page
- [ ] Add venue voting UI

### Production
- [ ] Add rate limiting
- [ ] Implement caching (Redis)
- [ ] Add monitoring and logging
- [ ] Set up database backups
- [ ] Add API authentication for all endpoints

## Summary

✅ **Database**: 4 new tables with proper indexes and foreign keys
✅ **Models**: SQLAlchemy models for all Event Feed entities
✅ **Schemas**: Pydantic validation schemas
✅ **API**: 10+ endpoints for complete CRUD operations
✅ **Migration**: Alembic migration ready to apply
✅ **Separation**: Completely separate from Find Meeting Point
✅ **Frontend**: Headers updated as requested

The backend is **fully implemented and ready for testing**!
