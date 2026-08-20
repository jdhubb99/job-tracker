import { useAuthStore } from '@/stores/authStore';
import type {
  AuthTokenResponse,
  ApiErrorBody,
  JobApplicationCreateData,
  JobApplicationResponse,
  JobApplicationStatus,
  JobApplicationUpdateData,
  LoginRequest,
  RegisterRequest,
  User,
} from '@/lib/types';

export class ApiError extends Error {
  status: number;
  errorBody: ApiErrorBody | null;

  constructor(status: number, body: ApiErrorBody | null) {
    super(body?.message ?? `Request failed with status ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.errorBody = body;
  }

  get fieldErrors(): Record<string, string> | null {
    return this.errorBody?.fieldErrors ?? null;
  }
}

let refreshPromise: Promise<AuthTokenResponse | null> | null = null;

async function parseErrorBody(response: Response): Promise<ApiErrorBody | null> {
  try {
    return (await response.json()) as ApiErrorBody;
  } catch {
    return null;
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { accessToken } = useAuthStore.getState();

  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const response = await fetch(`/api${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (response.status === 401 && !path.startsWith('/auth/refresh')) {
    const refreshed = await silentRefresh();
    if (refreshed) {
      const retryHeaders = new Headers(options.headers);
      if (!retryHeaders.has('Content-Type')) {
        retryHeaders.set('Content-Type', 'application/json');
      }
      retryHeaders.set('Authorization', `Bearer ${refreshed.accessToken}`);

      const retryResponse = await fetch(`/api${path}`, {
        ...options,
        headers: retryHeaders,
        credentials: 'include',
      });

      if (!retryResponse.ok) {
        if (retryResponse.status === 401) {
          useAuthStore.getState().clearAuth();
          window.dispatchEvent(new CustomEvent('auth:logout'));
        }
        throw new ApiError(retryResponse.status, await parseErrorBody(retryResponse));
      }

      if (retryResponse.status === 204) return undefined as T;
      return retryResponse.json() as Promise<T>;
    }

    useAuthStore.getState().clearAuth();
    window.dispatchEvent(new CustomEvent('auth:logout'));
    throw new ApiError(401, null);
  }

  if (!response.ok) {
    throw new ApiError(response.status, await parseErrorBody(response));
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

async function silentRefresh(): Promise<AuthTokenResponse | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) return null;

      const data = (await response.json()) as AuthTokenResponse;
      useAuthStore.getState().setAuth(data.user, data.accessToken);
      return data;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export const authApi = {
  login(credentials: LoginRequest): Promise<AuthTokenResponse> {
    return apiFetch<AuthTokenResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  register(data: RegisterRequest): Promise<AuthTokenResponse> {
    return apiFetch<AuthTokenResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  refresh(): Promise<AuthTokenResponse | null> {
    return silentRefresh();
  },

  logout(): Promise<void> {
    return apiFetch<void>('/auth/logout', { method: 'POST' });
  },

  me(): Promise<User> {
    return apiFetch<User>('/auth/me');
  },
};

export const jobApplicationsApi = {
  getAll(status?: JobApplicationStatus): Promise<JobApplicationResponse[]> {
    const params = status ? `?status=${status}` : '';
    return apiFetch<JobApplicationResponse[]>(`/job-applications${params}`);
  },

  getById(id: string): Promise<JobApplicationResponse> {
    return apiFetch<JobApplicationResponse>(`/job-applications/${id}`);
  },

  create(data: JobApplicationCreateData): Promise<JobApplicationResponse> {
    return apiFetch<JobApplicationResponse>('/job-applications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update(id: string, data: JobApplicationUpdateData): Promise<JobApplicationResponse> {
    return apiFetch<JobApplicationResponse>(`/job-applications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete(id: string): Promise<void> {
    return apiFetch<void>(`/job-applications/${id}`, { method: 'DELETE' });
  },
};
