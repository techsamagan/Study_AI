# Frontend-Backend Integration Summary

## Overview
The frontend and backend have been fully integrated. The frontend now communicates with the Django REST API backend using JWT authentication.

## What Was Done

### Backend (Django)
1. **Django REST Framework Setup**
   - JWT authentication with SimpleJWT
   - CORS configuration for frontend access
   - Custom User model
   - Models: Document, Summary, Flashcard
   - OpenAI integration for summaries and flashcards

2. **API Endpoints**
   - `/api/auth/register/` - User registration
   - `/api/auth/login/` - User login
   - `/api/auth/refresh/` - Token refresh
   - `/api/auth/profile/` - User profile
   - `/api/documents/` - Document CRUD
   - `/api/documents/{id}/generate_summary/` - Generate summary
   - `/api/documents/{id}/generate_flashcards/` - Generate flashcards
   - `/api/summaries/` - Summary CRUD
   - `/api/summaries/{id}/generate_flashcards/` - Generate flashcards from summary
   - `/api/flashcards/` - Flashcard CRUD
   - `/api/flashcards/{id}/review/` - Mark flashcard as reviewed
   - `/api/dashboard/stats/` - Dashboard statistics

### Frontend (React)
1. **API Service** (`src/services/api.ts`)
   - Centralized API client with JWT token management
   - All API endpoints wrapped in TypeScript interfaces
   - Error handling and token refresh logic

2. **Updated Components**
   - **SignInDialog**: Now uses backend login API
   - **SignUpDialog**: Now uses backend registration API
   - **Router**: Uses JWT tokens instead of localStorage boolean
   - **DashboardView**: Fetches real data from backend
   - **DocumentSummarizationView**: Uploads documents and generates summaries via API
   - **FlashcardCreationView**: Full CRUD operations with backend

## Setup Instructions

### Backend Setup
1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Create virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set environment variables:
   ```bash
   export SECRET_KEY="your-secret-key-here"
   export OPENAI_API_KEY="your-openai-api-key-here"
   ```
   Or create a `.env` file in the backend directory.

5. Run migrations:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

6. Create superuser (optional):
   ```bash
   python manage.py createsuperuser
   ```

7. Start the server:
   ```bash
   python manage.py runserver
   ```
   Backend will run on `http://localhost:8000`

### Frontend Setup
1. Navigate to frontend directory:
   ```bash
   cd front_end
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file (optional):
   ```bash
   VITE_API_BASE_URL=http://localhost:8000/api
   ```
   If not set, defaults to `http://localhost:8000/api`

4. Start the development server:
   ```bash
   npm run dev
   ```
   Frontend will run on `http://localhost:5173` (or another port if 5173 is busy)

## How It Works

### Authentication Flow
1. User registers/logs in through SignUpDialog or SignInDialog
2. Backend returns JWT tokens (access and refresh)
3. Tokens are stored in localStorage
4. All subsequent API requests include the access token in the Authorization header
5. Router checks for token presence to determine authentication status

### Document Upload Flow
1. User uploads a document in DocumentSummarizationView
2. File is sent to `/api/documents/` endpoint
3. Backend extracts text from the document (PDF, DOCX, TXT)
4. User can generate summary via `/api/documents/{id}/generate_summary/`
5. OpenAI generates summary and key points
6. Summary is displayed in the UI

### Flashcard Generation Flow
1. User can generate flashcards from a document or summary
2. Backend sends document/summary content to OpenAI
3. OpenAI generates flashcards with questions and answers
4. Flashcards are saved to the database
5. User can view, edit, and delete flashcards

## API Authentication

All API endpoints (except registration and login) require JWT authentication. The frontend automatically includes the token in requests:

```
Authorization: Bearer <access_token>
```

Tokens expire after 1 day. The refresh token can be used to get a new access token.

## Environment Variables

### Backend
- `SECRET_KEY`: Django secret key
- `OPENAI_API_KEY`: OpenAI API key for AI features

### Frontend
- `VITE_API_BASE_URL`: Backend API base URL (default: `http://localhost:8000/api`)

## Testing the Integration

1. Start the backend server
2. Start the frontend server
3. Open the frontend in your browser
4. Register a new account
5. Upload a document
6. Generate a summary
7. Generate flashcards
8. View dashboard statistics

## Troubleshooting

### CORS Errors
- Ensure backend CORS settings include your frontend URL
- Check that `CORS_ALLOWED_ORIGINS` in `settings.py` includes your frontend URL

### Authentication Errors
- Check that tokens are being stored in localStorage
- Verify token expiration
- Check backend logs for authentication errors

### API Connection Errors
- Verify backend is running on the correct port
- Check `VITE_API_BASE_URL` environment variable
- Verify CORS settings allow your frontend origin

### OpenAI Errors
- Ensure `OPENAI_API_KEY` is set correctly
- Check OpenAI API quota/limits
- Verify API key has necessary permissions

## Next Steps

1. Add error handling for network failures
2. Implement token refresh on 401 errors
3. Add loading states for better UX
4. Implement pagination for large datasets
5. Add file validation on frontend before upload
6. Implement study session tracking
7. Add flashcard review scheduling

