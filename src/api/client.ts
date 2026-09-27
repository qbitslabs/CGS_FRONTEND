/* Fetch wrapper for the CGS clinic API with bearer auth and JSON errors.
 * All staff screens talk to the backend through this client. */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/cgs_api/v1';

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  code?: string;
}

export class ApiError extends Error {
  status: number;
  code?: string;
  data?: any;

  constructor(message: string, status: number, code?: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private getAuthToken(): string | null {
    return localStorage.getItem('cgs_access_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = endpoint.startsWith('http')
      ? endpoint
      : `${this.baseURL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    const token = this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const controller = new AbortController();
      const timeoutMs = options.signal ? undefined : 90000;
      const timer = timeoutMs ? setTimeout(() => controller.abort(), timeoutMs) : null;
      const response = await fetch(url, {
        ...options,
        headers,
        signal: options.signal || controller.signal,
      });
      if (timer) clearTimeout(timer);

      let payload: any = null;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        payload = await response.json();
      } else {
        payload = await response.text();
      }

      if (response.status === 401) {
        if (!url.includes('/auth/login')) {
          localStorage.removeItem('cgs_access_token');
          localStorage.removeItem('cgs_current_user');
          window.dispatchEvent(new CustomEvent('cgs:session_expired'));
          throw new ApiError('Session expired. Please log in again.', 401, 'UNAUTHORIZED');
        }
      }

      if (!response.ok) {
        const errorMsg =
          (payload && typeof payload === 'object' && (payload.error?.message || payload.error || payload.message)) ||
          `Request failed with status ${response.status}`;
        const errorCode = payload && typeof payload === 'object' ? (payload.code || payload.error?.code) : undefined;
        throw new ApiError(errorMsg, response.status, errorCode, payload);
      }

      // If backend wrapped in { success: true, data: ... }, preserve meta if present
      if (payload && typeof payload === 'object' && 'data' in payload && 'success' in payload) {
        if ('meta' in payload || 'pagination' in payload || 'total' in payload) {
          return payload as T;
        }
        return payload.data as T;
      }

      return payload as T;
    } catch (err: any) {
      if (err instanceof ApiError) {
        throw err;
      }
      throw new ApiError(err.message || 'Network error occurred', 0, 'NETWORK_ERROR');
    }
  }

  public get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '' && v !== 'All') {
          searchParams.append(k, String(v));
        }
      });
      const qs = searchParams.toString();
      if (qs) {
        url += (url.includes('?') ? '&' : '?') + qs;
      }
    }
    return this.request<T>(url, { method: 'GET' });
  }

  public post<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public patch<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public put<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const cgs_api = new ApiClient(API_BASE_URL);
export const api = cgs_api;

