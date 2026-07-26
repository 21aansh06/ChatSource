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

function getHumanReadableErrorMessage(status: number, defaultMsg?: string): string {
  if (defaultMsg && !defaultMsg.startsWith('HTTP Error')) {
    return defaultMsg;
  }
  switch (status) {
    case 401:
      return 'Your authentication session has expired. Please sign in again.';
    case 403:
      return 'You do not have permission to access or modify this notebook.';
    case 404:
      return 'The requested resource was not found.';
    case 413:
      return 'The uploaded file exceeds the maximum allowed size limit.';
    case 429:
      return 'Too many requests. Please wait a moment before trying again.';
    case 500:
    case 502:
    case 503:
      return 'The server encountered an internal issue. Please try again shortly.';
    default:
      return defaultMsg || `An unexpected error occurred (Status ${status}).`;
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

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (err: any) {
    throw new ApiError(
      'Unable to connect to the backend server. Please check your network connection.',
      0
    );
  }

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
      // Ignore JSON parse errors
    }

    const userFriendlyMessage = getHumanReadableErrorMessage(response.status, errorMessage);
    throw new ApiError(userFriendlyMessage, response.status, errorDetails);
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
