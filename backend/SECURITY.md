# Security Guide - Sensitive Data Storage

## Where Sensitive Data is Stored

All sensitive data (API keys, passwords, secrets) are stored in **environment variables** and loaded from a **`.env` file** in the `backend` directory.

## Sensitive Data Stored

The following sensitive information is stored as environment variables:

### 1. Django Secret Key
- **Variable**: `SECRET_KEY`
- **Purpose**: Used for cryptographic signing, session security, and CSRF protection
- **Location**: `.env` file in `backend/` directory
- **Example**: `SECRET_KEY=django-insecure-change-this-in-production`

### 2. Database Credentials
- **Variables**: 
  - `DB_NAME` - Database name
  - `DB_USER` - Database username
  - `DB_PASSWORD` - Database password
  - `DB_HOST` - Database host
  - `DB_PORT` - Database port
- **Purpose**: PostgreSQL database connection
- **Location**: `.env` file
- **Example**:
  ```
  DB_NAME=ai_learning_assistant
  DB_USER=postgres
  DB_PASSWORD=your_secure_password
  DB_HOST=localhost
  DB_PORT=5432
  ```

### 3. Redis Credentials
- **Variables**:
  - `REDIS_HOST` - Redis host
  - `REDIS_PORT` - Redis port
  - `REDIS_DB` - Redis database number
  - `REDIS_PASSWORD` - Redis password (optional)
- **Purpose**: Redis connection for caching and sessions
- **Location**: `.env` file
- **Example**:
  ```
  REDIS_HOST=localhost
  REDIS_PORT=6379
  REDIS_DB=0
  REDIS_PASSWORD=
  ```

### 4. OpenAI API Key
- **Variable**: `OPENAI_API_KEY`
- **Purpose**: Authentication for OpenAI API (used for summaries and flashcards)
- **Location**: `.env` file
- **Example**: `OPENAI_API_KEY=sk-...`

## How It Works

### Development (Local)
1. Create a `.env` file in the `backend/` directory
2. Add all sensitive variables to the `.env` file
3. The `.env` file is automatically loaded by `python-decouple`
4. The `.env` file is in `.gitignore` - **NEVER commit it to Git**

### Production
1. Set environment variables in your hosting platform:
   - **Heroku**: `heroku config:set SECRET_KEY=...`
   - **AWS**: Use AWS Secrets Manager or Parameter Store
   - **Docker**: Pass via `-e` flag or `docker-compose.yml` environment section
   - **Kubernetes**: Use Secrets
   - **Vercel/Railway**: Set in dashboard environment variables

## Security Best Practices

### ✅ DO:
1. **Always use `.env` file for local development**
2. **Add `.env` to `.gitignore`** (already done)
3. **Use strong, unique passwords** for database and Redis
4. **Rotate secrets regularly** in production
5. **Use different secrets** for development and production
6. **Never commit secrets** to version control
7. **Use environment variables** in production (not `.env` files)

### ❌ DON'T:
1. **Never commit `.env` file** to Git
2. **Never hardcode secrets** in code
3. **Never share secrets** in chat/email
4. **Never use production secrets** in development
5. **Never log secrets** in application logs

## Creating Your `.env` File

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your actual values:
   ```bash
   # Generate a secret key
   python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
   
   # Add to .env
   SECRET_KEY=<generated_key>
   OPENAI_API_KEY=<your_openai_key>
   DB_PASSWORD=<your_db_password>
   ```

## File Structure

```
backend/
├── .env              # ← Your sensitive data (NOT in Git)
├── .env.example      # ← Template (safe to commit)
├── .gitignore        # ← Ensures .env is ignored
├── config/
│   └── settings.py   # ← Loads from .env using python-decouple
└── ...
```

## Verification

To verify your `.env` file is working:

```bash
# In Django shell
python manage.py shell
>>> from decouple import config
>>> config('SECRET_KEY')  # Should return your secret key
>>> config('OPENAI_API_KEY')  # Should return your API key
```

## Production Deployment

For production, use your platform's environment variable system:

**Example for Docker:**
```yaml
# docker-compose.yml
services:
  web:
    environment:
      - SECRET_KEY=${SECRET_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - DB_PASSWORD=${DB_PASSWORD}
```

**Example for Heroku:**
```bash
heroku config:set SECRET_KEY=your-secret-key
heroku config:set OPENAI_API_KEY=your-api-key
```

## Emergency: If Secrets Are Compromised

1. **Immediately rotate all secrets**:
   - Generate new SECRET_KEY
   - Change database password
   - Regenerate OpenAI API key
   - Update Redis password (if used)

2. **Update all environment variables** in production

3. **Review access logs** for unauthorized access

4. **Consider revoking and regenerating** all API keys

