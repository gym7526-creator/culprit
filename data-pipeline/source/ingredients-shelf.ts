/**
 * Ingredient master, part 2: frozen, pantry, international, spices, beverages.
 * Same rules as part 1 (general-knowledge FODMAP levels; estimated store-brand prices).
 */
import type { Ingredient } from '../../src/data/content/schema.ts';

import { i, PESCATARIAN, VEGAN, VEGETARIAN } from './helpers.ts';

const F = 'frozen' as const;
const PA = 'pantry' as const;
const IN = 'international' as const;
const S = 'spices' as const;
const BV = 'beverages' as const;

/** Small spice jars: ~50 g at a typical store-brand price. */
const jar = (price = 1.49, size = 50): [number, 'g', number] => [size, 'g', price];
const spice = (id: string, name: string, extra: Parameters<typeof i>[6] = {}, price = 1.49) =>
  i(id, name, S, 5, VEGAN, [jar(price)], { staple: true, gPerMl: 0.5, ...extra });

export const shelfIngredients: Ingredient[] = [
  // ---------------------------------------------------------------- frozen
  i('frozen_peas', 'Frozen peas', F, 0.4, VEGAN, [[340, 'g', 1.49]], { days: 180, fodmap: { gos: 'moderate', fructan: 'moderate' }, safeG: 30 }),
  i('frozen_corn', 'Frozen sweet corn', F, 1.2, VEGAN, [[340, 'g', 1.49]], { days: 180, fodmap: { sorbitol: 'moderate' }, safeG: 40, skin: ['high_glycemic'] }),
  i('frozen_spinach', 'Frozen chopped spinach', F, 0.4, VEGAN, [[283, 'g', 1.49]], { days: 180 }),
  i('frozen_green_beans', 'Frozen green beans', F, 0.1, VEGAN, [[340, 'g', 1.49]], { days: 180, fodmap: { sorbitol: 'moderate' }, safeG: 75 }),
  i('frozen_broccoli', 'Frozen broccoli florets', F, 0.4, VEGAN, [[340, 'g', 1.79]], { days: 180, fodmap: { fructose: 'moderate' }, safeG: 75 }),
  i('frozen_edamame', 'Frozen shelled edamame', F, 5, VEGAN, [[340, 'g', 2.49]], { days: 180, allergens: ['soy'], fodmap: { gos: 'moderate' }, safeG: 90, protein: 'tofu' }),
  i('frozen_berries', 'Frozen mixed berries (blueberry, strawberry, raspberry)', F, 0.4, VEGAN, [[454, 'g', 3.49]], { days: 180 }),
  i('frozen_cauliflower_rice', 'Frozen cauliflower rice', F, 0.3, VEGAN, [[340, 'g', 2.29]], { days: 180, fodmap: { mannitol: 'high' } }),
  i('frozen_hash_browns', 'Frozen shredded hash browns', F, 0.5, VEGAN, [[850, 'g', 2.99]], { days: 180, skin: ['high_glycemic'] }),
  i('frozen_shrimp', 'Frozen raw shrimp, peeled', F, 1, PESCATARIAN, [[907, 'g', 13.99]], { days: 180, allergens: ['shellfish'], protein: 'shellfish' }),
  i('frozen_cod', 'Frozen cod fillets', F, 0.7, PESCATARIAN, [[454, 'g', 6.99]], { days: 180, gEach: 115, allergens: ['fish'], protein: 'fish' }),
  i('frozen_pineapple', 'Frozen pineapple chunks', F, 0.1, VEGAN, [[454, 'g', 2.99]], { days: 180 }),
  i('frozen_bell_peppers', 'Frozen bell pepper strips', F, 0.2, VEGAN, [[454, 'g', 2.29]], { days: 180 }),

  // ---------------------------------------------------------------- pantry: grains & starches
  i('white_rice', 'Long-grain white rice', PA, 0.7, VEGAN, [[907, 'g', 1.99], [2268, 'g', 4.29]], { staple: true, gPerMl: 0.8, skin: ['high_glycemic'] }),
  i('jasmine_rice', 'Jasmine rice', PA, 0.6, VEGAN, [[907, 'g', 2.99]], { gPerMl: 0.8, skin: ['high_glycemic'] }),
  i('basmati_rice', 'Basmati rice', PA, 0.6, VEGAN, [[907, 'g', 3.49]], { gPerMl: 0.8 }),
  i('brown_rice', 'Brown rice', PA, 2.7, VEGAN, [[907, 'g', 1.99]], { gPerMl: 0.8 }),
  i('quinoa', 'Quinoa', PA, 6, VEGAN, [[340, 'g', 3.99]], { gPerMl: 0.75 }),
  i('rolled_oats', 'Rolled oats', PA, 6.5, VEGAN, [[1190, 'g', 3.49]], { staple: true, gPerMl: 0.38, fodmap: { gos: 'moderate', fructan: 'moderate' }, safeG: 52, note: 'Low at about ½ cup dry.' }),
  i('gf_pasta', 'Gluten-free pasta (rice/corn)', PA, 1.5, VEGAN, [[340, 'g', 2.49]], { skin: ['high_glycemic'] }),
  i('pasta', 'Pasta (wheat)', PA, 1.5, VEGAN, [[454, 'g', 1.29]], { staple: true, allergens: ['wheat'], fodmap: { fructan: 'high' }, skin: ['high_glycemic'], swaps: ['gf_pasta'], note: 'Wheat test food.' }),
  i('rice_noodles', 'Rice noodles', PA, 0.6, VEGAN, [[397, 'g', 2.49]], { skin: ['high_glycemic'] }),
  i('polenta', 'Polenta (dry cornmeal)', PA, 1.8, VEGAN, [[680, 'g', 2.99]], { gPerMl: 0.6 }),
  i('gf_flour', 'Gluten-free all-purpose flour', PA, 1.5, VEGAN, [[623, 'g', 4.99]], { gPerMl: 0.55 }),
  i('flour', 'All-purpose flour', PA, 1, VEGAN, [[2268, 'g', 2.99]], { staple: true, gPerMl: 0.53, allergens: ['wheat'], fodmap: { fructan: 'high' }, swaps: ['gf_flour'] }),
  i('cornstarch', 'Cornstarch', PA, 0.1, VEGAN, [[454, 'g', 1.79]], { staple: true, gPerMl: 0.54 }),
  i('panko', 'Panko breadcrumbs', PA, 3, VEGAN, [[227, 'g', 2.29]], { gPerMl: 0.25, allergens: ['wheat'], fodmap: { fructan: 'high' }, swaps: ['gf_breadcrumbs'] }),
  i('gf_breadcrumbs', 'Gluten-free breadcrumbs', PA, 3, VEGAN, [[340, 'g', 4.49]], { gPerMl: 0.3 }),
  i('rice_cakes', 'Plain rice cakes', PA, 3, VEGAN, [[136, 'g', 2.49]], { gEach: 9, skin: ['high_glycemic'], note: 'Control (placebo) test food.' }),
  i('gf_crackers', 'Gluten-free rice crackers', PA, 8, VEGAN, [[100, 'g', 2.99]], { gEach: 3 }),
  i('tortilla_chips', 'Corn tortilla chips', PA, 23, VEGAN, [[283, 'g', 2.99]], { reflux: ['fried'] }),
  i('popcorn_kernels', 'Popcorn kernels', PA, 4, VEGAN, [[850, 'g', 2.99]], { gPerMl: 0.7 }),
  i('rice_paper', 'Rice paper wrappers', IN, 0.5, VEGAN, [[340, 'g', 3.49]], { gEach: 9 }),

  // ---------------------------------------------------------------- pantry: canned & jarred
  i('canned_chickpeas', 'Canned chickpeas', PA, 2.5, VEGAN, [[439, 'g', 1.09]], { gPerMl: 0.65, fodmap: { gos: 'high' }, safeG: 42, protein: 'legume', note: 'Rinsed canned chickpeas are low at ¼ cup. GOS test food.' }),
  i('canned_lentils', 'Canned lentils', PA, 0.4, VEGAN, [[425, 'g', 1.49]], { gPerMl: 0.8, fodmap: { gos: 'high' }, safeG: 46, protein: 'legume', note: 'Rinsed canned lentils are low at ¼ cup. GOS test food.' }),
  i('canned_black_beans', 'Canned black beans', PA, 0.5, VEGAN, [[439, 'g', 1.09]], { gPerMl: 0.7, fodmap: { gos: 'high' }, safeG: 30, protein: 'legume' }),
  i('canned_kidney_beans', 'Canned kidney beans', PA, 0.5, VEGAN, [[439, 'g', 1.09]], { gPerMl: 0.7, fodmap: { gos: 'high' }, protein: 'legume' }),
  i('refried_beans', 'Canned refried beans', PA, 1.5, VEGAN, [[454, 'g', 1.49]], { gPerMl: 1, fodmap: { gos: 'high', fructan: 'high' } }),
  i('coconut_milk', 'Canned coconut milk', PA, 20, VEGAN, [[403, 'ml', 2.29]], { gPerMl: 1, note: 'Low at ½ cup.' }),
  i('coconut_milk_light', 'Canned light coconut milk', PA, 7, VEGAN, [[403, 'ml', 2.29]], { gPerMl: 1 }),
  i('crushed_tomatoes', 'Canned crushed tomatoes', PA, 0.3, VEGAN, [[794, 'g', 1.99]], { gPerMl: 1.05, reflux: ['tomato'] }),
  i('diced_tomatoes', 'Canned diced tomatoes', PA, 0.2, VEGAN, [[411, 'g', 1.09]], { gPerMl: 1.05, reflux: ['tomato'] }),
  i('tomato_passata', 'Tomato passata (plain, no onion or garlic)', PA, 0.2, VEGAN, [[680, 'g', 2.99]], { gPerMl: 1.05, reflux: ['tomato'] }),
  i('tomato_paste', 'Tomato paste', PA, 0.5, VEGAN, [[170, 'g', 0.99]], { gPerMl: 1.1, reflux: ['tomato'] }),
  i('marinara_sauce', 'Marinara sauce (jarred)', PA, 2, VEGAN, [[680, 'g', 2.49]], { gPerMl: 1.05, reflux: ['tomato'], fodmap: { fructan: 'high' }, swaps: ['tomato_passata'] }),
  i('salsa', 'Jarred salsa', PA, 0.2, VEGAN, [[454, 'g', 2.49]], { gPerMl: 1.05, reflux: ['tomato', 'spicy'], fodmap: { fructan: 'high' } }),
  i('roasted_red_peppers', 'Roasted red peppers (jarred)', PA, 0.3, VEGAN, [[340, 'g', 2.99]], {}),
  i('olives_black', 'Sliced black olives', PA, 11, VEGAN, [[170, 'g', 1.29]], {}),
  i('olives_kalamata', 'Kalamata olives', PA, 15, VEGAN, [[283, 'g', 3.99]], {}),
  i('capers', 'Capers', PA, 0.9, VEGAN, [[100, 'g', 2.49]], {}),
  i('pickles', 'Dill pickles', PA, 0.2, VEGAN, [[680, 'g', 2.49]], { fodmap: { fructan: 'low' } }),
  i('canned_tuna', 'Canned tuna in water', PA, 1, PESCATARIAN, [[142, 'g', 1.29]], { allergens: ['fish'], protein: 'fish' }),
  i('canned_salmon', 'Canned salmon', PA, 6, PESCATARIAN, [[418, 'g', 4.99]], { allergens: ['fish'], protein: 'fish' }),
  i('broth_chicken_lowfodmap', 'Chicken broth, onion- and garlic-free', PA, 0.2, [], [[946, 'ml', 4.49, false]], { gPerMl: 1, note: 'Choose a broth labelled onion- and garlic-free (or certified low-FODMAP).' }),
  i('broth_veg_lowfodmap', 'Vegetable broth, onion- and garlic-free', PA, 0.2, VEGAN, [[946, 'ml', 4.49, false]], { gPerMl: 1, note: 'Choose a broth labelled onion- and garlic-free (or certified low-FODMAP).' }),
  i('broth_chicken', 'Chicken broth (regular)', PA, 0.2, [], [[946, 'ml', 1.99]], { gPerMl: 1, fodmap: { fructan: 'high' }, swaps: ['broth_chicken_lowfodmap'], note: 'Most regular broths contain onion and garlic.' }),
  i('broth_beef', 'Beef broth (regular)', PA, 0.2, [], [[946, 'ml', 1.99]], { gPerMl: 1, fodmap: { fructan: 'high' } }),

  // ---------------------------------------------------------------- pantry: oils, vinegars, sauces
  i('olive_oil', 'Olive oil', PA, 100, VEGAN, [[500, 'ml', 6.99]], { staple: true, gPerMl: 0.92 }),
  i('vegetable_oil', 'Vegetable oil', PA, 100, VEGAN, [[1420, 'ml', 3.99]], { staple: true, gPerMl: 0.92 }),
  i('garlic_infused_oil', 'Garlic-infused olive oil (store-bought)', PA, 100, VEGAN, [[250, 'ml', 6.49, false]], { gPerMl: 0.92, note: 'Garlic flavour without the fructans, which do not dissolve in oil. Buy it ready-made; homemade garlic oil has a food-safety risk.' }),
  i('sesame_oil', 'Toasted sesame oil', IN, 100, VEGAN, [[148, 'ml', 3.49]], { gPerMl: 0.92, allergens: ['sesame'] }),
  i('cooking_spray', 'Cooking spray', PA, 100, VEGAN, [[170, 'g', 2.99]], { staple: true }),
  i('rice_vinegar', 'Rice vinegar', IN, 0, VEGAN, [[355, 'ml', 2.49]], { gPerMl: 1 }),
  i('apple_cider_vinegar', 'Apple cider vinegar', PA, 0, VEGAN, [[473, 'ml', 1.99]], { staple: true, gPerMl: 1 }),
  i('balsamic_vinegar', 'Balsamic vinegar', PA, 0, VEGAN, [[500, 'ml', 3.49]], { gPerMl: 1.05, fodmap: { fructose: 'moderate' }, safeG: 21 }),
  i('red_wine_vinegar', 'Red wine vinegar', PA, 0, VEGAN, [[473, 'ml', 1.99]], { gPerMl: 1 }),
  i('white_vinegar', 'White vinegar', PA, 0, VEGAN, [[946, 'ml', 1.29]], { staple: true, gPerMl: 1 }),
  i('soy_sauce', 'Soy sauce', IN, 0.1, VEGAN, [[444, 'ml', 2.49]], { staple: true, gPerMl: 1.1, allergens: ['soy', 'wheat'], swaps: ['tamari'] }),
  i('tamari', 'Tamari (gluten-free soy sauce)', IN, 0.1, VEGAN, [[296, 'ml', 3.99]], { gPerMl: 1.1, allergens: ['soy'] }),
  i('fish_sauce', 'Fish sauce', IN, 0, PESCATARIAN, [[200, 'ml', 2.99]], { gPerMl: 1.2, allergens: ['fish'] }),
  i('oyster_sauce', 'Oyster sauce', IN, 0.3, PESCATARIAN, [[255, 'g', 2.99]], { gPerMl: 1.2, allergens: ['shellfish', 'wheat', 'soy'] }),
  i('hoisin_sauce', 'Hoisin sauce', IN, 0.5, VEGAN, [[240, 'g', 2.99]], { gPerMl: 1.2, allergens: ['soy', 'wheat'], fodmap: { fructan: 'high' } }),
  i('miso_paste', 'White miso paste', IN, 6, VEGAN, [[397, 'g', 4.99]], { gPerMl: 1.15, allergens: ['soy'] }),
  i('sriracha', 'Sriracha', IN, 1, VEGAN, [[481, 'g', 3.49]], { gPerMl: 1.1, reflux: ['spicy'], fodmap: { fructan: 'moderate' }, safeG: 5 }),
  i('hot_sauce', 'Hot sauce (vinegar-based)', PA, 0, VEGAN, [[148, 'ml', 1.49]], { gPerMl: 1, reflux: ['spicy'] }),
  i('thai_red_curry_paste', 'Thai red curry paste', IN, 3, VEGAN, [[113, 'g', 2.99]], { gPerMl: 1.1, reflux: ['spicy'], fodmap: { fructan: 'high' }, note: 'Usually contains garlic and shallot.' }),
  i('dijon_mustard', 'Dijon mustard', PA, 4, VEGAN, [[340, 'g', 1.99]], { staple: true, gPerMl: 1.05 }),
  i('yellow_mustard', 'Yellow mustard', PA, 3, VEGAN, [[397, 'g', 1.29]], { gPerMl: 1.05 }),
  i('mayonnaise', 'Mayonnaise', PA, 75, VEGETARIAN, [[887, 'ml', 3.99]], { staple: true, gPerMl: 0.92, allergens: ['egg'] }),
  i('ketchup', 'Ketchup', PA, 0.1, VEGAN, [[567, 'g', 1.99]], { gPerMl: 1.15, reflux: ['tomato'], fodmap: { fructan: 'moderate' }, safeG: 13, skin: ['high_glycemic'] }),
  i('bbq_sauce', 'BBQ sauce', PA, 0.5, VEGAN, [[510, 'g', 1.99]], { gPerMl: 1.2, reflux: ['tomato'], fodmap: { fructan: 'high', fructose: 'moderate' }, skin: ['high_glycemic'] }),
  i('pesto', 'Basil pesto (jarred)', PA, 45, VEGETARIAN, [[170, 'g', 3.49]], { gPerMl: 1, allergens: ['milk', 'tree_nut'], fodmap: { fructan: 'high' }, reflux: ['high_fat'] }),
  i('peanut_butter', 'Peanut butter (natural)', PA, 50, VEGAN, [[454, 'g', 2.99]], { gPerMl: 1.05, allergens: ['peanut'] }),
  i('tahini', 'Tahini', IN, 54, VEGAN, [[454, 'g', 5.99]], { gPerMl: 1.05, allergens: ['sesame'] }),
  i('maple_syrup', 'Maple syrup (pure)', PA, 0.1, VEGAN, [[355, 'ml', 6.99]], { gPerMl: 1.32, skin: ['high_glycemic'] }),
  i('honey', 'Honey', PA, 0, VEGETARIAN, [[340, 'g', 4.49]], { gPerMl: 1.42, fodmap: { fructose: 'high' }, skin: ['high_glycemic'], note: 'Fructose test food.' }),
  i('sugar', 'Granulated sugar', PA, 0, VEGAN, [[1814, 'g', 2.99]], { staple: true, gPerMl: 0.85, skin: ['high_glycemic'] }),
  i('brown_sugar', 'Brown sugar', PA, 0, VEGAN, [[907, 'g', 2.29]], { staple: true, gPerMl: 0.9, skin: ['high_glycemic'] }),
  i('baking_powder', 'Baking powder', PA, 0, VEGAN, [[230, 'g', 1.99]], { staple: true, gPerMl: 0.9 }),
  i('vanilla_extract', 'Vanilla extract', S, 0, VEGAN, [[59, 'ml', 3.99]], { staple: true, gPerMl: 0.88 }),
  i('dark_chocolate', 'Dark chocolate bar (70%)', PA, 43, VEGAN, [[100, 'g', 2.99]], { gEach: 10, reflux: ['chocolate', 'caffeine', 'high_fat'], note: 'Chocolate test food (gEach = one small square).' }),
  i('cocoa_powder', 'Unsweetened cocoa powder', PA, 14, VEGAN, [[226, 'g', 3.49]], { gPerMl: 0.42, reflux: ['chocolate', 'caffeine'] }),
  // ---------------------------------------------------------------- pantry: nuts & seeds
  i('walnuts', 'Walnuts', PA, 65, VEGAN, [[227, 'g', 4.99]], { gPerMl: 0.42, allergens: ['tree_nut'] }),
  i('almonds', 'Almonds', PA, 50, VEGAN, [[227, 'g', 4.49]], { gPerMl: 0.6, allergens: ['tree_nut'], fodmap: { gos: 'moderate' }, safeG: 12 }),
  i('sliced_almonds', 'Sliced almonds', PA, 50, VEGAN, [[170, 'g', 3.99]], { gPerMl: 0.38, allergens: ['tree_nut'], fodmap: { gos: 'moderate' }, safeG: 12 }),
  i('peanuts', 'Roasted peanuts', PA, 49, VEGAN, [[454, 'g', 3.49]], { gPerMl: 0.6, allergens: ['peanut'] }),
  i('pecans', 'Pecans', PA, 72, VEGAN, [[170, 'g', 4.99]], { gPerMl: 0.45, allergens: ['tree_nut'] }),
  i('cashews', 'Cashews', PA, 44, VEGAN, [[227, 'g', 4.99]], { gPerMl: 0.55, allergens: ['tree_nut'], fodmap: { gos: 'high', fructan: 'high' } }),
  i('pistachios', 'Pistachios', PA, 45, VEGAN, [[170, 'g', 4.99]], { gPerMl: 0.55, allergens: ['tree_nut'], fodmap: { gos: 'high', fructan: 'high' } }),
  i('pumpkin_seeds', 'Pumpkin seeds (pepitas)', PA, 49, VEGAN, [[227, 'g', 3.99]], { gPerMl: 0.55 }),
  i('sunflower_seeds', 'Sunflower seeds', PA, 51, VEGAN, [[227, 'g', 2.49]], { gPerMl: 0.55 }),
  i('chia_seeds', 'Chia seeds', PA, 31, VEGAN, [[340, 'g', 4.99]], { gPerMl: 0.65 }),
  i('sesame_seeds', 'Sesame seeds', S, 50, VEGAN, [[100, 'g', 2.49]], { gPerMl: 0.6, allergens: ['sesame'] }),
  i('shredded_coconut', 'Unsweetened shredded coconut', PA, 65, VEGAN, [[198, 'g', 2.99]], { gPerMl: 0.35 }),
  i('raisins', 'Raisins', PA, 0.5, VEGAN, [[340, 'g', 2.99]], { gPerMl: 0.65, fodmap: { fructose: 'moderate', fructan: 'moderate' }, safeG: 13, skin: ['high_glycemic'] }),

  // ---------------------------------------------------------------- spices & dried herbs
  i('salt', 'Salt', S, 0, VEGAN, [[737, 'g', 0.99]], { staple: true, gPerMl: 1.2 }),
  i('black_pepper', 'Ground black pepper', S, 3, VEGAN, [jar(2.49, 85)], { staple: true, gPerMl: 0.5 }),
  spice('cumin', 'Ground cumin'),
  spice('paprika', 'Paprika'),
  spice('smoked_paprika', 'Smoked paprika', {}, 1.99),
  spice('turmeric', 'Ground turmeric'),
  spice('ground_ginger', 'Ground ginger'),
  spice('cinnamon', 'Ground cinnamon'),
  spice('nutmeg', 'Ground nutmeg', {}, 2.49),
  spice('oregano_dried', 'Dried oregano'),
  spice('basil_dried', 'Dried basil'),
  spice('thyme_dried', 'Dried thyme'),
  spice('rosemary_dried', 'Dried rosemary'),
  spice('italian_seasoning', 'Italian seasoning (herbs only, no garlic)'),
  spice('dill_dried', 'Dried dill'),
  spice('coriander_ground', 'Ground coriander'),
  spice('curry_powder', 'Curry powder (no garlic or onion)', {}, 1.99),
  spice('garam_masala', 'Garam masala', {}, 2.99),
  spice('five_spice', 'Chinese five-spice', {}, 2.99),
  spice('bay_leaves', 'Bay leaves', { gEach: 0.2 }, 1.99),
  spice('mustard_powder', 'Dry mustard powder', {}, 2.49),
  spice('fennel_seeds', 'Fennel seeds', {}, 1.99),
  spice('chili_flakes', 'Red pepper flakes', { reflux: ['spicy'] }),
  spice('cayenne', 'Cayenne pepper', { reflux: ['spicy'] }),
  spice('chipotle_powder', 'Chipotle chili powder (pure)', { reflux: ['spicy'] }, 2.49),
  spice('ancho_powder', 'Ancho chili powder (pure, mild)', {}, 2.49),
  spice('garlic_powder', 'Garlic powder', { fodmap: { fructan: 'high' }, swaps: ['garlic_infused_oil'] }),
  spice('onion_powder', 'Onion powder', { fodmap: { fructan: 'high' }, swaps: ['chives'] }),
  spice('asafoetida', 'Asafoetida (gluten-free)', { note: 'A pinch gives an onion-garlic flavour. Check the label for a gluten-free (rice flour) blend.' }, 4.99),

  // ---------------------------------------------------------------- beverages (test foods)
  i('coffee_ground', 'Ground coffee', BV, 0, VEGAN, [[340, 'g', 7.99]], { reflux: ['caffeine'], note: 'Coffee test food.' }),
  i('peppermint_tea', 'Peppermint tea bags', BV, 0, VEGAN, [[20, 'each', 2.99]], { gEach: 2, reflux: ['mint'], note: 'Mint test food.' }),
  i('ginger_tea', 'Ginger tea bags', BV, 0, VEGAN, [[20, 'each', 2.99]], { gEach: 2 }),
  i('sparkling_water', 'Sparkling water (plain)', BV, 0, VEGAN, [[2000, 'ml', 1.29]], { gPerMl: 1, reflux: ['carbonation'], note: 'Carbonation test food.' }),
  i('red_wine', 'Red wine', BV, 0, VEGAN, [[750, 'ml', 8.99, false]], { gPerMl: 1, reflux: ['alcohol'], note: 'Alcohol test only: 21+ and opt-in.' }),
];

