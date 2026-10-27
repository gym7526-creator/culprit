/**
 * Recipes, batch 4: everyday family dinners with regular ingredients (onion, garlic, wheat, dairy,
 * tomato, spice). Not calm-safe; they unlock in the personal phase once a user's triggers are known,
 * so plans stay as broad as possible.
 */
import type { RecipeSource } from '../../src/data/content/schema.ts';

import { r } from './recipe-helpers.ts';

export const recipesEveryday: RecipeSource[] = [
  r({
    id: 'spaghetti_marinara',
    title: 'Spaghetti marinara',
    cuisine: 'italian', minutes: 20, equip: ['stovetop'], kid: true, emoji: '🍝',
    ing: [
      ['pasta', 454, 'g', 'spaghetti'], ['marinara_sauce', 680, 'g'], ['garlic', 2, 'each', 'cloves, sliced'],
      ['olive_oil', 1, 'tbsp'], ['basil_fresh', 10, 'g'], ['parmesan', 0.5, 'cup'],
    ],
    steps: [
      ['Cook the spaghetti in salted boiling water until just tender.', 600],
      ['Warm the garlic in the oil until fragrant, then add the marinara and simmer.', 300],
      'Toss the drained pasta with the sauce. Serve with basil and parmesan.',
    ],
  }),
  r({
    id: 'classic_beef_chili',
    title: 'Classic beef chili',
    cuisine: 'soups', minutes: 45, equip: ['stovetop'], mild: false, leftover: true, emoji: '🌶️',
    ing: [
      ['ground_beef_lean', 680, 'g'], ['onion_yellow', 1, 'each', 'diced'], ['garlic', 3, 'each', 'cloves'],
      ['bell_pepper_green', 1, 'each', 'diced'], ['canned_kidney_beans', 2, 'each', 'cans, rinsed'],
      ['crushed_tomatoes', 794, 'g'], ['cumin', 1, 'tbsp'], ['chipotle_powder', 1, 'tsp'], ['oregano_dried', 1, 'tsp'],
      ['cheddar', 80, 'g'], ['sour_cream', 120, 'g'],
    ],
    serves: 6,
    steps: [
      ['Brown the beef with the onion and pepper.', 600],
      'Add the garlic and spices for 1 minute.',
      ['Add the tomatoes, beans and 1 cup of water. Simmer, stirring now and then.', 1500],
      'Season with salt. Serve with cheddar and sour cream.',
    ],
  }),
  r({
    id: 'beef_tacos_salsa',
    title: 'Beef tacos with salsa',
    cuisine: 'mexican', minutes: 20, equip: ['stovetop'], kid: true, emoji: '🌮',
    ing: [
      ['ground_beef_lean', 454, 'g'], ['onion_yellow', 0.5, 'each', 'diced'], ['cumin', 2, 'tsp'], ['chili_flakes', 0.25, 'tsp'],
      ['paprika', 1, 'tsp'], ['corn_tortillas', 12, 'each'], ['salsa', 227, 'g'], ['iceberg', 0.5, 'each', 'shredded'],
      ['cheddar', 80, 'g'],
    ],
    steps: [
      ['Brown the beef with the onion.', 480],
      ['Add the spices, a pinch of salt and ¼ cup water. Simmer until saucy.', 180],
      'Warm the tortillas and fill with beef, lettuce, cheese and salsa.',
    ],
  }),
  r({
    id: 'classic_cheeseburgers',
    title: 'Classic cheeseburgers',
    cuisine: 'american', minutes: 20, equip: ['stovetop'], kid: true, emoji: '🍔',
    ing: [
      ['ground_beef_80', 680, 'g'], ['burger_buns', 4, 'each'], ['cheddar', 4, 'each', 'slices'], ['onion_red', 0.5, 'each', 'sliced'],
      ['tomato', 1, 'each', 'sliced'], ['iceberg', 0.25, 'each'], ['pickles', 60, 'g'], ['ketchup', 2, 'tbsp'], ['yellow_mustard', 1, 'tbsp'],
    ],
    steps: [
      'Shape the beef into 4 patties slightly wider than the buns. Season generously with salt and pepper.',
      ['Cook in a hot skillet, about 4 minutes a side, adding the cheese for the last minute.', 480],
      'Toast the buns and build burgers with the toppings.',
    ],
  }),
  r({
    id: 'sausage_peppers_onions',
    title: 'Sausage, peppers and onions',
    cuisine: 'italian', minutes: 25, equip: ['stovetop'], emoji: '🌭',
    ing: [
      ['italian_sausage', 4, 'each'], ['bell_pepper_red', 1, 'each', 'sliced'], ['bell_pepper_green', 1, 'each', 'sliced'],
      ['onion_yellow', 1, 'each', 'sliced'], ['olive_oil', 1, 'tsp'], ['burger_buns', 4, 'each'], ['yellow_mustard', 1, 'tbsp'],
    ],
    steps: [
      ['Brown the sausages in the oil, turning, then add ¼ cup water, cover and cook through.', 720],
      ['Add the peppers and onion and cook until soft and browned.', 600],
      'Serve the sausages in buns piled with peppers and onions.',
    ],
  }),
  r({
    id: 'bbq_chicken_corn_potatoes',
    title: 'BBQ chicken with corn and potatoes',
    cuisine: 'sheet_pan', minutes: 45, equip: ['oven', 'sheet_pan'], kid: true, emoji: '🌽',
    ing: [
      ['chicken_thigh', 680, 'g'], ['bbq_sauce', 0.5, 'cup'], ['potato_baby', 600, 'g'], ['corn_on_cob', 4, 'each', 'halved'],
      ['olive_oil', 1, 'tbsp'], ['salt', 1, 'tsp'],
    ],
    steps: [
      'Heat the oven to 425°F (220°C).',
      ['Toss the potatoes with the oil and salt and roast.', 900],
      ['Add the chicken and corn. Brush the chicken with half the BBQ sauce and roast.', 1200],
      ['Brush with the rest of the sauce and roast until sticky and cooked through.', 300],
    ],
  }),
  r({
    id: 'chicken_enchiladas',
    title: 'Chicken enchiladas',
    cuisine: 'mexican', minutes: 45, medium: true, equip: ['oven', 'stovetop'], leftover: true, emoji: '🫔',
    ing: [
      ['chicken_breast', 500, 'g'], ['wheat_tortillas', 8, 'each'], ['crushed_tomatoes', 794, 'g'], ['onion_yellow', 1, 'each'],
      ['garlic', 2, 'each', 'cloves'], ['cumin', 2, 'tsp'], ['chipotle_powder', 0.5, 'tsp'], ['monterey_jack', 200, 'g'],
      ['olive_oil', 1, 'tbsp'], ['cilantro', 0.25, 'each'],
    ],
    steps: [
      ['Poach the chicken in simmering water until cooked, then shred.', 900],
      ['Soften the onion in the oil, add the garlic and spices, then the tomatoes. Simmer to make the sauce.', 600],
      'Heat the oven to 375°F (190°C). Mix the chicken with 1 cup of sauce and half the cheese.',
      'Roll the filling in tortillas and lay them in a baking dish. Cover with the rest of the sauce and cheese.',
      ['Bake until bubbling. Top with cilantro.', 1200],
    ],
  }),
  r({
    id: 'turkey_lasagna',
    title: 'Turkey lasagna',
    cuisine: 'italian', minutes: 75, medium: true, equip: ['oven', 'stovetop'], kid: true, leftover: true, emoji: '🍝',
    ing: [
      ['pasta', 340, 'g', 'lasagna sheets'], ['ground_turkey', 454, 'g'], ['marinara_sauce', 1020, 'g'], ['ricotta', 425, 'g'],
      ['eggs', 1, 'each'], ['mozzarella', 340, 'g'], ['parmesan', 0.5, 'cup'], ['baby_spinach', 142, 'g'],
    ],
    serves: 8,
    steps: [
      ['Boil the lasagna sheets until just flexible. Drain and lay flat.', 480],
      ['Brown the turkey, then stir in the marinara.', 480],
      'Mix the ricotta, egg, spinach and half the parmesan. Heat the oven to 375°F (190°C).',
      'Layer sauce, pasta, ricotta mix and mozzarella in a 9×13 dish, three times, ending with sauce and cheese.',
      ['Cover with foil and bake, then uncover and bake until golden.', 2700],
      'Rest for 15 minutes before cutting.',
    ],
  }),
  r({
    id: 'shrimp_pad_thai',
    title: 'Shrimp pad thai',
    cuisine: 'asian', minutes: 25, medium: true, equip: ['stovetop'], mild: false, emoji: '🍤',
    ing: [
      ['rice_noodles', 227, 'g'], ['shrimp', 400, 'g'], ['eggs', 2, 'each'], ['garlic', 3, 'each', 'cloves'],
      ['fish_sauce', 3, 'tbsp'], ['brown_sugar', 2, 'tbsp'], ['lime', 2, 'each'], ['chili_flakes', 0.5, 'tsp'],
      ['bean_sprouts', 150, 'g'], ['green_onion', 1, 'each'], ['peanuts', 40, 'g'], ['vegetable_oil', 2, 'tbsp'],
    ],
    steps: [
      'Soak the noodles following the package. Mix the fish sauce, sugar, juice of 1 lime and chili flakes.',
      ['Stir-fry the shrimp and garlic in the oil until pink. Push aside and scramble the eggs.', 240],
      ['Add the noodles and sauce and toss until the noodles are tender.', 180],
      'Toss in the sprouts and green onions. Serve with peanuts and lime wedges.',
    ],
  }),
  r({
    id: 'butter_chicken',
    title: 'Butter chicken',
    cuisine: 'asian', minutes: 40, equip: ['stovetop'], leftover: true, emoji: '🍛',
    ing: [
      ['chicken_thigh', 680, 'g', 'cubed'], ['butter', 2, 'tbsp'], ['onion_yellow', 1, 'each'], ['garlic', 4, 'each', 'cloves'],
      ['ginger_fresh', 1, 'tbsp'], ['garam_masala', 2, 'tsp'], ['turmeric', 0.5, 'tsp'], ['crushed_tomatoes', 400, 'g'],
      ['heavy_cream', 120, 'ml'], ['basmati_rice', 1.25, 'cup'],
    ],
    steps: [
      ['Cook the rice with 2¼ cups of water, covered, on low.', 900],
      ['Brown the chicken in the butter. Set aside.', 360],
      ['Soften the onion, then add the garlic, ginger and spices for a minute.', 420],
      ['Add the tomatoes and simmer. Blend smooth if you like.', 600],
      'Stir in the cream and chicken and simmer until cooked through. Serve with rice.',
    ],
  }),
  r({
    id: 'margherita_pita_pizzas',
    title: 'Margherita pita pizzas',
    cuisine: 'italian', minutes: 15, equip: ['oven'], kid: true, emoji: '🍕',
    ing: [
      ['pita', 4, 'each'], ['marinara_sauce', 200, 'g'], ['fresh_mozzarella', 200, 'g'], ['basil_fresh', 10, 'g'],
      ['olive_oil', 1, 'tsp'], ['spring_mix', 142, 'g'],
    ],
    steps: [
      'Heat the oven to 425°F (220°C).',
      'Spread the pitas with marinara and top with torn mozzarella.',
      ['Bake until the cheese melts.', 600],
      'Top with basil. Serve with dressed greens.',
    ],
  }),
  r({
    id: 'beef_snow_pea_stir_fry',
    title: 'Beef and snow pea stir-fry',
    cuisine: 'asian', minutes: 20, equip: ['stovetop'], emoji: '🥢',
    ing: [
      ['flank_steak', 454, 'g', 'thinly sliced'], ['snow_peas', 227, 'g'], ['garlic', 3, 'each', 'cloves'],
      ['ginger_fresh', 1, 'tbsp'], ['soy_sauce', 3, 'tbsp'], ['hoisin_sauce', 2, 'tbsp'], ['cornstarch', 1, 'tsp'],
      ['vegetable_oil', 1, 'tbsp'], ['white_rice', 1.25, 'cup'],
    ],
    steps: [
      ['Cook the rice with 2½ cups of water, covered, on low.', 900],
      ['Sear the beef in the oil over high heat. Set aside.', 180],
      ['Stir-fry the snow peas, garlic and ginger.', 120],
      'Mix the soy, hoisin, cornstarch and ¼ cup water, add with the beef and toss until glossy.',
    ],
  }),
  r({
    id: 'chicken_caesar_wraps',
    title: 'Chicken Caesar wraps',
    cuisine: 'american', minutes: 15, equip: ['stovetop'], emoji: '🌯',
    ing: [
      ['chicken_tenders', 450, 'g'], ['wheat_tortillas', 4, 'each'], ['romaine', 2, 'each'], ['parmesan', 0.5, 'cup'],
      ['mayonnaise', 3, 'tbsp'], ['lemon', 1, 'each'], ['garlic', 1, 'each', 'clove, grated'], ['dijon_mustard', 1, 'tsp'],
      ['olive_oil', 1, 'tsp'],
    ],
    steps: [
      ['Season and cook the chicken in the oil until done. Slice.', 480],
      'Whisk the mayonnaise, lemon juice, garlic, mustard and half the parmesan.',
      'Toss the chopped romaine with the dressing and the rest of the parmesan.',
      'Fill the tortillas with salad and chicken and roll up.',
    ],
  }),
  r({
    id: 'pesto_chicken_pasta',
    title: 'Pesto chicken pasta',
    cuisine: 'italian', minutes: 20, equip: ['stovetop'], kid: true, emoji: '🌿',
    ing: [
      ['pasta', 340, 'g'], ['chicken_breast', 450, 'g', 'cubed'], ['pesto', 0.5, 'cup'], ['cherry_tomatoes', 283, 'g'],
      ['parmesan', 0.25, 'cup'], ['olive_oil', 1, 'tsp'],
    ],
    steps: [
      ['Cook the pasta. Save ½ cup of water, then drain.', 600],
      ['Cook the chicken in the oil until done.', 480],
      'Toss the pasta with the chicken, pesto, halved tomatoes and a splash of pasta water. Top with parmesan.',
    ],
  }),
  r({
    id: 'black_bean_quesadillas',
    title: 'Black bean quesadillas',
    cuisine: 'mexican', minutes: 15, equip: ['stovetop'], kid: true, emoji: '🧀',
    ing: [
      ['wheat_tortillas', 8, 'each'], ['canned_black_beans', 1, 'each', 'can, rinsed'], ['cheddar', 200, 'g'],
      ['frozen_corn', 150, 'g'], ['cumin', 1, 'tsp'], ['salsa', 227, 'g'], ['sour_cream', 120, 'g'],
    ],
    steps: [
      'Lightly mash the beans with the cumin and corn.',
      'Spread the beans over 4 tortillas, top with cheese and the remaining tortillas.',
      ['Cook in a dry skillet over medium heat until golden on both sides.', 360],
      'Cut into wedges and serve with salsa and sour cream.',
    ],
  }),
  r({
    id: 'three_bean_veggie_chili',
    title: 'Veggie bean chili',
    cuisine: 'soups', minutes: 40, equip: ['stovetop'], mild: false, leftover: true, emoji: '🫘',
    ing: [
      ['canned_kidney_beans', 1, 'each', 'can, rinsed'], ['canned_black_beans', 2, 'each', 'cans, rinsed'],
      ['onion_yellow', 1, 'each'], ['garlic', 3, 'each', 'cloves'], ['bell_pepper_red', 1, 'each'], ['crushed_tomatoes', 794, 'g'],
      ['cumin', 1, 'tbsp'], ['chipotle_powder', 1, 'tsp'], ['olive_oil', 1, 'tbsp'], ['cilantro', 0.25, 'each'],
    ],
    serves: 6,
    steps: [
      ['Soften the onion and pepper in the oil.', 480],
      'Add the garlic and spices for 1 minute.',
      ['Add the beans, tomatoes and 1 cup of water. Simmer until thick.', 1500],
      'Season and top with cilantro.',
    ],
  }),
  r({
    id: 'mushroom_swiss_burgers',
    title: 'Mushroom Swiss turkey burgers',
    cuisine: 'american', minutes: 25, equip: ['stovetop'], emoji: '🍄',
    ing: [
      ['ground_turkey', 454, 'g'], ['mushrooms_button', 227, 'g', 'sliced'], ['onion_yellow', 0.5, 'each', 'sliced'],
      ['swiss_cheese', 4, 'each'], ['burger_buns', 4, 'each'], ['dijon_mustard', 1, 'tbsp'], ['olive_oil', 1, 'tbsp'],
    ],
    steps: [
      ['Cook the mushrooms and onion in the oil until golden. Season and set aside.', 480],
      ['Shape and cook the turkey patties until cooked through. Top with Swiss to melt.', 600],
      'Serve on buns with mustard and the mushrooms.',
    ],
  }),
  r({
    id: 'sloppy_joes',
    title: 'Sloppy joes',
    cuisine: 'american', minutes: 20, equip: ['stovetop'], kid: true, emoji: '🥪',
    ing: [
      ['ground_beef_lean', 454, 'g'], ['onion_yellow', 0.5, 'each'], ['bell_pepper_green', 0.5, 'each'], ['ketchup', 0.5, 'cup'],
      ['tomato_paste', 1, 'tbsp'], ['yellow_mustard', 1, 'tbsp'], ['brown_sugar', 1, 'tbsp'], ['burger_buns', 4, 'each'],
      ['coleslaw_mix', 200, 'g'],
    ],
    steps: [
      ['Brown the beef with the onion and pepper.', 480],
      ['Stir in the ketchup, tomato paste, mustard, sugar and ¼ cup water. Simmer until thick.', 300],
      'Spoon onto toasted buns. Serve with coleslaw mix on the side.',
    ],
  }),
  r({
    id: 'chicken_fajita_rice_bowls',
    title: 'Chicken fajita rice bowls',
    cuisine: 'bowls', minutes: 25, equip: ['stovetop'], emoji: '🫑',
    ing: [
      ['chicken_breast', 600, 'g'], ['onion_red', 1, 'each'], ['bell_pepper_red', 1, 'each'], ['bell_pepper_green', 1, 'each'],
      ['cumin', 2, 'tsp'], ['chipotle_powder', 0.5, 'tsp'], ['salsa', 227, 'g'], ['sour_cream', 120, 'g'], ['white_rice', 1.25, 'cup'],
      ['vegetable_oil', 1, 'tbsp'],
    ],
    steps: [
      ['Cook the rice with 2½ cups of water, covered, on low.', 900],
      ['Cook the sliced chicken with the spices in the oil until done. Set aside.', 480],
      ['Char the onion and peppers in the same pan.', 360],
      'Build bowls with rice, chicken, vegetables, salsa and sour cream.',
    ],
  }),
  r({
    id: 'garlic_butter_shrimp_noodles',
    title: 'Garlic butter shrimp noodles',
    cuisine: 'asian', minutes: 20, equip: ['stovetop'], emoji: '🧄',
    ing: [
      ['pasta', 340, 'g', 'spaghetti'], ['shrimp', 454, 'g'], ['butter', 3, 'tbsp'], ['garlic', 6, 'each', 'cloves'],
      ['soy_sauce', 2, 'tbsp'], ['parmesan', 0.25, 'cup'], ['green_onion', 1, 'each'],
    ],
    steps: [
      ['Cook the pasta. Save ½ cup of water, then drain.', 600],
      ['Melt the butter and cook the garlic gently until golden. Add the shrimp and cook until pink.', 240],
      'Toss in the pasta, soy sauce, parmesan and a splash of pasta water. Top with green onions.',
    ],
  }),
  r({
    id: 'chicken_tortilla_soup',
    title: 'Chicken tortilla soup',
    cuisine: 'soups', minutes: 40, equip: ['stovetop'], mild: false, leftover: true, emoji: '🍲',
    ing: [
      ['broth_chicken', 1500, 'ml'], ['chicken_breast', 450, 'g'], ['onion_yellow', 1, 'each'], ['garlic', 3, 'each', 'cloves'],
      ['diced_tomatoes', 411, 'g'], ['canned_black_beans', 1, 'each', 'can, rinsed'], ['frozen_corn', 150, 'g'],
      ['cumin', 2, 'tsp'], ['chipotle_powder', 0.5, 'tsp'], ['lime', 1, 'each'], ['tortilla_chips', 100, 'g'], ['avocado', 1, 'each'],
    ],
    serves: 6,
    steps: [
      ['Soften the onion in a little of the broth. Add the garlic and spices.', 360],
      ['Add the rest of the broth, tomatoes and chicken. Simmer until cooked through.', 1200],
      'Shred the chicken, then return it with the beans and corn. Heat through and add the lime juice.',
      'Serve topped with crushed chips and avocado.',
    ],
  }),
  r({
    id: 'tuscan_white_bean_pasta',
    title: 'Tuscan white bean pasta',
    cuisine: 'italian', minutes: 25, equip: ['stovetop'], emoji: '🍝',
    ing: [
      ['pasta', 340, 'g'], ['canned_kidney_beans', 1, 'each', 'can, rinsed'], ['baby_spinach', 142, 'g'], ['garlic', 3, 'each', 'cloves'],
      ['diced_tomatoes', 411, 'g'], ['olive_oil', 2, 'tbsp'], ['parmesan', 0.33, 'cup'], ['chili_flakes', 0.25, 'tsp'],
    ],
    steps: [
      ['Cook the pasta. Save ½ cup of water, then drain.', 600],
      ['Warm the garlic and chili flakes in the oil, add the tomatoes and beans, and simmer.', 360],
      'Stir in the spinach until wilted, then toss with the pasta, parmesan and a splash of pasta water.',
    ],
  }),
  r({
    id: 'baked_falafel_pitas',
    title: 'Baked falafel pitas',
    cuisine: 'mediterranean', minutes: 40, medium: true, equip: ['oven'], emoji: '🧆',
    ing: [
      ['canned_chickpeas', 2, 'each', 'cans, drained'], ['onion_red', 0.5, 'each'], ['garlic', 2, 'each', 'cloves'],
      ['parsley', 1, 'each'], ['cumin', 2, 'tsp'], ['flour', 3, 'tbsp'], ['olive_oil', 2, 'tbsp'], ['pita', 4, 'each'],
      ['tahini', 3, 'tbsp'], ['lemon', 1, 'each'], ['cucumber', 1, 'each'], ['tomato', 2, 'each'],
    ],
    steps: [
      'Heat the oven to 400°F (200°C) and oil a sheet pan.',
      'Pulse the chickpeas, onion, garlic, parsley, cumin, flour and 1 teaspoon of salt in a food processor until coarse.',
      ['Shape into 16 small patties, brush with oil and bake, flipping once, until crisp.', 1500],
      'Whisk the tahini with the lemon juice, a pinch of salt and water until pourable.',
      'Fill the pitas with falafel, cucumber, tomato and tahini sauce.',
    ],
  }),
  r({
    id: 'sesame_honey_chicken',
    title: 'Sesame honey chicken',
    cuisine: 'asian', minutes: 25, equip: ['stovetop'], kid: true, emoji: '🍯',
    ing: [
      ['chicken_breast', 600, 'g', 'cubed'], ['cornstarch', 3, 'tbsp'], ['honey', 3, 'tbsp'], ['soy_sauce', 3, 'tbsp'],
      ['garlic', 2, 'each', 'cloves'], ['sesame_oil', 1, 'tsp'], ['sesame_seeds', 1, 'tbsp'], ['vegetable_oil', 2, 'tbsp'],
      ['broccoli', 300, 'g'], ['white_rice', 1.25, 'cup'],
    ],
    steps: [
      ['Cook the rice with 2½ cups of water, covered, on low.', 900],
      ['Toss the chicken in 2 tablespoons of cornstarch and fry in the oil until golden.', 480],
      'Mix the honey, soy, garlic, sesame oil, the rest of the cornstarch and ¼ cup water.',
      ['Pour over the chicken and simmer until sticky. Steam the broccoli alongside.', 120],
      'Sprinkle with sesame seeds and serve with rice.',
    ],
  }),
  r({
    id: 'tomato_soup_grilled_cheese',
    title: 'Tomato soup and grilled cheese',
    cuisine: 'soups', minutes: 25, equip: ['stovetop'], kid: true, emoji: '🥪',
    ing: [
      ['crushed_tomatoes', 794, 'g'], ['onion_yellow', 0.5, 'each'], ['garlic', 2, 'each', 'cloves'], ['milk', 1, 'cup'],
      ['butter', 3, 'tbsp'], ['basil_dried', 1, 'tsp'], ['wheat_bread', 8, 'each'], ['cheddar', 170, 'g'],
    ],
    steps: [
      ['Soften the onion in 1 tablespoon of butter, then add the garlic and basil.', 360],
      ['Add the tomatoes and 1 cup of water and simmer.', 600],
      'Blend until smooth and stir in the milk. Season with salt.',
      ['Make sandwiches with the cheese, butter the outsides and cook in a skillet until golden.', 480],
    ],
  }),
  r({
    id: 'broccoli_mac_and_cheese',
    title: 'Broccoli mac and cheese',
    cuisine: 'american', minutes: 25, equip: ['stovetop'], kid: true, emoji: '🧀',
    ing: [
      ['pasta', 340, 'g', 'elbows'], ['broccoli', 300, 'g'], ['butter', 2, 'tbsp'], ['flour', 2, 'tbsp'], ['milk', 2, 'cup'],
      ['cheddar', 200, 'g'], ['mustard_powder', 0.5, 'tsp'], ['salt', 0.75, 'tsp'],
    ],
    steps: [
      ['Cook the pasta, adding the broccoli for the last 3 minutes. Drain.', 600],
      'Melt the butter, whisk in the flour, then slowly whisk in the milk.',
      ['Simmer until thickened, then stir in the cheese, mustard powder and salt until smooth.', 240],
      'Fold in the pasta and broccoli.',
    ],
  }),
  r({
    id: 'bean_cheese_burritos',
    title: 'Bean and cheese burritos',
    cuisine: 'mexican', minutes: 20, equip: ['stovetop'], kid: true, emoji: '🌯',
    ing: [
      ['refried_beans', 454, 'g'], ['wheat_tortillas', 6, 'each'], ['cheddar', 170, 'g'], ['white_rice', 1, 'cup'],
      ['salsa', 227, 'g'], ['romaine', 1, 'each'],
    ],
    serves: 6,
    steps: [
      ['Cook the rice with 2 cups of water, covered, on low.', 900],
      'Warm the beans in a small pan.',
      'Fill each tortilla with rice, beans, cheese, lettuce and salsa. Fold in the sides and roll.',
      ['Toast the burritos seam-side down in a dry pan until golden.', 240],
    ],
  }),
  r({
    id: 'korean_style_beef_bowls',
    title: 'Korean-style beef bowls',
    cuisine: 'asian', minutes: 20, equip: ['stovetop'], mild: false, emoji: '🍚',
    ing: [
      ['ground_beef_lean', 454, 'g'], ['soy_sauce', 3, 'tbsp'], ['brown_sugar', 2, 'tbsp'], ['garlic', 3, 'each', 'cloves'],
      ['ginger_fresh', 1, 'tbsp'], ['sesame_oil', 1, 'tsp'], ['chili_flakes', 0.5, 'tsp'], ['white_rice', 1.25, 'cup'],
      ['cucumber', 1, 'each'], ['green_onion', 1, 'each'],
    ],
    steps: [
      ['Cook the rice with 2½ cups of water, covered, on low.', 900],
      ['Brown the beef, then add the garlic and ginger.', 480],
      'Stir in the soy sauce, sugar, sesame oil and chili flakes and simmer for 2 minutes.',
      'Serve over rice with sliced cucumber and green onions.',
    ],
  }),
  r({
    id: 'avocado_chicken_salad_sandwiches',
    title: 'Avocado chicken salad sandwiches',
    cuisine: 'american', minutes: 15, equip: ['stovetop'], emoji: '🥑',
    ing: [
      ['chicken_breast', 450, 'g'], ['avocado', 2, 'each'], ['greek_yogurt', 100, 'g'], ['lemon', 1, 'each'],
      ['onion_red', 0.25, 'each', 'minced'], ['wheat_bread', 8, 'each'], ['romaine', 1, 'each'],
    ],
    steps: [
      ['Poach the chicken in simmering salted water until cooked, then cool and chop.', 900],
      'Mash the avocado with the yogurt, lemon juice and a pinch of salt. Fold in the chicken and onion.',
      'Build sandwiches with lettuce.',
    ],
  }),
  r({
    id: 'greek_meatball_pitas',
    title: 'Greek meatball pitas',
    cuisine: 'mediterranean', minutes: 30, equip: ['oven'], emoji: '🧆',
    ing: [
      ['ground_turkey', 454, 'g'], ['onion_red', 0.5, 'each', 'grated'], ['garlic', 2, 'each', 'cloves'], ['panko', 0.33, 'cup'],
      ['oregano_dried', 2, 'tsp'], ['eggs', 1, 'each'], ['pita', 4, 'each'], ['yogurt_plain', 200, 'g'], ['cucumber', 1, 'each'],
      ['tomato', 2, 'each'], ['dill_fresh', 10, 'g'],
    ],
    steps: [
      'Heat the oven to 400°F (200°C).',
      'Mix the turkey, onion, garlic, panko, oregano, egg and salt. Roll into 16 balls.',
      ['Bake until cooked through.', 1080],
      'Mix the yogurt with grated cucumber and dill.',
      'Fill warm pitas with meatballs, tomato and the yogurt sauce.',
    ],
  }),
  r({
    id: 'pesto_salmon_asparagus',
    title: 'Pesto salmon with asparagus',
    cuisine: 'sheet_pan', minutes: 25, equip: ['oven', 'sheet_pan'], emoji: '🐟',
    ing: [
      ['salmon_fillet', 560, 'g'], ['pesto', 3, 'tbsp'], ['asparagus', 454, 'g'], ['potato_baby', 500, 'g'], ['olive_oil', 1, 'tbsp'],
      ['lemon', 1, 'each'],
    ],
    steps: [
      'Heat the oven to 425°F (220°C).',
      ['Roast the potatoes tossed in oil and salt.', 900],
      ['Add the salmon spread with pesto and the asparagus. Roast until the salmon flakes.', 720],
      'Squeeze lemon over the top.',
    ],
  }),
  r({
    id: 'sausage_spinach_pasta',
    title: 'Sausage and spinach pasta',
    cuisine: 'italian', minutes: 25, equip: ['stovetop'], emoji: '🍝',
    ing: [
      ['pasta', 340, 'g'], ['italian_sausage', 3, 'each', 'casings removed'], ['marinara_sauce', 680, 'g'],
      ['baby_spinach', 142, 'g'], ['parmesan', 0.33, 'cup'],
    ],
    steps: [
      ['Cook the pasta and drain.', 600],
      ['Brown the sausage, breaking it up.', 420],
      ['Add the marinara and simmer, then stir in the spinach.', 300],
      'Toss with the pasta and serve with parmesan.',
    ],
  }),
  r({
    id: 'shrimp_scampi',
    title: 'Shrimp scampi',
    cuisine: 'italian', minutes: 20, equip: ['stovetop'], emoji: '🦐',
    ing: [
      ['pasta', 340, 'g', 'linguine'], ['shrimp', 454, 'g'], ['butter', 2, 'tbsp'], ['olive_oil', 1, 'tbsp'],
      ['garlic', 4, 'each', 'cloves'], ['lemon', 1, 'each'], ['chili_flakes', 0.25, 'tsp'], ['parsley', 0.5, 'each'],
    ],
    steps: [
      ['Cook the pasta. Save ½ cup of water, then drain.', 600],
      ['Cook the garlic and chili in the butter and oil, then add the shrimp until pink.', 240],
      'Add the lemon juice, pasta and a splash of pasta water. Toss with parsley.',
    ],
  }),
  r({
    id: 'chicken_cacciatore',
    title: 'Chicken cacciatore',
    cuisine: 'italian', minutes: 50, equip: ['stovetop'], leftover: true, emoji: '🍗',
    ing: [
      ['chicken_thigh', 680, 'g'], ['onion_yellow', 1, 'each'], ['garlic', 3, 'each', 'cloves'], ['bell_pepper_red', 1, 'each'],
      ['mushrooms_button', 227, 'g'], ['crushed_tomatoes', 794, 'g'], ['oregano_dried', 1, 'tsp'], ['olive_oil', 1, 'tbsp'],
      ['polenta', 1, 'cup'],
    ],
    steps: [
      ['Brown the chicken in the oil. Set aside.', 480],
      ['Cook the onion, pepper and mushrooms until soft, then the garlic.', 480],
      ['Add the tomatoes, oregano and chicken. Simmer, covered, until tender.', 1500],
      ['Whisk the polenta into 4 cups of boiling salted water and cook, stirring often.', 900],
      'Serve the chicken over the polenta.',
    ],
  }),
  r({
    id: 'honey_mustard_chicken_cauliflower',
    title: 'Honey mustard chicken with roasted cauliflower',
    cuisine: 'sheet_pan', minutes: 35, equip: ['oven', 'sheet_pan'], kid: true, emoji: '🍯',
    ing: [
      ['chicken_breast', 600, 'g'], ['honey', 2, 'tbsp'], ['dijon_mustard', 2, 'tbsp'], ['cauliflower', 1, 'each', 'florets'],
      ['potato_baby', 500, 'g'], ['olive_oil', 1.5, 'tbsp'], ['salt', 1, 'tsp'],
    ],
    steps: [
      'Heat the oven to 425°F (220°C).',
      ['Toss the cauliflower and potatoes with the oil and salt and roast.', 900],
      'Mix the honey and mustard and brush over the chicken.',
      ['Add the chicken to the pan and roast until 165°F (74°C).', 1200],
    ],
  }),
  r({
    id: 'hoisin_tofu_veggie_stir_fry',
    title: 'Hoisin tofu and vegetable stir-fry',
    cuisine: 'asian', minutes: 20, equip: ['stovetop'], emoji: '🥦',
    ing: [
      ['tofu_extra_firm', 397, 'g'], ['broccoli', 300, 'g'], ['snow_peas', 150, 'g'], ['mushrooms_button', 150, 'g'],
      ['garlic', 2, 'each', 'cloves'], ['hoisin_sauce', 3, 'tbsp'], ['soy_sauce', 1, 'tbsp'], ['vegetable_oil', 2, 'tbsp'],
      ['white_rice', 1.25, 'cup'],
    ],
    steps: [
      ['Cook the rice with 2½ cups of water, covered, on low.', 900],
      ['Fry the cubed tofu in half the oil until golden. Set aside.', 480],
      ['Stir-fry the vegetables and garlic in the rest of the oil.', 300],
      'Add the tofu, hoisin and soy and toss.',
    ],
  }),
  r({
    id: 'loaded_beef_nachos',
    title: 'Loaded beef nachos',
    cuisine: 'mexican', minutes: 20, equip: ['oven', 'stovetop'], kid: true, mild: false, emoji: '🧀',
    ing: [
      ['tortilla_chips', 283, 'g'], ['ground_beef_lean', 454, 'g'], ['cumin', 2, 'tsp'], ['canned_black_beans', 1, 'each', 'can, rinsed'],
      ['cheddar', 200, 'g'], ['salsa', 227, 'g'], ['sour_cream', 120, 'g'], ['jalapeno', 1, 'each'],
    ],
    steps: [
      ['Brown the beef with the cumin and a pinch of salt.', 480],
      'Heat the oven to 400°F (200°C). Spread the chips on a sheet pan and top with beef, beans and cheese.',
      ['Bake until the cheese melts.', 480],
      'Top with salsa, sour cream and sliced jalapeño.',
    ],
  }),
  r({
    id: 'chicken_pot_pie_biscuits',
    title: 'Chicken pot pie with biscuit top',
    cuisine: 'american', minutes: 60, medium: true, equip: ['oven', 'stovetop'], kid: true, leftover: true, emoji: '🥧',
    ing: [
      ['chicken_breast', 500, 'g', 'cubed'], ['onion_yellow', 1, 'each'], ['carrot', 2, 'each'], ['celery', 2, 'each', 'stalks'],
      ['frozen_peas', 150, 'g'], ['butter', 5, 'tbsp'], ['flour', 1.75, 'cup'], ['broth_chicken', 500, 'ml'], ['milk', 1.25, 'cup'],
      ['baking_powder', 2, 'tsp'], ['thyme_dried', 1, 'tsp'],
    ],
    serves: 6,
    steps: [
      'Heat the oven to 400°F (200°C).',
      ['Soften the onion, carrot and celery in 2 tablespoons of butter. Add the chicken and cook until no longer pink.', 600],
      ['Stir in ¼ cup of the flour, then the broth, ½ cup milk and thyme. Simmer until thick. Add the peas.', 300],
      'Mix the rest of the flour with the baking powder and ½ teaspoon salt. Cut in the rest of the butter, then stir in the rest of the milk.',
      'Pour the filling into a baking dish and drop spoonfuls of biscuit dough on top.',
      ['Bake until the biscuits are golden.', 1500],
    ],
  }),
  r({
    id: 'classic_minestrone',
    title: 'Classic minestrone',
    cuisine: 'soups', minutes: 40, equip: ['stovetop'], leftover: true, emoji: '🥣',
    ing: [
      ['onion_yellow', 1, 'each'], ['garlic', 3, 'each', 'cloves'], ['celery', 2, 'each', 'stalks'], ['carrot', 2, 'each'],
      ['zucchini', 1, 'each'], ['canned_kidney_beans', 1, 'each', 'can, rinsed'], ['diced_tomatoes', 411, 'g'],
      ['broth_veg_lowfodmap', 1500, 'ml'], ['pasta', 120, 'g', 'small shapes'], ['italian_seasoning', 2, 'tsp'], ['olive_oil', 1, 'tbsp'],
    ],
    serves: 6,
    steps: [
      ['Soften the onion, celery and carrot in the oil. Add the garlic.', 480],
      ['Add the broth, tomatoes and seasoning. Simmer.', 600],
      ['Add the zucchini, beans and pasta and simmer until the pasta is tender.', 600],
    ],
  }),
  r({
    id: 'lemon_garlic_roast_chicken_onions',
    title: 'Lemon garlic chicken with onions',
    cuisine: 'sheet_pan', minutes: 50, equip: ['oven', 'sheet_pan'], emoji: '🍋',
    ing: [
      ['chicken_thigh', 680, 'g'], ['lemon', 2, 'each'], ['garlic', 8, 'each', 'cloves'], ['onion_red', 2, 'each', 'wedges'],
      ['potato_yukon', 4, 'each'], ['olive_oil', 2, 'tbsp'], ['oregano_dried', 2, 'tsp'],
    ],
    steps: [
      'Heat the oven to 425°F (220°C).',
      'Toss everything with the oil, lemon juice, oregano and salt in a roasting dish.',
      ['Roast until the chicken is 165°F (74°C) and the potatoes are golden.', 2700],
    ],
  }),
  r({
    id: 'spinach_ricotta_pasta',
    title: 'Spinach ricotta pasta',
    cuisine: 'italian', minutes: 20, equip: ['stovetop'], kid: true, emoji: '🍝',
    ing: [
      ['pasta', 340, 'g'], ['ricotta', 425, 'g'], ['baby_spinach', 142, 'g'], ['garlic', 2, 'each', 'cloves'],
      ['lemon', 1, 'each'], ['parmesan', 0.5, 'cup'], ['olive_oil', 1, 'tbsp'], ['nutmeg', 0.25, 'tsp'],
    ],
    steps: [
      ['Cook the pasta. Save 1 cup of water, then drain.', 600],
      ['Warm the garlic in the oil, then wilt the spinach.', 120],
      'Stir in the ricotta, lemon zest, nutmeg, parmesan and enough pasta water to make it creamy. Toss with the pasta.',
    ],
  }),
  r({
    id: 'hawaiian_chicken_skewers',
    title: 'Hawaiian BBQ chicken skewers',
    cuisine: 'american', minutes: 30, equip: ['grill'], kid: true, emoji: '🍍',
    ing: [
      ['chicken_breast', 600, 'g'], ['pineapple', 0.5, 'each'], ['onion_red', 1, 'each'], ['bell_pepper_red', 1, 'each'],
      ['bbq_sauce', 0.5, 'cup'], ['white_rice', 1.25, 'cup'],
    ],
    steps: [
      ['Cook the rice with 2½ cups of water, covered, on low.', 900],
      'Thread chunks of chicken, pineapple, onion and pepper onto skewers.',
      ['Grill, turning and brushing with BBQ sauce, until the chicken is cooked through.', 720],
    ],
  }),
  r({
    id: 'mango_shrimp_tacos',
    title: 'Mango shrimp tacos',
    cuisine: 'mexican', minutes: 20, equip: ['stovetop'], mild: false, emoji: '🥭',
    ing: [
      ['shrimp', 454, 'g'], ['mango', 1, 'each'], ['onion_red', 0.25, 'each'], ['jalapeno', 1, 'each'], ['lime', 2, 'each'],
      ['cilantro', 0.5, 'each'], ['chipotle_powder', 0.5, 'tsp'], ['corn_tortillas', 12, 'each'], ['vegetable_oil', 1, 'tbsp'],
    ],
    steps: [
      'Dice the mango, onion and jalapeño and mix with lime juice and cilantro.',
      ['Season the shrimp with chipotle and salt and cook in the oil until pink.', 180],
      'Fill warm tortillas with shrimp and mango salsa.',
    ],
  }),
  r({
    id: 'egg_roll_in_a_bowl',
    title: 'Egg roll in a bowl',
    cuisine: 'asian', minutes: 20, equip: ['stovetop'], mild: false, emoji: '🥢',
    ing: [
      ['ground_pork', 454, 'g'], ['coleslaw_mix', 397, 'g'], ['garlic', 3, 'each', 'cloves'], ['ginger_fresh', 1, 'tbsp'],
      ['soy_sauce', 3, 'tbsp'], ['sesame_oil', 1, 'tsp'], ['sriracha', 1, 'tbsp'], ['green_onion', 1, 'each'], ['white_rice', 1, 'cup'],
    ],
    steps: [
      ['Cook the rice with 2 cups of water, covered, on low.', 900],
      ['Brown the pork, then add the garlic and ginger.', 480],
      ['Add the coleslaw mix and soy sauce and cook until just wilted.', 240],
      'Finish with sesame oil, sriracha and green onions. Serve with rice.',
    ],
  }),
  r({
    id: 'loaded_baked_potato_soup',
    title: 'Loaded baked potato soup',
    cuisine: 'soups', minutes: 40, equip: ['stovetop'], kid: true, emoji: '🥔',
    ing: [
      ['potato_russet', 4, 'each', 'cubed'], ['onion_yellow', 1, 'each'], ['garlic', 2, 'each', 'cloves'], ['broth_chicken', 1000, 'ml'],
      ['milk', 1, 'cup'], ['cheddar', 120, 'g'], ['bacon', 4, 'each'], ['chives', 10, 'g'],
    ],
    steps: [
      ['Cook the bacon until crisp. Crumble and set aside, keeping 1 tablespoon of fat.', 360],
      ['Soften the onion in the fat, then add the garlic, potatoes and broth. Simmer until soft.', 1200],
      'Mash or blend part of the soup, stir in the milk and most of the cheese.',
      'Top with bacon, the rest of the cheese and chives.',
    ],
  }),
  r({
    id: 'chicken_burrito_bowls',
    title: 'Chicken burrito bowls',
    cuisine: 'bowls', minutes: 30, equip: ['stovetop'], emoji: '🌯',
    ing: [
      ['chicken_breast', 600, 'g'], ['cumin', 2, 'tsp'], ['chipotle_powder', 0.5, 'tsp'], ['canned_black_beans', 1, 'each', 'can, rinsed'],
      ['frozen_corn', 150, 'g'], ['white_rice', 1.25, 'cup'], ['salsa', 227, 'g'], ['avocado', 1, 'each'], ['lime', 1, 'each'],
      ['vegetable_oil', 1, 'tbsp'],
    ],
    steps: [
      ['Cook the rice with 2½ cups of water. Stir in the lime juice when done.', 900],
      ['Season the chicken and cook in the oil until done. Slice.', 720],
      'Warm the beans and corn together.',
      'Build bowls with rice, chicken, beans, corn, salsa and avocado.',
    ],
  }),
  r({
    id: 'thai_red_curry_chicken',
    title: 'Thai red curry chicken',
    cuisine: 'asian', minutes: 25, equip: ['stovetop'], mild: false, emoji: '🍛',
    ing: [
      ['chicken_breast', 600, 'g'], ['thai_red_curry_paste', 3, 'tbsp'], ['coconut_milk', 403, 'ml'], ['bell_pepper_red', 1, 'each'],
      ['snow_peas', 150, 'g'], ['fish_sauce', 1, 'tbsp'], ['brown_sugar', 1, 'tsp'], ['basil_fresh', 15, 'g'], ['lime', 1, 'each'],
      ['jasmine_rice', 1.25, 'cup'],
    ],
    steps: [
      ['Cook the rice with 2½ cups of water, covered, on low.', 900],
      ['Fry the curry paste in a splash of the coconut milk for 1 minute.', 60],
      ['Add the sliced chicken, the rest of the coconut milk, fish sauce and sugar. Simmer.', 480],
      ['Add the pepper and snow peas and simmer until tender-crisp.', 180],
      'Stir in the basil and lime juice. Serve with rice.',
    ],
  }),
  r({
    id: 'caprese_pasta_salad',
    title: 'Caprese pasta salad',
    cuisine: 'italian', minutes: 20, equip: ['stovetop'], emoji: '🍅',
    ing: [
      ['pasta', 340, 'g', 'short shapes'], ['cherry_tomatoes', 283, 'g'], ['fresh_mozzarella', 200, 'g'], ['basil_fresh', 15, 'g'],
      ['balsamic_vinegar', 2, 'tbsp'], ['olive_oil', 3, 'tbsp'], ['garlic', 1, 'each', 'clove, grated'],
    ],
    steps: [
      ['Cook the pasta, then rinse under cold water and drain well.', 600],
      'Whisk the oil, balsamic, garlic and a pinch of salt.',
      'Toss the pasta with halved tomatoes, torn mozzarella, basil and the dressing.',
    ],
  }),
  r({
    id: 'philly_cheesesteaks',
    title: 'Philly cheesesteak sandwiches',
    cuisine: 'american', minutes: 25, equip: ['stovetop'], emoji: '🥖',
    ing: [
      ['beef_sirloin', 454, 'g', 'very thinly sliced'], ['onion_yellow', 1, 'each'], ['bell_pepper_green', 1, 'each'],
      ['swiss_cheese', 8, 'each'], ['burger_buns', 4, 'each', 'or hoagie rolls'], ['olive_oil', 1, 'tbsp'],
    ],
    steps: [
      ['Cook the onion and pepper in half the oil until soft. Set aside.', 480],
      ['Sear the beef in the rest of the oil over high heat, seasoning with salt and pepper.', 180],
      'Return the vegetables, divide into 4 piles and top with cheese until melted.',
      'Scoop each pile into a toasted roll.',
    ],
  }),
  r({
    id: 'breakfast_burritos',
    title: 'Breakfast-for-dinner burritos',
    cuisine: 'mexican', minutes: 20, equip: ['stovetop'], kid: true, emoji: '🌯',
    ing: [
      ['eggs', 8, 'each'], ['frozen_hash_browns', 300, 'g'], ['bell_pepper_red', 1, 'each'], ['wheat_tortillas', 4, 'each'],
      ['cheddar', 120, 'g'], ['salsa', 227, 'g'], ['vegetable_oil', 1.5, 'tbsp'],
    ],
    steps: [
      ['Crisp the hash browns in 1 tablespoon of oil.', 480],
      ['Cook the diced pepper, then scramble the eggs with it in the rest of the oil.', 240],
      'Fill the tortillas with hash browns, eggs, cheese and salsa and roll up.',
    ],
  }),
];
