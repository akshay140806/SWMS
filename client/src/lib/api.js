import axios from 'axios';

const rawBase = import.meta.env.VITE_API_URL || '';
const cleanBase = rawBase ? rawBase.replace(/\/+$/, '') : '';
const baseURL = cleanBase ? `${cleanBase}/api` : '/api';

const api = axios.create({ baseURL });
api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem('token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && !location.pathname.startsWith('/login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      location.href = '/login';
    }
    return Promise.reject(err);
  }
);
export default api;
