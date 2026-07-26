import {
  Notebook,
  CreateNotebookInput,
  UpdateNotebookInput,
  Source,
  ChatSession,
  ChatMessage,
  AskQuestionInput,
  AskQuestionResponse,
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

type TokenGetter = () => Promise<string | null>;

let globalTokenGetter: TokenGetter | null = null;

/**
 * Configure the global authentication token provider (e.g. from Clerk)
 */
export function setAuthTokenGetter(getter: TokenGetter) {
  globalTokenGetter = getter;
}

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

/**
 * Centralized, typed API HTTP Client
 * Automatically attaches Authorization header with Clerk Session Token
 */
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
  customTokenGetter?: TokenGetter
): Promise<T> {
  const tokenGetter = customTokenGetter || globalTokenGetter;
  let token: string | null = null;

  if (tokenGetter) {
    try {
      token = await tokenGetter();
    } catch (err) {
      console.warn('[ApiClient] Failed to retrieve auth token:', err);
    }
  }

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Set default Content-Type to JSON if body is not FormData
  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const url = `${API_BASE_URL.replace(/\/$/, '')}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetails: any = null;
    let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;

    try {
      errorDetails = await response.json();
      if (errorDetails?.error) {
        errorMessage = errorDetails.error;
      } else if (errorDetails?.message) {
        errorMessage = errorDetails.message;
      }
    } catch {
      // Ignore JSON parse errors for non-JSON error responses
    }

    throw new ApiError(errorMessage, response.status, errorDetails);
  }

  // For 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const apiClient = {
  // Notebook Endpoints
  notebooks: {
    list: (getToken?: TokenGetter): Promise<{ notebooks: Notebook[] }> =>
      fetchApi('/api/notebooks', { method: 'GET' }, getToken),

    create: (
      input: CreateNotebookInput,
      getToken?: TokenGetter
    ): Promise<{ message: string; notebook: Notebook }> =>
      fetchApi(
        '/api/notebooks',
        {
          method: 'POST',
          body: JSON.stringify(input),
        },
        getToken
      ),

    getById: (id: string, getToken?: TokenGetter): Promise<{ notebook: Notebook }> =>
      fetchApi(`/api/notebooks/${id}`, { method: 'GET' }, getToken),

    update: (
      id: string,
      input: UpdateNotebookInput,
      getToken?: TokenGetter
    ): Promise<{ message: string; notebook: Notebook }> =>
      fetchApi(
        `/api/notebooks/${id}`,
        {
          method: 'PATCH',
          body: JSON.stringify(input),
        },
        getToken
      ),

    delete: (id: string, getToken?: TokenGetter): Promise<{ message: string }> =>
      fetchApi(`/api/notebooks/${id}`, { method: 'DELETE' }, getToken),
  },

  // Source Endpoints
  sources: {
    list: (notebookId: string, getToken?: TokenGetter): Promise<{ sources: Source[] }> =>
      fetchApi(`/api/notebooks/${notebookId}/sources`, { method: 'GET' }, getToken),

    create: (
      notebookId: string,
      formData: FormData,
      getToken?: TokenGetter
    ): Promise<{ message: string; source: Source }> =>
      fetchApi(
        `/api/notebooks/${notebookId}/sources`,
        {
          method: 'POST',
          body: formData,
        },
        getToken
      ),

    delete: (sourceId: string, getToken?: TokenGetter): Promise<{ message: string }> =>
      fetchApi(`/api/sources/${sourceId}`, { method: 'DELETE' }, getToken),
  },

  // Chat Endpoints
  chat: {
    ask: (
      notebookId: string,
      input: AskQuestionInput,
      getToken?: TokenGetter
    ): Promise<AskQuestionResponse> =>
      fetchApi(
        `/api/notebooks/${notebookId}/chat`,
        {
          method: 'POST',
          body: JSON.stringify(input),
        },
        getToken
      ),

    listSessions: (
      notebookId: string,
      getToken?: TokenGetter
    ): Promise<{ sessions: ChatSession[] }> =>
      fetchApi(`/api/notebooks/${notebookId}/chat/sessions`, { method: 'GET' }, getToken),

    getSessionHistory: (
      notebookId: string,
      sessionId: string,
      getToken?: TokenGetter
    ): Promise<{ session: ChatSession & { messages: ChatMessage[] } }> =>
      fetchApi(
        `/api/notebooks/${notebookId}/chat/sessions/${sessionId}`,
        { method: 'GET' },
        getToken
      ),

    getStreamUrl: (notebookId: string, sessionId: string): string =>
      `${API_BASE_URL.replace(/\/$/, '')}/api/notebooks/${notebookId}/chat/stream/${sessionId}`,
  },
};
