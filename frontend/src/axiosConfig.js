// src/axiosConfig.js
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8000/',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the JWT token from localStorage
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;
