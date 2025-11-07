# AI Learning Assistant - Backend

Django REST API backend for the AI Learning Assistant application. This backend provides authentication, document management, AI-powered summarization, and flashcard generation using OpenAI.

## Features

- **User Authentication**: Registration and login with JWT tokens
- **Document Management**: Upload and manage documents (PDF, DOCX, TXT)
- **AI Summarization**: Generate summaries and key points from documents using OpenAI
- **Flashcard Generation**: Automatically generate flashcards from documents or summaries
- **Flashcard Management**: Create, read, update, and delete flashcards
- **Study Tracking**: Track flashcard reviews and mastery levels

## Setup Instructions

### 1. Install Dependencies

Create a virtual environment and install required packages:

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Install PostgreSQL and Redis

**Option A: Using Docker Compose (Recommended)**

The easiest way to set up PostgreSQL and Redis is using Docker Compose:

```bash
# Start PostgreSQL and Redis containers
docker-compose up -d

# Check if containers are running
docker-compose ps

# Stop containers
docker-compose down
```

This will start PostgreSQL on port 5432 and Redis on port 6379.

**Option B: Manual Installation**

**PostgreSQL:**
- macOS: `brew install postgresql@15` or download from [postgresql.org](https://www.postgresql.org/download/)
- Linux: `sudo apt-get install postgresql postgresql-contrib` (Ubuntu/Debian)
- Windows: Download from [postgresql.org](https://www.postgresql.org/download/windows/)

**Redis:**
- macOS: `brew install redis`
- Linux: `sudo apt-get install redis-server` (Ubuntu/Debian)
- Windows: Download from [redis.io](https://redis.io/download) or use WSL

Start PostgreSQL and Redis services:
```bash
# PostgreSQL
brew services start postgresql@15  # macOS
sudo systemctl start postgresql    # Linux

# Redis
brew services start redis          # macOS
sudo systemctl start redis-server  # Linux
redis-server                       # Or run directly
```

### 3. Create PostgreSQL Database

Create a database for the application:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE ai_learning_assistant;

# Create user (optional)
CREATE USER ai_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE ai_learning_assistant TO ai_user;

# Exit psql
\q
```

### 4. Environment Variables

**IMPORTANT**: All sensitive data (API keys, passwords, secrets) must be stored in a `.env` file in the `backend` directory. This file is in `.gitignore` and will NOT be committed to Git.

Create a `.env` file in the `backend` directory:

```bash
# Copy the example file
cp .env.example .env

# Edit .env and add your actual values
```

The `.env` file should contain:

```bash
# Django Secret Key (REQUIRED)
# Generate one: python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
SECRET_KEY=your-secret-key-here

# Database (PostgreSQL)
DB_NAME=ai_learning_assistant
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=  # Optional, leave empty if no password

# OpenAI API Key (REQUIRED for AI features)
OPENAI_API_KEY=your-openai-api-key-here

# Debug Mode (set to False in production)
DEBUG=True

# Allowed Hosts (comma-separated for production)
ALLOWED_HOSTS=localhost,127.0.0.1
```

**Security Notes:**
- The `.env` file is automatically loaded by `python-decouple`
- Never commit `.env` to Git (it's in `.gitignore`)
- Use different values for development and production
- See `SECURITY.md` for detailed security guidelines

### 5. Database Setup

Run migrations to create the database tables:

```bash
python manage.py makemigrations
python manage.py migrate
```

### 6. Create Superuser (Optional)

Create an admin user to access Django admin panel:

```bash
python manage.py createsuperuser
```

### 7. Run the Server

Make sure PostgreSQL and Redis are running, then start the Django development server:

```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000/api/`

## API Endpoints

### Authentication

- `POST /api/auth/register/` - Register a new user
  - Body: `{ "email": "user@example.com", "username": "username", "first_name": "John", "last_name": "Doe", "password": "password123", "password_confirm": "password123" }`
  
- `POST /api/auth/login/` - Login and get JWT tokens
  - Body: `{ "email": "user@example.com", "password": "password123" }`
  - Returns: `{ "access": "token", "refresh": "token", "user": {...} }`

- `POST /api/auth/refresh/` - Refresh access token
  - Body: `{ "refresh": "refresh_token" }`

- `GET /api/auth/profile/` - Get current user profile (requires authentication)

### Documents

- `GET /api/documents/` - List all user's documents
- `POST /api/documents/` - Upload a new document
  - Form data: `file` (file), `title` (string)
- `GET /api/documents/{id}/` - Get document details
- `DELETE /api/documents/{id}/` - Delete a document
- `POST /api/documents/{id}/generate_summary/` - Generate summary for a document
- `POST /api/documents/{id}/generate_flashcards/` - Generate flashcards from a document
  - Body: `{ "num_cards": 10 }` (optional)

### Summaries

- `GET /api/summaries/` - List all user's summaries
- `GET /api/summaries/{id}/` - Get summary details
- `DELETE /api/summaries/{id}/` - Delete a summary
- `POST /api/summaries/{id}/generate_flashcards/` - Generate flashcards from a summary
  - Body: `{ "num_cards": 10 }` (optional)

### Flashcards

- `GET /api/flashcards/` - List all user's flashcards
  - Query params: `category` (filter by category), `document` (filter by document ID)
- `POST /api/flashcards/` - Create a new flashcard
  - Body: `{ "question": "...", "answer": "...", "category": "...", "document": id }`
- `GET /api/flashcards/{id}/` - Get flashcard details
- `PUT /api/flashcards/{id}/` - Update a flashcard
- `DELETE /api/flashcards/{id}/` - Delete a flashcard
- `POST /api/flashcards/{id}/review/` - Mark flashcard as reviewed
  - Body: `{ "mastery_level": 85 }` (optional, 0-100)

### Dashboard

- `GET /api/dashboard/stats/` - Get dashboard statistics
  - Returns: `{ "documents_count": 10, "flashcards_count": 50, "summaries_count": 5, "study_time": "0h", "mastery": 75 }`

## Authentication

All endpoints except registration and login require JWT authentication. Include the access token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## File Upload

Supported file types:
- PDF (`.pdf`)
- Word documents (`.docx`, `.doc`)
- Text files (`.txt`)

Maximum file size: 10MB

## OpenAI Integration

The backend uses OpenAI's GPT-4o-mini model for:
- Generating document summaries
- Extracting key points
- Creating flashcards from content

Make sure to set your `OPENAI_API_KEY` environment variable.

## Development

### Running Tests

```bash
python manage.py test
```

### Accessing Admin Panel

Visit `http://localhost:8000/admin/` and login with your superuser credentials.

## Project Structure

```
backend/
├── config/          # Django project settings
├── api/             # Main API application
│   ├── models.py    # Database models
│   ├── views.py     # API views
│   ├── serializers.py  # Data serializers
│   ├── services.py  # OpenAI service
│   └── urls.py      # URL routing
├── manage.py        # Django management script
├── requirements.txt # Python dependencies
└── README.md        # This file
```

## Database and Cache

- **PostgreSQL**: Used as the primary database for storing all application data
- **Redis**: Used for caching and session storage
  - Cache timeout: 5 minutes (default)
  - Session storage: All sessions stored in Redis
  - JWT token blacklisting: Blacklisted tokens stored in Redis

## Notes

- The backend uses PostgreSQL for the database and Redis for caching/sessions
- CORS is configured to allow requests from `localhost:5173` and `localhost:3000`. Adjust in `settings.py` if needed.
- JWT tokens expire after 1 day (access) and 7 days (refresh). Adjust in `settings.py` if needed.
- Make sure PostgreSQL and Redis are running before starting the Django server

