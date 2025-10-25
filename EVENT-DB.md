# Event Database Documentation

## Overview

This document explains the database structure, relationships, and interactions for the Where2Meet event feed system.

---

## Database Architecture

### Technology Stack
- **Database**: PostgreSQL 16 (running in Docker)
- **ORM**: SQLAlchemy with psycopg driver
- **Migrations**: Alembic
- **Connection**: `postgresql+psycopg://where2meet:where2meet@localhost:5432/where2meet`

---

## Database Tables

### 1. `users` - User Authentication & Profiles

**Purpose**: Store user accounts with authentication and profile information.

```sql
CREATE TABLE users (
    id VARCHAR PRIMARY KEY,              -- e.g., "user_abc123"
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    avatar VARCHAR(500),                 -- Avatar image URL
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);
```

**Indexes**:
- `ix_users_email` - Fast email lookups for login
- `ix_users_created_at` - Query users by registration date

**Key Points**:
- User IDs are prefixed with `user_`
- Passwords are hashed using bcrypt
- Avatar can be any public image URL

---

### 2. `feed_events` - Event Feed Events

**Purpose**: Main event table for the Event Feed feature (public events that users can join).

```sql
CREATE TABLE feed_events (
    id VARCHAR PRIMARY KEY,                -- e.g., "evt_abc123"
    title VARCHAR(255) NOT NULL,
    description TEXT,

    -- Host & Participants
    host_id VARCHAR REFERENCES users(id),  -- Event creator
    host_name VARCHAR(100) NOT NULL,
    participant_limit INTEGER,

    -- Time & Location
    meeting_time TIMESTAMP NOT NULL,
    location_area VARCHAR(255) NOT NULL,   -- "Downtown SF", "Brooklyn, NY"
    location_coords_lat FLOAT,
    location_coords_lng FLOAT,

    -- Location Type (NEW!)
    location_type VARCHAR(20) NOT NULL DEFAULT 'collaborative',

    -- Fixed Venue Details (for location_type = 'fixed')
    fixed_venue_id VARCHAR(255),           -- Google Place ID
    fixed_venue_name VARCHAR(255),         -- "Jackson Park LIC"
    fixed_venue_address TEXT,
    fixed_venue_lat FLOAT,
    fixed_venue_lng FLOAT,

    -- Categorization
    category VARCHAR(100),                 -- 'food', 'sports', 'entertainment', etc.

    -- Visual
    background_image VARCHAR(500),         -- Unsplash image URL

    -- Settings
    visibility VARCHAR(20) DEFAULT 'public',  -- 'public' or 'link_only'
    allow_vote BOOLEAN DEFAULT TRUE,

    -- Status
    status VARCHAR(20) DEFAULT 'active',   -- 'active', 'full', 'closed', 'past', 'cancelled'

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP                   -- Soft delete
);
```

**Indexes**:
- `ix_feed_events_created_at` - Sort by newest events
- `ix_feed_events_meeting_time` - Filter by date
- `ix_feed_events_status` - Filter active events
- `ix_feed_events_host_id` - Find user's hosted events

**Event Types**:

1. **Fixed Location Event** (`location_type = 'fixed'`)
   - Venue is already decided (e.g., "Jackson Park LIC")
   - Users join knowing where it is
   - `fixed_venue_*` fields are populated
   - No voting needed

2. **Collaborative Event** (`location_type = 'collaborative'`)
   - Venue is TBD - participants vote on location
   - Multiple venue candidates are added
   - `allow_vote = true` enables voting
   - Location decided by votes

---

### 3. `feed_participants` - Event Participants

**Purpose**: Track who has joined each event.

```sql
CREATE TABLE feed_participants (
    id VARCHAR PRIMARY KEY,                -- e.g., "part_abc123"
    event_id VARCHAR NOT NULL REFERENCES feed_events(id) ON DELETE CASCADE,
    user_id VARCHAR REFERENCES users(id),  -- NULL for anonymous guests
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    avatar VARCHAR(500),                   -- Participant's avatar
    joined_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes**:
- `ix_feed_participants_event_id` - Get all participants for an event
- `ix_feed_participants_user_id` - Get all events a user joined

**Key Points**:
- **Host automatically becomes first participant** when creating event
- Avatar is stored here (not fetched from users table each time)
- Cascade delete: When event is deleted, all participants are deleted

---

### 4. `feed_venues` - Venue Candidates (Collaborative Events)

**Purpose**: Store venue options for collaborative location events.

```sql
CREATE TABLE feed_venues (
    id VARCHAR PRIMARY KEY,
    event_id VARCHAR NOT NULL REFERENCES feed_events(id) ON DELETE CASCADE,
    place_id VARCHAR(255) NOT NULL,        -- Google Places ID
    name VARCHAR(255) NOT NULL,
    vicinity TEXT,                         -- Address
    lat FLOAT NOT NULL,
    lng FLOAT NOT NULL,
    rating FLOAT,
    user_ratings_total INTEGER DEFAULT 0,
    distance_from_center FLOAT,
    in_circle BOOLEAN DEFAULT TRUE,
    open_now BOOLEAN,
    types TEXT,                            -- JSON array as string
    photo_reference VARCHAR(500),          -- Google Places photo
    added_by VARCHAR(20) DEFAULT 'system', -- 'system' or 'organizer'
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes**:
- `ix_feed_venues_event_id` - Get all venues for an event
- `ix_feed_venues_place_id` - Deduplicate venues

**Usage**:
- Only used for `location_type = 'collaborative'` events
- Empty for fixed location events
- Participants can vote on these venues

---

### 5. `feed_votes` - Venue Voting

**Purpose**: Track participant votes for venue candidates.

```sql
CREATE TABLE feed_votes (
    id SERIAL PRIMARY KEY,
    event_id VARCHAR NOT NULL REFERENCES feed_events(id) ON DELETE CASCADE,
    participant_id VARCHAR NOT NULL REFERENCES feed_participants(id) ON DELETE CASCADE,
    venue_id VARCHAR NOT NULL REFERENCES feed_venues(id) ON DELETE CASCADE,
    voted_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(participant_id, venue_id)       -- One vote per venue per participant
);
```

**Indexes**:
- `ix_feed_votes_event_id` - Get all votes for an event
- `ix_feed_votes_participant_venue` (UNIQUE) - Prevent duplicate votes

**Voting Rules**:
- One participant can vote for multiple venues
- One participant can only vote once per venue
- Vote count is calculated by: `COUNT(feed_votes) GROUP BY venue_id`

---

## Database Relationships

```
users
  ↓ (one-to-many)
feed_events (host_id → users.id)
  ↓ (one-to-many)
  ├── feed_participants (event_id → feed_events.id)
  │     ↓ (one-to-many)
  │     └── feed_votes (participant_id → feed_participants.id)
  │
  └── feed_venues (event_id → feed_events.id)
        ↓ (one-to-many)
        └── feed_votes (venue_id → feed_venues.id)
```

**Key Relationships**:
1. **User → Events**: A user can host many events (host_id)
2. **Event → Participants**: An event has many participants
3. **Event → Venues**: An event has many venue candidates (for collaborative events)
4. **Participant → Votes**: A participant can vote for multiple venues
5. **Venue → Votes**: A venue can receive votes from multiple participants

---

## Data Flow Examples

### 1. Creating a Fixed Location Event

**Frontend Request**:
```typescript
POST /api/v1/feed/events
Authorization: Bearer <token>

{
  "title": "Basketball at Jackson Park",
  "description": "Casual pickup game!",
  "meeting_time": "2025-10-25T18:00:00Z",
  "location_area": "Jackson Park LIC",
  "location_type": "fixed",
  "fixed_venue_name": "Jackson Park LIC",
  "fixed_venue_address": "123 Main St, Queens, NY",
  "fixed_venue_lat": 40.7489,
  "fixed_venue_lng": -73.9395,
  "category": "sports",
  "participant_limit": 10,
  "visibility": "public",
  "allow_vote": false,  // No voting for fixed locations
  "background_image": "https://images.unsplash.com/..."
}
```

**Backend Processing** (`server/server/app/api/v1/feed.py:99-152`):
```python
1. Extract current_user from JWT token
2. Generate event ID: "evt_abc123"
3. Create FeedEvent record
4. Automatically create first FeedParticipant:
   - participant_id = host's user_id
   - name = host's name
   - avatar = host's avatar
5. Commit to database
6. Return event response with participant_count = 1
```

**Database State After**:
```
feed_events:
  id: evt_abc123
  title: "Basketball at Jackson Park"
  host_id: user_xyz789
  location_type: fixed
  fixed_venue_name: "Jackson Park LIC"
  participant_limit: 10
  status: active

feed_participants:
  id: part_def456
  event_id: evt_abc123
  user_id: user_xyz789
  name: "John Doe"
  avatar: "https://..."
```

---

### 2. Creating a Collaborative Event

**Frontend Request**:
```typescript
POST /api/v1/feed/events
Authorization: Bearer <token>

{
  "title": "Weekend Brunch Meetup",
  "description": "Let's find a good brunch spot!",
  "meeting_time": "2025-10-26T11:00:00Z",
  "location_area": "Downtown SF",
  "location_coords": {
    "lat": 37.7749,
    "lng": -122.4194
  },
  "location_type": "collaborative",
  "category": "food",
  "participant_limit": 8,
  "visibility": "public",
  "allow_vote": true,  // Enable voting
}
```

**Backend Processing**:
```python
1. Create FeedEvent (same as above)
2. Auto-add host as participant
3. Venue candidates are added separately later
   (via Google Maps API or manual addition)
```

**Participants can then**:
- Add venue suggestions
- Vote on venues
- Final location determined by most votes

---

### 3. Joining an Event

**Frontend Request**:
```typescript
POST /api/v1/feed/events/evt_abc123/join
Authorization: Bearer <token>

{
  "name": "Alice Johnson",
  "email": "alice@example.com",
  "avatar": "https://ui-avatars.com/..."
}
```

**Backend Processing** (`server/server/app/api/v1/feed.py:370-442`):
```python
1. Verify event exists and is not deleted
2. Check if event is full (participant_count >= participant_limit)
3. Check if event status allows joining (not 'closed', 'cancelled', 'past')
4. Check if user already joined (avoid duplicates)
5. Create FeedParticipant record
6. If event reaches participant_limit, set status to 'full'
7. Commit to database
8. Return participant record
```

**Database State After**:
```
feed_participants:
  (new row)
  id: part_ghi789
  event_id: evt_abc123
  user_id: user_alice
  name: "Alice Johnson"
  avatar: "https://..."
```

---

### 4. Leaving an Event

**Frontend Request**:
```typescript
DELETE /api/v1/feed/events/evt_abc123/leave
Authorization: Bearer <token>
```

**Backend Processing** (`server/server/app/api/v1/feed.py:445-483`):
```python
1. Find participant record by event_id and user_id
2. Delete participant record
3. If event was 'full', change status back to 'active'
4. Commit to database
```

**Database State After**:
```
feed_participants:
  (row deleted)
```

**Cascading Effects**:
- All votes by that participant are also deleted (CASCADE)

---

### 5. Fetching Event Feed

**Frontend Request**:
```typescript
GET /api/v1/feed/events?category=sports&page=1&page_size=20
```

**Backend Processing** (`server/server/app/api/v1/feed.py:155-250`):
```python
1. Query feed_events WHERE deleted_at IS NULL
2. Apply filters:
   - category (if provided)
   - date (if provided)
   - near_me (calculate distance from user coordinates)
3. For each event, build response:
   a. Count participants: COUNT(feed_participants)
   b. Get participant avatars: LIMIT 4
   c. Count venues: COUNT(feed_venues)
   d. Calculate average rating: AVG(feed_venues.rating)
   e. Calculate distance (if user location provided)
4. Order by created_at DESC
5. Paginate results
6. Return events with computed fields
```

**Response Format**:
```json
{
  "events": [
    {
      "id": "evt_abc123",
      "title": "Basketball at Jackson Park",
      "host_id": "user_xyz789",
      "host_name": "John Doe",
      "participant_count": 5,
      "participant_limit": 10,
      "participant_avatars": [
        "https://ui-avatars.com/...",
        "https://ui-avatars.com/...",
        "https://ui-avatars.com/...",
        "https://ui-avatars.com/..."
      ],
      "meeting_time": "2025-10-25T18:00:00Z",
      "location_area": "Jackson Park LIC",
      "location_type": "fixed",
      "fixed_venue_name": "Jackson Park LIC",
      "category": "sports",
      "venue_count": 0,
      "average_rating": null,
      "distance_km": 2.5,
      "status": "active"
    }
  ],
  "total": 15,
  "page": 1,
  "page_size": 20,
  "has_more": false
}
```

---

## Authentication Flow

### 1. User Signup

```
Frontend → POST /api/v1/auth/signup
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}

Backend:
1. Hash password with bcrypt
2. Generate user ID: "user_abc123"
3. Create User record
4. Generate JWT token
5. Return token + user data

Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": {
    "id": "user_abc123",
    "email": "user@example.com",
    "name": "John Doe",
    "avatar": null
  }
}

Frontend:
- Stores token in localStorage as 'auth_token'
- Stores user in AuthContext
```

---

### 2. User Login

```
Frontend → POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

Backend:
1. Find user by email
2. Verify password with bcrypt
3. Update last_login timestamp
4. Generate JWT token
5. Return token + user data

Frontend:
- Stores token in localStorage
- Updates AuthContext
```

---

### 3. Authenticated Requests

```
Frontend → GET/POST/PATCH/DELETE /api/v1/...
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

Backend Middleware:
1. Extract token from Authorization header
2. Decode JWT token
3. Verify token signature
4. Extract user_id from token payload
5. Query users table by user_id
6. Attach user object to request
7. Proceed to endpoint handler

If token is invalid:
- Return 401 Unauthorized
```

---

## Key Backend Endpoints

### Event Management

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/v1/feed/events` | Required | Create new event |
| GET | `/api/v1/feed/events` | Optional | List all events (filtered) |
| GET | `/api/v1/feed/events/{id}` | Optional | Get event details |
| PATCH | `/api/v1/feed/events/{id}` | Required | Update event (host only) |
| DELETE | `/api/v1/feed/events/{id}` | Required | Delete event (host only) |
| POST | `/api/v1/feed/events/{id}/join` | Required | Join event |
| DELETE | `/api/v1/feed/events/{id}/leave` | Required | Leave event |
| GET | `/api/v1/feed/my-posts` | Required | Get user's hosted events |

### Venue & Voting (Collaborative Events)

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/v1/feed/events/{id}/venues` | Required | Add venue candidate |
| POST | `/api/v1/feed/events/{id}/votes` | Required | Vote for a venue |

### User Management

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/v1/auth/signup` | None | Create account |
| POST | `/api/v1/auth/login` | None | Login |
| GET | `/api/v1/auth/me` | Required | Get current user |
| PATCH | `/api/v1/auth/me` | Required | Update profile (name, avatar, password) |

---

## Important Database Queries

### Get event with all details

```python
# Get event
event = db.query(FeedEvent).filter(
    FeedEvent.id == event_id,
    FeedEvent.deleted_at.is_(None)
).first()

# Get participants
participants = db.query(FeedParticipant).filter(
    FeedParticipant.event_id == event_id
).all()

# Get venues (for collaborative events)
venues = db.query(FeedVenue).filter(
    FeedVenue.event_id == event_id
).all()

# Get vote counts per venue
votes = db.query(
    FeedVenue.id,
    func.count(FeedVote.id).label('vote_count')
).outerjoin(FeedVote).group_by(FeedVenue.id).all()
```

### Get user's hosted events

```python
events = db.query(FeedEvent).filter(
    FeedEvent.host_id == user_id,
    FeedEvent.deleted_at.is_(None)
).order_by(FeedEvent.created_at.desc()).all()
```

### Get user's joined events

```python
events = db.query(FeedEvent).join(FeedParticipant).filter(
    FeedParticipant.user_id == user_id,
    FeedEvent.deleted_at.is_(None)
).order_by(FeedEvent.created_at.desc()).all()
```

---

## Soft Delete Pattern

Events use **soft delete** - they're never actually removed from the database.

```python
# "Delete" event
event.deleted_at = datetime.utcnow()
db.commit()

# All queries filter out deleted events
db.query(FeedEvent).filter(FeedEvent.deleted_at.is_(None))
```

**Benefits**:
- Can restore deleted events
- Maintain data integrity
- Analytics on deleted events

---

## Database Management Scripts

Located in `/scripts/`:

| Script | Purpose |
|--------|---------|
| `db_seed.sh` | Populate with test data |
| `db_reset.sh` | Drop and recreate database |
| `db_backup.sh` | Create backup |
| `db_restore.sh` | Restore from backup |
| `db_migrate.sh` | Run Alembic migrations |
| `db_console.sh` | PostgreSQL shell |
| `db_gui.sh` | Start pgAdmin GUI |

**Example Usage**:
```bash
# Seed database with test data
./scripts/db_seed.sh

# Create backup
./scripts/db_backup.sh

# Run migrations
./scripts/db_migrate.sh upgrade
```

---

## Common Issues & Solutions

### Issue: "Event not found"

**Cause**: Trying to access deleted event or using wrong ID

**Check**:
```sql
SELECT id, title, deleted_at FROM feed_events WHERE id = 'evt_abc123';
```

**Solution**: Ensure `deleted_at IS NULL`

---

### Issue: "Failed to join event"

**Possible causes**:
1. Event is full (`participant_count >= participant_limit`)
2. Event is closed/cancelled/past (`status NOT IN ['active']`)
3. User already joined (duplicate participant)
4. Missing authentication token

**Check**:
```sql
-- Check event status
SELECT status, participant_limit FROM feed_events WHERE id = 'evt_abc123';

-- Count participants
SELECT COUNT(*) FROM feed_participants WHERE event_id = 'evt_abc123';

-- Check if user already joined
SELECT * FROM feed_participants
WHERE event_id = 'evt_abc123' AND user_id = 'user_xyz789';
```

---

### Issue: Avatars not showing

**Cause**: Participant records missing avatar field

**Fix**:
```python
# Update participants with user avatars
participants = db.query(FeedParticipant).filter(
    FeedParticipant.user_id.isnot(None)
).all()

for p in participants:
    user = db.query(User).filter(User.id == p.user_id).first()
    if user and user.avatar:
        p.avatar = user.avatar

db.commit()
```

---

## Migration History

| Migration | Date | Description |
|-----------|------|-------------|
| `feed001` | 2025-10-22 | Create feed_events, feed_participants, feed_venues, feed_votes tables |
| `b012172d21fc` | 2025-10-23 | Add avatar column to users table |

**View migration history**:
```bash
cd server/server
alembic history
alembic current
```

---

## Useful Database Queries

### Count events by status
```sql
SELECT status, COUNT(*) FROM feed_events
WHERE deleted_at IS NULL
GROUP BY status;
```

### Find popular events (most participants)
```sql
SELECT e.id, e.title, COUNT(p.id) as participant_count
FROM feed_events e
LEFT JOIN feed_participants p ON e.id = p.event_id
WHERE e.deleted_at IS NULL
GROUP BY e.id, e.title
ORDER BY participant_count DESC
LIMIT 10;
```

### Find events with no participants
```sql
SELECT e.id, e.title
FROM feed_events e
LEFT JOIN feed_participants p ON e.id = p.event_id
WHERE e.deleted_at IS NULL AND p.id IS NULL;
```

### Check user's activity
```sql
-- Events hosted
SELECT COUNT(*) FROM feed_events
WHERE host_id = 'user_xyz789' AND deleted_at IS NULL;

-- Events joined
SELECT COUNT(*) FROM feed_participants
WHERE user_id = 'user_xyz789';
```

---

## Summary

**Key Takeaways**:

1. **Two Event Types**:
   - **Fixed**: Venue already decided, no voting
   - **Collaborative**: Participants vote on venue options

2. **Host Auto-Join**: When you create an event, you're automatically the first participant

3. **Soft Delete**: Events are never really deleted, just marked with `deleted_at`

4. **Authentication**: JWT tokens in `Authorization: Bearer <token>` header

5. **Avatars**: Stored in both `users.avatar` and `feed_participants.avatar` for performance

6. **Cascade Delete**: Delete event → deletes participants → deletes votes

7. **Database Location**: PostgreSQL running in Docker on `localhost:5432`

---

## Quick Reference

**Connect to database**:
```bash
./scripts/db_console.sh
```

**View all tables**:
```sql
\dt
```

**Describe table structure**:
```sql
\d feed_events
```

**Query examples**:
```sql
-- All active events
SELECT * FROM feed_events WHERE deleted_at IS NULL AND status = 'active';

-- Event with participants
SELECT e.title, p.name
FROM feed_events e
JOIN feed_participants p ON e.id = p.event_id
WHERE e.id = 'evt_abc123';
```

---

**Last Updated**: 2025-10-23
**Database Version**: PostgreSQL 16
**Schema Version**: feed001 + b012172d21fc (avatar support)
