const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// --- Retry config for Render free-tier cold starts (~30-60s spin-up) ---
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 2000; // 2s, then 4s, then 8s
const REQUEST_TIMEOUT_MS = 20000; // 20s safety net per attempt

async function handleResponse(response: Response) {
  if (!response.ok) {
    // 401 = expired/invalid token
    if (response.status === 401) {
      const err = new Error('Session expired. Please log in again.');
      (err as any).status = 401;
      throw err;
    }
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Retries a fetch call with exponential backoff when it fails due to
 * network errors (service spinning up) or 502/503/504 gateway errors.
 * Includes an AbortController timeout to prevent hanging requests.
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retriesLeft: number = MAX_RETRIES,
  delay: number = INITIAL_RETRY_DELAY_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    // Retry on gateway errors (Render returns these while spinning up)
    if ((response.status === 502 || response.status === 503 || response.status === 504) && retriesLeft > 0) {
      await new Promise((r) => setTimeout(r, delay));
      return fetchWithRetry(url, options, retriesLeft - 1, delay * 2);
    }
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    // Network error or timeout (service completely down / spinning up)
    if (retriesLeft > 0) {
      await new Promise((r) => setTimeout(r, delay));
      return fetchWithRetry(url, options, retriesLeft - 1, delay * 2);
    }
    throw error;
  }
}

// --- Backend warm-up with readiness tracking ---
let _backendReady: Promise<void> | null = null;

/**
 * Warm up the backend on app load. Returns a promise that resolves
 * once the backend is confirmed reachable (or after max attempts).
 * Subsequent dashboards can await this before firing their API calls.
 */
export function warmUpBackend(): Promise<void> {
  if (_backendReady) return _backendReady;
  _backendReady = (async () => {
    for (let i = 0; i < 3; i++) {
      try {
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 15000);
        const res = await fetch(`${API_BASE_URL}/api-docs`, {
          method: 'GET',
          signal: controller.signal,
        });
        clearTimeout(tid);
        if (res.ok || res.status < 500) return; // backend is up
      } catch {
        // wait before retry
        if (i < 2) await new Promise((r) => setTimeout(r, 3000));
      }
    }
    // Give up silently — fetchWithRetry will handle per-request retries
  })();
  return _backendReady;
}

/** Wait for backend to be ready (non-blocking if already warm) */
export function waitForBackend(): Promise<void> {
  return _backendReady || Promise.resolve();
}

export const api = {
  get: async (endpoint: string, token?: string) => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetchWithRetry(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers,
    });
    
    return handleResponse(response);
  },
  
  post: async (endpoint: string, data: any, token?: string) => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetchWithRetry(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    
    return handleResponse(response);
  },
  
  put: async (endpoint: string, data: any, token?: string) => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetchWithRetry(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
    
    return handleResponse(response);
  },
  
  delete: async (endpoint: string, token?: string) => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetchWithRetry(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers,
    });
    
    return handleResponse(response);
  },

  uploadFile: async (endpoint: string, file: File, fieldName: string = 'file', additionalFields?: Record<string, string>, token?: string) => {
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const formData = new FormData();
    formData.append(fieldName, file);
    if (additionalFields) {
      Object.entries(additionalFields).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const response = await fetchWithRetry(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    return handleResponse(response);
  },
};
