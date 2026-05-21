import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 12000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('saho_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('saho_token');
      localStorage.removeItem('saho_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);
