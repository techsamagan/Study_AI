# Manual PostgreSQL and Redis Setup

If you prefer not to use Docker, follow these steps:

## PostgreSQL Setup

### macOS
```bash
# Install PostgreSQL
brew install postgresql@15

# Start PostgreSQL
brew services start postgresql@15

# Create database
psql -U postgres
CREATE DATABASE ai_learning_assistant;
\q
```

### Linux (Ubuntu/Debian)
```bash
# Install PostgreSQL
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database
sudo -u postgres psql
CREATE DATABASE ai_learning_assistant;
\q
```

### Windows
1. Download PostgreSQL from https://www.postgresql.org/download/windows/
2. Install with default settings
3. Use pgAdmin or psql to create database:
   ```sql
   CREATE DATABASE ai_learning_assistant;
   ```

## Redis Setup

### macOS
```bash
# Install Redis
brew install redis

# Start Redis
brew services start redis
```

### Linux (Ubuntu/Debian)
```bash
# Install Redis
sudo apt-get install redis-server

# Start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

### Windows
1. Download Redis from https://redis.io/download
2. Or use WSL (Windows Subsystem for Linux)
3. Or use a Redis Docker container

## Update .env File

After manual installation, your `.env` file should use your system's PostgreSQL credentials:

```bash
# Database - Use your system's PostgreSQL credentials
DB_NAME=ai_learning_assistant
DB_USER=postgres
DB_PASSWORD=your_postgres_password  # Change this!
DB_HOST=localhost
DB_PORT=5432

# Redis - Defaults usually work
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=
```

