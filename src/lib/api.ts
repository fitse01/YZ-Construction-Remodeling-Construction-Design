import axios from 'axios';

// When VITE_API_URL is not set (in production or when proxied by Vite/Nginx),
// default to empty string so requests use relative URLs (/api/...).
export const API_BASE = import.meta.env.VITE_API_URL || '';

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

export default api;
