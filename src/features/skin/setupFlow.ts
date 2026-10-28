/** Skin setup steps (spec §12): one question per screen. ZIP and store only if not already known. */
export const SKIN_STEPS = [
  'concern',
  'areas',
  'duration',
  'current',
  'sensitive',
  'budget',
  'zip',
  'store',
  'check-in',
] as const;
export type SkinStep = (typeof SKIN_STEPS)[number];

export function isSkinStep(s: string): s is SkinStep {
  return (SKIN_STEPS as readonly string[]).includes(s);
}

/** Visible steps given what's already known (ZIP/store may come from the stomach onboarding). */
export function skinSteps(hasZip: boolean, hasStore: boolean): SkinStep[] {
  return SKIN_STEPS.filter((s) => (s === 'zip' ? !hasZip : s === 'store' ? !hasStore : true));
}
