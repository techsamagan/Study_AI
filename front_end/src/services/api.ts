const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Types
export interface PlanLimits {
  documents: { limit: number; used: number; remaining: number };
  summaries: { limit: number; used: number; remaining: number };
  flashcards: { limit: number; used: number; remaining: number };
  max_file_size_mb: number;
  ai_generations: { limit: number; used: number; remaining: number };
}

export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  plan_type: 'free' | 'pro';
  subscription_status: string;
  is_pro: boolean;
  plan_limits?: PlanLimits;
  is_staff?: boolean;
  is_superuser?: boolean;
  date_joined?: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface Document {
  id: number;
  title: string;
  file: string;
  file_size: number;
  file_type: string;
  pages: number | null;
  uploaded_at: string;
  updated_at: string;
}

export interface Summary {
  id: number;
  document: number;
  full_summary: string;
  key_points: string[];
  created_at: string;
  updated_at: string;
}

export interface Flashcard {
  id: number;
  document?: number;
  summary?: number;
  question: string;
  answer: string;
  category: string;
  created_at: string;
  updated_at: string;
  last_reviewed?: string;
  review_count: number;
  mastery_level: number;
}

export interface DashboardStats {
  documents_count: number;
  flashcards_count: number;
  summaries_count: number;
  study_time: string;
  mastery: number;
  plan_type?: string;
  is_pro?: boolean;
}

// API Client
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private getAuthToken(): string | null {
    return localStorage.getItem('access_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getAuthToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let error;
      try {
        error = await response.json();
      } catch {
        error = { detail: `HTTP error! status: ${response.status}` };
      }
      // Try to extract error message from different possible fields
      const errorMessage = error.error || error.detail || error.message || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }

    return response.json();
  }

  // Authentication
  async register(data: {
    email: string;
    username: string;
    first_name: string;
    last_name: string;
    password: string;
    password_confirm: string;
  }): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/register/', {
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

  async refreshToken(): Promise<{ access: string }> {
    const refresh = localStorage.getItem('refresh_token');
    if (!refresh) {
      throw new Error('No refresh token available');
    }
    return this.request<{ access: string }>('/auth/refresh/', {
      method: 'POST',
      body: JSON.stringify({ refresh }),
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
    const response = await this.request<{ count: number; next: string | null; previous: string | null; results: Document[] }>('/documents/');
    return response.results || [];
  }

  async uploadDocument(file: File, title: string): Promise<Document> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);

    const token = this.getAuthToken();
    const response = await fetch(`${this.baseURL}/documents/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
      throw new Error(error.detail || error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async deleteDocument(id: number): Promise<void> {
    await this.request(`/documents/${id}/`, {
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
  async getSummaries(): Promise<Summary[]> {
    const response = await this.request<{ count: number; next: string | null; previous: string | null; results: Summary[] }>('/summaries/');
    return response.results || [];
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
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.document) queryParams.append('document', params.document.toString());
    
    const query = queryParams.toString();
    const response = await this.request<{ count: number; next: string | null; previous: string | null; results: Flashcard[] }>(`/flashcards/${query ? `?${query}` : ''}`);
    return response.results || [];
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

  async updateFlashcard(id: number, data: Partial<Flashcard>): Promise<Flashcard> {
    return this.request<Flashcard>(`/flashcards/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteFlashcard(id: number): Promise<void> {
    await this.request(`/flashcards/${id}/`, {
      method: 'DELETE',
    });
  }

  async reviewFlashcard(id: number, masteryLevel?: number): Promise<Flashcard> {
    return this.request<Flashcard>(`/flashcards/${id}/review/`, {
      method: 'POST',
      body: JSON.stringify({ mastery_level: masteryLevel }),
    });
  }

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    return this.request<DashboardStats>('/dashboard/stats/');
  }

  // Subscription
  async createCheckoutSession(): Promise<{ checkout_url: string; session_id: string }> {
    return this.request<{ checkout_url: string; session_id: string }>('/subscription/checkout/', {
      method: 'POST',
    });
  }

  async verifyPayment(sessionId: string): Promise<{ message: string; user: User }> {
    return this.request<{ message: string; user: User }>('/subscription/verify/', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId }),
    });
  }

  // Admin endpoints
  async getAdminDashboardStats(): Promise<any> {
    return this.request<any>('/admin/dashboard/stats/');
  }

  async getAdminUsers(params?: { page?: number; plan_type?: string; search?: string }): Promise<{ results: User[]; count: number; next: string | null; previous: string | null } | User[]> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.plan_type) queryParams.append('plan_type', params.plan_type);
    if (params?.search) queryParams.append('search', params.search);
    
    const query = queryParams.toString();
    return this.request<any>(`/admin/users/${query ? `?${query}` : ''}`);
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

  async adminUpgradeUser(userId: number): Promise<{ message: string; user: User }> {
    return this.request<{ message: string; user: User }>(`/admin/users/${userId}/upgrade/`, {
      method: 'POST',
    });
  }

  async adminDowngradeUser(userId: number): Promise<{ message: string; user: User }> {
    return this.request<{ message: string; user: User }>(`/admin/users/${userId}/downgrade/`, {
      method: 'POST',
    });
  }

  async getAdminContentStats(): Promise<any> {
    return this.request<any>('/admin/content/stats/');
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

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
  return userStr ? JSON.parse(userStr) : null;
};

export const setStoredUser = (user: User) => {
  localStorage.setItem('user', JSON.stringify(user));
};

