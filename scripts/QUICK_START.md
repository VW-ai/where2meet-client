# 🚀 Quick Start - Management Scripts

## Your New Management Tools

```
┌─────────────────────────────────────────────────────┐
│  🎯 Where2Meet Management Dashboard                │
└─────────────────────────────────────────────────────┘

DATABASE MANAGEMENT
├─ 💾 db_backup.sh          Create timestamped backup
├─ 🔄 db_restore.sh         Restore from backup file
├─ ⚡ db_reset.sh           Fresh start (destructive!)
├─ 🌱 db_seed.sh            Add test data
├─ 🔧 db_migrate.sh         Migration helper
└─ 💻 db_console.sh         Open PostgreSQL shell

MONITORING
├─ 🏥 health_check.sh       Check all systems
└─ 📄 logs.sh               View/follow logs

DOCUMENTATION
├─ 📚 README.md             Full documentation
└─ 📖 BACKEND_MANAGEMENT.md Quick reference
```

## ⚡ Most Common Commands

```bash
# Check if everything is healthy
./scripts/health_check.sh

# Watch backend logs live
./scripts/logs.sh backend -f

# Create a backup before making changes
./scripts/db_backup.sh

# Add test data (3 users + sample events)
./scripts/db_seed.sh

# Check migration status
./scripts/db_migrate.sh status
```

## 🎓 First Time Setup

```bash
# 1. Make sure everything is running
./start_all.sh

# 2. Check system health
./scripts/health_check.sh

# 3. Seed database with test data
./scripts/db_seed.sh

# 4. Test login with:
#    Email: alice@example.com
#    Password: password123
```

## 🛠️ Common Workflows

### Make Database Changes
```bash
./scripts/db_backup.sh                           # 1. Backup
# Edit models in server/server/app/models/       # 2. Change
./scripts/db_migrate.sh create "your message"    # 3. Migrate
./scripts/db_migrate.sh upgrade                  # 4. Apply
./scripts/health_check.sh                        # 5. Verify
```

### Debug Issues
```bash
./scripts/health_check.sh      # What's wrong?
./scripts/logs.sh backend      # Check logs
./scripts/db_console.sh        # Inspect database
```

### Start Fresh
```bash
./scripts/db_reset.sh          # Nuclear option!
# Backs up → Resets → Migrates → Seeds
```

## 🎯 Test It Now!

```bash
# Run health check
./scripts/health_check.sh

# Should see:
# ✅ All systems operational
```

## 📚 Learn More

- **Full docs**: `cat scripts/README.md`
- **Guide**: `cat BACKEND_MANAGEMENT.md`
- **Help**: `./scripts/db_migrate.sh` (no args shows help)

---

**Pro Tip**: Add these to your shell aliases!

```bash
# Add to ~/.bashrc or ~/.zshrc
alias w2m-health='./scripts/health_check.sh'
alias w2m-logs='./scripts/logs.sh backend -f'
alias w2m-backup='./scripts/db_backup.sh'
alias w2m-seed='./scripts/db_seed.sh'
```
