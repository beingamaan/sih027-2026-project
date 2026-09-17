import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor injecting JWT Bearer token into all requests & normalizing api path
api.interceptors.request.use((config) => {
  // Prevent duplicate /api if baseURL ends with /api and request url also starts with /api
  if (config.baseURL?.endsWith('/api') && config.url?.startsWith('/api')) {
    config.url = config.url.replace(/^\/api/, '');
  }
  const token = sessionStorage.getItem('sih_access_token') || localStorage.getItem('sih_access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});
