/**
 * Ingredient master, part 3: wider coverage for swaps, custom grocery items and future recipes.
 * Same rules as parts 1 and 2: general-knowledge FODMAP levels (human review before launch) and
 * estimated typical store-brand prices.
 */
import type { Ingredient } from '../../src/data/content/schema.ts';

import { i, MEAT, PESCATARIAN, VEGAN, VEGETARIAN } from './helpers.ts';

const P = 'produce' as const;
const M = 'meat_seafood' as const;
const D = 'dairy' as const;
const F = 'frozen' as const;
const PA = 'pantry' as const;
const IN = 'international' as const;
const S = 'spices' as const;
const BV = 'beverages' as const;

const spice = (id: string, name: string, extra: Parameters<typeof i>[6] = {}, price = 1.99) =>
  i(id, name, S, 5, VEGAN, [[50, 'g', price]], { staple: true, gPerMl: 0.5, ...extra });

export const extraIngredients: Ingredient[] = [
  // ---------------------------------------------------------------- produce
  i('green_leaf_lettuce', 'Green leaf lettuce', P, 0.2, VEGAN, [[1, 'each', 1.79]], {
    days: 6,
    gEach: 300,
  }),
  i('red_leaf_lettuce', 'Red leaf lettuce', P, 0.2, VEGAN, [[1, 'each', 1.79]], {
    days: 6,
    gEach: 300,
  }),
  i('collard_greens', 'Collard greens', P, 0.6, VEGAN, [[1, 'each', 1.99]], {
    days: 7,
    gEach: 300,
  }),
  i('watercress', 'Watercress', P, 0.1, VEGAN, [[113, 'g', 2.99]], { days: 4 }),
  i('endive', 'Belgian endive', P, 0.1, VEGAN, [[1, 'each', 1.49]], { days: 7, gEach: 120 }),
  i('radicchio', 'Radicchio', P, 0.3, VEGAN, [[1, 'each', 2.49]], { days: 10, gEach: 250 }),
  i('daikon', 'Daikon radish', P, 0.1, VEGAN, [[1, 'each', 1.99]], { days: 14, gEach: 500 }),
  i('turnip', 'Turnips', P, 0.1, VEGAN, [[454, 'g', 1.49]], { days: 21, gEach: 120 }),
  i('rutabaga', 'Rutabaga', P, 0.2, VEGAN, [[1, 'each', 1.99]], { days: 30, gEach: 600 }),
  i('jicama', 'Jicama', P, 0.1, VEGAN, [[1, 'each', 1.79]], { days: 14, gEach: 500 }),
  i('chayote', 'Chayote squash', P, 0.1, VEGAN, [[1, 'each', 0.99]], { days: 14, gEach: 200 }),
  i('acorn_squash', 'Acorn squash', P, 0.1, VEGAN, [[1, 'each', 1.99]], {
    days: 30,
    gEach: 700,
    fodmap: { gos: 'moderate' },
    safeG: 75,
  }),
  i('poblano', 'Poblano pepper (mild)', P, 0.2, VEGAN, [[1, 'each', 0.69]], {
    days: 10,
    gEach: 120,
  }),
  i('serrano', 'Serrano pepper', P, 0.4, VEGAN, [[1, 'each', 0.15]], {
    days: 10,
    gEach: 6,
    reflux: ['spicy'],
  }),
  i('cremini_mushrooms', 'Cremini mushrooms', P, 0.1, VEGAN, [[227, 'g', 2.79]], {
    days: 5,
    fodmap: { mannitol: 'high' },
  }),
  i('portobello', 'Portobello mushroom caps', P, 0.4, VEGAN, [[2, 'each', 3.49]], {
    days: 5,
    gEach: 85,
    fodmap: { mannitol: 'high' },
  }),
  i('alfalfa_sprouts', 'Alfalfa sprouts', P, 0.7, VEGAN, [[113, 'g', 2.49]], { days: 4 }),
  i('onion_white', 'White onion', P, 0.1, VEGAN, [[1, 'each', 0.99]], {
    days: 30,
    gEach: 150,
    fodmap: { fructan: 'high' },
    swaps: ['green_onion', 'chives'],
  }),
  i('honeydew', 'Honeydew melon', P, 0.1, VEGAN, [[1, 'each', 3.49]], { days: 7, gEach: 1800 }),
  i('papaya', 'Papaya', P, 0.3, VEGAN, [[1, 'each', 2.99]], { days: 5, gEach: 500 }),
  i('passion_fruit', 'Passion fruit', P, 0.7, VEGAN, [[1, 'each', 0.99]], { days: 7, gEach: 18 }),
  i('clementine', 'Clementines', P, 0.2, VEGAN, [[1361, 'g', 4.99]], {
    days: 14,
    gEach: 75,
    reflux: ['citrus'],
  }),
  i('grapefruit', 'Grapefruit', P, 0.1, VEGAN, [[1, 'each', 1.29]], {
    days: 14,
    gEach: 250,
    reflux: ['citrus'],
  }),
  i('plum', 'Plum', P, 0.3, VEGAN, [[1, 'each', 0.79]], {
    days: 5,
    gEach: 70,
    fodmap: { sorbitol: 'high' },
  }),
  i('nectarine', 'Nectarine', P, 0.3, VEGAN, [[1, 'each', 0.89]], {
    days: 5,
    gEach: 140,
    fodmap: { sorbitol: 'high' },
  }),
  i('cherries', 'Cherries', P, 0.2, VEGAN, [[454, 'g', 4.99]], {
    days: 5,
    fodmap: { fructose: 'high', sorbitol: 'high' },
  }),
  i('rhubarb', 'Rhubarb', P, 0.2, VEGAN, [[454, 'g', 3.99]], { days: 7 }),
  i('lemongrass_paste', 'Lemongrass paste', P, 1, VEGAN, [[113, 'g', 3.49]], { days: 30 }),
  i('ginger_paste', 'Ginger paste', P, 1, VEGAN, [[113, 'g', 3.49]], { days: 30 }),

  // ---------------------------------------------------------------- meat & seafood
  i('ground_lamb', 'Ground lamb', M, 23, MEAT, [[454, 'g', 8.99]], {
    days: 2,
    reflux: ['high_fat'],
  }),
  i('pork_shoulder', 'Pork shoulder', M, 15, MEAT, [[1361, 'g', 7.99]], {
    days: 3,
    protein: 'pork',
    reflux: ['high_fat'],
  }),
  i('chicken_sausage', 'Chicken sausage', M, 9, MEAT, [[340, 'g', 4.99]], {
    days: 7,
    gEach: 85,
    protein: 'chicken',
    fodmap: { fructan: 'high' },
    note: 'Most are seasoned with garlic or onion.',
  }),
  i('turkey_bacon', 'Turkey bacon', M, 15, MEAT, [[340, 'g', 3.99]], {
    days: 7,
    gEach: 14,
    protein: 'turkey',
  }),
  i('beef_chuck_roast', 'Beef chuck roast', M, 14, MEAT, [[1361, 'g', 16.99]], {
    days: 3,
    protein: 'beef',
  }),
  i('smoked_salmon', 'Smoked salmon', M, 4, PESCATARIAN, [[113, 'g', 5.99]], {
    days: 14,
    allergens: ['fish'],
    protein: 'fish',
  }),
  i('mahi_mahi', 'Mahi-mahi fillets', M, 0.7, PESCATARIAN, [[454, 'g', 10.99]], {
    days: 2,
    allergens: ['fish'],
    protein: 'fish',
  }),
  i('trout', 'Rainbow trout fillets', M, 6, PESCATARIAN, [[454, 'g', 9.99]], {
    days: 2,
    allergens: ['fish'],
    protein: 'fish',
  }),
  i('mussels', 'Mussels', M, 2, PESCATARIAN, [[907, 'g', 6.99]], {
    days: 2,
    allergens: ['shellfish'],
    protein: 'shellfish',
  }),
  i('canned_sardines', 'Canned sardines', PA, 11, PESCATARIAN, [[106, 'g', 1.79]], {
    allergens: ['fish'],
    protein: 'fish',
  }),

  // ---------------------------------------------------------------- dairy & refrigerated
  i('brie', 'Brie cheese', D, 28, VEGETARIAN, [[227, 'g', 5.99]], {
    days: 21,
    allergens: ['milk'],
    skin: ['dairy_milk'],
    protein: 'cheese',
  }),
  i('goat_cheese', 'Goat cheese', D, 21, VEGETARIAN, [[113, 'g', 3.99]], {
    days: 21,
    allergens: ['milk'],
    protein: 'cheese',
  }),
  i('provolone', 'Sliced provolone', D, 27, VEGETARIAN, [[227, 'g', 3.49]], {
    days: 30,
    gEach: 21,
    allergens: ['milk'],
    skin: ['dairy_milk'],
    protein: 'cheese',
  }),
  i('pepper_jack', 'Pepper Jack cheese', D, 30, VEGETARIAN, [[227, 'g', 2.99]], {
    days: 30,
    allergens: ['milk'],
    skin: ['dairy_milk'],
    reflux: ['spicy'],
    protein: 'cheese',
  }),
  i('half_and_half', 'Half-and-half', D, 12, VEGETARIAN, [[473, 'ml', 2.49]], {
    days: 14,
    gPerMl: 1,
    allergens: ['milk'],
    skin: ['dairy_milk'],
    fodmap: { lactose: 'moderate' },
    safeG: 30,
  }),
  i('oat_milk', 'Oat milk', D, 1.5, VEGAN, [[1893, 'ml', 3.99]], {
    days: 10,
    gPerMl: 1,
    fodmap: { fructan: 'moderate', gos: 'moderate' },
    safeG: 125,
    note: 'Low at about ½ cup.',
  }),
  i('rice_milk', 'Rice milk', D, 1, VEGAN, [[1893, 'ml', 3.49]], {
    days: 10,
    gPerMl: 1,
    skin: ['high_glycemic'],
  }),
  i('ghee', 'Ghee', PA, 99, VEGETARIAN, [[227, 'g', 6.99]], { gPerMl: 0.91, allergens: ['milk'] }),
  i('kefir_plain', 'Plain kefir', D, 2, VEGETARIAN, [[946, 'ml', 3.99]], {
    days: 14,
    gPerMl: 1.03,
    allergens: ['milk'],
    skin: ['dairy_milk', 'whey'],
    fodmap: { lactose: 'moderate' },
    safeG: 60,
  }),

  // ---------------------------------------------------------------- frozen
  i(
    'frozen_mixed_veg',
    'Frozen mixed vegetables (peas, corn, carrots, beans)',
    F,
    0.5,
    VEGAN,
    [[454, 'g', 1.79]],
    { days: 180, fodmap: { gos: 'moderate', sorbitol: 'moderate' }, safeG: 40 },
  ),
  i('frozen_kale', 'Frozen chopped kale', F, 0.5, VEGAN, [[340, 'g', 1.99]], { days: 180 }),
  i('frozen_salmon', 'Frozen salmon fillets', F, 13, PESCATARIAN, [[454, 'g', 8.99]], {
    days: 180,
    gEach: 113,
    allergens: ['fish'],
    protein: 'fish',
  }),
  i('frozen_chicken_breast', 'Frozen boneless chicken breasts', F, 3, MEAT, [[1361, 'g', 9.99]], {
    days: 180,
    gEach: 200,
    protein: 'chicken',
  }),
  i('frozen_tilapia', 'Frozen tilapia fillets', F, 2, PESCATARIAN, [[907, 'g', 7.99]], {
    days: 180,
    gEach: 115,
    allergens: ['fish'],
    protein: 'fish',
  }),
  i('frozen_mango', 'Frozen mango chunks', F, 0.4, VEGAN, [[454, 'g', 2.99]], {
    days: 180,
    fodmap: { fructose: 'high' },
  }),

  // ---------------------------------------------------------------- pantry: grains & noodles
  i('arborio_rice', 'Arborio rice', PA, 0.6, VEGAN, [[907, 'g', 3.99]], {
    gPerMl: 0.8,
    skin: ['high_glycemic'],
  }),
  i('wild_rice', 'Wild rice', PA, 1, VEGAN, [[454, 'g', 4.99]], { gPerMl: 0.65 }),
  i('millet', 'Millet', PA, 4, VEGAN, [[680, 'g', 3.99]], { gPerMl: 0.85 }),
  i('buckwheat_groats', 'Buckwheat groats', PA, 3, VEGAN, [[454, 'g', 4.49]], { gPerMl: 0.7 }),
  i('egg_noodles', 'Egg noodles', PA, 4, VEGETARIAN, [[340, 'g', 1.99]], {
    allergens: ['wheat', 'egg'],
    fodmap: { fructan: 'high' },
    skin: ['high_glycemic'],
  }),
  i('couscous', 'Couscous', PA, 0.6, VEGAN, [[284, 'g', 2.49]], {
    gPerMl: 0.73,
    allergens: ['wheat'],
    fodmap: { fructan: 'high' },
  }),
  i('orzo', 'Orzo', PA, 1.5, VEGAN, [[454, 'g', 1.79]], {
    allergens: ['wheat'],
    fodmap: { fructan: 'high' },
  }),
  i('udon', 'Udon noodles', IN, 1, VEGAN, [[600, 'g', 3.49]], {
    allergens: ['wheat'],
    fodmap: { fructan: 'high' },
  }),
  i('taco_shells', 'Corn taco shells', PA, 22, VEGAN, [[12, 'each', 2.49]], {
    gEach: 11,
    reflux: ['fried'],
  }),

  // ---------------------------------------------------------------- pantry: canned & jarred
  i('coconut_cream', 'Canned coconut cream', PA, 35, VEGAN, [[400, 'ml', 2.99]], {
    gPerMl: 1,
    reflux: ['high_fat'],
  }),
  i('canned_corn', 'Canned sweet corn', PA, 1.2, VEGAN, [[432, 'g', 0.99]], {
    fodmap: { sorbitol: 'moderate' },
    safeG: 40,
  }),
  i('canned_green_beans', 'Canned green beans', PA, 0.1, VEGAN, [[411, 'g', 0.99]], {}),
  i('canned_pumpkin', 'Canned pumpkin purée', PA, 0.3, VEGAN, [[425, 'g', 1.99]], {
    gPerMl: 1.05,
    fodmap: { gos: 'moderate' },
    safeG: 75,
  }),
  i('canned_pineapple', 'Canned pineapple in juice', PA, 0.1, VEGAN, [[567, 'g', 1.79]], {}),
  i('applesauce', 'Unsweetened applesauce', PA, 0.1, VEGAN, [[680, 'g', 2.49]], {
    gPerMl: 1.05,
    fodmap: { fructose: 'high', sorbitol: 'high' },
  }),
  i('strawberry_jam', 'Strawberry jam', PA, 0.1, VEGAN, [[510, 'g', 2.99]], {
    gPerMl: 1.3,
    skin: ['high_glycemic'],
  }),
  i('salsa_verde', 'Salsa verde', PA, 0.5, VEGAN, [[454, 'g', 2.99]], {
    gPerMl: 1.05,
    reflux: ['spicy'],
    fodmap: { fructan: 'high' },
  }),
  i('enchilada_sauce', 'Red enchilada sauce', PA, 1, VEGAN, [[284, 'g', 1.79]], {
    gPerMl: 1.05,
    reflux: ['tomato', 'spicy'],
    fodmap: { fructan: 'high' },
  }),
  i('pickled_jalapenos', 'Pickled jalapeños', PA, 0.4, VEGAN, [[340, 'g', 1.99]], {
    reflux: ['spicy'],
  }),
  i('sun_dried_tomatoes', 'Sun-dried tomatoes', PA, 3, VEGAN, [[85, 'g', 3.49]], {
    reflux: ['tomato'],
    fodmap: { fructose: 'moderate' },
    safeG: 8,
  }),
  i('artichoke_hearts', 'Canned artichoke hearts', PA, 0.3, VEGAN, [[397, 'g', 2.99]], {
    fodmap: { fructan: 'high' },
  }),
  i('worcestershire', 'Worcestershire sauce', PA, 0, PESCATARIAN, [[296, 'ml', 2.49]], {
    gPerMl: 1.1,
    allergens: ['fish'],
    fodmap: { fructan: 'moderate' },
    safeG: 10,
  }),
  i('sweet_chili_sauce', 'Sweet chili sauce', IN, 0.2, VEGAN, [[296, 'ml', 2.99]], {
    gPerMl: 1.2,
    reflux: ['spicy'],
    fodmap: { fructan: 'moderate' },
    safeG: 10,
    skin: ['high_glycemic'],
  }),
  i('teriyaki_sauce', 'Teriyaki sauce (bottled)', IN, 0.1, VEGAN, [[296, 'ml', 2.99]], {
    gPerMl: 1.15,
    allergens: ['soy', 'wheat'],
    fodmap: { fructan: 'high' },
    swaps: ['tamari'],
  }),
  i('coconut_aminos', 'Coconut aminos', IN, 0, VEGAN, [[237, 'ml', 5.99]], { gPerMl: 1.1 }),
  i('nutritional_yeast', 'Nutritional yeast', PA, 4, VEGAN, [[142, 'g', 4.99]], { gPerMl: 0.3 }),
  i('broth_veg', 'Vegetable broth (regular)', PA, 0.2, VEGAN, [[946, 'ml', 1.99]], {
    gPerMl: 1,
    fodmap: { fructan: 'high' },
    swaps: ['broth_veg_lowfodmap'],
  }),
  i('agave_syrup', 'Agave syrup', PA, 0, VEGAN, [[680, 'g', 4.99]], {
    gPerMl: 1.35,
    fodmap: { fructose: 'high' },
    skin: ['high_glycemic'],
  }),
  // ---------------------------------------------------------------- pantry: nuts, seeds, dried fruit
  i('macadamia_nuts', 'Macadamia nuts', PA, 76, VEGAN, [[170, 'g', 6.99]], {
    gPerMl: 0.55,
    allergens: ['tree_nut'],
  }),
  i('hazelnuts', 'Hazelnuts', PA, 61, VEGAN, [[170, 'g', 5.99]], {
    gPerMl: 0.55,
    allergens: ['tree_nut'],
    fodmap: { gos: 'moderate', fructan: 'moderate' },
    safeG: 15,
  }),
  i('brazil_nuts', 'Brazil nuts', PA, 66, VEGAN, [[170, 'g', 5.99]], {
    gPerMl: 0.55,
    allergens: ['tree_nut'],
  }),
  i('flaxseed', 'Ground flaxseed', PA, 42, VEGAN, [[454, 'g', 3.99]], { gPerMl: 0.5 }),
  i('hemp_seeds', 'Hemp seeds', PA, 49, VEGAN, [[227, 'g', 6.99]], { gPerMl: 0.6 }),
  i('dried_cranberries', 'Dried cranberries', PA, 1.4, VEGAN, [[170, 'g', 2.99]], {
    gPerMl: 0.5,
    skin: ['high_glycemic'],
    note: 'Low in small amounts (about 1 tablespoon).',
  }),
  i('dried_apricots', 'Dried apricots', PA, 0.5, VEGAN, [[170, 'g', 3.99]], {
    gPerMl: 0.6,
    fodmap: { sorbitol: 'high' },
  }),
  i('prunes', 'Prunes', PA, 0.4, VEGAN, [[227, 'g', 3.49]], {
    gPerMl: 0.6,
    fodmap: { sorbitol: 'high', fructan: 'moderate' },
  }),

  // ---------------------------------------------------------------- spices
  spice('allspice', 'Ground allspice'),
  spice('cardamom', 'Ground cardamom', {}, 4.99),
  spice('cloves_ground', 'Ground cloves', {}, 2.99),
  spice('sage_dried', 'Dried sage'),
  spice('tarragon_dried', 'Dried tarragon', {}, 2.49),
  spice('marjoram_dried', 'Dried marjoram'),
  spice('zaatar', 'Za’atar (no garlic)', { allergens: ['sesame'] }, 3.99),
  spice('sumac', 'Ground sumac', {}, 3.99),
  spice(
    'everything_seasoning',
    'Everything bagel seasoning',
    { allergens: ['sesame'], fodmap: { fructan: 'high' } },
    2.49,
  ),

  // ---------------------------------------------------------------- beverages
  i('decaf_coffee', 'Decaf ground coffee', BV, 0, VEGAN, [[340, 'g', 7.99]], {
    note: 'Still contains a little caffeine.',
  }),
  i('black_tea', 'Black tea bags', BV, 0, VEGAN, [[20, 'each', 2.49]], {
    gEach: 2,
    reflux: ['caffeine'],
  }),
  i('green_tea', 'Green tea bags', BV, 0, VEGAN, [[20, 'each', 2.49]], {
    gEach: 2,
    reflux: ['caffeine'],
  }),
  i('chamomile_tea', 'Chamomile tea bags', BV, 0, VEGAN, [[20, 'each', 2.49]], {
    gEach: 2,
    note: 'Chamomile tea is not considered low-FODMAP; fine to test later.',
    fodmap: { fructan: 'moderate' },
  }),
  i('cola', 'Cola', BV, 0, VEGAN, [[2000, 'ml', 2.29]], {
    gPerMl: 1.04,
    reflux: ['caffeine', 'carbonation'],
    skin: ['high_glycemic'],
  }),
  i('beer', 'Beer', BV, 0, VEGAN, [[355, 'ml', 1.99, false]], {
    gPerMl: 1,
    allergens: ['wheat'],
    reflux: ['alcohol', 'carbonation'],
    note: 'Contains gluten (barley).',
  }),
  i('white_wine', 'White wine', BV, 0, VEGAN, [[750, 'ml', 8.99, false]], {
    gPerMl: 1,
    reflux: ['alcohol'],
  }),
];
