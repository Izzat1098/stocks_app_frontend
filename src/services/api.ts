import axios from 'axios';
import { AuthResponse, UserLogin, UserRegistration, User } from '../types';
import { StockData } from '../services/stockService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // console.log('ERRRORRR ', error.response);
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  // Auth service with backend API
  register: async (userData: UserRegistration): Promise<AuthResponse> => {
    const response = await api.post('/users/register', userData);
    return response.data;
  },

  login: async (credentials: UserLogin): Promise<AuthResponse> => {
    const response = await api.post('/users/login', credentials);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  },

  validateToken: async (token: string): Promise<AuthResponse> => {
    // console.log('Validating token:', { 'access_token': token });
    const response = await api.post('/users/validate', { access_token: token });

    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error('Invalid token');
    }    
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    console.log(userStr);

    if (!userStr || userStr === 'undefined' || userStr === 'null') {
      return null;
    }
    const userData: User = JSON.parse(userStr);
    return userData ? userData : null;
  },

  getToken: () => {
    return localStorage.getItem('access_token');
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('access_token');
  },
};


export const aiService = {
// AI service with backend API
  generateDescription: async (stock: StockData): Promise<StockData> => {
    const response = await api.get(`/stocks/${stock.id}/ai_description`);
    return response.data;
  },

};

export default api;