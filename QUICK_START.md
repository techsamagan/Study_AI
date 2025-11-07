# Quick Start Guide - What Data You Need to Provide

## Required Data to Run the Program

To run the AI Learning Assistant, you need to provide the following data:

---

## 1. **OpenAI API Key** (REQUIRED for AI features)

**What it is:** Your OpenAI API key for generating summaries and flashcards

**Where to get it:**
1. Go to https://platform.openai.com/api-keys
2. Sign up or log in
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)

**How to provide it:**
- Add to `.env` file: `OPENAI_API_KEY=sk-your-key-here`

**Cost:** OpenAI charges per API call (very affordable for testing)

---

## 2. **Django Secret Key** (REQUIRED)

**What it is:** A cryptographic key for Django security

**How to generate:**
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

**How to provide it:**
- Add to `.env` file: `SECRET_KEY=your-generated-key-here`

---

## 3. **PostgreSQL Database Credentials** (REQUIRED)

**What it is:** Database connection information

**If using Docker Compose (Easiest):**
- No setup needed! Docker Compose creates it automatically
- Default values work:
  ```
  DB_NAME=ai_learning_assistant
  DB_USER=postgres
  DB_PASSWORD=postgres
  DB_HOST=localhost
  DB_PORT=5432
  ```

**If using manual PostgreSQL:**
- Create database first:
  ```bash
  psql -U postgres
  CREATE DATABASE ai_learning_assistant;
  ```
- Then provide in `.env`:
  ```
  DB_NAME=ai_learning_assistant
  DB_USER=postgres
  DB_PASSWORD=your_postgres_password
  DB_HOST=localhost
  DB_PORT=5432
  ```

---

## 4. **Redis Credentials** (REQUIRED)

**What it is:** Redis connection for caching

**If using Docker Compose:**
- No setup needed! Default values work:
  ```
  REDIS_HOST=localhost
  REDIS_PORT=6379
  REDIS_DB=0
  REDIS_PASSWORD=
  ```

**If using manual Redis:**
- Just use defaults (no password needed for local):
  ```
  REDIS_HOST=localhost
  REDIS_PORT=6379
  REDIS_DB=0
  REDIS_PASSWORD=
  ```

---

## 5. **Optional Settings**

**DEBUG Mode:**
```
DEBUG=True  # For development
DEBUG=False # For production
```

**ALLOWED_HOSTS:**
```
ALLOWED_HOSTS=localhost,127.0.0.1  # For local development
```

---

## Complete Setup Steps

### Step 1: Start PostgreSQL and Redis

**Option A: Using Docker (Recommended)**
```bash
cd backend
docker-compose up -d
```

**Option B: Manual Installation**
- Install PostgreSQL and Redis on your system
- Start both services

### Step 2: Create `.env` File

```bash
cd backend
# Create .env file
touch .env
```

### Step 3: Add Required Data to `.env`

Create a `.env` file in the `backend/` directory with this content:

```bash
# 1. Generate Django Secret Key (run this command first)
# python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
SECRET_KEY=your-generated-secret-key-here

# 2. Database (use defaults if using Docker Compose)
DB_NAME=ai_learning_assistant
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432

# 3. Redis (use defaults if using Docker Compose)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=

# 4. OpenAI API Key (REQUIRED - get from https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-your-openai-api-key-here

# 5. Optional Settings
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
```

### Step 4: Install Dependencies

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Step 5: Setup Database

```bash
python manage.py makemigrations
python manage.py migrate
```

### Step 6: Run the Server

```bash
python manage.py runserver
```

---

## Minimum Required Data (Quick Summary)

**You MUST provide:**
1. ✅ **OpenAI API Key** - Get from https://platform.openai.com/api-keys
2. ✅ **Django Secret Key** - Generate using Python command above

**You can use defaults if using Docker Compose:**
- Database credentials (postgres/postgres)
- Redis credentials (localhost:6379)

---

## Example `.env` File (Copy & Paste Ready)

```bash
# Generate secret key first:
# python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
SECRET_KEY=django-insecure-CHANGE-THIS-TO-YOUR-GENERATED-KEY

# Database (defaults for Docker Compose)
DB_NAME=ai_learning_assistant
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432

# Redis (defaults for Docker Compose)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=

# OpenAI API Key (REQUIRED - replace with your key)
OPENAI_API_KEY=sk-replace-with-your-actual-key

# Development settings
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
```

---

## What You DON'T Need to Provide

- ❌ User accounts (created through registration)
- ❌ Documents (uploaded through the app)
- ❌ Any other data (all created through the app)

---

## Troubleshooting

**"OPENAI_API_KEY not set" error:**
- Make sure you added `OPENAI_API_KEY=sk-...` to `.env`
- Restart the Django server after adding

**Database connection error:**
- Make sure PostgreSQL is running: `docker-compose ps` or check service status
- Verify database credentials in `.env` match your PostgreSQL setup

**Redis connection error:**
- Make sure Redis is running: `docker-compose ps` or check service status
- Verify Redis credentials in `.env`

---

## Next Steps After Setup

1. Start backend: `python manage.py runserver`
2. Start frontend: `cd front_end && npm run dev`
3. Open browser: http://localhost:5173
4. Register a new account
5. Upload a document and test AI features!

