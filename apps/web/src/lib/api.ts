const ROOT_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/api$/, '').replace(/\/$/, '');
const API_BASE = `${ROOT_URL}/api`;

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    ...options.headers,
  };

  if (!(options.body instanceof FormData)) {
    (headers as Record<string, string>)['Content-Type'] = 'application/json';
  }

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (err) {
    console.error('Fetch error:', err);
    throw new ApiError('Error de conexión. Verifica que el servidor esté activo.', 0);
  }

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    throw new ApiError('No autorizado', 401);
  }

  if (!res.ok) {
    let body: Record<string, unknown> = {};
    try {
      const text = await res.text();
      body = JSON.parse(text);
    } catch {
      body = { message: `Error ${res.status}` };
    }
    throw new ApiError(
      (body.message as string) || `Error ${res.status}`,
      res.status,
    );
  }

  const text = await res.text();
  if (!text) return {} as T;
  try {
    return JSON.parse(text);
  } catch (err) {
    console.error('JSON parse error:', err, text);
    throw new ApiError('Error al procesar respuesta del servidor', 0);
  }
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint),

  post: <T>(endpoint: string, data?: unknown) =>
    request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T>(endpoint: string, data?: unknown) =>
    request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(endpoint: string) =>
    request<T>(endpoint, { method: 'DELETE' }),

  upload: <T>(endpoint: string, file: File, fieldName = 'file') => {
    const formData = new FormData();
    formData.append(fieldName, file);
    return request<T>(endpoint, {
      method: 'POST',
      body: formData,
    });
  },

// Special: get PDF as blob
  getPdf: async (endpoint: string): Promise<Blob> => {
    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${endpoint}`, { headers });
    if (!res.ok) throw new ApiError('Error descargando PDF', res.status);
    return res.blob();
  },

  // Special: download file (CSV, Excel, etc.)
  downloadFile: async (endpoint: string, filename: string) => {
    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${endpoint}`, { headers });
    if (!res.ok) throw new ApiError('Error descargando archivo', res.status);
    
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  getFileUrl: (path?: string | null) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${ROOT_URL}${path}`;
  },
};

export { ApiError };
