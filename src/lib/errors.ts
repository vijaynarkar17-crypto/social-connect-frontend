import axios from 'axios';
import { API_BASE } from '@/lib/api';

export function getApiError(err: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(err)) {
    if (err.code === 'ECONNABORTED') {
      return 'Request timed out. Check that the backend is running (npm run dev) and try again.';
    }
    if (!err.response) {
      return API_BASE
        ? 'Cannot reach server. Check that the backend is running and VITE_API_URL is correct.'
        : 'Cannot reach server. Run npm run dev from the project root.';
    }
    const data = err.response.data as { error?: string } | undefined;
    if (err.response.status === 429) {
      return data?.error || 'Too many attempts. Please wait a minute.';
    }
    return data?.error || fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
