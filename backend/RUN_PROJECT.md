# How to Run and Test the Project

## Prerequisites

1. **Start Docker Desktop** (Required for PostgreSQL and Redis)
   - Open Docker Desktop application
   - Wait until it's fully started (whale icon in menu bar)

2. **Create `.env` file** (Already done ✓)

3. **Install dependencies** (Already done ✓)

## Step-by-Step Setup

### Step 1: Start Docker Containers

```bash
cd backend
docker-compose up -d
```

**Verify containers are running:**
```bash
docker-compose ps
```

You should see:
- `ai_learning_postgres` - Running
- `ai_learning_redis` - Running

### Step 2: Run Database Migrations

```bash
cd backend
source venv/bin/activate
python manage.py migrate
```

### Step 3: Create Superuser (Optional)

```bash
python manage.py createsuperuser
```

### Step 4: Start Django Server

```bash
python manage.py runserver
```

The server will start on: **http://localhost:8000**

### Step 5: Test the API

**Option A: Using the test script**
```bash
# In a new terminal
cd backend
source venv/bin/activate
pip install requests  # If not installed
python test_api.py
```

**Option B: Using curl**
```bash
# Test registration
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "first_name": "Test",
    "last_name": "User",
    "password": "testpass123",
    "password_confirm": "testpass123"
  }'

# Test login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123"
  }'
```

**Option C: Using Postman or Browser**
- Open: http://localhost:8000/api/auth/register/
- Use POST method with JSON body

## Troubleshooting

### Docker Not Running
**Error:** `Cannot connect to the Docker daemon`

**Solution:**
1. Open Docker Desktop
2. Wait for it to fully start
3. Try again: `docker-compose up -d`

### Database Connection Error
**Error:** `password authentication failed`

**Solution:**
1. Make sure Docker containers are running: `docker-compose ps`
2. Check `.env` file has correct database credentials
3. Restart containers: `docker-compose restart`

### Port Already in Use
**Error:** `Port 8000 is already in use`

**Solution:**
```bash
# Use a different port
python manage.py runserver 8001
```

## Quick Test Checklist

- [ ] Docker Desktop is running
- [ ] Containers are up: `docker-compose ps`
- [ ] `.env` file exists with API key
- [ ] Dependencies installed: `pip list | grep Django`
- [ ] Migrations run: `python manage.py migrate`
- [ ] Server starts: `python manage.py runserver`
- [ ] API responds: http://localhost:8000/api/

## Next Steps

1. **Start Frontend:**
   ```bash
   cd front_end
   npm install
   npm run dev
   ```

2. **Open in Browser:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000/api/
   - Admin Panel: http://localhost:8000/admin/

3. **Test Full Flow:**
   - Register a new account
   - Login
   - Upload a document
   - Generate summary
   - Create flashcards

