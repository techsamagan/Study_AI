# AI Learning Assistant - Full Stack Application

A comprehensive AI-powered learning assistant application with document summarization, flashcard generation, and study mode features.

## 🚀 Features

- **Document Upload & Processing**: Upload PDF and DOCX files for AI-powered analysis
- **AI Summarization**: Generate comprehensive summaries with key points
- **Flashcard Generation**: Automatically create flashcards from documents
- **Study Mode**: Interactive study sessions with spaced repetition
- **User Management**: Registration, authentication, and profile management
- **Analytics Dashboard**: Monitor usage metrics from the admin interface

## 📁 Project Structure

```
ai_project/
├── backend/          # Django REST API
│   ├── api/         # Main application
│   ├── config/      # Django settings
│   └── requirements.txt
├── front_end/        # React + TypeScript frontend
│   ├── src/
│   └── package.json
└── README.md
```

## 🛠️ Tech Stack

### Backend
- **Django 5.0+**: Web framework
- **Django REST Framework**: RESTful API
- **PostgreSQL**: Database
- **Redis**: Caching and session management
- **OpenAI API**: AI-powered content generation

### Frontend
- **React 18+**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool
- **Tailwind CSS**: Styling
- **Motion**: Animations

## 📋 Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Docker & Docker Compose (optional)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd ai_project
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Set up database (using Docker Compose)
docker-compose up -d

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run server
python manage.py runserver
```

### 3. Frontend Setup

```bash
cd front_end

# Install dependencies
npm install

# Set up environment variables
# Create .env file with:
# VITE_API_BASE_URL=http://localhost:8000/api

# Run development server
npm run dev
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api
- **Django Admin**: http://localhost:8000/admin

## 📝 Environment Variables

### Backend (.env)

```env
# Django
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_NAME=ai_learning_assistant
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5434

# Redis
REDIS_URL=redis://localhost:6379/0

# OpenAI
OPENAI_API_KEY=your-openai-api-key
```

### Frontend (.env)

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

## 🗄️ Database Setup

### Using Docker Compose (Recommended)

```bash
cd backend
docker-compose up -d
```

This will start PostgreSQL and Redis containers.

### Manual Setup

1. Install PostgreSQL and Redis
2. Create a database named `ai_learning_assistant`
3. Update database credentials in `backend/.env`
4. Run migrations: `python manage.py migrate`

## 🔐 Authentication

The application uses JWT (JSON Web Tokens) for authentication:
- Access tokens expire in 15 minutes
- Refresh tokens expire in 7 days
- Tokens are stored in localStorage

## 👨‍💼 Admin Access

1. Create a superuser: `python manage.py createsuperuser`
2. Login with superuser credentials
3. Admin menu will appear in the sidebar
4. Access admin dashboard at `/admin` route

## 📚 API Documentation

### Authentication
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - User login
- `POST /api/auth/refresh/` - Refresh access token
- `GET /api/auth/profile/` - Get user profile
- `PATCH /api/auth/profile/` - Update user profile

### Documents
- `GET /api/documents/` - List documents
- `POST /api/documents/` - Upload document
- `GET /api/documents/{id}/` - Get document
- `DELETE /api/documents/{id}/` - Delete document

### Summaries
- `GET /api/summaries/` - List summaries
- `POST /api/documents/{id}/generate_summary/` - Generate summary
- `GET /api/summaries/{id}/` - Get summary

### Flashcards
- `GET /api/flashcards/` - List flashcards
- `POST /api/flashcards/` - Create flashcard
- `POST /api/documents/{id}/generate_flashcards/` - Generate flashcards
- `POST /api/flashcards/{id}/review/` - Review flashcard

### Admin (Requires admin permissions)
- `GET /api/admin/dashboard/stats/` - Dashboard statistics
- `GET /api/admin/users/` - List users
- `GET /api/admin/users/{id}/` - Get user details
- `PATCH /api/admin/users/{id}/` - Update user details (e.g., grant admin access)
- `GET /api/admin/content/stats/` - Content statistics

## 🧪 Testing

### Backend
```bash
cd backend
python manage.py test
```

### Frontend
```bash
cd front_end
npm test
```
---

**Note**: Make sure to never commit sensitive information like API keys, secrets, or `.env` files to the repository.

