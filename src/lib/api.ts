import axios from 'axios';

export const API_BASE = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  timeout: 15000,
});

let refreshing = false;
let queue: Array<() => void> = [];

function skipRefresh(url?: string) {
  if (!url) return false;
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/register') ||
    url.includes('/auth/me') ||
    url.includes('/auth/refresh') ||
    url.includes('/auth/forgot-password') ||
    url.includes('/auth/reset-password')
  );
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry && !skipRefresh(original?.url)) {
      if (refreshing) {
        return new Promise((resolve) => {
          queue.push(() => resolve(api(original)));
        });
      }
      original._retry = true;
      refreshing = true;
      try {
        await api.post('/api/auth/refresh');
        queue.forEach((cb) => cb());
        queue = [];
        return api(original);
      } catch {
        queue = [];
        return Promise.reject(error);
      } finally {
        refreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;

export async function uploadFile(file: File, folder = 'posts') {
  const form = new FormData();
  form.append('file', file);
  form.append('folder', folder);
  const { data } = await api.post('/api/posts/upload', form);
  return data.url as string;
}
