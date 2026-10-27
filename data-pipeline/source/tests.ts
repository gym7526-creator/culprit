/**
 * Reintroduction test library (spec §5.4). Protocol modelled on NHS dietitian reintroduction leaflets:
 * one group at a time, 3 days, escalating portion (1×, 2×, 3×), stop early on symptoms, at least two
 * calm days between tests. Wording follows the language rules: "test", "may", "seems to", never a diagnosis.
 */
import type { TestDefinition, TestsFile } from '../../src/data/content/schema.ts';

const GUT = ['bloating', 'gas', 'pain', 'diarrhea', 'constipation'];
const REFLUX = ['heartburn', 'nausea'];

const fodmap = (
  t: Omit<TestDefinition, 'kind' | 'matchingSymptoms'> & { matchingSymptoms?: string[] },
): TestDefinition => ({
  kind: 'fodmap',
  matchingSymptoms: GUT,
  ...t,
});
const reflux = (
  t: Omit<TestDefinition, 'kind' | 'matchingSymptoms'> & { matchingSymptoms?: string[] },
): TestDefinition => ({
  kind: 'reflux',
  matchingSymptoms: REFLUX,
  ...t,
});

const tests: TestDefinition[] = [
  fodmap({
    id: 'wheat',
    name: 'Wheat',
    hostType: 'addon',
    suspectChips: ['bread_pasta'],
    skipForCeliac: true,
    doses: [
      {
        portion: '1 slice of regular wheat bread',
        ingredientId: 'wheat_bread',
        qty: 1,
        unit: 'each',
      },
      {
        portion: '2 slices of regular wheat bread',
        ingredientId: 'wheat_bread',
        qty: 2,
        unit: 'each',
      },
      {
        portion: '3 slices of regular wheat bread',
        ingredientId: 'wheat_bread',
        qty: 3,
        unit: 'each',
      },
    ],
    howTo:
      'Have regular wheat bread with tonight’s dinner (or swap the gluten-free pasta for regular pasta at the same amount).',
    whyThisAmount:
      'We start with a normal small portion and build up over three days, so we can see the amount where your stomach starts to notice.',
  }),
  fodmap({
    id: 'onion',
    name: 'Onion',
    hostType: 'addon',
    suspectChips: ['onion'],
    doses: [
      { portion: '1 tablespoon of cooked onion', ingredientId: 'onion_yellow', qty: 10, unit: 'g' },
      {
        portion: '2 tablespoons of cooked onion',
        ingredientId: 'onion_yellow',
        qty: 20,
        unit: 'g',
      },
      {
        portion: '3 tablespoons of cooked onion',
        ingredientId: 'onion_yellow',
        qty: 30,
        unit: 'g',
      },
    ],
    howTo:
      'Finely chop the onion and cook it in a little oil before adding it to tonight’s dinner.',
    whyThisAmount:
      'A tablespoon is a typical amount in a home-cooked dish. Small steps up help us find your comfortable amount, not just a yes or no.',
  }),
  fodmap({
    id: 'garlic',
    name: 'Garlic',
    hostType: 'addon',
    suspectChips: ['garlic'],
    doses: [
      { portion: '¼ clove of garlic', ingredientId: 'garlic', qty: 0.25, unit: 'each' },
      { portion: '½ clove of garlic', ingredientId: 'garlic', qty: 0.5, unit: 'each' },
      { portion: '¾ clove of garlic', ingredientId: 'garlic', qty: 0.75, unit: 'each' },
    ],
    howTo: 'Mince the garlic and stir it into tonight’s dinner while it cooks.',
    whyThisAmount:
      'Garlic is strong even in small amounts, so we start with a quarter clove and build up slowly.',
  }),
  fodmap({
    id: 'gos',
    name: 'Beans and lentils',
    hostType: 'addon',
    suspectChips: ['beans'],
    doses: [
      {
        portion: '2 tablespoons of chickpeas or lentils',
        ingredientId: 'canned_chickpeas',
        qty: 2,
        unit: 'tbsp',
      },
      {
        portion: '4 tablespoons of chickpeas or lentils',
        ingredientId: 'canned_chickpeas',
        qty: 4,
        unit: 'tbsp',
      },
      {
        portion: '6 tablespoons of chickpeas or lentils',
        ingredientId: 'canned_chickpeas',
        qty: 6,
        unit: 'tbsp',
      },
    ],
    howTo:
      'Rinse canned chickpeas or lentils and stir them into tonight’s dinner or serve on the side.',
    whyThisAmount:
      'Two tablespoons is a small side portion. Doubling and tripling it shows how much your stomach is happy with.',
  }),
  fodmap({
    id: 'lactose',
    name: 'Dairy (lactose)',
    hostType: 'side',
    suspectChips: ['dairy'],
    matchingSymptoms: ['bloating', 'gas', 'pain', 'diarrhea'],
    doses: [
      {
        portion: '½ cup (125 ml) of regular milk or 125 g plain yogurt',
        ingredientId: 'milk',
        qty: 125,
        unit: 'ml',
      },
      {
        portion: '1 cup (250 ml) of regular milk or 250 g plain yogurt',
        ingredientId: 'milk',
        qty: 250,
        unit: 'ml',
      },
      {
        portion: '1½ cups (375 ml) of regular milk or 375 g plain yogurt',
        ingredientId: 'milk',
        qty: 375,
        unit: 'ml',
      },
    ],
    howTo: 'Have the milk or yogurt with or after dinner, not on an empty stomach.',
    whyThisAmount:
      'Half a cup is a normal splash-to-glass amount. Building up shows whether small amounts, like milk in coffee, are fine for you.',
  }),
  fodmap({
    id: 'fructose',
    name: 'Fructose (honey, mango)',
    hostType: 'side',
    suspectChips: ['fruit'],
    doses: [
      { portion: '1 teaspoon of honey or ¼ mango', ingredientId: 'honey', qty: 1, unit: 'tsp' },
      { portion: '2 teaspoons of honey or ½ mango', ingredientId: 'honey', qty: 2, unit: 'tsp' },
      { portion: '3 teaspoons of honey or ¾ mango', ingredientId: 'honey', qty: 3, unit: 'tsp' },
    ],
    howTo: 'Drizzle the honey over tonight’s dinner or yogurt, or eat the mango after dinner.',
    whyThisAmount:
      'A teaspoon of honey is a small, everyday amount. We go up in even steps so the result is easy to read.',
  }),
  fodmap({
    id: 'sorbitol',
    name: 'Sorbitol (avocado, corn)',
    hostType: 'side',
    suspectChips: ['fruit'],
    doses: [
      {
        portion: '¼ avocado or 3 tablespoons of sweet corn',
        ingredientId: 'avocado',
        qty: 0.25,
        unit: 'each',
      },
      {
        portion: '½ avocado or 6 tablespoons of sweet corn',
        ingredientId: 'avocado',
        qty: 0.5,
        unit: 'each',
      },
      {
        portion: '¾ avocado or 9 tablespoons of sweet corn',
        ingredientId: 'avocado',
        qty: 0.75,
        unit: 'each',
      },
    ],
    howTo: 'Serve the avocado or corn as a side with tonight’s dinner.',
    whyThisAmount:
      'A quarter avocado is a typical topping. Stepping up shows whether a little is fine even if a lot is not.',
  }),
  fodmap({
    id: 'mannitol',
    name: 'Mannitol (cauliflower, celery, sweet potato)',
    hostType: 'addon',
    suspectChips: [],
    doses: [
      {
        portion:
          '2 tablespoons of cauliflower (or ¼ celery stick, or 3 tablespoons of sweet potato)',
        ingredientId: 'cauliflower',
        qty: 20,
        unit: 'g',
      },
      {
        portion:
          '4 tablespoons of cauliflower (or ½ celery stick, or 6 tablespoons of sweet potato)',
        ingredientId: 'cauliflower',
        qty: 40,
        unit: 'g',
      },
      {
        portion:
          '6 tablespoons of cauliflower (or ¾ celery stick, or 9 tablespoons of sweet potato)',
        ingredientId: 'cauliflower',
        qty: 60,
        unit: 'g',
      },
    ],
    howTo: 'Cook the vegetable into tonight’s dinner or roast it as a side.',
    whyThisAmount:
      'These vegetables share the same sugar alcohol, so one test covers all three. Small portions first keep it gentle.',
  }),
  reflux({
    id: 'coffee',
    name: 'Coffee',
    hostType: 'side',
    suspectChips: ['coffee'],
    doses: [
      {
        portion: '1 cup of coffee in the morning',
        ingredientId: 'coffee_ground',
        qty: 10,
        unit: 'g',
      },
      {
        portion: '2 cups of coffee (morning and late morning)',
        ingredientId: 'coffee_ground',
        qty: 20,
        unit: 'g',
      },
      {
        portion: '3 cups of coffee, all before noon',
        ingredientId: 'coffee_ground',
        qty: 30,
        unit: 'g',
      },
    ],
    howTo:
      'Drink the coffee with breakfast or after it, the way you normally take it, but with lactose-free milk if you use milk.',
    whyThisAmount:
      'Many people drink one to three cups a day, so these steps cover real-life amounts. Keep it to the morning so it does not affect sleep.',
  }),
  reflux({
    id: 'tomato',
    name: 'Tomato',
    hostType: 'addon',
    suspectChips: [],
    doses: [
      {
        portion: '½ cup of tomato sauce with dinner',
        ingredientId: 'crushed_tomatoes',
        qty: 120,
        unit: 'g',
      },
      {
        portion: '1 cup of tomato sauce with dinner',
        ingredientId: 'crushed_tomatoes',
        qty: 240,
        unit: 'g',
      },
      {
        portion: '1½ cups of tomato sauce with dinner',
        ingredientId: 'crushed_tomatoes',
        qty: 360,
        unit: 'g',
      },
    ],
    howTo: 'Stir the tomato sauce into tonight’s dinner or serve it over the top.',
    whyThisAmount:
      'Half a cup is a light pasta-sauce serving. More sauce on days two and three shows how much is comfortable.',
  }),
  reflux({
    id: 'fatty',
    name: 'Rich or fried food',
    hostType: 'side',
    suspectChips: ['fried'],
    doses: [
      { portion: '1 strip of bacon with dinner', ingredientId: 'bacon', qty: 1, unit: 'each' },
      { portion: '2 strips of bacon with dinner', ingredientId: 'bacon', qty: 2, unit: 'each' },
      { portion: '3 strips of bacon with dinner', ingredientId: 'bacon', qty: 3, unit: 'each' },
    ],
    howTo: 'Cook the bacon until crisp and have it with tonight’s dinner.',
    whyThisAmount:
      'Fat slows digestion, which can matter for heartburn. Adding a little more each day shows where your limit seems to be.',
  }),
  reflux({
    id: 'spicy',
    name: 'Spicy food',
    hostType: 'addon',
    suspectChips: ['spicy'],
    doses: [
      {
        portion: '¼ teaspoon of red pepper flakes in dinner',
        ingredientId: 'chili_flakes',
        qty: 0.25,
        unit: 'tsp',
      },
      {
        portion: '½ teaspoon of red pepper flakes in dinner',
        ingredientId: 'chili_flakes',
        qty: 0.5,
        unit: 'tsp',
      },
      {
        portion: '¾ teaspoon of red pepper flakes in dinner',
        ingredientId: 'chili_flakes',
        qty: 0.75,
        unit: 'tsp',
      },
    ],
    howTo: 'Stir the red pepper flakes into tonight’s dinner while it cooks.',
    whyThisAmount:
      'A quarter teaspoon gives gentle warmth. We build up so you learn how much heat you can enjoy.',
  }),
  reflux({
    id: 'late_dinner',
    name: 'Late dinner',
    hostType: 'timing',
    suspectChips: [],
    doses: [
      { portion: 'Finish dinner within 1½ hours of bedtime' },
      { portion: 'Finish dinner within 1½ hours of bedtime' },
      { portion: 'Finish dinner within 1½ hours of bedtime' },
    ],
    howTo:
      'Eat your usual planned dinner, but later than normal so you finish about 1½ hours before bed.',
    whyThisAmount:
      'This one tests timing, not food. Eating closer to bedtime is a common heartburn pattern, so we check whether it seems to affect you.',
  }),
  reflux({
    id: 'chocolate',
    name: 'Chocolate',
    hostType: 'side',
    suspectChips: [],
    doses: [
      {
        portion: '1 small square of dark chocolate after dinner',
        ingredientId: 'dark_chocolate',
        qty: 1,
        unit: 'each',
      },
      {
        portion: '2 small squares of dark chocolate after dinner',
        ingredientId: 'dark_chocolate',
        qty: 2,
        unit: 'each',
      },
      {
        portion: '3 small squares of dark chocolate after dinner',
        ingredientId: 'dark_chocolate',
        qty: 3,
        unit: 'each',
      },
    ],
    howTo: 'Have the chocolate as dessert after tonight’s dinner.',
    whyThisAmount:
      'One square is a small treat. Building up shows whether a little dessert chocolate is fine for you.',
  }),
  reflux({
    id: 'citrus',
    name: 'Citrus',
    hostType: 'side',
    suspectChips: ['fruit'],
    doses: [
      {
        portion: '½ orange (or ½ cup orange juice)',
        ingredientId: 'orange',
        qty: 0.5,
        unit: 'each',
      },
      { portion: '1 orange (or 1 cup orange juice)', ingredientId: 'orange', qty: 1, unit: 'each' },
      {
        portion: '1½ oranges (or 1½ cups orange juice)',
        ingredientId: 'orange',
        qty: 1.5,
        unit: 'each',
      },
    ],
    howTo: 'Have the orange or juice with or after dinner.',
    whyThisAmount:
      'Half an orange is a small snack portion. We step up so you can tell whether citrus seems to bother you.',
  }),
  reflux({
    id: 'carbonation',
    name: 'Fizzy drinks',
    hostType: 'side',
    suspectChips: ['fizzy'],
    doses: [
      {
        portion: '1 cup (240 ml) of plain sparkling water with dinner',
        ingredientId: 'sparkling_water',
        qty: 240,
        unit: 'ml',
      },
      {
        portion: '2 cups (480 ml) of plain sparkling water with dinner',
        ingredientId: 'sparkling_water',
        qty: 480,
        unit: 'ml',
      },
      {
        portion: '3 cups (720 ml) of plain sparkling water across the evening',
        ingredientId: 'sparkling_water',
        qty: 720,
        unit: 'ml',
      },
    ],
    howTo: 'Drink plain sparkling water (no caffeine or sugar) with tonight’s dinner.',
    whyThisAmount:
      'Plain sparkling water tests the bubbles on their own, without caffeine or sugar mixed in.',
  }),
  reflux({
    id: 'mint',
    name: 'Mint',
    hostType: 'side',
    suspectChips: [],
    doses: [
      {
        portion: '1 cup of peppermint tea after dinner',
        ingredientId: 'peppermint_tea',
        qty: 1,
        unit: 'each',
      },
      {
        portion: '2 cups of peppermint tea in the evening',
        ingredientId: 'peppermint_tea',
        qty: 2,
        unit: 'each',
      },
      {
        portion: '3 cups of peppermint tea in the evening',
        ingredientId: 'peppermint_tea',
        qty: 3,
        unit: 'each',
      },
    ],
    howTo: 'Brew a cup of peppermint tea after dinner.',
    whyThisAmount:
      'Peppermint may relax the valve at the top of the stomach for some people. Building up shows whether it seems to matter for you.',
  }),
  reflux({
    id: 'alcohol',
    name: 'Alcohol',
    hostType: 'side',
    suspectChips: ['alcohol'],
    minAge: 21,
    optIn: true,
    doses: [
      {
        portion: '½ glass (75 ml) of wine with dinner',
        ingredientId: 'red_wine',
        qty: 75,
        unit: 'ml',
      },
      {
        portion: '1 glass (150 ml) of wine with dinner',
        ingredientId: 'red_wine',
        qty: 150,
        unit: 'ml',
      },
      {
        portion: '1 glass (150 ml) of wine with dinner',
        ingredientId: 'red_wine',
        qty: 150,
        unit: 'ml',
      },
    ],
    howTo:
      'Only if you’re 21 or older and already drink. Have the wine with food, never on an empty stomach.',
    whyThisAmount:
      'This test is optional and stays at or under one standard drink a day. Skip it any time.',
  }),
  {
    id: 'control',
    name: 'Daily add-on',
    kind: 'control',
    hostType: 'side',
    suspectChips: [],
    matchingSymptoms: [...GUT, ...REFLUX],
    doses: [
      { portion: '2 plain rice cakes', ingredientId: 'rice_cakes', qty: 2, unit: 'each' },
      { portion: '3 plain rice cakes', ingredientId: 'rice_cakes', qty: 3, unit: 'each' },
      { portion: '4 plain rice cakes', ingredientId: 'rice_cakes', qty: 4, unit: 'each' },
    ],
    howTo: 'Have the add-on with or after tonight’s dinner.',
    whyThisAmount:
      'Some test days are placebo checks so your results are accurate. We reveal which ones at the end.',
  },
];

export const testsFile: TestsFile = {
  protocol: {
    doseDays: 3,
    calmDaysBetween: 2,
    calmMinDays: 14,
    calmMaxDays: 28,
    source:
      'https://www.gloshospitals.nhs.uk/documents/17365/FODMAP_reintroduction_information_for_website_Feb_23_update.pdf',
  },
  order: {
    fodmap: ['wheat', 'onion', 'garlic', 'mannitol', 'gos', 'lactose', 'fructose', 'sorbitol'],
    reflux: [
      'coffee',
      'tomato',
      'fatty',
      'spicy',
      'late_dinner',
      'chocolate',
      'citrus',
      'carbonation',
      'mint',
      'alcohol',
    ],
    controlEvery: 4,
  },
  tests,
  controls: [
    {
      id: 'rice_cakes_control',
      portion: '2 plain rice cakes',
      ingredientId: 'rice_cakes',
      qty: 2,
      unit: 'each',
    },
    {
      id: 'rice_crackers_control',
      portion: '10 plain rice crackers',
      ingredientId: 'gf_crackers',
      qty: 10,
      unit: 'each',
    },
    {
      id: 'cucumber_control',
      portion: '½ cucumber, sliced',
      ingredientId: 'cucumber',
      qty: 0.5,
      unit: 'each',
    },
  ],
};
