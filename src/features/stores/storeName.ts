import { content } from '@/data/content';
import type { Answers } from '@/engines/onboarding';

/** The store as the user knows it: their typed name for "Other", else the chain name. */
export function storeLabel(a: Pick<Answers, 'chainId' | 'storeName'>): string {
  if (a.chainId === 'other' && a.storeName?.trim()) return a.storeName.trim();
  return content.chains.chains.find((c) => c.id === a.chainId)?.name ?? '';
}
