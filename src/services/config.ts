import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Backend base URL.
 *
 * Priority (first defined wins):
 * 1. `EXPO_PUBLIC_API_URL` env var (recommended for device builds).
 * 2. Dev Expo host IP (automatically detected when running Expo Go / dev client).
 * 3. Platform-aware localhost default (10.0.2.2 on Android emulator).
 */
function resolveBaseUrl(): string {
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } })
    .process?.env;
  const envUrl = env?.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl.replace(/\/+$/, '');

  const hostUri =
    (Constants.expoConfig?.hostUri as string | undefined) ??
    (Constants.expoGoConfig?.debuggerHost as string | undefined) ??
    (Constants.manifest2?.extra?.expoGo?.debuggerHost as string | undefined);

  if (hostUri) {
    const host = hostUri.split(':')[0];
    return `http://${host}:3000`;
  }

  if (Platform.OS === 'android') return 'http://10.0.2.2:3000';
  return 'http://localhost:3000';
}

export const API_BASE_URL = resolveBaseUrl();
export const SOCKET_URL = API_BASE_URL;

export const config = {
  apiBaseUrl: API_BASE_URL,
  socketUrl: SOCKET_URL,
};
