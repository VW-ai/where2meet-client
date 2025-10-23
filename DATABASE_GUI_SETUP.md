# 🎨 Visual Database Management Setup

Manage your PostgreSQL database visually with GUI tools!

## 🚀 Quickest Option: pgAdmin in Docker

**No installation needed!** Just run:

```bash
./scripts/db_gui.sh pgadmin-start
```

Then open: **http://localhost:5050**

Login:
- Email: `admin@where2meet.local`
- Password: `admin`

**First time setup in pgAdmin:**
1. Click "Add New Server"
2. **General tab:**
   - Name: `Where2Meet`
3. **Connection tab:**
   - Host: `localhost`
   - Port: `5432`
   - Database: `where2meet`
   - Username: `where2meet`
   - Password: `where2meet`
4. Click "Save"

Done! You can now browse tables, run queries, and manage your database visually.

---

## 🎯 All GUI Options

### Option 1: pgAdmin (Docker) ⭐ Recommended for Quick Start

**Pros:**
- ✅ No installation
- ✅ Official PostgreSQL tool
- ✅ Full-featured
- ✅ Free

**Cons:**
- ❌ Web-based (not native)
- ❌ Heavier than alternatives

```bash
# Start
./scripts/db_gui.sh pgadmin-start

# Stop
./scripts/db_gui.sh pgadmin-stop
```

Access: http://localhost:5050

---

### Option 2: TablePlus ⭐ Recommended for Mac Users

**Pros:**
- ✅ Beautiful native Mac app
- ✅ Fast and lightweight
- ✅ Great UX
- ✅ Free tier available
- ✅ Supports multiple databases

**Cons:**
- ❌ Premium features require license ($89)

**Install:**
```bash
brew install --cask tableplus
```

Or download: https://tableplus.com/

**Setup:**
1. Open TablePlus
2. Click "Create new connection"
3. Select "PostgreSQL"
4. Enter connection details:
   ```
   Host: localhost
   Port: 5432
   User: where2meet
   Password: where2meet
   Database: where2meet
   ```
5. Click "Connect"

---

### Option 3: Postico (Mac Only)

**Pros:**
- ✅ Simple, elegant interface
- ✅ Native Mac app
- ✅ Good for beginners

**Cons:**
- ❌ Mac only
- ❌ $50 license (after trial)

**Install:**
```bash
brew install --cask postico
```

Or download: https://eggerapps.at/postico/

---

### Option 4: DBeaver (Free & Cross-platform)

**Pros:**
- ✅ Completely free
- ✅ Very powerful
- ✅ Works on Mac/Windows/Linux
- ✅ Supports many databases

**Cons:**
- ❌ Heavier/slower
- ❌ Java-based UI

**Install:**
```bash
brew install --cask dbeaver-community
```

Or download: https://dbeaver.io/

---

### Option 5: VS Code Extensions

**Best for:** Quick queries without leaving your editor

**Install Extensions:**
1. **PostgreSQL** by Chris Kolkman
   - Good for quick connections

2. **Database Client** by cweijan
   - More full-featured
   - Tree view of databases

**Setup in VS Code:**
1. Install extension
2. Click PostgreSQL icon in sidebar
3. Add new connection with details above

---

### Option 6: DataGrip (Paid, Professional)

**Pros:**
- ✅ Most powerful features
- ✅ Great for complex queries
- ✅ Advanced debugging

**Cons:**
- ❌ $89/year subscription
- ❌ Heavier application

Download: https://www.jetbrains.com/datagrip/

---

## 🔑 Connection Details (For Any Tool)

Get connection info anytime:
```bash
./scripts/db_gui.sh info
```

**Standard Connection:**
```
Host:     localhost
Port:     5432
Database: where2meet
Username: where2meet
Password: where2meet
```

**Connection String:**
```
postgresql://where2meet:where2meet@localhost:5432/where2meet
```

**With Driver (for Python):**
```
postgresql+psycopg://where2meet:where2meet@localhost:5432/where2meet
```

---

## 📊 What You Can Do with GUI Tools

### Browse Data
- View all tables
- See table schemas
- Browse records with filters
- Sort and search data

### Query Data
- Write SQL queries
- Save favorite queries
- Export results to CSV/JSON
- View query execution plans

### Modify Database
- Edit records directly
- Add/remove columns
- Create indexes
- View relationships

### Monitor Performance
- Check active queries
- View slow queries
- Analyze table sizes
- Monitor connections

---

## 🎓 Common Tasks

### View All Tables

In SQL console:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';
```

### Check Table Structure

```sql
\d feed_events
```

Or in pgAdmin: Right-click table → Properties

### View Sample Data

```sql
SELECT * FROM feed_events LIMIT 10;
```

### Count Records

```sql
SELECT
    'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'feed_events', COUNT(*) FROM feed_events
UNION ALL
SELECT 'feed_participants', COUNT(*) FROM feed_participants;
```

### Find Large Tables

```sql
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## 🔍 Useful Queries for Where2Meet

### Check All Events

```sql
SELECT
    id,
    title,
    category,
    status,
    participant_count,
    participant_limit,
    created_at
FROM feed_events
ORDER BY created_at DESC;
```

### Check Users

```sql
SELECT
    id,
    email,
    name,
    created_at,
    last_login
FROM users
ORDER BY created_at DESC;
```

### Check Event Participants

```sql
SELECT
    e.title as event,
    u.name as participant,
    u.email,
    fp.joined_at
FROM feed_participants fp
JOIN feed_events e ON fp.event_id = e.id
JOIN users u ON fp.user_id = u.id
ORDER BY fp.joined_at DESC;
```

### Database Statistics

```sql
SELECT
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM feed_events) as total_events,
    (SELECT COUNT(*) FROM feed_events WHERE status = 'active') as active_events,
    (SELECT COUNT(*) FROM feed_participants) as total_participants;
```

---

## 🛠️ Tips & Tricks

### TablePlus Tips

- **⌘ + K**: Quick filter
- **⌘ + T**: New query tab
- **⌘ + R**: Run query
- **⌘ + E**: Export data
- Right-click table → "Open in new tab" for focused work

### pgAdmin Tips

- Use **Query Tool** (Tools → Query Tool) for SQL
- **Save queries** for reuse
- Use **Explain** button to see query plans
- **Dashboard** shows live statistics

### VS Code Tips

- Save connection as "favorite"
- Use snippets for common queries
- Split editor to see data + query

---

## 🚨 Safety Tips

### ⚠️ Before Editing Data Directly

1. **Always backup first:**
   ```bash
   ./scripts/db_backup.sh
   ```

2. **Test in transaction:**
   ```sql
   BEGIN;
   -- Your changes here
   -- Check results
   ROLLBACK;  -- or COMMIT if good
   ```

3. **Use WHERE carefully:**
   ```sql
   -- BAD: Updates everything!
   UPDATE users SET name = 'Test';

   -- GOOD: Updates specific user
   UPDATE users SET name = 'Test' WHERE id = '123';
   ```

---

## 📚 Next Steps

1. **Start pgAdmin:**
   ```bash
   ./scripts/db_gui.sh pgadmin-start
   ```

2. **Or install TablePlus:**
   ```bash
   brew install --cask tableplus
   ```

3. **Connect using info from:**
   ```bash
   ./scripts/db_gui.sh info
   ```

4. **Explore your database visually!**

---

## 🔗 Quick Links

- [pgAdmin Documentation](https://www.pgadmin.org/docs/)
- [TablePlus Documentation](https://tableplus.com/docs)
- [PostgreSQL SQL Tutorial](https://www.postgresql.org/docs/current/tutorial-sql.html)
- [Our Database Schema](server/server/DATABASE_SCHEMA.md)

---

**Enjoy your visual database management! 🎨**
