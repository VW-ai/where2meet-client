# Where2Meet - Quick Start Guide

Complete guide to start both the client (M1) and server (M2) from scratch.

## Prerequisites

Before starting, ensure you have:

- ✅ **Node.js** 18+ and **pnpm** (for client)
- ✅ **Python** 3.9+ and **pip** (for server)
- ✅ **Docker Desktop** (for PostgreSQL & Redis)
- ✅ **Google Maps API Key** ([Get one here](https://console.cloud.google.com/apis))

---

## Option 1: Start Client Only (M1 - Single User)

Perfect for testing the frontend features without multi-user support.

### Step 1: Configure Environment

```bash
# Copy environment template
cp .env.local.example .env.local

# Edit .env.local and add your Google Maps API key
# NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_key_here
```

### Step 2: Install Dependencies

```bash
pnpm install
```

### Step 3: Start Development Server

```bash
pnpm dev
```

✅ **Client running at**: http://localhost:4000

### What You Can Do (M1 Features):
- ✅ Add multiple locations via search or map click
- ✅ See centroid and minimum enclosing circle
- ✅ Search for venues by keyword
- ✅ Sort candidates by rating or distance
- ✅ View venue details and directions

---

## Option 2: Start Full Stack (M1 + M2 - Multi-User)

For testing the complete application with multi-user collaboration.

### Part A: Start Server (Backend)

#### 1. Navigate to Server Directory
```bash
cd server/server
```

#### 2. Quick Setup (Automated)
```bash
# Run the setup script (does everything for you)
./setup.sh
```

**OR Manual Setup:**

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your Google Maps API key
# GOOGLE_MAPS_API_KEY=your_actual_key_here
# SECRET_KEY=change-this-in-production

# Start Docker services (PostgreSQL + Redis)
docker-compose up -d

# Wait for services to start
sleep 10

# Run database migrations
alembic revision --autogenerate -m "Initial schema"
alembic upgrade head
```

#### 3. Start API Server
```bash
uvicorn app.main:app --reload --port 8000
```

✅ **Server running at**:
- API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Health Check: http://localhost:8000/health

### Part B: Start Client (Frontend)

In a **new terminal** (leave the server running):

```bash
# Navigate back to root directory
cd ../..  # or just open a new terminal in project root

# Configure environment (if not done yet)
cp .env.local.example .env.local
# Edit .env.local and add your API key

# Install dependencies (if not done yet)
pnpm install

# Start client
pnpm dev
```

✅ **Client running at**: http://localhost:4000

---

## Verification Checklist

### Client Health Check
Visit http://localhost:4000 and you should see:
- ✅ Map loads correctly
- ✅ Search box shows autocomplete
- ✅ Can click on map to add locations

### Server Health Check
Visit http://localhost:8000/health and you should see:
```json
{"status": "healthy"}
```

Visit http://localhost:8000/docs and you should see:
- ✅ Interactive API documentation (Swagger UI)
- ✅ All 17+ endpoints listed

### Database Health Check
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check if Redis is running
docker ps | grep redis

# Should see both containers running
```

---

## Common Issues & Solutions

### Issue: "Port 4000 already in use"

**Solution**:
```bash
# Find what's using the port
lsof -ti:4000 | xargs kill -9

# Or use a different port
pnpm dev -- -p 4001
```

### Issue: "Google Maps not loading"

**Solution**:
1. Check your API key in `.env.local`
2. Ensure Maps JavaScript API is enabled in Google Cloud Console
3. Ensure Places API is enabled
4. Check HTTP referrer restrictions (should allow `http://localhost:4000/*`)

### Issue: "Cannot connect to database"

**Solution**:
```bash
# Check Docker is running
docker ps

# If no containers, start them
cd server/server
docker-compose up -d

# Check logs
docker-compose logs postgres
```

### Issue: "Module not found" (Python)

**Solution**:
```bash
# Make sure virtual environment is activated
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Reinstall dependencies
pip install -r requirements.txt
```

### Issue: "Module not found" (Node)

**Solution**:
```bash
# Remove node_modules and reinstall
rm -rf node_modules
pnpm install
```

---

## Testing the Application

### Test M1 Features (Client Only)
1. Open http://localhost:4000
2. Search for "New York City" → Add location
3. Search for "Los Angeles" → Add location
4. Enter keyword "restaurant" → Click "Search POIs"
5. Verify:
   - ✅ Blue circle shows on map (MEC)
   - ✅ Green marker shows center
   - ✅ Orange markers show venues
   - ✅ Can sort by rating/distance
   - ✅ Click venue to see details

### Test M2 Features (Full Stack)

#### 1. Create Event
```bash
curl -X POST http://localhost:8000/api/v1/events \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Team Lunch",
    "category": "restaurant",
    "visibility": "blur",
    "allow_vote": true
  }'
```

Save the `event_id` from response.

#### 2. Add Participants
```bash
# Replace {event_id} with actual ID
curl -X POST http://localhost:8000/api/v1/events/{event_id}/participants \
  -H "Content-Type: application/json" \
  -d '{
    "lat": 40.7128,
    "lng": -74.0060,
    "name": "Alice"
  }'
```

#### 3. Search Candidates
```bash
curl -X POST http://localhost:8000/api/v1/events/{event_id}/candidates/search \
  -H "Content-Type: application/json" \
  -d '{
    "keyword": "restaurant",
    "radius_multiplier": 1.1
  }'
```

#### 4. View Real-time Stream
Open in browser: http://localhost:8000/api/v1/events/{event_id}/stream

---

## Development Workflow

### Daily Development

**Start Everything:**
```bash
# Terminal 1: Start database services
cd server/server
docker-compose up -d

# Terminal 2: Start API server
cd server/server
source venv/bin/activate
uvicorn app.main:app --reload --port 8000

# Terminal 3: Start client
cd where2meet-client  # project root
pnpm dev
```

**Stop Everything:**
```bash
# Stop client: Ctrl+C in terminal 3
# Stop server: Ctrl+C in terminal 2
# Stop databases:
cd server/server
docker-compose down
```

### Making Changes

**Client Changes:**
- Edit files in `app/`, `components/`, `lib/`
- Hot reload happens automatically
- Changes visible at http://localhost:4000

**Server Changes:**
- Edit files in `server/server/app/`
- Hot reload happens automatically (uvicorn --reload)
- Changes visible at http://localhost:8000

**Database Schema Changes:**
```bash
cd server/server
source venv/bin/activate
alembic revision --autogenerate -m "Description of change"
alembic upgrade head
```

---

## Project Structure Quick Reference

```
where2meet-client/
├── app/                    # Next.js pages (M1 frontend)
│   └── page.tsx           # Main application
├── components/            # React components
│   ├── MapView.tsx        # Google Maps integration
│   ├── InputPanel.tsx     # Location input
│   └── CandidatesPanel.tsx # Venue search
├── lib/                   # Algorithms (MEC, centroid)
├── server/
│   └── server/            # FastAPI backend (M2)
│       ├── app/
│       │   ├── api/v1/    # API endpoints
│       │   ├── models/    # Database models
│       │   ├── schemas/   # Pydantic schemas
│       │   └── services/  # Business logic
│       └── docker-compose.yml
├── .env.local             # Client environment
└── START_HERE.md          # This file
```

---

## Useful Commands

### Client (pnpm)
```bash
pnpm dev          # Start development server (port 4000)
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

### Server (Python)
```bash
uvicorn app.main:app --reload          # Development mode
uvicorn app.main:app --host 0.0.0.0    # Production mode
alembic upgrade head                    # Apply migrations
alembic downgrade -1                    # Rollback migration
python test_basic.py                    # Run tests
```

### Docker
```bash
docker-compose up -d          # Start services
docker-compose down           # Stop services
docker-compose down -v        # Stop and delete volumes
docker-compose logs -f        # View logs
docker-compose ps             # Check status
```

---

## API Documentation

Once the server is running, visit:
- **Interactive Docs**: http://localhost:8000/docs (Swagger UI)
- **Alternative Docs**: http://localhost:8000/redoc (ReDoc)

You can test all API endpoints directly from the browser!

---

## Getting Help

### Documentation
- **Client README**: `README.md`
- **Server README**: `server/server/README.md`
- **Quickstart**: `QUICKSTART.md` and `server/server/QUICKSTART.md`
- **Troubleshooting**: `TROUBLESHOOTING.md`
- **API Key Setup**: `CHECK_API_KEY.md`

### Common Questions

**Q: Do I need to run both client and server?**
A: No! For single-user testing, just run the client (M1). For multi-user features, run both.

**Q: Which port is which?**
A:
- Client: http://localhost:4000
- Server: http://localhost:8000
- PostgreSQL: localhost:5432
- Redis: localhost:6379

**Q: Can I use a different port?**
A: Yes!
- Client: `pnpm dev -- -p 4001`
- Server: `uvicorn app.main:app --port 8001`

**Q: How do I reset everything?**
A:
```bash
# Reset client
rm -rf node_modules .next
pnpm install

# Reset server
cd server/server
docker-compose down -v
docker-compose up -d
alembic upgrade head
```

---

## Next Steps

1. ✅ **Start the application** using steps above
2. 📖 **Read the documentation** in README files
3. 🧪 **Test the features** using the test scenarios
4. 🚀 **Start developing** your own features
5. 📦 **Deploy to production** when ready

---

**Need Help?** Check the troubleshooting guides or review the test reports in `server/server/TEST_REPORT.md`

**Happy Coding!** 🎉
