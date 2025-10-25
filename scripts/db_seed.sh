#!/bin/bash

# Database Seed Script
# Populates database with sample data for development

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SERVER_DIR="$SCRIPT_DIR/../server/server"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Seeding Database${NC}"
echo -e "${BLUE}========================================${NC}\n"

cd "$SERVER_DIR"
source venv/bin/activate

echo -e "${YELLOW}Running seed script...${NC}"

# Create Python seed script
python << 'EOF'
import sys
import os
from datetime import datetime, timedelta
from uuid import uuid4
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add app to path
sys.path.insert(0, os.getcwd())

from app.models.user import User
from app.models.event import Event as EventModel, Participant, Candidate
from app.models.feed import FeedEvent, FeedParticipant

# Database connection - use postgresql+psycopg for psycopg (not psycopg2)
DATABASE_URL = "postgresql+psycopg://where2meet:where2meet@localhost:5432/where2meet"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

try:
    print("🌱 Seeding users...")

    # Create test users with avatars
    users = [
        User(
            id=f"user_{uuid4().hex[:12]}",
            email="alice@example.com",
            hashed_password="hashed_password_placeholder",  # Placeholder
            name="Alice Johnson",
            avatar="https://ui-avatars.com/api/?name=Alice+Johnson&background=4F46E5&color=fff"
        ),
        User(
            id=f"user_{uuid4().hex[:12]}",
            email="bob@example.com",
            hashed_password="hashed_password_placeholder",  # Placeholder
            name="Bob Smith",
            avatar="https://ui-avatars.com/api/?name=Bob+Smith&background=DC2626&color=fff"
        ),
        User(
            id=f"user_{uuid4().hex[:12]}",
            email="charlie@example.com",
            hashed_password="hashed_password_placeholder",  # Placeholder
            name="Charlie Davis",
            avatar="https://ui-avatars.com/api/?name=Charlie+Davis&background=059669&color=fff"
        ),
    ]

    # Check if users already exist
    existing_users = db.query(User).filter(User.email.in_([u.email for u in users])).all()
    if existing_users:
        print(f"ℹ️  Users already exist, using existing users")
        users = db.query(User).filter(User.email.in_(['alice@example.com', 'bob@example.com', 'charlie@example.com'])).all()
    else:
        for user in users:
            db.add(user)
        db.commit()
        print(f"✓ Created {len(users)} users")
        # Refresh to get IDs
        for user in users:
            db.refresh(user)

    print("\n🌱 Seeding event feed events...")

    # Create sample event feed events
    now = datetime.utcnow()

    feed_events = [
        FeedEvent(
            id=f"feed_{uuid4().hex[:16]}",
            title="Weekend Brunch Meetup",
            description="Let's grab brunch this weekend! Looking for a cozy spot with good coffee.",
            meeting_time=now + timedelta(days=2, hours=10),
            location_area="Downtown SF",
            location_type="collaborative",
            category="food",
            participant_limit=8,
            visibility="public",
            allow_vote=True,
            status="active",
            host_id=users[0].id,
            host_name=users[0].name,
            background_image="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=600&fit=crop"
        ),
        FeedEvent(
            id=f"feed_{uuid4().hex[:16]}",
            title="Basketball Game - Pickup",
            description="Casual pickup basketball game. All skill levels welcome!",
            meeting_time=now + timedelta(days=1, hours=18),
            location_area="Mission District",
            location_type="collaborative",
            category="sports",
            participant_limit=10,
            visibility="public",
            allow_vote=True,
            status="active",
            host_id=users[1].id,
            host_name=users[1].name
        ),
        FeedEvent(
            id=f"feed_{uuid4().hex[:16]}",
            title="Coffee & Code",
            description="Work session at a nice cafe. Bring your laptop!",
            meeting_time=now + timedelta(days=3, hours=14),
            location_area="SOMA",
            location_type="collaborative",
            category="work",
            participant_limit=None,
            visibility="public",
            allow_vote=True,
            status="active",
            host_id=users[2].id,
            host_name=users[2].name,
            background_image="https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&h=600&fit=crop"
        ),
    ]

    for event in feed_events:
        db.add(event)

    db.commit()
    print(f"✓ Created {len(feed_events)} event feed events")

    # Refresh to get IDs
    for event in feed_events:
        db.refresh(event)

    print("\n🌱 Seeding event feed participants...")

    # Add participants to events
    # Using UI Avatars as placeholder avatars
    feed_participants = [
        FeedParticipant(
            id=f"part_{uuid4().hex[:16]}",
            event_id=feed_events[0].id,
            user_id=users[1].id,
            name=users[1].name,
            email=users[1].email,
            avatar=f"https://ui-avatars.com/api/?name={users[1].name.replace(' ', '+')}&background=random"
        ),
        FeedParticipant(
            id=f"part_{uuid4().hex[:16]}",
            event_id=feed_events[0].id,
            user_id=users[2].id,
            name=users[2].name,
            email=users[2].email,
            avatar=f"https://ui-avatars.com/api/?name={users[2].name.replace(' ', '+')}&background=random"
        ),
        FeedParticipant(
            id=f"part_{uuid4().hex[:16]}",
            event_id=feed_events[1].id,
            user_id=users[0].id,
            name=users[0].name,
            email=users[0].email,
            avatar=f"https://ui-avatars.com/api/?name={users[0].name.replace(' ', '+')}&background=random"
        ),
    ]

    for participant in feed_participants:
        db.add(participant)

    db.commit()
    print(f"✓ Created {len(feed_participants)} event feed participants")

    print("\n✅ Database seeded successfully!")
    print("\n📝 Test accounts:")
    print("   alice@example.com / password123")
    print("   bob@example.com / password123")
    print("   charlie@example.com / password123")

except Exception as e:
    print(f"\n❌ Error seeding database: {e}")
    db.rollback()
    sys.exit(1)
finally:
    db.close()
EOF

echo -e "\n${GREEN}✓ Seed complete${NC}"
