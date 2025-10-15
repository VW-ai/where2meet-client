# Where2Meet - Utility Scripts

Quick start/stop scripts for managing all services.

## 📜 Available Scripts

### `./start_all.sh`
Starts all services in the correct order:
1. Docker containers (PostgreSQL + Redis)
2. FastAPI backend (port 5001)
3. Next.js frontend (port 4000)

**Usage:**
```bash
./start_all.sh
```

**What it does:**
- Starts Docker containers with `docker compose up -d`
- Waits for PostgreSQL to be ready
- Starts backend API in background (logs to `logs/backend.log`)
- Starts frontend dev server in background (logs to `logs/frontend.log`)
- Saves process IDs to `logs/*.pid` files

---

### `./stop_all.sh`
Stops all running services:
1. Next.js frontend
2. FastAPI backend
3. Docker containers

**Usage:**
```bash
./stop_all.sh
```

**What it does:**
- Kills frontend process (port 4000)
- Kills backend process (port 5001)
- Stops Docker containers with `docker compose down`
- Cleans up PID files

---

### `./check_status.sh`
Checks if all services are running properly.

**Usage:**
```bash
./check_status.sh
```

**What it shows:**
- ✓/✗ Frontend status (http://localhost:4000)
- ✓/✗ Backend status (http://localhost:5001)
- ✓/✗ PostgreSQL status (localhost:5432)
- ✓/✗ Redis status (localhost:6379)
- Docker container status
- Process IDs of running services

---

## 🚀 Quick Start Guide

### First Time Setup
1. Make sure you have installed:
   - Docker Desktop
   - Node.js & pnpm
   - Python 3.9+ with venv

2. Install dependencies:
   ```bash
   # Install frontend dependencies
   pnpm install

   # Install backend dependencies
   cd server/server
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   cd ../..
   ```

3. Start all services:
   ```bash
   ./start_all.sh
   ```

4. Open your browser to http://localhost:4000

### Daily Usage
```bash
# Start everything
./start_all.sh

# Check if everything is running
./check_status.sh

# View backend logs
tail -f logs/backend.log

# View frontend logs
tail -f logs/frontend.log

# Stop everything when done
./stop_all.sh
```

---

## 📊 Service Ports

| Service    | Port | URL                        |
|------------|------|----------------------------|
| Frontend   | 4000 | http://localhost:4000      |
| Backend    | 5001 | http://localhost:5001      |
| PostgreSQL | 5432 | localhost:5432             |
| Redis      | 6379 | localhost:6379             |

---

## 📁 Log Files

Logs are stored in the `logs/` directory:
- `logs/backend.log` - FastAPI backend logs
- `logs/frontend.log` - Next.js frontend logs
- `logs/backend.pid` - Backend process ID
- `logs/frontend.pid` - Frontend process ID

---

## 🔧 Troubleshooting

### "Port already in use"
The scripts automatically kill existing processes on the required ports.

### "Docker containers not starting"
Make sure Docker Desktop is running:
```bash
open -a Docker
```

### "Backend fails to start"
Check the logs:
```bash
tail -f logs/backend.log
```

### "Database connection error"
Wait for PostgreSQL to fully start:
```bash
docker exec where2meet-postgres pg_isready -U where2meet
```

### Manually restart a specific service

**Backend only:**
```bash
cd server/server
source venv/bin/activate
uvicorn app.main:app --reload --port 5001
```

**Frontend only:**
```bash
pnpm dev
```

**Database only:**
```bash
cd server/server
docker compose up -d
```

---

## 🧹 Clean Restart

If you need to completely reset everything:
```bash
# Stop all services
./stop_all.sh

# Remove Docker volumes (⚠️ this deletes database data)
cd server/server
docker compose down -v

# Clear Next.js cache
rm -rf .next

# Restart everything
cd ../..
./start_all.sh
```
