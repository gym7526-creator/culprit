/**
 * Recipes, batch 3: gentle on REFLUX (no tomato, citrus, chili, mint, chocolate, caffeine; moderate
 * fat) but with everyday FODMAP ingredients (onion, garlic, wheat, beans, milk, honey). Used by
 * reflux-dominant profiles and in the personal phase.
 */
import type { RecipeSource } from '../../src/data/content/schema.ts';

import { r } from './recipe-helpers.ts';

export const recipesCalmReflux: RecipeSource[] = [
  r({
    id: 'classic_chicken_noodle_soup',
    title: 'Classic chicken noodle soup',
    cuisine: 'soups', minutes: 40, equip: ['stovetop'], kid: true, leftover: true, emoji: '🍜',
    ing: [
      ['broth_chicken', 1900, 'ml'], ['chicken_breast', 500, 'g'], ['onion_yellow', 1, 'each', 'diced'],
      ['carrot', 3, 'each', 'sliced'], ['celery', 2, 'each', 'stalks, sliced'], ['pasta', 170, 'g', 'egg-noodle shapes'],
      ['thyme_dried', 1, 'tsp'], ['olive_oil', 1, 'tbsp'], ['parsley', 0.25, 'each'],
    ],
    steps: [
      ['Soften the onion, carrot and celery in the oil in a large pot.', 360],
      ['Add the broth, chicken and thyme. Simmer until the chicken is cooked through.', 1200],
      'Lift out the chicken and shred it.',
      ['Add the noodles and simmer until tender.', 480],
      'Return the chicken, season with salt and finish with parsley.',
    ],
  }),
  r({
    id: 'garlic_herb_roast_chicken',
    title: 'Garlic herb roast chicken and potatoes',
    cuisine: 'sheet_pan', minutes: 50, equip: ['oven', 'sheet_pan'], kid: true, emoji: '🧄',
    ing: [
      ['chicken_drumsticks', 800, 'g'], ['potato_yukon', 5, 'each', 'chunked'], ['onion_yellow', 1, 'each', 'wedges'],
      ['garlic', 6, 'each', 'cloves, smashed'], ['olive_oil', 1, 'tbsp'], ['rosemary_dried', 1, 'tsp'],
      ['thyme_dried', 1, 'tsp'], ['salt', 1.25, 'tsp'],
    ],
    steps: [
      'Heat the oven to 425°F (220°C).',
      'Toss everything with the oil, herbs and salt on a large sheet pan, with the chicken skin side up.',
      ['Roast until the chicken reaches 175°F (80°C) and the potatoes are golden.', 2700],
    ],
  }),
  r({
    id: 'turkey_meatloaf_mash',
    title: 'Turkey meatloaf with mashed potatoes',
    cuisine: 'american', minutes: 60, equip: ['oven', 'stovetop'], kid: true, leftover: true, emoji: '🍖',
    ing: [
      ['ground_turkey', 680, 'g'], ['onion_yellow', 1, 'each', 'finely diced'], ['panko', 0.75, 'cup'], ['eggs', 1, 'each'],
      ['milk', 0.25, 'cup'], ['dijon_mustard', 2, 'tbsp'], ['maple_syrup', 2, 'tbsp'], ['thyme_dried', 1, 'tsp'],
      ['potato_russet', 4, 'each', 'peeled and cubed'], ['butter', 2, 'tbsp'], ['salt', 1.5, 'tsp'],
    ],
    serves: 6,
    steps: [
      'Heat the oven to 375°F (190°C).',
      'Mix the turkey, onion, panko, egg, 2 tablespoons of milk, thyme, 1 tablespoon of mustard and 1 teaspoon of salt. Shape into a loaf on a lined pan.',
      'Stir the rest of the mustard with the maple syrup and brush it over the loaf.',
      ['Bake until 165°F (74°C) in the center.', 2700],
      ['Boil the potatoes until soft, then mash with the butter, the rest of the milk and salt.', 1200],
      'Rest the meatloaf for 10 minutes, slice and serve with the mash.',
    ],
  }),
  r({
    id: 'creamy_mushroom_chicken',
    title: 'Creamy mushroom chicken with rice',
    cuisine: 'american', minutes: 35, equip: ['stovetop'], emoji: '🍄',
    ing: [
      ['chicken_breast', 600, 'g'], ['mushrooms_button', 227, 'g', 'sliced'], ['onion_yellow', 0.5, 'each', 'diced'],
      ['garlic', 2, 'each', 'cloves, minced'], ['flour', 1, 'tbsp'], ['milk', 1, 'cup'], ['broth_chicken', 120, 'ml'],
      ['thyme_dried', 1, 'tsp'], ['olive_oil', 1, 'tbsp'], ['white_rice', 1.25, 'cup'],
    ],
    steps: [
      ['Cook the rice with 2½ cups of water, covered, on low.', 900],
      ['Season the chicken and cook it in the oil until browned and cooked through. Set aside.', 720],
      ['Cook the onion and mushrooms in the same pan until browned. Add the garlic for 30 seconds.', 360],
      'Sprinkle in the flour, then slowly stir in the milk, broth and thyme.',
      ['Simmer until thickened, then return the chicken to warm through.', 180],
      'Serve over rice.',
    ],
  }),
  r({
    id: 'white_bean_kale_soup',
    title: 'White bean and kale soup',
    cuisine: 'soups', minutes: 30, equip: ['stovetop'], leftover: true, emoji: '🥬',
    ing: [
      ['canned_kidney_beans', 2, 'each', 'cans, rinsed'],
      ['onion_yellow', 1, 'each', 'diced'], ['garlic', 3, 'each', 'cloves, minced'], ['carrot', 2, 'each', 'diced'],
      ['kale', 1, 'each', 'chopped'], ['rosemary_dried', 1, 'tsp'], ['olive_oil', 1, 'tbsp'], ['sourdough_bread', 4, 'each'],
    ],
    steps: [
      ['Soften the onion and carrot in the oil.', 360],
      'Add the garlic and rosemary for 30 seconds.',
      ['Add the beans and 1.5 liters of water with 2 teaspoons of salt. Simmer.', 900],
      ['Mash some of the beans against the pot to thicken, then add the kale and simmer until tender.', 300],
      'Serve with toasted sourdough.',
    ],
  }),
  r({
    id: 'light_chicken_alfredo',
    title: 'Lighter chicken alfredo',
    cuisine: 'italian', minutes: 25, equip: ['stovetop'], kid: true, emoji: '🍝',
    ing: [
      ['pasta', 340, 'g', 'fettuccine'], ['chicken_breast', 450, 'g', 'sliced'], ['butter', 1, 'tbsp'], ['flour', 1, 'tbsp'],
      ['garlic', 2, 'each', 'cloves, minced'], ['milk', 1.5, 'cup'], ['parmesan', 0.66, 'cup'], ['broccoli', 300, 'g'],
      ['olive_oil', 1, 'tsp'], ['salt', 1, 'tsp'],
    ],
    steps: [
      ['Cook the pasta in salted water, adding the broccoli for the last 3 minutes. Drain.', 600],
      ['Cook the chicken in the oil until cooked through. Set aside.', 480],
      'Melt the butter, stir in the garlic and flour, then slowly whisk in the milk.',
      ['Simmer until thickened, then stir in the parmesan.', 180],
      'Toss the pasta, broccoli and chicken with the sauce.',
    ],
  }),
  r({
    id: 'red_lentil_soup',
    title: 'Red lentil soup',
    cuisine: 'soups', minutes: 35, equip: ['stovetop'], leftover: true, emoji: '🥣',
    ing: [
      ['canned_lentils', 2, 'each', 'cans, rinsed'], ['broth_veg_lowfodmap', 1500, 'ml'], ['onion_yellow', 1, 'each', 'diced'],
      ['carrot', 2, 'each', 'diced'], ['celery', 1, 'each', 'stalk, diced'], ['cumin', 2, 'tsp'], ['turmeric', 0.5, 'tsp'],
      ['olive_oil', 1, 'tbsp'], ['parsley', 0.25, 'each'],
    ],
    steps: [
      ['Soften the onion, carrot and celery in the oil.', 420],
      'Add the cumin and turmeric for 30 seconds.',
      ['Add the lentils and broth. Simmer until the vegetables are soft.', 1200],
      'Blend half the soup and stir it back in. Season and top with parsley.',
    ],
  }),
  r({
    id: 'honey_garlic_salmon',
    title: 'Honey garlic salmon with rice',
    cuisine: 'asian', minutes: 25, equip: ['oven', 'stovetop'], emoji: '🍯',
    ing: [
      ['salmon_fillet', 560, 'g'], ['honey', 2, 'tbsp'], ['soy_sauce', 2, 'tbsp'], ['garlic', 2, 'each', 'cloves, grated'],
      ['white_rice', 1.25, 'cup'], ['green_beans', 300, 'g'], ['sesame_seeds', 1, 'tsp'],
    ],
    steps: [
      ['Cook the rice with 2½ cups of water, covered, on low.', 900],
      'Heat the oven to 400°F (200°C). Mix the honey, soy sauce and garlic and spoon over the salmon.',
      ['Bake until the salmon flakes.', 720],
      ['Steam the green beans.', 300],
      'Serve with sesame seeds sprinkled on top.',
    ],
  }),
  r({
    id: 'hummus_chicken_wraps',
    title: 'Hummus chicken wraps',
    cuisine: 'mediterranean', minutes: 15, equip: ['stovetop'], kid: true, emoji: '🌯',
    ing: [
      ['chicken_tenders', 450, 'g'], ['cumin', 1, 'tsp'], ['olive_oil', 1, 'tsp'], ['wheat_tortillas', 4, 'each'],
      ['hummus', 200, 'g'], ['cucumber', 1, 'each', 'sliced'], ['romaine', 1, 'each', 'shredded'], ['salt', 0.5, 'tsp'],
    ],
    steps: [
      'Season the chicken with cumin and salt.',
      ['Cook in the oil until cooked through, then slice.', 480],
      'Spread each tortilla with hummus, add lettuce, cucumber and chicken, and roll up tightly.',
    ],
  }),
  r({
    id: 'chickpea_spinach_curry',
    title: 'Chickpea spinach curry',
    cuisine: 'asian', minutes: 30, equip: ['stovetop'], leftover: true, emoji: '🍛',
    ing: [
      ['canned_chickpeas', 2, 'each', 'cans, rinsed'], ['onion_yellow', 1, 'each', 'diced'], ['garlic', 3, 'each', 'cloves'],
      ['ginger_fresh', 1, 'tbsp'], ['curry_powder', 1, 'tbsp'], ['coconut_milk_light', 403, 'ml'], ['baby_spinach', 142, 'g'],
      ['vegetable_oil', 1, 'tbsp'], ['basmati_rice', 1.25, 'cup'],
    ],
    steps: [
      ['Cook the rice with 2¼ cups of water, covered, on low.', 900],
      ['Soften the onion in the oil. Add the garlic, ginger and curry powder for 1 minute.', 420],
      ['Add the chickpeas and coconut milk. Simmer.', 600],
      'Stir in the spinach until wilted. Season with salt and serve over rice.',
    ],
  }),
  r({
    id: 'beef_mushroom_stroganoff',
    title: 'Beef and mushroom stroganoff',
    cuisine: 'american', minutes: 30, medium: true, equip: ['stovetop'], emoji: '🍄',
    ing: [
      ['beef_sirloin', 454, 'g', 'thinly sliced'], ['mushrooms_button', 227, 'g'], ['onion_yellow', 1, 'each', 'sliced'],
      ['flour', 1, 'tbsp'], ['broth_beef', 360, 'ml'], ['dijon_mustard', 1, 'tsp'], ['greek_yogurt', 150, 'g'],
      ['pasta', 340, 'g', 'wide noodles'], ['olive_oil', 1, 'tbsp'], ['parsley', 0.25, 'each'],
    ],
    steps: [
      ['Cook the noodles in salted water. Drain.', 600],
      ['Sear the beef in half the oil over high heat. Set aside.', 180],
      ['Cook the onion and mushrooms in the rest of the oil until golden.', 420],
      ['Stir in the flour, then the broth and mustard. Simmer until thickened.', 240],
      'Take off the heat, stir in the yogurt and beef, and serve over noodles with parsley.',
    ],
  }),
  r({
    id: 'apple_thyme_pork_chops',
    title: 'Apple and thyme pork chops',
    cuisine: 'american', minutes: 30, equip: ['stovetop'], emoji: '🍎',
    ing: [
      ['pork_chops', 4, 'each'], ['apple', 2, 'each', 'sliced'], ['onion_red', 1, 'each', 'sliced'], ['thyme_dried', 1, 'tsp'],
      ['apple_cider_vinegar', 1, 'tbsp'], ['olive_oil', 1, 'tbsp'], ['potato_baby', 600, 'g'], ['salt', 1, 'tsp'],
    ],
    steps: [
      ['Boil the potatoes until tender.', 900],
      ['Season the chops with salt and thyme and sear in the oil until cooked through. Set aside.', 480],
      ['Cook the apple and onion in the same pan until soft and golden.', 420],
      'Add the vinegar and 2 tablespoons of water, scrape up the browned bits and spoon over the chops.',
    ],
  }),
  r({
    id: 'mild_white_turkey_chili',
    title: 'Mild white turkey chili',
    cuisine: 'soups', minutes: 35, equip: ['stovetop'], kid: true, leftover: true, emoji: '🥘',
    ing: [
      ['ground_turkey', 454, 'g'], ['onion_yellow', 1, 'each', 'diced'], ['garlic', 3, 'each', 'cloves'],
      ['canned_kidney_beans', 2, 'each', 'cans, rinsed'], ['broth_chicken', 750, 'ml'], ['cumin', 2, 'tsp'],
      ['oregano_dried', 1, 'tsp'], ['frozen_corn', 150, 'g'], ['monterey_jack', 60, 'g'], ['cilantro', 0.25, 'each'],
    ],
    steps: [
      ['Brown the turkey with the onion.', 480],
      'Add the garlic, cumin and oregano for 1 minute.',
      ['Add the beans and broth. Simmer.', 900],
      'Mash some beans to thicken, stir in the corn, and serve with cheese and cilantro.',
    ],
  }),
  r({
    id: 'veg_fried_rice_snap_peas',
    title: 'Vegetable fried rice with snap peas and mushrooms',
    cuisine: 'asian', minutes: 20, equip: ['stovetop'], emoji: '🍚',
    ing: [
      ['white_rice', 4, 'cup', 'cooked and cooled'], ['eggs', 3, 'each'], ['sugar_snap_peas', 150, 'g'],
      ['mushrooms_button', 150, 'g'], ['onion_yellow', 0.5, 'each', 'diced'], ['garlic', 2, 'each', 'cloves'],
      ['soy_sauce', 3, 'tbsp'], ['sesame_oil', 1, 'tsp'], ['vegetable_oil', 1.5, 'tbsp'],
    ],
    steps: [
      ['Scramble the eggs in a little oil. Set aside.', 90],
      ['Stir-fry the onion, mushrooms and snap peas in the rest of the oil. Add the garlic.', 300],
      ['Add the rice and let it crisp.', 180],
      'Stir in the eggs, soy sauce and sesame oil.',
    ],
  }),
  r({
    id: 'roasted_cauliflower_chickpea_bowls',
    title: 'Roasted cauliflower and chickpea bowls',
    cuisine: 'bowls', minutes: 35, equip: ['oven'], leftover: true, emoji: '🥗',
    ing: [
      ['cauliflower', 1, 'each', 'florets'], ['canned_chickpeas', 1, 'each', 'can, rinsed'], ['olive_oil', 2, 'tbsp'],
      ['cumin', 1, 'tsp'], ['paprika', 1, 'tsp'], ['quinoa', 1, 'cup'], ['tahini', 3, 'tbsp'], ['baby_spinach', 100, 'g'],
      ['salt', 1, 'tsp'],
    ],
    steps: [
      'Heat the oven to 425°F (220°C).',
      ['Toss the cauliflower and chickpeas with the oil, spices and salt. Roast until browned.', 1500],
      ['Simmer the quinoa in 2 cups of water, covered.', 900],
      'Thin the tahini with warm water and a pinch of salt.',
      'Build bowls with spinach, quinoa and the roasted vegetables. Drizzle with tahini.',
    ],
  }),
  r({
    id: 'sweet_potato_black_bean_bowls',
    title: 'Sweet potato and black bean bowls',
    cuisine: 'bowls', minutes: 35, equip: ['oven'], leftover: true, emoji: '🍠',
    ing: [
      ['sweet_potato', 2, 'each', 'cubed'], ['canned_black_beans', 1, 'each', 'can, rinsed'], ['onion_red', 0.5, 'each', 'diced'],
      ['cumin', 2, 'tsp'], ['smoked_paprika', 1, 'tsp'], ['olive_oil', 1.5, 'tbsp'], ['brown_rice', 1, 'cup'],
      ['cilantro', 0.5, 'each'], ['salt', 1, 'tsp'],
    ],
    steps: [
      'Heat the oven to 425°F (220°C).',
      ['Toss the sweet potato with the oil, spices and salt and roast until tender.', 1500],
      ['Cook the brown rice with 2 cups of water, covered.', 1800],
      'Warm the beans with the onion in a small pan.',
      'Build bowls with rice, sweet potato and beans. Top with cilantro.',
    ],
  }),
  r({
    id: 'honey_garlic_chicken_thighs',
    title: 'Honey garlic chicken thighs',
    cuisine: 'asian', minutes: 30, equip: ['stovetop'], kid: true, emoji: '🍯',
    ing: [
      ['chicken_thigh', 680, 'g'], ['honey', 3, 'tbsp'], ['soy_sauce', 3, 'tbsp'], ['garlic', 4, 'each', 'cloves'],
      ['apple_cider_vinegar', 1, 'tbsp'], ['vegetable_oil', 1, 'tsp'], ['broccoli', 300, 'g'], ['white_rice', 1.25, 'cup'],
    ],
    steps: [
      ['Cook the rice with 2½ cups of water, covered, on low.', 900],
      ['Brown the chicken in the oil, about 5 minutes a side.', 600],
      'Mix the honey, soy sauce, garlic and vinegar and pour it in.',
      ['Simmer, turning the chicken, until sticky and cooked through. Steam the broccoli on the side.', 420],
    ],
  }),
  r({
    id: 'greek_yogurt_chicken_pitas',
    title: 'Dill yogurt chicken pitas',
    cuisine: 'mediterranean', minutes: 20, equip: ['stovetop'], emoji: '🥙',
    ing: [
      ['chicken_breast', 500, 'g', 'sliced'], ['oregano_dried', 1, 'tsp'], ['olive_oil', 1, 'tsp'], ['pita', 4, 'each'],
      ['greek_yogurt', 200, 'g'], ['dill_fresh', 10, 'g'], ['cucumber', 1, 'each'], ['onion_red', 0.25, 'each', 'thinly sliced'],
      ['romaine', 1, 'each'],
    ],
    steps: [
      ['Season the chicken with oregano and salt and cook in the oil until done.', 480],
      'Grate half the cucumber into the yogurt with the dill and a pinch of salt. Slice the rest.',
      'Warm the pitas and fill with lettuce, chicken, sliced cucumber, onion and dill yogurt.',
    ],
  }),
  r({
    id: 'asparagus_mushroom_pasta',
    title: 'Asparagus and mushroom pasta',
    cuisine: 'italian', minutes: 25, equip: ['stovetop'], emoji: '🌱',
    ing: [
      ['pasta', 340, 'g'], ['asparagus', 454, 'g', 'cut into pieces'], ['mushrooms_button', 227, 'g'],
      ['garlic', 2, 'each', 'cloves'], ['olive_oil', 2, 'tbsp'], ['parmesan', 0.5, 'cup'], ['salt', 1, 'tsp'],
    ],
    steps: [
      ['Cook the pasta in salted water, adding the asparagus for the last 3 minutes. Save ½ cup of water and drain.', 600],
      ['Brown the mushrooms in the oil. Add the garlic for 30 seconds.', 360],
      'Toss in the pasta, asparagus, parmesan and enough pasta water to make it glossy.',
    ],
  }),
  r({
    id: 'turkey_sliders_onions',
    title: 'Turkey sliders with caramelized onions',
    cuisine: 'american', minutes: 30, equip: ['stovetop'], kid: true, emoji: '🍔',
    ing: [
      ['ground_turkey', 454, 'g'], ['onion_yellow', 2, 'each', 'thinly sliced'], ['burger_buns', 8, 'each', 'or slider rolls'],
      ['swiss_cheese', 4, 'each', 'halved'], ['yellow_mustard', 2, 'tbsp'], ['olive_oil', 1, 'tbsp'], ['salt', 0.75, 'tsp'],
    ],
    steps: [
      ['Cook the onions slowly in the oil with a pinch of salt until golden and soft.', 900],
      'Shape the turkey into 8 small patties and season with salt.',
      ['Cook the patties until cooked through, adding the cheese at the end to melt.', 480],
      'Build sliders with mustard and a pile of onions.',
    ],
  }),
];
