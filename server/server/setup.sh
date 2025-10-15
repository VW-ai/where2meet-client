#!/bin/bash
# Where2Meet Server Setup Script

set -e

echo "🚀 Where2Meet Server Setup"
echo "=========================="

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.9 or higher."
    exit 1
fi

echo "✅ Python 3 found: $(python3 --version)"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please edit .env and set your GOOGLE_MAPS_API_KEY"
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "⚠️  Docker is not running. Please start Docker to use PostgreSQL and Redis."
    echo "    You can start services with: docker-compose up -d"
else
    echo "🐳 Docker is running"

    # Start database services
    echo "🚀 Starting PostgreSQL and Redis..."
    docker-compose up -d

    # Wait for PostgreSQL to be ready
    echo "⏳ Waiting for PostgreSQL to be ready..."
    sleep 5

    # Run migrations
    echo "🗄️  Running database migrations..."
    alembic revision --autogenerate -m "Initial schema"
    alembic upgrade head

    echo ""
    echo "✅ Setup complete!"
    echo ""
    echo "📚 Next steps:"
    echo "   1. Edit .env and set your GOOGLE_MAPS_API_KEY"
    echo "   2. Start the API server:"
    echo "      uvicorn app.main:app --reload --port 8000"
    echo "   3. Open API docs: http://localhost:8000/docs"
    echo ""
    echo "🔧 Useful commands:"
    echo "   - Stop services: docker-compose down"
    echo "   - View logs: docker-compose logs -f"
    echo "   - Reset database: docker-compose down -v && docker-compose up -d"
fi
