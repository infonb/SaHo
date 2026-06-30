import axios from 'axios';

/**
 * API Client Configuration for SaHo Foundation Admin
 *
 * Handles:
 * - Base URL configuration
 * - Request/Response interceptors
 * - CORS-friendly headers
 * - Token-based authentication
 */

// Use Vite's /api proxy in development to avoid browser CORS issues.
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';
export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Accept': 'application/json',
  },
  timeout: 12000,
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  const token = localStorage.getItem('saho_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - runs after each response
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || 'unknown url';
    const method = err.config?.method?.toUpperCase() || 'UNKNOWN';
    console.error('[apiClient] response error', method, url, err.response?.status, err.message, err);
    if (err.response?.status === 401) {
      localStorage.removeItem('saho_token');
      localStorage.removeItem('saho_user');
      window.location.href = '/login';
    }

    return Promise.reject(err);
  }
);

// Export default for use in other API modules
export default apiClient;
