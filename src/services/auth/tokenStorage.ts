import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const ACCESS_KEY = 'foothost.accessToken';
const REFRESH_KEY = 'foothost.refreshToken';

/**
 * Prefer SecureStore (native iOS Keychain / Android Keystore) when available;
 * fall back to AsyncStorage on web (SecureStore is native-only).
 */
const useSecure = Platform.OS === 'ios' || Platform.OS === 'android';

async function setItem(key: string, value: string): Promise<void> {
  if (useSecure) await SecureStore.setItemAsync(key, value);
  else await AsyncStorage.setItem(key, value);
}

async function getItem(key: string): Promise<string | null> {
  if (useSecure) return SecureStore.getItemAsync(key);
  return AsyncStorage.getItem(key);
}

async function removeItem(key: string): Promise<void> {
  if (useSecure) await SecureStore.deleteItemAsync(key);
  else await AsyncStorage.removeItem(key);
}

export const tokenStorage = {
  async save(access: string, refresh?: string): Promise<void> {
    await setItem(ACCESS_KEY, access);
    if (refresh) await setItem(REFRESH_KEY, refresh);
  },
  getAccess: () => getItem(ACCESS_KEY),
  getRefresh: () => getItem(REFRESH_KEY),
  async clear(): Promise<void> {
    await removeItem(ACCESS_KEY);
    await removeItem(REFRESH_KEY);
  },
};
