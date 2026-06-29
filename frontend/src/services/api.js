import axios from 'axios';
import { v4 as uuid } from 'uuid';

// Resolve backend target URL from environment variables, defaulting to local Spring Boot port
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:9526' : '/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Inject JWT Bearer token once auth is implemented
api.interceptors.request.use(
  (config) => {
    // Generate a correlation ID for request tracing
    config.headers['X-Correlation-ID'] = uuid();

    // JWT token lookup placeholder
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    console.log(`[API Request] ${config.method.toUpperCase()} -> ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Unified error handler
api.interceptors.response.use(
  (response) => {
    return response.data; // Directly return the backend's ApiResponse envelope
  },
  (error) => {
    const errorDetails = {
      message: 'A connection error occurred. Please try again.',
      status: error.response?.status || 500,
      errors: [],
    };

    if (error.response) {
      // Backend returned an error response
      const apiResponse = error.response.data;
      errorDetails.message = apiResponse?.message || 'Server error occurred.';
      errorDetails.errors = apiResponse?.errors || [];
      console.error(`[API Error] Response received: ${errorDetails.status} - ${errorDetails.message}`, errorDetails.errors);
      
      // Auto logout on unauthorized
      if (errorDetails.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (!window.location.pathname.includes('/auth') && window.location.pathname !== '/' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    } else if (error.request) {
      // Request was sent but no response came back
      errorDetails.message = 'No response received from server. Verify backend is running.';
      console.error('[API Error] No response from server.');
    } else {
      // Error building request
      errorDetails.message = error.message;
      console.error('[API Error] Request config failed:', error.message);
    }

    // Dispatch global event for ToastProvider
    window.dispatchEvent(new CustomEvent('api-error', { detail: errorDetails }));

    return Promise.reject(errorDetails);
  }
);

export default api;
