import 'react-native-url-polyfill/auto';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';

// SecureStore (Android Keystore) limits values to ~2KB, so session tokens are stored in chunks.
const CHUNK = 1800;
const secureStorage = {
  async getItem(key: string) {
    const count = Number((await SecureStore.getItemAsync(`${key}.n`)) ?? 0);
    if (!count) return null;
    const parts: string[] = [];
    for (let i = 0; i < count; i++) parts.push((await SecureStore.getItemAsync(`${key}.${i}`)) ?? '');
    return parts.join('');
  },
  async setItem(key: string, value: string) {
    const previous = Number((await SecureStore.getItemAsync(`${key}.n`)) ?? 0);
    const total = Math.ceil(value.length / CHUNK);
    for (let i = 0; i < total; i++) await SecureStore.setItemAsync(`${key}.${i}`, value.slice(i * CHUNK, (i + 1) * CHUNK));
    await SecureStore.setItemAsync(`${key}.n`, String(total));
    for (let i = total; i < previous; i++) await SecureStore.deleteItemAsync(`${key}.${i}`);
  },
  async removeItem(key: string) {
    const count = Number((await SecureStore.getItemAsync(`${key}.n`)) ?? 0);
    for (let i = 0; i < count; i++) await SecureStore.deleteItemAsync(`${key}.${i}`);
    await SecureStore.deleteItemAsync(`${key}.n`);
  },
};

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
export const isConfigured = Boolean(url && anonKey);

// Only the public anon key is used here. All authorization is enforced by RLS + SECURITY DEFINER functions.
export const supabase = createClient(url || 'http://localhost', anonKey || 'missing', {
  auth: { storage: secureStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
});
