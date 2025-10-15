# Where2Meet Server (M2)

FastAPI backend for Where2Meet - Multi-user location coordination platform.

## Features (M2)

- ✅ **Event Creation & Join** - Create events with signed join links
- ✅ **Participant Management** - Anonymous location submission with privacy blur
- ✅ **Real-time Updates** - Server-Sent Events (SSE) for live synchronization
- ✅ **Server-side MEC** - Minimum Enclosing Circle computation
- ✅ **POI Search** - Google Maps Places API integration
- ✅ **Candidate Ranking** - Sort by rating or distance
- ✅ **Voting System** - Vote for preferred venues with de-duplication
- ✅ **Deadline Management** - Auto-lock and manual publish
- ✅ **Data Lifecycle** - TTL, soft delete, and governance
- ✅ **Security** - JWT tokens, rate limiting, structured logging

## Tech Stack

- **Framework**: FastAPI 0.115
- **Database**: PostgreSQL 16
- **Cache**: Redis 7
- **ORM**: SQLAlchemy 2.0
- **Migrations**: Alembic 1.13
- **Authentication**: JWT (python-jose)
- **HTTP Client**: HTTPX
- **Logging**: Structlog

## Quick Start

### 1. Start Database Services

```bash
cd server
docker-compose up -d
```

This starts PostgreSQL (port 5432) and Redis (port 6379).

### 2. Install Python Dependencies

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env and set:
# - GOOGLE_MAPS_API_KEY (required for POI search)
# - SECRET_KEY (change in production)
```

### 4. Run Database Migrations

```bash
# Create initial migration
alembic revision --autogenerate -m "Initial schema"

# Apply migrations
alembic upgrade head
```

### 5. Start API Server

```bash
uvicorn app.main:app --reload --port 8000
```

API will be available at:
- **API**: http://localhost:8000
- **Docs**: http://localhost:8000/docs
- **Health**: http://localhost:8000/health

## API Endpoints

### Events
- `POST /api/v1/events` - Create event
- `GET /api/v1/events/{event_id}` - Get event details
- `PATCH /api/v1/events/{event_id}` - Update event settings
- `POST /api/v1/events/{event_id}/publish` - Publish final decision
- `DELETE /api/v1/events/{event_id}` - Delete event
- `GET /api/v1/events/{event_id}/analysis` - Get MEC analysis

### Participants
- `POST /api/v1/events/{event_id}/participants` - Add participant
- `GET /api/v1/events/{event_id}/participants` - List participants
- `DELETE /api/v1/events/{event_id}/participants/{pid}` - Remove participant

### Candidates
- `POST /api/v1/events/{event_id}/candidates/search` - Search venues
- `GET /api/v1/events/{event_id}/candidates` - List candidates (with sorting)
- `POST /api/v1/events/{event_id}/candidates` - Manually add candidate
- `DELETE /api/v1/events/{event_id}/candidates/{cid}` - Remove candidate

### Votes
- `POST /api/v1/events/{event_id}/votes` - Cast vote
- `GET /api/v1/events/{event_id}/votes` - List votes
- `DELETE /api/v1/events/{event_id}/votes/{vote_id}` - Remove vote

### SSE (Real-time)
- `GET /api/v1/events/{event_id}/stream` - SSE stream for live updates

## Real-time Events

The SSE endpoint broadcasts these events:

- `participant_joined` - New participant added
- `participant_left` - Participant removed
- `candidates_added` - Multiple candidates added from search
- `candidate_added` - Single candidate manually added
- `candidate_removed` - Candidate removed
- `vote_cast` - Vote submitted
- `vote_removed` - Vote retracted
- `event_updated` - Event settings changed
- `event_published` - Final decision published

## Database Schema

### Events
- `id` (PK) - Event identifier
- `title`, `category`, `deadline`
- `visibility` - "blur" or "show" participant locations
- `allow_vote` - Enable/disable voting
- `final_decision` - Published result
- `created_at`, `expires_at`, `deleted_at`

### Participants
- `id` (PK), `event_id` (FK)
- `lat`, `lng` - Actual coordinates
- `fuzzy_lat`, `fuzzy_lng` - Blurred coordinates
- `name` - Optional display name
- `joined_at`

### Candidates
- `id` (PK), `event_id` (FK)
- `place_id` - Google Places ID
- `name`, `address`, `lat`, `lng`
- `rating`, `user_ratings_total`
- `distance_from_center`, `in_circle`
- `opening_hours`, `added_by`

### Votes
- `id` (PK), `event_id` (FK)
- `participant_id` (FK), `candidate_id` (FK)
- `voted_at`
- Unique constraint: (participant_id, candidate_id)

## Development

### Database Commands

```bash
# Create new migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1

# View migration history
alembic history

# View current revision
alembic current
```

### Docker Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f postgres
docker-compose logs -f redis

# Reset database (WARNING: deletes all data)
docker-compose down -v
docker-compose up -d
```

### Testing

```bash
# Run tests (when implemented)
pytest

# Run with coverage
pytest --cov=app --cov-report=html
```

## Configuration

### Environment Variables

See `.env.example` for all available options:

- **DATABASE_URL** - PostgreSQL connection string
- **REDIS_URL** - Redis connection string
- **SECRET_KEY** - JWT signing key (change in production!)
- **GOOGLE_MAPS_API_KEY** - Required for POI search
- **ALLOWED_ORIGINS** - CORS allowed origins
- **EVENT_TTL_DAYS** - Event expiry (default: 30)
- **RATE_LIMIT_REQUESTS** - Rate limit threshold

### Security Best Practices

1. **Change SECRET_KEY** in production
2. **Restrict API key** to server IP
3. **Enable HTTPS** in production
4. **Set strong database password**
5. **Use Redis password** in production
6. **Configure rate limiting** appropriately

## Deployment

### Production Checklist

- [ ] Set `ENVIRONMENT=production` and `DEBUG=false`
- [ ] Generate strong `SECRET_KEY`
- [ ] Configure production database
- [ ] Enable Redis authentication
- [ ] Set up HTTPS/TLS
- [ ] Configure firewall rules
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy
- [ ] Test disaster recovery

### Recommended Setup

- **Web Server**: Nginx (reverse proxy)
- **App Server**: Uvicorn with Gunicorn
- **Database**: Managed PostgreSQL (AWS RDS, etc.)
- **Cache**: Managed Redis (ElastiCache, etc.)
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK Stack or CloudWatch

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Test connection
psql -h localhost -U where2meet -d where2meet

# View logs
docker-compose logs postgres
```

### Migration Errors

```bash
# Reset migrations (WARNING: destructive)
alembic downgrade base
alembic upgrade head

# Or recreate database
docker-compose down -v
docker-compose up -d
alembic upgrade head
```

### Redis Connection Issues

```bash
# Check if Redis is running
docker ps | grep redis

# Test connection
redis-cli ping

# View logs
docker-compose logs redis
```

## Next Steps (M3)

Planned features for Milestone 3:

- Enhanced privacy controls
- Time slot voting
- Weather integration
- Multi-language support
- Email notifications
- Export results to PDF
- Analytics dashboard

## License

MIT License - See LICENSE file
