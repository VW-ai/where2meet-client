# Where2Meet Server - Quick Start

Get the server running in 5 minutes!

## Prerequisites

- Python 3.9 or higher
- Docker Desktop (for PostgreSQL & Redis)
- Google Maps API Key (for POI search)

## Setup Steps

### Option 1: Automated Setup (Recommended)

```bash
cd server
./setup.sh
```

This script will:
1. Create Python virtual environment
2. Install all dependencies
3. Start Docker services (PostgreSQL + Redis)
4. Run database migrations
5. Create `.env` file from template

### Option 2: Manual Setup

```bash
cd server

# 1. Create virtual environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
# Edit .env and set GOOGLE_MAPS_API_KEY

# 4. Start database services
docker-compose up -d

# 5. Run migrations
alembic revision --autogenerate -m "Initial schema"
alembic upgrade head
```

## Start the Server

```bash
# Make sure you're in the server directory with venv activated
uvicorn app.main:app --reload --port 8000
```

Server will start at: **http://localhost:8000**

## Verify Installation

1. **Health Check**: http://localhost:8000/health
2. **API Documentation**: http://localhost:8000/docs
3. **Test Event Creation**:
   ```bash
   curl -X POST http://localhost:8000/api/v1/events \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Team Lunch",
       "category": "food",
       "visibility": "blur",
       "allow_vote": true
     }'
   ```

## Common Commands

### Database
```bash
# View logs
docker-compose logs -f postgres

# Reset database (WARNING: deletes all data)
docker-compose down -v
docker-compose up -d
alembic upgrade head

# Create new migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head
```

### Server
```bash
# Development mode (auto-reload)
uvicorn app.main:app --reload --port 8000

# Production mode
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Docker
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View all logs
docker-compose logs -f

# Check status
docker-compose ps
```

## API Endpoints Quick Reference

### Events
```bash
# Create event
POST /api/v1/events

# Get event
GET /api/v1/events/{event_id}

# Update settings
PATCH /api/v1/events/{event_id}

# Publish final decision
POST /api/v1/events/{event_id}/publish
```

### Participants
```bash
# Add participant
POST /api/v1/events/{event_id}/participants

# List participants
GET /api/v1/events/{event_id}/participants
```

### Candidates
```bash
# Search venues
POST /api/v1/events/{event_id}/candidates/search

# List candidates
GET /api/v1/events/{event_id}/candidates?sort_by=rating

# Add manually
POST /api/v1/events/{event_id}/candidates
```

### Votes
```bash
# Cast vote
POST /api/v1/events/{event_id}/votes?participant_id={pid}

# List votes
GET /api/v1/events/{event_id}/votes
```

### Real-time
```bash
# SSE stream
GET /api/v1/events/{event_id}/stream
```

## Environment Variables

Required:
- `GOOGLE_MAPS_API_KEY` - For POI search

Optional (with defaults):
- `DATABASE_URL` - PostgreSQL connection (default: localhost:5432)
- `REDIS_URL` - Redis connection (default: localhost:6379)
- `SECRET_KEY` - JWT signing key (change in production!)
- `EVENT_TTL_DAYS` - Event expiry (default: 30)

## Troubleshooting

### Docker not running
```bash
# Start Docker Desktop, then:
docker-compose up -d
```

### Database connection error
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check logs
docker-compose logs postgres
```

### Migration error
```bash
# Reset migrations
alembic downgrade base
alembic upgrade head
```

### Port already in use
```bash
# Change port in command
uvicorn app.main:app --reload --port 8001
```

## Next Steps

- Read full documentation: `server/README.md`
- Explore API docs: http://localhost:8000/docs
- Test with Postman/Insomnia
- Integrate with frontend client

## Support

- **API Documentation**: http://localhost:8000/docs
- **Project README**: `server/README.md`
- **Database Schema**: See `server/app/models/event.py`
- **Example Requests**: Available in API docs
