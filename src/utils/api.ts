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

export const api = {
  get: async <T>(endpoint: string, params?: Record<string, string>): Promise<T> => {
    let url = endpoint;
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
    return res.json() as Promise<T>;
  },

  post: async <T>(endpoint: string, body: any): Promise<T> => {
    const res = await fetch(endpoint, {
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
    const res = await fetch(endpoint, {
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
    const res = await fetch(endpoint, {
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
