/** Skin setup steps (spec §12): one question per screen. ZIP only if not already known. */
export const SKIN_STEPS = [
  'concern',
  'areas',
  'duration',
  'current',
  'sensitive',
  'budget',
  'zip',
  'retailer',
  'check-in',
] as const;
export type SkinStep = (typeof SKIN_STEPS)[number];

export function isSkinStep(s: string): s is SkinStep {
  return (SKIN_STEPS as readonly string[]).includes(s);
}

/** Visible steps: the ZIP may already be known from the stomach onboarding. */
export function skinSteps(hasZip: boolean): SkinStep[] {
  return SKIN_STEPS.filter((s) => (s === 'zip' ? !hasZip : true));
}
