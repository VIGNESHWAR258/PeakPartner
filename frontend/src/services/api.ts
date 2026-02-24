const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// --- Retry config for Render free-tier cold starts (~30-60s spin-up) ---
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 2000; // 2s, then 4s, then 8s

async function handleResponse(response: Response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Retries a fetch call with exponential backoff when it fails due to
 * network errors (service spinning up) or 502/503/504 gateway errors.
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retriesLeft: number = MAX_RETRIES,
  delay: number = INITIAL_RETRY_DELAY_MS
): Promise<Response> {
  try {
    const response = await fetch(url, options);
    // Retry on gateway errors (Render returns these while spinning up)
    if ((response.status === 502 || response.status === 503 || response.status === 504) && retriesLeft > 0) {
      await new Promise((r) => setTimeout(r, delay));
      return fetchWithRetry(url, options, retriesLeft - 1, delay * 2);
    }
    return response;
  } catch (error) {
    // Network error (service completely down / spinning up)
    if (retriesLeft > 0) {
      await new Promise((r) => setTimeout(r, delay));
      return fetchWithRetry(url, options, retriesLeft - 1, delay * 2);
    }
    throw error;
  }
}

/**
 * Warm up the backend on app load so it's ready by the time the user interacts.
 * Fires a lightweight GET and ignores the result.
 */
export function warmUpBackend() {
  fetch(`${API_BASE_URL}/api-docs`, { method: 'GET' }).catch(() => {
    // Silently ignore — this is just a wake-up ping
  });
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
