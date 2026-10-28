/** Onboarding copy (spec §8). One question per screen; plain, warm, short. */
export const onboardingCopy = {
  back: 'Back',
  continue: 'Continue',
  skip: 'Skip',

  welcome: {
    title: 'Find the foods wrecking your stomach.',
    subtitle: 'Without logging a thing.',
    cta: 'Get started',
    restore: 'I already have an account',
    disclaimer: 'Not medical advice.',
    disclaimerLink: 'Read more',
    stamp: 'TRIGGER',
  },

  focus: {
    title: 'What do you want to fix first?',
    options: {
      stomach: { emoji: '🫃', label: 'My stomach', sublabel: 'Bloating, gas, heartburn…' },
      skin: { emoji: '✨', label: 'My skin', sublabel: 'Breakouts' },
      both: { emoji: '🔁', label: 'Both' },
    },
    skinSoon: 'Coming soon, we’ll start with your stomach.',
  },

  birthYear: {
    title: 'What year were you born?',
    subtitle: 'Some parts of the program depend on your age.',
    label: 'Birth year',
  },

  ageBlocked: {
    emoji: '🙂',
    title: 'Culprit isn’t available yet for your age',
    body: 'Culprit is for people 13 and older. If your stomach is bothering you, talk to a parent or your doctor.',
  },

  teen: {
    emoji: '🌱',
    title: 'The full program is for 18+',
    body: 'Cutting out foods to test them isn’t a good idea while you’re still growing. Talk to a parent or doctor about your stomach. They can help you find what’s going on safely.',
    skinNote: 'Skin mode (for 13+) is coming soon.',
    back: 'Go back',
  },

  symptoms: {
    title: 'What bothers you?',
    subtitle: 'Pick all that apply.',
    options: {
      bloating: 'Bloating',
      gas: 'Gas',
      pain: 'Stomach pain or cramps',
      heartburn: 'Heartburn or reflux',
      diarrhea: 'Diarrhea',
      constipation: 'Constipation',
      nausea: 'Nausea',
    },
  },

  mainSymptom: { title: 'Which one bothers you most?' },

  frequency: {
    title: 'How often does it happen?',
    options: {
      daily: { emoji: '📅', label: 'Every day' },
      few_week: { emoji: '🗓️', label: 'A few times a week' },
      weekly: { emoji: '📆', label: 'About once a week' },
      less: { emoji: '🌤️', label: 'Less than that' },
    },
  },

  timing: {
    title: 'When does it usually hit?',
    options: {
      after_eating: { emoji: '🍽️', label: 'Right after eating' },
      hours_later: { emoji: '⏳', label: 'A few hours later' },
      night: { emoji: '🌙', label: 'At night or lying down' },
      morning: { emoji: '🌅', label: 'In the morning' },
      no_pattern: { emoji: '🤷', label: 'No pattern' },
    },
  },

  impact: {
    title: 'How much does it get in the way?',
    label: 'How much it gets in the way',
    levels: ['Barely', 'A little', 'Some', 'A lot', 'It runs my day'],
    faces: ['😌', '🙂', '😐', '😣', '😫'],
  },

  empathy: {
    emoji: '🤝',
    title: 'You’re not alone.',
    body: 'About 1 in 7 adults dealt with bloating in just the past week, and nearly a third had heartburn.',
    kicker: 'Most never get a clear answer. Let’s find yours.',
    sources: 'Sources: national surveys of 88,795 and 71,812 US adults.',
  },

  suspects: {
    title: 'Any suspects?',
    subtitle: 'Foods you think might be involved. A guess is fine.',
    knownFineTitle: 'Any of these you KNOW are fine?',
    knownFineSubtitle: 'We’ll skip testing these.',
    confirmSkip: 'We’ll skip testing {items}. You can always test them later.',
    options: {
      dairy: 'Dairy',
      bread_pasta: 'Bread or pasta',
      onion: 'Onion',
      garlic: 'Garlic',
      beans: 'Beans',
      coffee: 'Coffee',
      spicy: 'Spicy food',
      fried: 'Fried food',
      fruit: 'Fruit',
      alcohol: 'Alcohol',
      fizzy: 'Fizzy drinks',
      no_idea: 'No idea',
    },
  },

  tried: {
    title: 'Tried anything before?',
    options: {
      no_dairy: { emoji: '🥛', label: 'Cutting out dairy' },
      gluten_free: { emoji: '🍞', label: 'Gluten-free' },
      low_fodmap: { emoji: '📋', label: 'Low-FODMAP' },
      antacids: { emoji: '💊', label: 'Antacids or acid pills' },
      probiotics: { emoji: '🦠', label: 'Probiotics' },
      nothing: { emoji: '🆕', label: 'Nothing yet' },
    },
  },

  objection: {
    title: 'This time, you don’t track a thing.',
    body: 'Elimination diets work, but most people quit because tracking every bite is exhausting. Culprit plans every dinner for you. Your only job: one tap at night.',
    oldWay: 'The old way',
    oldItems: ['Food diary', 'Spreadsheets', 'Guessing'],
    newWay: 'Culprit',
    newItems: ['Follow the plan', 'Tap once at night'],
  },

  redFlags: {
    title: 'Quick safety check',
    subtitle: 'Do any of these apply to you?',
    options: {
      blood_in_stool: 'Blood in your stool',
      black_stool: 'Black or tarry stool',
      weight_loss: 'Losing weight without trying',
      swallowing: 'Trouble or pain swallowing',
      vomiting: 'Vomiting that keeps happening',
      chest_pain: 'Chest pain',
      fever_pain: 'Fever with stomach pain',
      after_50: 'Symptoms that started after age 50',
      family_history: 'Family history of colon cancer, celiac disease or IBD',
      celiac_ibd: 'Celiac disease or IBD',
    },
    none: 'None of these',
  },

  redFlagNotice: {
    emoji: '🩺',
    title: 'Please check with a doctor before starting.',
    body: 'These symptoms need a proper look. Culprit can still help you spot food patterns, but it shouldn’t replace seeing a doctor.',
    cta: 'I understand',
  },

  eatingDisorder: {
    title: 'Have you ever had an eating disorder, or been told you might?',
    subtitle: 'Your answer stays on your phone.',
    yes: 'Yes',
    no: 'No',
    skip: 'Prefer not to say',
  },

  edNotice: {
    emoji: '💜',
    title: 'Thanks for telling us.',
    body: 'Cutting out foods, even for a short time, can be risky if you’ve had an eating disorder. We’d recommend doing elimination only with a professional.',
    gentleTitle: 'Gentle mode',
    gentleBody:
      'Balanced weekly dinners with no foods cut out, plus heartburn timing tips. No testing.',
    gentleCta: 'Use gentle mode',
    proCta: 'I’m working with a professional',
  },

  pregnancy: {
    title: 'Are you pregnant or breastfeeding?',
    yes: 'Yes',
    no: 'No',
    skip: 'Prefer not to say',
  },

  pregnancyNotice: {
    emoji: '🤰',
    title: 'Check with your doctor first',
    body: 'It’s a good idea to talk to your doctor or midwife before changing what you eat. You can keep going; we’ll keep every week balanced.',
    cta: 'Got it',
  },

  diet: {
    title: 'How do you eat?',
    options: {
      none: { emoji: '🍽️', label: 'No restrictions' },
      vegetarian: { emoji: '🥕', label: 'Vegetarian' },
      vegan: { emoji: '🌱', label: 'Vegan' },
      pescatarian: { emoji: '🐟', label: 'Pescatarian' },
    },
    allergiesTitle: 'Any allergies?',
    allergens: {
      milk: 'Milk',
      egg: 'Egg',
      fish: 'Fish',
      shellfish: 'Shellfish',
      tree_nut: 'Tree nuts',
      peanut: 'Peanuts',
      wheat: 'Wheat',
      soy: 'Soy',
      sesame: 'Sesame',
    },
    celiacLabel: 'I have celiac disease',
    celiacNote: 'Follow your doctor’s plan. Culprit will keep everything gluten-free for you.',
    dislikesTitle: 'Foods you won’t eat',
    dislikeOptions: {
      mushrooms_button: 'Mushrooms',
      salmon_fillet: 'Salmon',
      shrimp: 'Shrimp',
      tofu_firm: 'Tofu',
      eggplant: 'Eggplant',
      cilantro: 'Cilantro',
      olives_black: 'Olives',
      zucchini: 'Zucchini',
      bell_pepper_green: 'Green peppers',
      pork_chops: 'Pork',
    },
  },

  household: {
    title: 'Who’s eating?',
    label: 'People eating',
    kids: 'Kids at the table?',
    note: 'Everyone eats the same dinner. They just won’t know it’s “gut-friendly”.',
  },

  cookNights: {
    title: 'Which nights do you cook?',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    daysLong: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  },

  cookTime: {
    title: 'How long can dinner take?',
    options: {
      15: { emoji: '⚡', label: '15 minutes', sublabel: 'Quick and simple' },
      30: { emoji: '⏱️', label: '30 minutes', sublabel: 'Most weeknights' },
      45: { emoji: '🍲', label: '45 minutes', sublabel: 'I like to cook' },
    },
  },

  equipment: {
    title: 'Anything extra in your kitchen?',
    subtitle: 'We assume a stove and oven. Pick any extras.',
    options: {
      air_fryer: { emoji: '💨', label: 'Air fryer' },
      slow_cooker: { emoji: '🫕', label: 'Slow cooker' },
      instant_pot: { emoji: '♨️', label: 'Pressure cooker' },
      grill: { emoji: '🔥', label: 'Grill' },
    },
  },

  zip: {
    title: 'What’s your ZIP code?',
    subtitle: 'So we can estimate grocery prices near you.',
    label: 'ZIP code',
    invalid: 'Enter a 5-digit US ZIP code.',
  },

  store: {
    title: 'Where do you usually shop?',
    confirm: 'We’ll estimate prices at {store} near {zip}.',
    near: 'Near you in {state}',
    nearUnknown: 'Popular stores',
    nationwide: 'Nationwide',
    more: 'All stores ({count})',
    hideMore: 'Hide other stores',
    search: 'Search stores',
    noMatch: 'No store matches “{query}”. Pick “Other / local store” and type its name.',
    otherName: 'Store name (optional)',
    otherNote: 'We’ll price it at a typical supermarket level for your area.',
    tiers: { budget: 'Lower prices', mid: 'Typical prices', premium: 'Higher prices' },
  },

  budget: {
    title: 'What’s your weekly grocery budget?',
    label: 'Weekly grocery budget',
    note: 'We’ll keep your week under this.',
  },

  pantry: {
    title: 'Already in your kitchen?',
    subtitle: 'Tap what you have. We’ll cross these off your lists.',
    names: {
      olive_oil: 'Olive oil',
      salt: 'Salt',
      black_pepper: 'Pepper',
      white_rice: 'Rice',
      rolled_oats: 'Oats',
      pasta: 'Pasta',
      soy_sauce: 'Soy sauce',
      apple_cider_vinegar: 'Vinegar',
      cumin: 'Cumin',
      paprika: 'Paprika',
      oregano_dried: 'Oregano',
    },
  },

  bedtime: {
    title: 'When do you usually go to bed?',
    label: 'Bedtime',
    refluxNote:
      'Eating 3 hours before bed is one of the biggest heartburn helpers. We’ll time your dinners.',
  },

  checkInTime: {
    title: 'When should we check in?',
    label: 'Check-in time',
    note: 'One tap. Two seconds. That’s the whole job.',
  },

  notifications: {
    title: 'Turn on your nightly check-in?',
    body: 'We’ll send one gentle reminder in the evening. That’s it.',
    previewApp: 'CULPRIT',
    previewTime: 'now',
    previewBody: 'How was your stomach today? One tap 👆',
    cta: 'Turn on my check-in',
    later: 'Not now',
  },

  source: {
    title: 'Where did you hear about us?',
    options: {
      tiktok: 'TikTok',
      instagram: 'Instagram',
      youtube: 'YouTube',
      friend: 'Friend or family',
      google: 'Google',
      app_store: 'App Store',
      reddit: 'Reddit',
      other: 'Other',
    },
  },

  howItWorks: {
    title: 'Here’s how it works',
    steps: [
      { when: 'Weeks 1–2', title: 'Calm start', body: 'Easy dinners that skip common triggers.' },
      { when: 'Weeks 3–8', title: 'Detective mode', body: 'We add one food back at a time.' },
      {
        when: 'After that',
        title: 'Your personal plan',
        body: 'Built around your results, forever.',
      },
    ],
    gentleSteps: [
      {
        when: 'Every week',
        title: 'Balanced dinners',
        body: 'Nothing cut out. Planned and priced for you.',
      },
      {
        when: 'Every night',
        title: 'One quick tap',
        body: 'So you can see how you’re doing over time.',
      },
    ],
    consent:
      'I understand some test days are placebo checks, and that Culprit isn’t medical advice.',
    alcohol: 'Include an optional alcohol test (21+)',
    cta: 'Build my plan',
  },

  building: {
    title: 'Building your plan',
    lines: {
      matching: 'Matching {count} dinners to your symptoms…',
      setAside: 'Setting aside common triggers for now…',
      gentle: 'Keeping every food on the menu…',
      suspects: 'Lining up your first suspects: {list}…',
      pricing: 'Pricing everything at {store} near {zip}…',
      timing: 'Timing dinners to finish by {time}…',
    },
    ringLabel: 'Building your plan',
  },

  firstWeek: {
    title: 'Your first week is ready.',
    total: '{total} at {store} (est.)',
    setAside: 'Set aside for now',
    suspects: 'First suspects we’ll test',
    listTitle: 'Your grocery list',
    listItems: '{count} items, sorted by aisle',
    cta: 'Unlock my plan',
    priceInfo: 'Prices are estimates',
    gentleNote: 'Gentle mode: nothing is cut out.',
  },

  saveProgress: {
    emoji: '📱',
    title: 'Your plan is saved on this phone',
    body: 'Everything stays private on your device. You can add an account later to back it up.',
    cta: 'Continue',
  },

  testNames: {
    wheat: 'Wheat',
    onion: 'Onion',
    garlic: 'Garlic',
    gos: 'Beans',
    lactose: 'Dairy',
    fructose: 'Fructose',
    sorbitol: 'Sorbitol',
    mannitol: 'Mannitol',
    coffee: 'Coffee',
    tomato: 'Tomato',
    fatty: 'Rich food',
    spicy: 'Spicy food',
    late_dinner: 'Late dinner',
    chocolate: 'Chocolate',
    citrus: 'Citrus',
    carbonation: 'Fizzy drinks',
    mint: 'Mint',
    alcohol: 'Alcohol',
    control: 'Placebo',
  },
} as const;
