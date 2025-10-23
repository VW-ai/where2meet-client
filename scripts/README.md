# Backend & Database Management Scripts

Comprehensive tools for managing your Where2Meet backend and database.

## Quick Reference

```bash
# Daily Operations
./scripts/health_check.sh              # Check all services
./scripts/logs.sh backend -f           # View live backend logs
./scripts/logs.sh all -f               # View all logs

# Database Management
./scripts/db_backup.sh                 # Create database backup
./scripts/db_seed.sh                   # Populate with test data
./scripts/db_console.sh                # Open PostgreSQL console

# Migrations
./scripts/db_migrate.sh status         # Check migration status
./scripts/db_migrate.sh create "msg"   # Create new migration
./scripts/db_migrate.sh upgrade        # Run migrations

# Emergency
./scripts/db_reset.sh                  # Reset database (destructive!)
./scripts/db_restore.sh backup.sql.gz  # Restore from backup
```

---

## Database Scripts

### 🗄️ Backup & Restore

#### Create Backup
```bash
./scripts/db_backup.sh
```
- Creates timestamped backup in `backups/db/`
- Automatically compresses with gzip
- Keeps last 10 backups automatically
- Run before risky operations!

#### Restore Backup
```bash
./scripts/db_restore.sh backups/db/where2meet_20250122_143022.sql.gz
```
- Restores database from backup file
- Creates safety backup before restore
- ⚠️ **Destructive** - will replace current data

### 🔄 Migrations

#### Check Migration Status
```bash
./scripts/db_migrate.sh status
```

#### Create New Migration
```bash
./scripts/db_migrate.sh create "add users table"
```
- Auto-generates migration from model changes
- **Always review** generated migration before applying!

#### Apply Migrations
```bash
./scripts/db_migrate.sh upgrade
```

#### Rollback Migration
```bash
./scripts/db_migrate.sh downgrade      # Rollback 1 migration
./scripts/db_migrate.sh downgrade 3    # Rollback 3 migrations
```

#### View Migration History
```bash
./scripts/db_migrate.sh history
```

### 🌱 Seed Development Data

```bash
./scripts/db_seed.sh
```

Creates test data:
- 3 test users (alice@example.com, bob@example.com, charlie@example.com)
- Sample event feed events
- Event participants
- Password for all test users: `password123`

**When to use:**
- After `db_reset.sh`
- Setting up new development environment
- Creating demo data

### ⚡ Reset Database

```bash
./scripts/db_reset.sh
```

**What it does:**
1. Creates safety backup
2. Rolls back all migrations
3. Re-runs all migrations from scratch
4. Seeds database with test data

⚠️ **Destructive** - deletes all data!

**Use when:**
- Database is in inconsistent state
- Testing migrations from scratch
- Starting fresh

### 💻 Database Console

```bash
./scripts/db_console.sh
```

Opens interactive PostgreSQL shell.

**Useful commands:**
```sql
\dt                  -- List tables
\d table_name        -- Describe table
\l                   -- List databases
\du                  -- List users
\q                   -- Quit
```

---

## Monitoring Scripts

### 🏥 Health Check

```bash
./scripts/health_check.sh
```

Checks:
- Docker containers running
- PostgreSQL responsive
- Redis responsive
- Backend API health endpoint
- Frontend server
- Database connectivity
- Record counts
- Disk usage

Exit codes:
- `0` = All healthy
- `1` = Issues detected

**Use in CI/CD:**
```bash
if ./scripts/health_check.sh; then
    echo "All systems go!"
else
    echo "Issues detected"
    exit 1
fi
```

### 📄 Log Viewer

#### View Backend Logs
```bash
./scripts/logs.sh backend           # Last 50 lines
./scripts/logs.sh backend -n 100    # Last 100 lines
./scripts/logs.sh backend -f        # Follow live
```

#### View All Logs
```bash
./scripts/logs.sh all              # Last 50 lines from all services
./scripts/logs.sh all -f           # Follow all services live
```

#### Available Services
- `backend` - FastAPI application logs
- `frontend` - Next.js dev server logs
- `postgres` - PostgreSQL database logs
- `redis` - Redis cache logs
- `all` - All services combined

---

## Common Workflows

### 🚀 Starting Fresh Development

```bash
# 1. Start services
./start_all.sh

# 2. Reset and seed database
./scripts/db_reset.sh

# 3. Verify health
./scripts/health_check.sh

# 4. View logs
./scripts/logs.sh all -f
```

### 📊 Before Making Schema Changes

```bash
# 1. Create backup
./scripts/db_backup.sh

# 2. Modify models in app/models/
# ... make your changes ...

# 3. Create migration
./scripts/db_migrate.sh create "describe your changes"

# 4. Review migration file in alembic/versions/
# ... check the generated SQL ...

# 5. Apply migration
./scripts/db_migrate.sh upgrade

# 6. Test changes
./scripts/health_check.sh
```

### 🔧 Debugging Database Issues

```bash
# 1. Check health
./scripts/health_check.sh

# 2. View logs
./scripts/logs.sh postgres -n 200

# 3. Open console to investigate
./scripts/db_console.sh

# 4. Check migration status
./scripts/db_migrate.sh status
```

### 🧪 Testing with Fresh Data

```bash
# 1. Backup current state (optional)
./scripts/db_backup.sh

# 2. Reset to clean state
./scripts/db_reset.sh

# 3. Run tests
pnpm test

# 4. Restore if needed
./scripts/db_restore.sh backups/db/latest_backup.sql.gz
```

---

## Best Practices

### ✅ DO

- **Backup before risky operations** - Always run `db_backup.sh` first
- **Review migrations** - Check generated SQL before applying
- **Seed development databases** - Use `db_seed.sh` for consistent test data
- **Monitor logs** - Use `logs.sh -f` during development
- **Check health regularly** - Run `health_check.sh` when things seem off

### ❌ DON'T

- **Don't skip backups** - Especially before `db_reset.sh`
- **Don't edit migrations** after they're applied
- **Don't manually modify database** - Use migrations instead
- **Don't commit `.env` files** - Use `.env.example` as template
- **Don't run migrations without reviewing** them first

---

## Troubleshooting

### "PostgreSQL container not running"

```bash
cd server/server
docker compose up -d
```

### "Backend failed to start"

```bash
# Check logs
./scripts/logs.sh backend

# Check if port 5001 is in use
lsof -i :5001

# Restart
./stop_all.sh
./start_all.sh
```

### "Migration failed"

```bash
# Check current status
./scripts/db_migrate.sh status

# View error in logs
./scripts/logs.sh backend -n 100

# Rollback if needed
./scripts/db_migrate.sh downgrade

# Restore from backup if broken
./scripts/db_restore.sh backups/db/latest.sql.gz
```

### "Database is in inconsistent state"

```bash
# Nuclear option - start fresh
./scripts/db_reset.sh
```

---

## Backup Strategy

### Automatic Backups

Backups are automatically created:
- Before `db_reset.sh`
- Before `db_restore.sh`
- When you run `db_backup.sh`

Old backups are automatically cleaned up (keeps last 10).

### Manual Backups

```bash
# Before major changes
./scripts/db_backup.sh

# Before production deployment
./scripts/db_backup.sh

# Before experimenting
./scripts/db_backup.sh
```

### Backup Location

```
backups/db/
├── where2meet_20250122_143022.sql.gz
├── where2meet_20250122_120000.sql.gz
└── pre_restore_20250122_140000.sql.gz
```

---

## Environment Variables

Key variables in `server/server/.env`:

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/where2meet

# Application
ENVIRONMENT=development
DEBUG=true

# Security (change in production!)
SECRET_KEY=your-secret-key-here

# External Services
GOOGLE_MAPS_API_KEY=your-key-here
```

⚠️ Never commit `.env` - use `.env.example` as template!

---

## Advanced Usage

### Automated Health Checks (Cron)

```bash
# Add to crontab for monitoring
*/5 * * * * /path/to/scripts/health_check.sh || echo "Health check failed" | mail -s "Alert" admin@example.com
```

### Continuous Backup (Cron)

```bash
# Daily backup at 2 AM
0 2 * * * /path/to/scripts/db_backup.sh
```

### Pre-commit Hook

```bash
# .git/hooks/pre-commit
#!/bin/bash
./scripts/health_check.sh || {
    echo "Health check failed - commit aborted"
    exit 1
}
```

---

## Additional Resources

- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [FastAPI Best Practices](https://fastapi.tiangolo.com/tutorial/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
