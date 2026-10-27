/**
 * Compact recipe authoring. Authors (or the offline LLM draft step) write only what a cook would
 * write; every tag in `derived` is computed later from the ingredient master (lib/derive.ts).
 */
import type {
  Cuisine,
  Equipment,
  RecipeSource,
  RecipeUnit,
  TestGroup,
} from '../../src/data/content/schema.ts';

type IngTuple = [id: string, qty: number, unit: RecipeUnit, prep?: string];
type StepInput = string | [text: string, timerSec: number];

const GRADIENT: Record<Cuisine, string> = {
  american: 'american',
  mexican: 'mexican',
  italian: 'italian',
  asian: 'asian',
  mediterranean: 'mediterranean',
  sheet_pan: 'sheetPan',
  bowls: 'bowls',
  soups: 'soups',
};

export type RecipeInput = {
  id: string;
  title: string;
  cuisine: Cuisine;
  minutes: number;
  medium?: boolean;
  serves?: number;
  equip: Equipment[];
  kid?: boolean;
  /** Defaults to true; set false for anything with real heat. */
  mild?: boolean;
  leftover?: boolean;
  hosts?: TestGroup[];
  emoji: string;
  ing: IngTuple[];
  steps: StepInput[];
};

export function r(x: RecipeInput): RecipeSource {
  const out: RecipeSource = {
    id: x.id,
    title: x.title,
    cuisine: x.cuisine,
    minutes: x.minutes,
    difficulty: x.medium ? 'medium' : 'easy',
    servingsBase: x.serves ?? 4,
    equipment: x.equip,
    ingredients: x.ing.map(([ingredientId, qty, unit, prep]) =>
      prep ? { ingredientId, qty, unit, prep } : { ingredientId, qty, unit },
    ),
    steps: x.steps.map((s) =>
      typeof s === 'string' ? { text: s } : { text: s[0], timerSec: s[1] },
    ),
    kidFriendly: x.kid ?? false,
    mild: x.mild ?? true,
    imageKey: `${GRADIENT[x.cuisine]}:${x.emoji}`,
  };
  if (x.leftover) out.leftoverFriendly = true;
  if (x.hosts && x.hosts.length > 0) out.testSlot = { canHost: x.hosts };
  return out;
}
