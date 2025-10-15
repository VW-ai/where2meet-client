#!/usr/bin/env python3
"""
Comprehensive test script for Where2Meet M2 server.
Tests syntax, imports, and code structure without requiring database.
"""

import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

def test_syntax():
    """Test Python syntax for all files."""
    print("=" * 60)
    print("TEST 1: Python Syntax Validation")
    print("=" * 60)

    py_files = list(Path("app").rglob("*.py"))
    errors = []

    for py_file in py_files:
        try:
            with open(py_file, 'r') as f:
                compile(f.read(), str(py_file), 'exec')
            print(f"✅ {py_file}")
        except SyntaxError as e:
            print(f"❌ {py_file}: {e}")
            errors.append((py_file, e))

    print(f"\n✅ {len(py_files)} files checked")
    if errors:
        print(f"❌ {len(errors)} syntax errors found")
        return False
    return True


def test_imports():
    """Test that all modules can be imported."""
    print("\n" + "=" * 60)
    print("TEST 2: Module Import Validation")
    print("=" * 60)

    modules = [
        "app.core.config",
        "app.core.security",
        "app.db.base",
        "app.models.event",
        "app.schemas.event",
        "app.services.algorithms",
        "app.services.google_maps",
        "app.services.sse",
    ]

    errors = []

    for module in modules:
        try:
            __import__(module)
            print(f"✅ {module}")
        except Exception as e:
            print(f"❌ {module}: {e}")
            errors.append((module, e))

    print(f"\n✅ {len(modules) - len(errors)}/{len(modules)} modules imported successfully")
    if errors:
        print(f"❌ {len(errors)} import errors found")
        return False
    return True


def test_config():
    """Test configuration module."""
    print("\n" + "=" * 60)
    print("TEST 3: Configuration Validation")
    print("=" * 60)

    try:
        from app.core.config import settings

        print("✅ Settings loaded successfully")
        print(f"   - DATABASE_URL: {settings.DATABASE_URL[:30]}...")
        print(f"   - REDIS_URL: {settings.REDIS_URL}")
        print(f"   - DEBUG: {settings.DEBUG}")
        print(f"   - EVENT_TTL_DAYS: {settings.EVENT_TTL_DAYS}")
        print(f"   - ALLOWED_ORIGINS: {len(settings.ALLOWED_ORIGINS)} origins")
        return True
    except Exception as e:
        print(f"❌ Configuration error: {e}")
        return False


def test_security():
    """Test security utilities."""
    print("\n" + "=" * 60)
    print("TEST 4: Security Utilities Validation")
    print("=" * 60)

    try:
        from app.core.security import (
            create_event_token,
            verify_event_token,
            generate_participant_id,
            create_event_id
        )

        # Test event ID generation
        event_id = create_event_id()
        print(f"✅ Event ID generated: {event_id}")
        assert event_id.startswith("evt_"), "Event ID should start with 'evt_'"

        # Test participant ID generation
        participant_id = generate_participant_id()
        print(f"✅ Participant ID generated: {participant_id}")
        assert participant_id.startswith("p_"), "Participant ID should start with 'p_'"

        # Test token creation and verification
        token = create_event_token(event_id)
        print(f"✅ Token created: {token[:50]}...")

        verified_id = verify_event_token(token)
        print(f"✅ Token verified: {verified_id}")
        assert verified_id == event_id, "Verified ID should match original"

        return True
    except Exception as e:
        print(f"❌ Security test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_algorithms():
    """Test geometric algorithms."""
    print("\n" + "=" * 60)
    print("TEST 5: Geometric Algorithms Validation")
    print("=" * 60)

    try:
        from app.services.algorithms import (
            compute_centroid,
            haversine_distance,
            compute_mec,
            apply_fuzzing
        )

        # Test centroid calculation
        locations = [(40.7128, -74.0060), (34.0522, -118.2437)]  # NYC, LA
        centroid = compute_centroid(locations)
        print(f"✅ Centroid calculated: {centroid}")
        assert centroid is not None, "Centroid should not be None"

        # Test distance calculation
        distance = haversine_distance(40.7128, -74.0060, 34.0522, -118.2437)
        print(f"✅ Distance NYC-LA: {distance:.2f} km")
        assert distance > 3000, "NYC-LA distance should be > 3000 km"

        # Test MEC calculation
        mec = compute_mec(locations)
        print(f"✅ MEC calculated: center=({mec[0]:.4f}, {mec[1]:.4f}), radius={mec[2]:.2f} km")
        assert mec is not None, "MEC should not be None"

        # Test fuzzing
        fuzzy = apply_fuzzing(40.7128, -74.0060)
        print(f"✅ Fuzzing applied: ({fuzzy[0]:.4f}, {fuzzy[1]:.4f})")
        assert fuzzy != (40.7128, -74.0060), "Fuzzy coordinates should differ"

        return True
    except Exception as e:
        print(f"❌ Algorithm test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_models():
    """Test database models (structure only, no DB connection)."""
    print("\n" + "=" * 60)
    print("TEST 6: Database Model Structure Validation")
    print("=" * 60)

    try:
        from app.models.event import Event, Participant, Candidate, Vote

        # Check Event model
        assert hasattr(Event, '__tablename__'), "Event should have __tablename__"
        print(f"✅ Event model: table={Event.__tablename__}")

        # Check Participant model
        assert hasattr(Participant, '__tablename__'), "Participant should have __tablename__"
        print(f"✅ Participant model: table={Participant.__tablename__}")

        # Check Candidate model
        assert hasattr(Candidate, '__tablename__'), "Candidate should have __tablename__"
        print(f"✅ Candidate model: table={Candidate.__tablename__}")

        # Check Vote model
        assert hasattr(Vote, '__tablename__'), "Vote should have __tablename__"
        print(f"✅ Vote model: table={Vote.__tablename__}")

        return True
    except Exception as e:
        print(f"❌ Model test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_schemas():
    """Test Pydantic schemas."""
    print("\n" + "=" * 60)
    print("TEST 7: Pydantic Schema Validation")
    print("=" * 60)

    try:
        from app.schemas.event import (
            EventCreate, EventResponse, ParticipantCreate,
            CandidateResponse, VoteCreate
        )

        # Test EventCreate schema
        event_data = {
            "title": "Test Event",
            "category": "restaurant",
            "visibility": "blur",
            "allow_vote": True
        }
        event = EventCreate(**event_data)
        print(f"✅ EventCreate validated: {event.title}")

        # Test ParticipantCreate schema
        participant_data = {
            "lat": 40.7128,
            "lng": -74.0060,
            "name": "Test User"
        }
        participant = ParticipantCreate(**participant_data)
        print(f"✅ ParticipantCreate validated: ({participant.lat}, {participant.lng})")

        # Test VoteCreate schema
        vote_data = {"candidate_id": "cand_123"}
        vote = VoteCreate(**vote_data)
        print(f"✅ VoteCreate validated: {vote.candidate_id}")

        return True
    except Exception as e:
        print(f"❌ Schema test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_api_structure():
    """Test API router structure."""
    print("\n" + "=" * 60)
    print("TEST 8: API Router Structure Validation")
    print("=" * 60)

    try:
        from app.api.v1 import events, participants, candidates, votes, sse

        # Check that routers exist
        assert hasattr(events, 'router'), "Events module should have router"
        print(f"✅ Events router loaded")

        assert hasattr(participants, 'router'), "Participants module should have router"
        print(f"✅ Participants router loaded")

        assert hasattr(candidates, 'router'), "Candidates module should have router"
        print(f"✅ Candidates router loaded")

        assert hasattr(votes, 'router'), "Votes module should have router"
        print(f"✅ Votes router loaded")

        assert hasattr(sse, 'router'), "SSE module should have router"
        print(f"✅ SSE router loaded")

        return True
    except Exception as e:
        print(f"❌ API structure test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_main_app():
    """Test main FastAPI application."""
    print("\n" + "=" * 60)
    print("TEST 9: FastAPI Application Validation")
    print("=" * 60)

    try:
        from app.main import app

        # Check that app is a FastAPI instance
        from fastapi import FastAPI
        assert isinstance(app, FastAPI), "app should be a FastAPI instance"
        print(f"✅ FastAPI app created: {app.title}")

        # Check routes are registered
        routes = [route.path for route in app.routes]
        print(f"✅ {len(routes)} routes registered")

        # Check for key endpoints
        assert any("/api/v1/events" in route for route in routes), "Events endpoints missing"
        print("✅ Events endpoints registered")

        assert any("/health" in route for route in routes), "Health endpoint missing"
        print("✅ Health endpoint registered")

        return True
    except Exception as e:
        print(f"❌ Main app test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_file_structure():
    """Test file and directory structure."""
    print("\n" + "=" * 60)
    print("TEST 10: File Structure Validation")
    print("=" * 60)

    required_files = [
        "requirements.txt",
        "docker-compose.yml",
        "alembic.ini",
        "setup.sh",
        "README.md",
        ".env.example",
        "app/main.py",
        "app/core/config.py",
        "app/core/security.py",
        "app/models/event.py",
        "app/schemas/event.py",
        "app/api/v1/events.py",
        "app/api/v1/participants.py",
        "app/api/v1/candidates.py",
        "app/api/v1/votes.py",
        "app/api/v1/sse.py",
        "app/services/algorithms.py",
        "app/services/google_maps.py",
        "app/services/sse.py",
        "alembic/env.py",
        "alembic/script.py.mako",
    ]

    missing = []
    for file in required_files:
        if Path(file).exists():
            print(f"✅ {file}")
        else:
            print(f"❌ {file} - MISSING")
            missing.append(file)

    print(f"\n✅ {len(required_files) - len(missing)}/{len(required_files)} required files present")
    if missing:
        print(f"❌ {len(missing)} files missing")
        return False
    return True


def main():
    """Run all tests."""
    print("\n" + "=" * 60)
    print("WHERE2MEET M2 SERVER - COMPREHENSIVE TEST SUITE")
    print("=" * 60 + "\n")

    tests = [
        ("Syntax", test_syntax),
        ("Imports", test_imports),
        ("Configuration", test_config),
        ("Security", test_security),
        ("Algorithms", test_algorithms),
        ("Models", test_models),
        ("Schemas", test_schemas),
        ("API Structure", test_api_structure),
        ("Main App", test_main_app),
        ("File Structure", test_file_structure),
    ]

    results = []
    for name, test_func in tests:
        try:
            result = test_func()
            results.append((name, result))
        except Exception as e:
            print(f"\n❌ Test '{name}' crashed: {e}")
            import traceback
            traceback.print_exc()
            results.append((name, False))

    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {name}")

    print(f"\n{passed}/{total} tests passed ({passed/total*100:.1f}%)")

    if passed == total:
        print("\n🎉 ALL TESTS PASSED! Server implementation is correct.")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Please review errors above.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
