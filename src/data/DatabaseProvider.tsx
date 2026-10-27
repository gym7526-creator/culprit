import { SQLiteProvider, type SQLiteDatabase } from 'expo-sqlite';
import type { PropsWithChildren } from 'react';

import { migrateDb } from './migrations';

export const DATABASE_NAME = 'culprit.db';

async function initializeDatabase(db: SQLiteDatabase): Promise<void> {
  await migrateDb(db);
}

/** Opens the on-device health database and runs migrations before rendering children. */
export function DatabaseProvider({ children }: PropsWithChildren) {
  return (
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={initializeDatabase}>
      {children}
    </SQLiteProvider>
  );
}
