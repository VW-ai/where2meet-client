# Where2Meet Database Schema

**Last Updated**: 2025-10-22
**Database**: PostgreSQL 16
**ORM**: SQLAlchemy 2.0

---

## Overview

The Where2Meet database consists of **TWO SEPARATE SYSTEMS**:

1. **Find Meeting Point** - Original location coordination feature
2. **Event Feed** - Social event discovery and planning feature

---

# System 1: Find Meeting Point

Tables for coordinating meeting locations among existing groups.

## Table: `users`

User authentication and profiles.

```sql
CREATE TABLE users (
    id VARCHAR PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX ix_users_id ON users(id);
CREATE INDEX ix_users_email ON users(email);
```

**Fields:**
- `id` - Unique user identifier
- `email` - User email (unique)
- `hashed_password` - Bcrypt hashed password
- `created_at` - Account creation timestamp

---

## Table: `events`

Meeting coordination events (Find Meeting Point).

```sql
CREATE TABLE events (
    id VARCHAR PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    deadline TIMESTAMP WITH TIME ZONE,
    visibility VARCHAR(20) DEFAULT 'blur',
    allow_vote BOOLEAN DEFAULT TRUE,
    final_decision TEXT,
    custom_center_lat FLOAT,
    custom_center_lng FLOAT,
    created_by VARCHAR REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX ix_events_id ON events(id);
CREATE INDEX ix_events_created_at ON events(created_at);
CREATE INDEX ix_events_deleted_at ON events(deleted_at);
CREATE INDEX ix_events_expires_at ON events(expires_at);
```

**Fields:**
- `id` - Event identifier
- `title` - Event name
- `category` - Event category (e.g., "coffee", "lunch")
- `deadline` - Voting deadline
- `visibility` - "blur" (fuzzy locations) or "show" (exact locations)
- `allow_vote` - Enable/disable voting
- `final_decision` - Published final venue choice
- `custom_center_lat/lng` - Host-dragged center point
- `created_by` - User who created event (nullable)
- `created_at` - Creation timestamp
- `expires_at` - Auto-deletion timestamp (TTL)
- `deleted_at` - Soft delete timestamp

---

## Table: `participants`

Anonymous participants in Find Meeting Point events.

```sql
CREATE TABLE participants (
    id VARCHAR PRIMARY KEY,
    event_id VARCHAR NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    lat FLOAT NOT NULL,
    lng FLOAT NOT NULL,
    fuzzy_lat FLOAT,
    fuzzy_lng FLOAT,
    name VARCHAR(100),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX ix_participants_id ON participants(id);
CREATE INDEX ix_participants_event_id ON participants(event_id);
```

**Fields:**
- `id` - Participant identifier
- `event_id` - Associated event (FK)
- `lat/lng` - Exact location
- `fuzzy_lat/fuzzy_lng` - Blurred location for privacy
- `name` - Optional display name
- `joined_at` - Join timestamp

---

## Table: `candidates`

Potential meeting venues (POI from Google Maps).

```sql
CREATE TABLE candidates (
    id VARCHAR PRIMARY KEY,
    event_id VARCHAR NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    place_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    lat FLOAT NOT NULL,
    lng FLOAT NOT NULL,
    rating FLOAT,
    user_ratings_total INTEGER DEFAULT 0,
    distance_from_center FLOAT,
    in_circle BOOLEAN DEFAULT TRUE,
    opening_hours TEXT,
    photo_reference VARCHAR(500),
    added_by VARCHAR(20) DEFAULT 'system',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX ix_candidates_id ON candidates(id);
CREATE INDEX ix_candidates_event_id ON candidates(event_id);
CREATE INDEX ix_candidates_place_id ON candidates(place_id);
```

**Fields:**
- `id` - Candidate identifier
- `event_id` - Associated event (FK)
- `place_id` - Google Places ID
- `name` - Venue name
- `address` - Full address
- `lat/lng` - Venue coordinates
- `rating` - Google rating (0-5)
- `user_ratings_total` - Number of Google reviews
- `distance_from_center` - Distance from MEC center (km)
- `in_circle` - Within Minimum Enclosing Circle
- `opening_hours` - JSON string of hours
- `photo_reference` - Google Places photo reference
- `added_by` - "system" or "organizer"
- `created_at` - Addition timestamp

---

## Table: `votes`

Participant votes for meeting venues.

```sql
CREATE TABLE votes (
    id SERIAL PRIMARY KEY,
    event_id VARCHAR NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    participant_id VARCHAR NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    candidate_id VARCHAR NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(participant_id, candidate_id)
);

CREATE INDEX ix_votes_event_id ON votes(event_id);
CREATE UNIQUE INDEX ix_votes_participant_candidate ON votes(participant_id, candidate_id);
```

**Fields:**
- `id` - Auto-incrementing vote ID
- `event_id` - Associated event (FK)
- `participant_id` - Voter (FK)
- `candidate_id` - Voted venue (FK)
- `voted_at` - Vote timestamp

**Constraints:**
- One vote per participant per candidate (UNIQUE)

---

# System 2: Event Feed

Tables for social event discovery and planning.

## Table: `feed_events`

Public social events (Event Feed).

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
    allow_vote BOOLEAN NOT NULL DEFAULT TRUE,

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'active',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX ix_feed_events_id ON feed_events(id);
CREATE INDEX ix_feed_events_created_at ON feed_events(created_at);
CREATE INDEX ix_feed_events_meeting_time ON feed_events(meeting_time);
CREATE INDEX ix_feed_events_status ON feed_events(status);
CREATE INDEX ix_feed_events_visibility ON feed_events(visibility);
CREATE INDEX ix_feed_events_host_id ON feed_events(host_id);
CREATE INDEX ix_feed_events_deleted_at ON feed_events(deleted_at);
```

**Fields:**
- `id` - Event identifier
- `title` - Event title (e.g., "Weekend Brunch Meetup")
- `description` - Detailed description
- `host_id` - Event creator (FK to users, nullable)
- `host_name` - Display name of host
- `participant_limit` - Max participants (nullable = unlimited)
- `meeting_time` - When the event happens
- `location_area` - General area (e.g., "Downtown SF")
- `location_coords_lat/lng` - Optional precise coordinates
- `location_type` - **"fixed"** or **"collaborative"**
- `fixed_venue_id` - Google Place ID (for fixed events)
- `fixed_venue_name` - Venue name (for fixed events)
- `fixed_venue_address` - Full address (for fixed events)
- `fixed_venue_lat/lng` - Venue coordinates (for fixed events)
- `category` - Event category (food, sports, entertainment, etc.)
- `background_image` - Hero image URL
- `visibility` - **"public"** or **"link_only"**
- `allow_vote` - Enable venue voting (for collaborative events)
- `status` - Event status (see below)
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp
- `deleted_at` - Soft delete timestamp

**Status Values:**
- `active` - Open for participants
- `full` - Reached participant limit
- `closed` - Host closed event
- `past` - Meeting time has passed
- `cancelled` - Event cancelled
- `completed` - Event successfully completed

**Location Types:**
- `fixed` - Organizer knows exact venue (no venue discovery needed)
- `collaborative` - Group finds location together (uses venue voting)

---

## Table: `feed_participants`

Participants who joined Event Feed events.

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

CREATE INDEX ix_feed_participants_id ON feed_participants(id);
CREATE INDEX ix_feed_participants_event_id ON feed_participants(event_id);
CREATE INDEX ix_feed_participants_user_id ON feed_participants(user_id);
```

**Fields:**
- `id` - Participant identifier
- `event_id` - Associated event (FK)
- `user_id` - User account (FK, nullable for anonymous)
- `name` - Display name
- `email` - Contact email (optional)
- `avatar` - Avatar URL (optional)
- `joined_at` - Join timestamp

---

## Table: `feed_venues`

Venue suggestions for collaborative Event Feed events.

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
    in_circle BOOLEAN DEFAULT TRUE,
    open_now BOOLEAN,
    types TEXT,
    photo_reference VARCHAR(500),
    added_by VARCHAR(20) DEFAULT 'system',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX ix_feed_venues_id ON feed_venues(id);
CREATE INDEX ix_feed_venues_event_id ON feed_venues(event_id);
CREATE INDEX ix_feed_venues_place_id ON feed_venues(place_id);
```

**Fields:**
- `id` - Venue identifier
- `event_id` - Associated event (FK)
- `place_id` - Google Places ID
- `name` - Venue name
- `vicinity` - Short address/vicinity
- `lat/lng` - Venue coordinates
- `rating` - Google rating (0-5)
- `user_ratings_total` - Number of Google reviews
- `distance_from_center` - Distance from event center (km)
- `in_circle` - Within search area
- `open_now` - Currently open (boolean)
- `types` - JSON array of place types
- `photo_reference` - Google Places photo reference
- `added_by` - **"system"** (auto-suggested) or **"organizer"** (manually added)
- `created_at` - Addition timestamp

**Note:** Only used for `collaborative` events. Fixed events don't need this table.

---

## Table: `feed_votes`

Votes for venue preferences in Event Feed.

```sql
CREATE TABLE feed_votes (
    id SERIAL PRIMARY KEY,
    event_id VARCHAR NOT NULL REFERENCES feed_events(id) ON DELETE CASCADE,
    participant_id VARCHAR NOT NULL REFERENCES feed_participants(id) ON DELETE CASCADE,
    venue_id VARCHAR NOT NULL REFERENCES feed_venues(id) ON DELETE CASCADE,
    voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(participant_id, venue_id)
);

CREATE INDEX ix_feed_votes_event_id ON feed_votes(event_id);
CREATE UNIQUE INDEX ix_feed_votes_participant_venue ON feed_votes(participant_id, venue_id);
```

**Fields:**
- `id` - Auto-incrementing vote ID
- `event_id` - Associated event (FK)
- `participant_id` - Voter (FK)
- `venue_id` - Voted venue (FK)
- `voted_at` - Vote timestamp

**Constraints:**
- One vote per participant per venue (UNIQUE)

---

## Entity Relationship Diagram

```
┌──────────────────┐
│      users       │
│  ────────────────│
│  id (PK)         │
│  email           │
│  hashed_password │
│  created_at      │
└──────────────────┘
         │
         │ (1:N)
         ├──────────────────────┐
         │                      │
         ▼                      ▼
┌──────────────────┐   ┌──────────────────┐
│     events       │   │   feed_events    │
│  ────────────────│   │  ────────────────│
│  id (PK)         │   │  id (PK)         │
│  created_by (FK) │   │  host_id (FK)    │
│  title           │   │  title           │
│  category        │   │  description     │
│  visibility      │   │  meeting_time    │
│  allow_vote      │   │  location_type   │
│  ...             │   │  status          │
└──────────────────┘   │  ...             │
         │             └──────────────────┘
         │ (1:N)                │
         ▼                      │ (1:N)
┌──────────────────┐           ▼
│  participants    │   ┌──────────────────┐
│  ────────────────│   │ feed_participants│
│  id (PK)         │   │  ────────────────│
│  event_id (FK)   │   │  id (PK)         │
│  lat, lng        │   │  event_id (FK)   │
│  name            │   │  user_id (FK)    │
└──────────────────┘   │  name, email     │
         │             └──────────────────┘
         │ (1:N)                │
         ▼                      │ (1:N)
┌──────────────────┐           ▼
│      votes       │   ┌──────────────────┐
│  ────────────────│   │   feed_votes     │
│  id (PK)         │   │  ────────────────│
│  event_id (FK)   │   │  id (PK)         │
│  participant (FK)│   │  event_id (FK)   │
│  candidate_id(FK)│   │  participant(FK) │
└──────────────────┘   │  venue_id (FK)   │
         ▲             └──────────────────┘
         │                      ▲
┌────────┴──────────┐           │
│                   │           │
│ (1:N)             │           │ (1:N)
▼                   ▼           ▼
┌──────────────────┐   ┌──────────────────┐
│   candidates     │   │   feed_venues    │
│  ────────────────│   │  ────────────────│
│  id (PK)         │   │  id (PK)         │
│  event_id (FK)   │   │  event_id (FK)   │
│  place_id        │   │  place_id        │
│  name, address   │   │  name, vicinity  │
│  lat, lng        │   │  lat, lng        │
│  rating          │   │  rating          │
└──────────────────┘   └──────────────────┘

SYSTEM 1: Find Meeting Point (LEFT)
SYSTEM 2: Event Feed (RIGHT)
```

---

## Key Differences Between Systems

| Feature | Find Meeting Point | Event Feed |
|---------|-------------------|------------|
| **Purpose** | Coordinate location for existing group | Discover and join social events |
| **Privacy** | Anonymous, location blur option | Public profiles, visible to all |
| **Participants** | Pre-existing group | Open to anyone |
| **Location** | Always collaborative | Fixed OR collaborative |
| **Time** | No specific meeting time | Specific meeting time required |
| **Visibility** | Private link only | Public feed + link only |
| **Status** | No status system | Active/full/closed/past/etc. |
| **Tables** | events, participants, candidates, votes | feed_events, feed_participants, feed_venues, feed_votes |

---

## Indexes Summary

### Performance Optimizations

**Find Meeting Point:**
- Event lookups by ID, creation date, deletion status
- Participant lookups by event
- Candidate lookups by event and Google Place ID
- Vote uniqueness per participant-candidate pair

**Event Feed:**
- Event lookups by ID, status, visibility, host, meeting time
- Participant lookups by event and user
- Venue lookups by event and Google Place ID
- Vote uniqueness per participant-venue pair

---

## Foreign Key Cascade Behaviors

**ON DELETE CASCADE:**
- When event deleted → all participants, candidates/venues, and votes deleted
- When participant deleted → all their votes deleted

**ON DELETE SET NULL:**
- When user deleted → events/feed_events keep host_id as NULL
- Allows anonymous event creation to persist

---

## Migration History

1. **2025_10_14_2213** - Initial migration (events, participants, candidates, votes)
2. **2025_10_14_2307** - Add users table
3. **2025_10_16_2333** - Add custom center to events
4. **2025_10_21_1346** - Add photo reference to candidates
5. **2025_10_22_2208** - Add Event Feed tables ✨ **LATEST**

---

## Database Statistics

**Total Tables:** 9
- **System 1 (Find Meeting Point):** 5 tables
  - users (shared)
  - events
  - participants
  - candidates
  - votes

- **System 2 (Event Feed):** 4 tables
  - feed_events
  - feed_participants
  - feed_venues
  - feed_votes

**Total Indexes:** 28+
**Total Foreign Keys:** 12+

---

## Connection Info

**Development:**
```
Host: localhost
Port: 5432
Database: where2meet
User: where2meet
Password: where2meet
```

**Container:**
```bash
docker exec -it where2meet-postgres psql -U where2meet -d where2meet
```

**Connection String:**
```
postgresql://where2meet:where2meet@localhost:5432/where2meet
```

---

## Useful Queries

### Check table sizes
```sql
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Count records per table
```sql
SELECT
    'events' as table_name, COUNT(*) FROM events
UNION ALL SELECT 'feed_events', COUNT(*) FROM feed_events
UNION ALL SELECT 'participants', COUNT(*) FROM participants
UNION ALL SELECT 'feed_participants', COUNT(*) FROM feed_participants
UNION ALL SELECT 'candidates', COUNT(*) FROM candidates
UNION ALL SELECT 'feed_venues', COUNT(*) FROM feed_venues
UNION ALL SELECT 'votes', COUNT(*) FROM votes
UNION ALL SELECT 'feed_votes', COUNT(*) FROM feed_votes;
```

### View all indexes
```sql
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```
