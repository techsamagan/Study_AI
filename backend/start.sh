#!/bin/bash
# Starts PostgreSQL in Docker, applies migrations and runs the dev server.
set -e
cd "$(dirname "$0")"

echo "🚀 Starting AI Learning Assistant Backend..."

if [ ! -f .env ]; then
    echo "❌ backend/.env not found. Create it with: cp .env.example .env"
    exit 1
fi

if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

echo "📦 Starting PostgreSQL..."
docker compose up -d --wait

if [ ! -d venv ]; then
    echo "🐍 Creating virtual environment..."
    python3.11 -m venv venv
    ./venv/bin/pip install --quiet --upgrade pip
    ./venv/bin/pip install --quiet -r requirements.txt
fi
source venv/bin/activate

echo "🗄️  Running database migrations..."
python manage.py migrate

echo "🌐 Starting Django server at http://localhost:8000 (API: http://localhost:8000/api/)"
python manage.py runserver
