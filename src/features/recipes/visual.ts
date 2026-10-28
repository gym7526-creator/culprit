import type { Recipe } from '@/data/content/schema';
import { recipePhotos, type RecipePhoto } from '@/data/photos';
import type { GradientKey } from '@/theme';

export function recipeVisual(r: Recipe): {
  gradient: GradientKey;
  emoji: string;
  photo: RecipePhoto | null;
} {
  const [gradient, emoji] = r.imageKey.split(':');
  return {
    gradient: (gradient ?? 'bowls') as GradientKey,
    emoji: emoji ?? '🍽️',
    photo: recipePhotos[r.id] ?? null,
  };
}
