/**
 * Ordered SQLite migrations, tracked by `PRAGMA user_version`.
 * NEVER edit a migration that has shipped: append a new one. Later phases add their own tables
 * (plans, test runs, results, price overrides, grocery checks...) here.
 */
export type Migration = {
  version: number;
  description: string;
  sql: string;
};

export const migrations: readonly Migration[] = [
  {
    version: 1,
    description: 'meta, check-ins, program state',
    sql: `
      CREATE TABLE IF NOT EXISTS meta (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS checkins (
        date TEXT PRIMARY KEY NOT NULL,                 -- local day, YYYY-MM-DD
        score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 4),
        symptoms TEXT NOT NULL DEFAULT '[]',            -- JSON array of symptom ids
        unusual TEXT NOT NULL DEFAULT '[]',             -- JSON array of unusual-day reasons
        test_food_taken INTEGER CHECK (test_food_taken IN (0, 1)),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS program_state (
        id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1), -- single row
        state_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `,
  },
  {
    version: 2,
    description: 'health key-value (onboarding answers), weekly plans',
    sql: `
      CREATE TABLE IF NOT EXISTS health_kv (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS plans (
        week_start TEXT PRIMARY KEY NOT NULL,         -- YYYY-MM-DD of the first planned night
        plan_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `,
  },
];

export const LATEST_SCHEMA_VERSION = migrations.reduce((max, m) => Math.max(max, m.version), 0);

/** The subset of expo-sqlite's SQLiteDatabase the migrator needs (keeps it unit-testable). */
export type MigratableDb = {
  execAsync(source: string): Promise<void>;
  getFirstAsync<T>(source: string): Promise<T | null>;
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
};

export async function migrateDb(db: MigratableDb): Promise<number> {
  // Connection settings must be applied outside the migration transaction.
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  if (row === null) {
    throw new Error('Could not read the database schema version');
  }
  const current = row.user_version;
  if (current > LATEST_SCHEMA_VERSION) {
    throw new Error(
      `Database schema v${current} is newer than this app supports (v${LATEST_SCHEMA_VERSION})`,
    );
  }

  const pending = migrations
    .filter((m) => m.version > current)
    .sort((a, b) => a.version - b.version);
  if (pending.length === 0) {
    return current;
  }

  await db.withTransactionAsync(async () => {
    for (const m of pending) {
      await db.execAsync(m.sql);
    }
    await db.execAsync(`PRAGMA user_version = ${LATEST_SCHEMA_VERSION}`);
  });
  return LATEST_SCHEMA_VERSION;
}
