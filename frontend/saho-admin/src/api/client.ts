import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api';
const DEBUG_DISABLE_AUTH = true;
const DEBUG_DISABLE_401_REDIRECT = true;

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 12000,
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
