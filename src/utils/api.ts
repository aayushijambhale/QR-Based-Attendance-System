/**
 * Centralized API and communication module.
 * Acts as an Axios proxy helper with built-in token authentication headers.
 */

const getHeaders = (): HeadersInit => {
  const token = localStorage.getItem('qr_admin_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const BASE_URL = import.meta.env.VITE_API_URL || '';

export const api = {
  get: async <T>(endpoint: string, params?: Record<string, string>): Promise<T> => {
    let url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
    if (params) {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.append(key, val);
        }
      });
      const qStr = query.toString();
      if (qStr) url += `?${qStr}`;
    }

    const res = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP error ${res.status}`);
    }

    try {
      const clone = res.clone();
      try {
        return await res.json() as T;
      } catch (jsonErr: any) {
        const textBody = await clone.text().catch(() => "FAILED TO READ TEXT");
        console.error(`[API PARSE ERROR] URL: ${url} | Status: ${res.status} | Content-Type: ${res.headers.get('content-type')} | Body Start: ${textBody.substring(0, 300)}`);
        throw jsonErr;
      }
    } catch (cloneErr: any) {
      return res.json() as Promise<T>;
    }
  },

  post: async <T>(endpoint: string, body: any): Promise<T> => {
    const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP error ${res.status}`);
    }
    return res.json() as Promise<T>;
  },

  put: async <T>(endpoint: string, body: any): Promise<T> => {
    const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
    const res = await fetch(url, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP error ${res.status}`);
    }
    return res.json() as Promise<T>;
  },

  delete: async <T>(endpoint: string): Promise<T> => {
    const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP error ${res.status}`);
    }
    return res.json() as Promise<T>;
  },
};
