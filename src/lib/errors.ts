import axios from 'axios';

export function getApiError(err: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(err)) {
    if (err.code === 'ECONNABORTED') {
      return 'Request timed out. Check that the backend is running (npm run dev) and try again.';
    }
    if (!err.response) {
      return 'Cannot reach server. Run npm run dev from the project root and open http://localhost:5173';
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
