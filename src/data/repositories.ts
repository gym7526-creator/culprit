/** Small typed repositories over the SQLite schema in migrations.ts. */
import type { SQLiteDatabase } from 'expo-sqlite';

import type { ProgramState } from '@/engines/program';
import type { WeekPlan } from '@/engines/plan';

export async function loadProgram(db: SQLiteDatabase): Promise<ProgramState | null> {
  const row = await db.getFirstAsync<{ state_json: string }>(
    'SELECT state_json FROM program_state WHERE id = 1',
  );
  return row ? (JSON.parse(row.state_json) as ProgramState) : null;
}

export async function saveProgram(db: SQLiteDatabase, state: ProgramState): Promise<void> {
  await db.runAsync(
    'INSERT OR REPLACE INTO program_state (id, state_json, updated_at) VALUES (1, ?, ?)',
    JSON.stringify(state),
    new Date().toISOString(),
  );
}

export async function loadPlan(db: SQLiteDatabase, weekStart: string): Promise<WeekPlan | null> {
  const row = await db.getFirstAsync<{ plan_json: string }>(
    'SELECT plan_json FROM plans WHERE week_start = ?',
    weekStart,
  );
  return row ? (JSON.parse(row.plan_json) as WeekPlan) : null;
}

export async function savePlan(db: SQLiteDatabase, plan: WeekPlan): Promise<void> {
  await db.runAsync(
    'INSERT OR REPLACE INTO plans (week_start, plan_json, created_at) VALUES (?, ?, ?)',
    plan.weekStart,
    JSON.stringify(plan),
    new Date().toISOString(),
  );
}
