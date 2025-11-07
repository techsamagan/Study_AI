#!/bin/bash
echo "🚀 Starting AI Learning Assistant Backend..."
echo ""

# Check if Docker is running
if ! docker ps > /dev/null 2>&1; then
    echo "❌ Docker is not running!"
    echo "Please start Docker Desktop and try again."
    exit 1
fi

# Start Docker containers
echo "📦 Starting PostgreSQL and Redis containers..."
docker-compose up -d

# Wait for containers to be ready
echo "⏳ Waiting for containers to be ready..."
sleep 5

# Check if containers are running
if docker-compose ps | grep -q "Up"; then
    echo "✅ Containers are running!"
else
    echo "❌ Containers failed to start"
    exit 1
fi

# Activate virtual environment
source venv/bin/activate

# Run migrations
echo "🗄️  Running database migrations..."
python manage.py migrate

# Start server
echo "🌐 Starting Django server..."
echo "Server will be available at: http://localhost:8000"
echo "API endpoints: http://localhost:8000/api/"
echo ""
python manage.py runserver
