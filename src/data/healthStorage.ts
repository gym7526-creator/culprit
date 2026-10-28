/**
 * Synchronous Zustand storage backed by the on-device SQLite database, for health-related state
 * (onboarding answers). Spec §3/§14: health data stays in SQLite, never in general prefs or analytics.
 */
import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';
import type { StateStorage } from 'zustand/middleware';

import { DATABASE_NAME } from './DatabaseProvider';

let db: SQLiteDatabase | null = null;

function database(): SQLiteDatabase {
  if (!db) {
    db = openDatabaseSync(DATABASE_NAME);
    // The provider's migration also creates this; doing it here too keeps hydration order-independent.
    db.execSync(
      'CREATE TABLE IF NOT EXISTS health_kv (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);',
    );
  }
  return db;
}

export const healthStorage: StateStorage = {
  getItem: (key) =>
    database().getFirstSync<{ value: string }>('SELECT value FROM health_kv WHERE key = ?', key)
      ?.value ?? null,
  setItem: (key, value) => {
    database().runSync('INSERT OR REPLACE INTO health_kv (key, value) VALUES (?, ?)', key, value);
  },
  removeItem: (key) => {
    database().runSync('DELETE FROM health_kv WHERE key = ?', key);
  },
};
