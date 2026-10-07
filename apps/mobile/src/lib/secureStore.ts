import * as SecureStore from 'expo-secure-store';
import type { User } from '@pms/shared';

/**
 * Tokens live only in the OS secure store (Android Keystore / iOS Keychain),
 * never in AsyncStorage or other plain storage.
 */
const ACCESS = 'pf_access_token';
const REFRESH = 'pf_refresh_token';
const USER = 'pf_user';

export const tokenStore = {
  getAccess: () => SecureStore.getItemAsync(ACCESS),
  getRefresh: () => SecureStore.getItemAsync(REFRESH),
  async save(access: string, refresh: string) {
    await Promise.all([SecureStore.setItemAsync(ACCESS, access), SecureStore.setItemAsync(REFRESH, refresh)]);
  },
  /** Last known profile, so the app can open (with cached data) when started offline. */
  async saveUser(user: User) {
    await SecureStore.setItemAsync(USER, JSON.stringify(user));
  },
  async getUser(): Promise<User | null> {
    const raw = await SecureStore.getItemAsync(USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  },
  async clear() {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS),
      SecureStore.deleteItemAsync(REFRESH),
      SecureStore.deleteItemAsync(USER),
    ]);
  },
};
