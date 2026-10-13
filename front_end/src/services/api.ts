const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Types
export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  is_active?: boolean;
  is_staff?: boolean;
  is_superuser?: boolean;
  date_joined?: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface RegisterResponse {
  message: string;
  user: User;
}

export interface Document {
  id: number;
  title: string;
  file_size: number;
  file_type: string;
  pages: number | null;
  uploaded_at: string;
  updated_at: string;
}

export interface Summary {
  id: number;
  document: Document;
  full_summary: string;
  key_points: string[];
  created_at: string;
  updated_at: string;
}

export interface Flashcard {
  id: number;
  document: Document | null;
  summary: number | null;
  question: string;
  answer: string;
  category: string;
  created_at: string;
  updated_at: string;
  last_reviewed: string | null;
  review_count: number;
  mastery_level: number;
}

export type ReviewResult = 'mastered' | 'needs_practice';

export interface StudySession {
  id: number;
  duration_seconds: number;
  cards_reviewed: number;
  cards_mastered: number;
  created_at: string;
}

export interface DashboardStats {
  documents_count: number;
  flashcards_count: number;
  summaries_count: number;
  study_seconds: number;
  study_time: string;
  mastery: number;
}

interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Auth helpers
export const setAuthTokens = (access: string, refresh: string) => {
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
};

export const clearAuthTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
};

export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('access_token');
};

export const getStoredUser = (): User | null => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

export const setStoredUser = (user: User) => {
  localStorage.setItem('user', JSON.stringify(user));
};

/** Fired on `window` when the session can no longer be refreshed. */
export const AUTH_EXPIRED_EVENT = 'auth:expired';

const FIELD_LABELS: Record<string, string> = {
  non_field_errors: '',
  password_confirm: 'Password confirmation',
  first_name: 'First name',
  last_name: 'Last name',
};

/** Turn a DRF error body into one readable message. */
export function extractErrorMessage(body: unknown, status: number): string {
  const fallback = `Request failed (HTTP ${status})`;
  if (typeof body === 'string') return body || fallback;
  if (Array.isArray(body)) return body.map(String).join(' ') || fallback;
  if (!body || typeof body !== 'object') return fallback;

  const data = body as Record<string, unknown>;
  for (const key of ['error', 'detail', 'message']) {
    if (typeof data[key] === 'string') return data[key] as string;
  }

  // Field errors look like { "email": ["user with this email already exists."] }
  const messages = Object.entries(data).map(([field, value]) => {
    const text = Array.isArray(value) ? value.map(String).join(' ') : String(value);
    const label = field in FIELD_LABELS
      ? FIELD_LABELS[field]
      : field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ');
    return label ? `${label}: ${text}` : text;
  });
  return messages.join(' ') || fallback;
}

// Endpoints where a 401 means "wrong credentials", not "expired access token"
const NO_REFRESH_ENDPOINTS = ['/auth/login/', '/auth/register/', '/auth/refresh/'];

// API Client
class ApiClient {
  private baseURL: string;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private getAuthToken(): string | null {
    return localStorage.getItem('access_token');
  }

  private send(endpoint: string, options: RequestInit): Promise<Response> {
    const headers = new Headers(options.headers);
    // FormData sets its own multipart Content-Type (with the boundary)
    if (options.body !== undefined && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }
    const token = this.getAuthToken();
    if (token && !NO_REFRESH_ENDPOINTS.includes(endpoint)) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return fetch(`${this.baseURL}${endpoint}`, { ...options, headers });
  }

  /** Exchange the refresh token for a new pair. Concurrent callers share one request. */
  private refreshAccessToken(): Promise<boolean> {
    if (!this.refreshPromise) {
      this.refreshPromise = (async () => {
        const refresh = localStorage.getItem('refresh_token');
        if (!refresh) return false;
        try {
          const response = await this.send('/auth/refresh/', {
            method: 'POST',
            body: JSON.stringify({ refresh }),
          });
          if (!response.ok) return false;
          const data = await response.json();
          // Refresh tokens rotate, so the old one is no longer valid
          setAuthTokens(data.access, data.refresh ?? refresh);
          return true;
        } catch {
          return false;
        }
      })().finally(() => {
        this.refreshPromise = null;
      });
    }
    return this.refreshPromise;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    let response = await this.send(endpoint, options);

    if (response.status === 401 && !NO_REFRESH_ENDPOINTS.includes(endpoint)) {
      if (await this.refreshAccessToken()) {
        response = await this.send(endpoint, options);
      }
      if (response.status === 401) {
        clearAuthTokens();
        window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
        throw new Error('Your session has expired. Please sign in again.');
      }
    }

    // 204 No Content (e.g. after a delete) has no body to parse
    const text = response.status === 204 ? '' : await response.text();
    let body: unknown = undefined;
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = undefined;
      }
    }

    if (!response.ok) {
      throw new Error(extractErrorMessage(body, response.status));
    }
    return body as T;
  }

  /** Fetch every page of a paginated list endpoint. */
  private async requestAll<T>(endpoint: string, params: Record<string, string> = {}): Promise<T[]> {
    const items: T[] = [];
    for (let page = 1; ; page += 1) {
      const query = new URLSearchParams({ ...params, page: String(page), page_size: '100' });
      const data = await this.request<Paginated<T>>(`${endpoint}?${query}`);
      items.push(...(data.results || []));
      if (!data.next) return items;
    }
  }

  // Authentication
  async register(data: {
    email: string;
    first_name: string;
    last_name: string;
    password: string;
    password_confirm: string;
  }): Promise<RegisterResponse> {
    return this.request<RegisterResponse>('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getProfile(): Promise<User> {
    return this.request<User>('/auth/profile/');
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    return this.request<User>('/auth/profile/', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Documents
  async getDocuments(): Promise<Document[]> {
    return this.requestAll<Document>('/documents/');
  }

  async uploadDocument(file: File, title: string): Promise<Document> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);

    return this.request<Document>('/documents/', {
      method: 'POST',
      body: formData,
    });
  }

  async deleteDocument(id: number): Promise<void> {
    await this.request(`/documents/${id}/`, {
      method: 'DELETE',
    });
  }

  async deleteAllDocuments(): Promise<{ message: string; deleted_count: number }> {
    return this.request('/documents/delete_all/', {
      method: 'DELETE',
    });
  }

  async generateSummary(documentId: number): Promise<Summary> {
    return this.request<Summary>(`/documents/${documentId}/generate_summary/`, {
      method: 'POST',
    });
  }

  async generateFlashcards(documentId: number, numCards: number = 10): Promise<Flashcard[]> {
    return this.request<Flashcard[]>(`/documents/${documentId}/generate_flashcards/`, {
      method: 'POST',
      body: JSON.stringify({ num_cards: numCards }),
    });
  }

  // Summaries
  async getSummaries(params?: { document?: number }): Promise<Summary[]> {
    const query: Record<string, string> = {};
    if (params?.document) query.document = params.document.toString();
    return this.requestAll<Summary>('/summaries/', query);
  }

  async getSummary(id: number): Promise<Summary> {
    return this.request<Summary>(`/summaries/${id}/`);
  }

  async deleteSummary(id: number): Promise<void> {
    await this.request(`/summaries/${id}/`, {
      method: 'DELETE',
    });
  }

  async generateFlashcardsFromSummary(summaryId: number, numCards: number = 10): Promise<Flashcard[]> {
    return this.request<Flashcard[]>(`/summaries/${summaryId}/generate_flashcards/`, {
      method: 'POST',
      body: JSON.stringify({ num_cards: numCards }),
    });
  }

  // Flashcards
  async getFlashcards(params?: { category?: string; document?: number }): Promise<Flashcard[]> {
    const query: Record<string, string> = {};
    if (params?.category) query.category = params.category;
    if (params?.document) query.document = params.document.toString();
    return this.requestAll<Flashcard>('/flashcards/', query);
  }

  async createFlashcard(data: {
    question: string;
    answer: string;
    category: string;
    document?: number;
    summary?: number;
  }): Promise<Flashcard> {
    return this.request<Flashcard>('/flashcards/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateFlashcard(
    id: number,
    data: { question: string; answer: string; category: string }
  ): Promise<Flashcard> {
    return this.request<Flashcard>(`/flashcards/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteFlashcard(id: number): Promise<void> {
    await this.request(`/flashcards/${id}/`, {
      method: 'DELETE',
    });
  }

  async deleteAllFlashcards(): Promise<{ message: string; deleted_count: number }> {
    return this.request('/flashcards/delete_all/', {
      method: 'DELETE',
    });
  }

  async reviewFlashcard(id: number, result: ReviewResult): Promise<Flashcard> {
    return this.request<Flashcard>(`/flashcards/${id}/review/`, {
      method: 'POST',
      body: JSON.stringify({ result }),
    });
  }

  // Study sessions
  async recordStudySession(data: {
    duration_seconds: number;
    cards_reviewed: number;
    cards_mastered: number;
  }): Promise<StudySession> {
    return this.request<StudySession>('/study-sessions/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    return this.request<DashboardStats>('/dashboard/stats/');
  }

  // Admin endpoints
  async getAdminDashboardStats(): Promise<any> {
    return this.request<any>('/admin/dashboard/stats/');
  }

  async getAdminUsers(params?: { page?: number; search?: string }): Promise<Paginated<User>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.search) queryParams.append('search', params.search);

    const query = queryParams.toString();
    return this.request<Paginated<User>>(`/admin/users/${query ? `?${query}` : ''}`);
  }

  async getAdminUser(userId: number): Promise<User> {
    return this.request<User>(`/admin/users/${userId}/`);
  }

  async updateAdminUser(userId: number, data: Partial<User>): Promise<User> {
    return this.request<User>(`/admin/users/${userId}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getAdminContentStats(): Promise<any> {
    return this.request<any>('/admin/content/stats/');
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
