import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const api = axios.create({ baseURL: API_URL, withCredentials: true });

api.interceptors.request.use((config) => {
  const token = Cookies.get('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: unknown) => void; reject: (e: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            return api(original);
          })
          .catch((e) => Promise.reject(e));
      }

      original._retry = true;
      isRefreshing = true;

      const refreshToken = Cookies.get('refreshToken');
      if (!refreshToken) {
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        Cookies.set('accessToken', data.accessToken, { expires: 1 / 96 });
        Cookies.set('refreshToken', data.refreshToken, { expires: 7 });
        processQueue(null, data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (e) {
        processQueue(e, null);
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        window.location.href = '/login';
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: Record<string, unknown>) =>
    api.post('/auth/register', data),
  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refreshToken }),
  me: () => api.get('/auth/me'),
};

// Admin
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getAdmins: () => api.get('/admin/admins'),
  createAdmin: (data: Record<string, unknown>) => api.post('/admin/admins', data),
  deactivateAdmin: (id: string) => api.patch(`/admin/admins/${id}/deactivate`),
  reactivateAdmin: (id: string) => api.patch(`/admin/admins/${id}/reactivate`),

  getClients: (params?: Record<string, string>) =>
    api.get('/admin/clients', { params }),
  getClient: (id: string) => api.get(`/admin/clients/${id}`),
  createClient: (data: Record<string, unknown>) => api.post('/admin/clients', data),
  updateClient: (id: string, data: Record<string, unknown>) =>
    api.put(`/admin/clients/${id}`, data),

  getProperties: (params?: Record<string, string>) =>
    api.get('/admin/properties', { params }),
  createProperty: (data: Record<string, unknown>) => api.post('/admin/properties', data),
  updateProperty: (id: string, data: Record<string, unknown>) =>
    api.put(`/admin/properties/${id}`, data),

  createAllocation: (data: Record<string, unknown>) =>
    api.post('/admin/allocations', data),

  getTickets: (params?: Record<string, string>) =>
    api.get('/admin/tickets', { params }),
  getTicket: (id: string) => api.get(`/admin/tickets/${id}`),
  updateTicket: (id: string, data: Record<string, unknown>) =>
    api.put(`/admin/tickets/${id}`, data),
  addTicketMessage: (id: string, data: Record<string, unknown>) =>
    api.post(`/admin/tickets/${id}/messages`, data),

  getReports: (params?: Record<string, string>) =>
    api.get('/admin/reports', { params }),
  createReport: (data: Record<string, unknown>) => api.post('/admin/reports', data),
  updateReport: (id: string, data: Record<string, unknown>) =>
    api.put(`/admin/reports/${id}`, data),

  // Inspections
  getInspections: (params?: Record<string, string>) =>
    api.get('/admin/inspections', { params }),
  getInspection: (id: string) => api.get(`/admin/inspections/${id}`),
  createInspection: (data: Record<string, unknown>) => api.post('/admin/inspections', data),
};

// Client
export const clientAPI = {
  getDashboard: () => api.get('/client/dashboard'),
  getProfile: () => api.get('/client/profile'),
  updateProfile: (data: Record<string, unknown>) => api.put('/client/profile', data),

  getTickets: (params?: Record<string, string>) =>
    api.get('/client/tickets', { params }),
  getTicket: (id: string) => api.get(`/client/tickets/${id}`),
  createTicket: (data: Record<string, unknown>) => api.post('/client/tickets', data),
  addMessage: (id: string, data: Record<string, unknown>) =>
    api.post(`/client/tickets/${id}/messages`, data),
};
