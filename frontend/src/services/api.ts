import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor injecting JWT Bearer token into all requests
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('sih_access_token') || localStorage.getItem('sih_access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});
