import axios from 'axios';
import { useStore } from '../store/useStore';

const API_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '/api/v1' : 'http://localhost:3000/api/v1');

// Criar instância axios
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

// Interceptor para adicionar token
api.interceptors.request.use(
  (config) => {
    const token = useStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratamento de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      useStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (name, email, password) => api.post('/auth/register', { name, email, password }),
  logout: () => api.post('/auth/logout'),
  profile: () => api.get('/auth/profile'),
  refresh: () => api.post('/auth/refresh')
};

// Sessions API
export const sessionsApi = {
  create: (data) => api.post('/sessions', data),
  get: (sessionId) => api.get(`/sessions/${sessionId}`),
  update: (sessionId, data) => api.patch(`/sessions/${sessionId}`, data),
  consent: (sessionId, data) => api.post(`/sessions/${sessionId}/consent`, data),
  list: () => api.get('/sessions'),
  stats: () => api.get('/sessions/stats/overview')
};

// Diagnosis API
export const diagnosisApi = {
  perform: (data) => api.post('/diagnosis', data),
  getGuide: (problemType) => api.get(`/diagnosis/guide/${problemType}`),
  validate: (data) => api.post('/diagnosis/validate', data)
};

// Tickets API
export const ticketsApi = {
  create: (data) => api.post('/tickets', data),
  list: () => api.get('/tickets/my'),
  get: (ticketId) => api.get(`/tickets/${ticketId}`),
  addMessage: (ticketId, content) => api.post(`/tickets/${ticketId}/messages`, { content }),
  stats: () => api.get('/tickets/stats/overview')
};

// Admin API
export const adminApi = {
  dashboard: () => api.get('/admin/dashboard'),
  users: () => api.get('/admin/users'),
  updateUserRole: (userId, role) => api.patch(`/admin/users/${userId}/role`, { role }),
  updateUserStatus: (userId, active) => api.patch(`/admin/users/${userId}/status`, { active }),
  logs: (params) => api.get('/admin/logs', { params }),
  settings: () => api.get('/admin/settings'),
  updateSettings: (data) => api.patch('/admin/settings', data),
  metrics: () => api.get('/admin/metrics')
};

// Technician API
export const technicianApi = {
  dashboard: () => api.get('/technician/dashboard'),
  stats: () => api.get('/technician/stats'),
  resetFlow: (data) => api.post('/technician/reset-flow', data),
  resetGuide: (type) => api.get(`/technician/reset-guide/${type}`),
};

// Clients API
export const clientsApi = {
  list: (params) => api.get('/clients', { params }),
  create: (data) => api.post('/clients', data),
  get: (id) => api.get(`/clients/${id}`),
  update: (id, data) => api.patch(`/clients/${id}`, data),
};

// Devices API
export const devicesApi = {
  list: (params) => api.get('/devices', { params }),
  create: (data) => api.post('/devices', data),
  get: (id) => api.get(`/devices/${id}`),
  check: (imei) => api.post('/technician/reset-flow', { imei }),
};

// Service Orders API
export const serviceOrdersApi = {
  list: (params) => api.get('/service-orders', { params }),
  create: (data) => api.post('/service-orders', data),
  get: (id) => api.get(`/service-orders/${id}`),
  update: (id, data) => api.patch(`/service-orders/${id}`, data),
  complete: (id, data) => api.post(`/service-orders/${id}/complete`, data),
};

// Reports API
export const reportsApi = {
  getByOrder: (orderId) => api.get(`/reports/${orderId}`),
  getByClient: (clientId) => api.get(`/reports/client/${clientId}`),
  generate: (orderId) => api.post('/reports/generate', { orderId }),
};

// Payments API
export const paymentsApi = {
  upload: (proofImage, description) => api.post('/payments/upload', { proofImage, description }),
  myStatus: () => api.get('/payments/my-status'),
  adminPending: () => api.get('/payments/admin/pending'),
  adminAll: () => api.get('/payments/admin/all'),
  adminApprove: (paymentId) => api.post(`/payments/admin/${paymentId}/approve`),
  adminReject: (paymentId, notes) => api.post(`/payments/admin/${paymentId}/reject`, { notes }),
  adminBlockUser: (userId, block) => api.post(`/payments/admin/users/${userId}/block`, { block }),
  adminUsers: () => api.get('/payments/admin/users'),
};

export default api;
