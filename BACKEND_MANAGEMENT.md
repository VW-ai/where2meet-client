# Backend & Database Management Guide

## 🎯 Quick Start

Your backend now has professional-grade management tools!

```bash
# Essential daily commands
./scripts/health_check.sh              # Is everything running?
./scripts/logs.sh backend -f           # Watch backend logs
./scripts/db_backup.sh                 # Save your data
./scripts/db_seed.sh                   # Get test data
```

## 📁 What's Been Added

### New `/scripts` Directory

```
scripts/
├── README.md          # Comprehensive documentation
├── db_backup.sh       # Automated database backups
├── db_restore.sh      # Restore from backup
├── db_reset.sh        # Fresh start (keeps migrations)
├── db_seed.sh         # Test data generator
├── db_migrate.sh      # Migration helper
├── db_console.sh      # PostgreSQL shell
├── health_check.sh    # System health monitor
└── logs.sh            # Unified log viewer
```

All scripts are:
- ✅ Executable (`chmod +x`)
- ✅ Documented with `--help`
- ✅ Color-coded output
- ✅ Error handling
- ✅ Safe (confirm before destructive ops)

## 🚦 Daily Workflows

### Morning Setup

```bash
# Start everything
./start_all.sh

# Verify all healthy
./scripts/health_check.sh

# Check what happened overnight
./scripts/logs.sh all -n 200
```

### Making Database Changes

```bash
# 1. Backup first!
./scripts/db_backup.sh

# 2. Edit your models in server/server/app/models/
# (make your changes)

# 3. Generate migration
./scripts/db_migrate.sh create "add new field to users"

# 4. Review the migration file!
# Look in: server/server/alembic/versions/

# 5. Apply migration
./scripts/db_migrate.sh upgrade

# 6. Test it
./scripts/health_check.sh
```

### Need Fresh Test Data?

```bash
./scripts/db_reset.sh    # Wipes DB and rebuilds
# OR
./scripts/db_seed.sh     # Just add test data
```

Test accounts created:
- `alice@example.com` / `password123`
- `bob@example.com` / `password123`
- `charlie@example.com` / `password123`

### Debugging Issues

```bash
# Check what's wrong
./scripts/health_check.sh

# See recent errors
./scripts/logs.sh backend -n 100

# Open database console
./scripts/db_console.sh

# Check migration state
./scripts/db_migrate.sh status
```

## 💾 Backup Strategy

### Automatic Backups Created

The scripts automatically backup before:
- Database resets (`db_reset.sh`)
- Database restores (`db_restore.sh`)
- You manually run `db_backup.sh`

### Where Are Backups?

```bash
backups/db/
└── where2meet_20250122_143022.sql.gz  # Timestamped
```

Auto-cleanup keeps last 10 backups.

### Restore a Backup

```bash
./scripts/db_restore.sh backups/db/where2meet_20250122_143022.sql.gz
```

⚠️ **Always creates a safety backup first!**

## 📊 Monitoring

### Health Dashboard

```bash
./scripts/health_check.sh
```

Checks:
- ✅ Docker running
- ✅ PostgreSQL responsive
- ✅ Redis responsive
- ✅ Backend API healthy
- ✅ Frontend running
- ✅ Database connectivity
- ✅ Record counts
- ✅ Disk usage

### Log Monitoring

```bash
# Live tail all services
./scripts/logs.sh all -f

# Just backend
./scripts/logs.sh backend -f

# Last 100 lines
./scripts/logs.sh backend -n 100

# Database logs
./scripts/logs.sh postgres -f
```

## 🔧 Migration Commands

```bash
# Check where you are
./scripts/db_migrate.sh status

# Create new migration (after model changes)
./scripts/db_migrate.sh create "description"

# Apply pending migrations
./scripts/db_migrate.sh upgrade

# Undo last migration
./scripts/db_migrate.sh downgrade

# Undo last 3 migrations
./scripts/db_migrate.sh downgrade 3

# See history
./scripts/db_migrate.sh history
```

## 🎓 Best Practices

### ✅ Always Do

1. **Backup before changes**
   ```bash
   ./scripts/db_backup.sh
   ```

2. **Review migrations before applying**
   ```bash
   # Look at the file first!
   cat server/server/alembic/versions/latest_migration.py
   ```

3. **Check health after changes**
   ```bash
   ./scripts/health_check.sh
   ```

4. **Use test data in development**
   ```bash
   ./scripts/db_seed.sh
   ```

### ❌ Never Do

1. **Don't skip backups** before risky operations
2. **Don't edit applied migrations** - create new ones instead
3. **Don't manually modify database** - use migrations
4. **Don't commit real data** - use seed script
5. **Don't ignore errors** in health check

## 🆘 Common Issues

### "Port 5001 already in use"

```bash
# Kill and restart
./stop_all.sh
./start_all.sh
```

### "PostgreSQL not responding"

```bash
# Restart containers
cd server/server
docker compose restart
```

### "Migration conflict"

```bash
# Check status
./scripts/db_migrate.sh status

# If broken, reset
./scripts/db_reset.sh
```

### "Lost all data!"

```bash
# Restore latest backup
./scripts/db_restore.sh backups/db/latest_backup.sql.gz
```

## 📈 Performance Tips

### Database Query Optimization

```sql
-- Open console
./scripts/db_console.sh

-- Check slow queries
SELECT * FROM pg_stat_statements
ORDER BY total_time DESC LIMIT 10;

-- Check table sizes
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Index Analysis

```sql
-- Missing indexes
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname = 'public'
AND n_distinct > 100
ORDER BY abs(correlation) DESC;
```

## 🔐 Security Checklist

- [ ] Changed `SECRET_KEY` in `.env`
- [ ] Using strong database password
- [ ] `.env` file is in `.gitignore`
- [ ] Regular backups scheduled
- [ ] SSL enabled for production database
- [ ] Google Maps API key has restrictions

## 📚 Next Steps

1. **Set up automated backups**
   ```bash
   # Add to crontab
   0 2 * * * /path/to/scripts/db_backup.sh
   ```

2. **Monitor health automatically**
   ```bash
   # Add to crontab
   */15 * * * * /path/to/scripts/health_check.sh || echo "Alert!"
   ```

3. **Read full documentation**
   ```bash
   cat scripts/README.md
   ```

4. **Test disaster recovery**
   ```bash
   ./scripts/db_backup.sh
   ./scripts/db_reset.sh
   ./scripts/db_restore.sh backups/db/latest.sql.gz
   ```

## 🎉 You Now Have

- ✅ Professional backup system
- ✅ Automated health monitoring
- ✅ Easy migration management
- ✅ Development data seeding
- ✅ Centralized log viewing
- ✅ Database console access
- ✅ One-command database reset

---

**Need help?** Check `scripts/README.md` for detailed documentation!
