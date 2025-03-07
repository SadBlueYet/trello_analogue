import axios from 'axios';
import { API_BASE_URL } from '../config';
import { getToken, removeToken } from '../utils/token';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Remove default headers for OPTIONS request
axiosInstance.interceptors.request.use(
  (config) => {
    // Don't add headers for OPTIONS requests
    if (config.method?.toUpperCase() === 'OPTIONS') {
      return config;
    }

    const { token, type } = getToken();
    if (token && type) {
      config.headers.Authorization = `${type} ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only handle 401 errors for non-auth requests and when we're not already on the login page
    if (error.response?.status === 401 && 
        !error.config.url.includes('/auth/') && 
        window.location.pathname !== '/login') {
      // Clear the token
      removeToken();
      // Store the current URL to redirect back after login
      sessionStorage.setItem('redirectUrl', window.location.pathname);
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance; 