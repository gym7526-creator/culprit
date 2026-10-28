import type { ImageSourcePropType } from 'react-native';

/**
 * Licensed stock photos per recipe, written by `npm run content:photos` (Pexels API, free for
 * commercial use). Recipes without a photo use the gradient + emoji style. Credits are shown on the
 * recipe screen and listed in Settings → Data attribution.
 */
export type RecipePhoto = { source: ImageSourcePropType; credit: string; url: string };

export const recipePhotos: Readonly<Record<string, RecipePhoto>> = {};
