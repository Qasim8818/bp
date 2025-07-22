import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  adminLogin: (email, password) =>
    api.post('/auth/admin/login', { email, password }),
    
  getCurrentAdmin: () =>
    api.get('/admin/profile'),
};
