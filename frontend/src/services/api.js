import axios from 'axios';
import { TOKEN_STORAGE_KEY } from '../redux/authSlice.js';

function resolveApiBaseUrl() {
  const raw = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');
  if (!raw || raw === '/api') return '/api';
  return raw.endsWith('/api') ? raw : `${raw}/api`;
}

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      error.userMessage = error.response.data?.message || 'Something went wrong. Please try again.';
    } else if (error.code === 'ECONNABORTED') {
      error.userMessage = 'The server took too long to respond (Render free tier may be waking up — try again in a few seconds).';
    } else {
      error.userMessage = 'Cannot reach the server. Check your backend URL or connection.';
    }
    return Promise.reject(error);
  }
);

export default api;
