import axios, { AxiosError, AxiosRequestConfig } from 'axios';

/**
 * API Client Configuration for SaHo Foundation Admin
 *
 * Handles:
 * - Base URL configuration
 * - Request/Response interceptors
 * - CORS-friendly headers
 * - Token-based authentication
 */

// Determine API base URL from environment or default to localhost:8080
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api';
const DEBUG_DISABLE_AUTH = true;
const DEBUG_DISABLE_401_REDIRECT = true;

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    // Explicitly set headers that trigger CORS preflight
    // These are needed for CORS to work properly
    'Accept': 'application/json',
  },
  timeout: 12000,
  // withCredentials is crucial for CORS when using authentication
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('saho_token');
  if (!DEBUG_DISABLE_AUTH && token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    console.warn('[apiClient] auth header injection disabled for debugging');
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
    if (!DEBUG_DISABLE_401_REDIRECT && err.response?.status === 401) {
      localStorage.removeItem('saho_token');
      localStorage.removeItem('saho_user');
      window.location.href = '/login';
    }

    return Promise.reject(err);
  }
);

// Export default for use in other API modules
export default apiClient;