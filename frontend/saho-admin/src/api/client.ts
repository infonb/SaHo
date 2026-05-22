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

// Request interceptor - runs before each request
apiClient.interceptors.request.use(
  (config) => {
    // Get authentication token from localStorage
    const token = localStorage.getItem('saho_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add custom headers if needed
    config.headers['X-Requested-With'] = 'XMLHttpRequest';

    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
      baseURL: config.baseURL,
      params: config.params,
    });

    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response interceptor - runs after each response
apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
      status: response.status,
      statusText: response.statusText,
    });
    return response;
  },
  (error: AxiosError) => {
    // Handle different error types
    if (error.response) {
      // Server responded with error status
      console.error(`[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
      });

      // Handle 401 Unauthorized - redirect to login
      if (error.response.status === 401) {
        localStorage.removeItem('saho_token');
        localStorage.removeItem('saho_user');
        window.location.href = '/login';
      }

      // Handle 403 Forbidden
      if (error.response.status === 403) {
        console.error('Access forbidden. You do not have permission to perform this action.');
      }

      // Handle 404 Not Found
      if (error.response.status === 404) {
        console.error('Resource not found.');
      }

      // Handle 500+ Server Errors
      if (error.response.status >= 500) {
        console.error('Server error. Please try again later.');
      }
    } else if (error.request) {
      // Request was made but no response received (CORS issue or network error)
      console.error('[API Network Error] No response received:', error.message);

      // Check if this is a CORS error
      if (error.message.includes('Network Error')) {
        console.error('CORS Error: The server may not be running or CORS is not configured properly.');
        console.error('Please ensure:');
        console.error('1. Backend is running on http://localhost:8080');
        console.error('2. Frontend is running on http://localhost:5173 or http://localhost:3000');
        console.error('3. CORS is configured in Spring Boot WebConfig');
      }
    } else {
      // Error in setting up the request
      console.error('[API Setup Error]', error.message);
    }

    return Promise.reject(error);
  }
);

// Export default for use in other API modules
export default apiClient;