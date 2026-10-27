import { LATEST_SCHEMA_VERSION, migrateDb, migrations, type MigratableDb } from '@/data/migrations';

/** Minimal fake: records SQL and tracks PRAGMA user_version. */
function fakeDb(initialVersion: number, failOn?: RegExp) {
  let version = initialVersion;
  const executed: string[] = [];
  let inTransaction = false;
  const db: MigratableDb = {
    async execAsync(sql) {
      if (failOn?.test(sql)) throw new Error('boom');
      executed.push(sql);
      const m = /PRAGMA user_version = (\d+)/.exec(sql);
      if (m?.[1]) version = Number(m[1]);
    },
    async getFirstAsync<T>() {
      return { user_version: version } as T;
    },
    async withTransactionAsync(task) {
      const snapshot = version;
      inTransaction = true;
      try {
        await task();
      } catch (e) {
        version = snapshot; // rollback
        throw e;
      } finally {
        inTransaction = false;
      }
    },
  };
  return { db, executed, version: () => version, inTransaction: () => inTransaction };
}

describe('migrations', () => {
  it('versions are unique, ascending and start at 1', () => {
    const versions = migrations.map((m) => m.version);
    expect(versions[0]).toBe(1);
    expect([...versions].sort((a, b) => a - b)).toEqual(versions);
    expect(new Set(versions).size).toBe(versions.length);
    expect(LATEST_SCHEMA_VERSION).toBe(versions[versions.length - 1]);
  });

  it('migrates a fresh database to the latest version', async () => {
    const f = fakeDb(0);
    await expect(migrateDb(f.db)).resolves.toBe(LATEST_SCHEMA_VERSION);
    expect(f.version()).toBe(LATEST_SCHEMA_VERSION);
    expect(f.executed.join('\n')).toContain('CREATE TABLE IF NOT EXISTS checkins');
  });

  it('enables WAL and foreign keys outside the transaction', async () => {
    const f = fakeDb(0);
    await migrateDb(f.db);
    expect(f.executed[0]).toContain('journal_mode = WAL');
    expect(f.executed[0]).toContain('foreign_keys = ON');
  });

  it('is a no-op when already up to date', async () => {
    const f = fakeDb(LATEST_SCHEMA_VERSION);
    await migrateDb(f.db);
    expect(f.executed).toHaveLength(1); // only the connection PRAGMAs
  });

  it('refuses a database newer than the app', async () => {
    const f = fakeDb(LATEST_SCHEMA_VERSION + 1);
    await expect(migrateDb(f.db)).rejects.toThrow(/newer/);
  });

  it('rolls back the version when a migration fails', async () => {
    const f = fakeDb(0, /CREATE TABLE/);
    await expect(migrateDb(f.db)).rejects.toThrow('boom');
    expect(f.version()).toBe(0);
  });

  it('check-ins constrain the score to the 0–4 scale', () => {
    const sql = migrations.find((m) => m.version === 1)?.sql ?? '';
    expect(sql).toContain('CHECK (score BETWEEN 0 AND 4)');
  });
});
