/** Strings used inside design-system components (labels, accessibility text, templates). */
export const componentCopy = {
  checkIn: {
    question: 'How was your stomach today?',
    faces: [
      { score: 0, emoji: '😌', label: 'Great' },
      { score: 1, emoji: '🙂', label: 'Good' },
      { score: 2, emoji: '😐', label: 'Okay' },
      { score: 3, emoji: '😣', label: 'Bad' },
      { score: 4, emoji: '😫', label: 'Awful' },
    ],
    faceA11y: 'Stomach today: {label}',
    symptoms: [
      { id: 'bloating', label: 'Bloating' },
      { id: 'gas', label: 'Gas' },
      { id: 'pain', label: 'Pain' },
      { id: 'heartburn', label: 'Heartburn' },
      { id: 'diarrhea', label: 'Diarrhea' },
      { id: 'constipation', label: 'Constipation' },
      { id: 'nausea', label: 'Nausea' },
    ],
  },

  status: {
    untested: 'Untested',
    testing: 'Testing',
    trigger: 'Trigger',
    partial: 'Small amounts OK',
    cleared: 'Cleared',
    unclear: 'Unclear',
    selfReported: 'Self-reported',
  },

  budget: {
    a11y: '{total} of {budget} budget',
    under: '{amount} under your {budget} budget',
    near: 'Right at your {budget} budget',
    over: '{amount} over your {budget} budget',
  },

  dinner: {
    minutes: '{minutes} min',
    eatBy: 'Eat by {time}',
    price: '{price} est.',
    testNight: 'Test night',
    locked: 'Unlock to see the recipe',
    notCooking: 'Not cooking',
  },

  testBanner: {
    a11yPrefix: 'Test',
    day: 'Day {day} of {total}',
    whyLink: 'Why this amount?',
  },

  progress: {
    a11y: 'Step {current} of {total}',
    back: 'Go back',
  },

  stepper: {
    increment: 'Increase {label}',
    decrement: 'Decrease {label}',
  },

  slider: {
    a11y: '{label}: {value}',
  },

  ring: {
    a11y: '{label}: {percent} percent',
  },

  sheet: {
    close: 'Close sheet',
  },

  timePicker: {
    hour: 'Hour',
    minute: 'Minute',
    period: 'AM or PM',
    am: 'AM',
    pm: 'PM',
  },

  option: {
    selected: 'Selected',
  },
} as const;
