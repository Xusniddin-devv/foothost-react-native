import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Backend base URL.
 *
 * Priority (first defined wins):
 * 1. `EXPO_PUBLIC_API_URL` env var (explicit override).
 * 2. Production default Heroku API URL.
 *
 * Optional local dev mode:
 * Set `EXPO_PUBLIC_USE_LOCAL_API=true` to route API calls to local backend
 * (`http://<expo-host-ip>:3000` or Android emulator `10.0.2.2:3000`).
 */
function resolveBaseUrl(): string {
  const defaultProdUrl = 'https://still-mountain-91803-673a3b81f512.herokuapp.com';
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } })
    .process?.env;
  const envUrl = env?.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl.replace(/\/+$/, '');

  const useLocalApi = env?.EXPO_PUBLIC_USE_LOCAL_API === 'true';
  if (!useLocalApi) return defaultProdUrl;

  const hostUri =
    (Constants.expoConfig?.hostUri as string | undefined) ??
    (Constants.expoGoConfig?.debuggerHost as string | undefined) ??
    (Constants.manifest2?.extra?.expoGo?.debuggerHost as string | undefined);

  if (hostUri) {
    const host = hostUri.split(':')[0];
    return `http://${host}:3000`;
  }

  if (Platform.OS === 'android') return 'http://10.0.2.2:3000';
  return defaultProdUrl;
}

export const API_BASE_URL = resolveBaseUrl();
export const SOCKET_URL = API_BASE_URL;

export const config = {
  apiBaseUrl: API_BASE_URL,
  socketUrl: SOCKET_URL,
};
