import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../config';
import { tokenStorage } from '../auth/tokenStorage';

type RefreshCallback = () => Promise<void>;
let onUnauthorized: RefreshCallback | null = null;

export function setUnauthorizedHandler(cb: RefreshCallback | null): void {
  onUnauthorized = cb;
}

function createClient(): AxiosInstance {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 20000,
  });

  instance.interceptors.request.use(async (cfg) => {
    const token = await tokenStorage.getAccess();
    if (token) {
      cfg.headers = cfg.headers ?? {};
      cfg.headers.Authorization = `Bearer ${token}`;
    }
    return cfg;
  });

  instance.interceptors.response.use(
    (r) => r,
    async (err) => {
      const status = err?.response?.status;
      if (status === 401 && onUnauthorized) {
        try {
          await onUnauthorized();
        } catch {
          /* swallow */
        }
      }
      return Promise.reject(err);
    },
  );

  return instance;
}

export const apiClient = createClient();

export async function apiRequest<T>(
  cfg: AxiosRequestConfig,
): Promise<T> {
  const res = await apiClient.request<T>(cfg);
  return res.data;
}

/** Extracts a user-facing message from an axios error. */
export function getApiErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(err)) {
    if (!err.response && err.message === 'Network Error') {
      return `Network Error (API: ${API_BASE_URL})`;
    }
    const data = err.response?.data as unknown;
    if (data && typeof data === 'object') {
      const msg = (data as { message?: unknown }).message;
      if (typeof msg === 'string') return msg;
      if (Array.isArray(msg) && msg.length > 0 && typeof msg[0] === 'string')
        return msg[0];
    }
    if (err.message) return err.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
