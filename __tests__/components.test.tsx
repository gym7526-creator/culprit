import { fireEvent, screen } from '@testing-library/react-native';

import {
  BudgetBar,
  Card,
  CheckInFaces,
  Chip,
  DinnerCard,
  EmptyState,
  OptionCard,
  PrimaryButton,
  ProgressBar,
  ScoreRing,
  SecondaryButton,
  Slider,
  StatusPill,
  Stepper,
  TestBanner,
  Text,
  TextButton,
  TimePicker,
  type PillStatus,
} from '@/components';
import { componentCopy } from '@/copy';
import { palette, type ColorScheme } from '@/theme';

import { renderWithTheme } from './helpers/renderWithTheme';

const noop = () => undefined;
const SCHEMES: readonly ColorScheme[] = ['light', 'dark'];

describe('PrimaryButton / SecondaryButton', () => {
  it('fires onPress', async () => {
    const onPress = jest.fn();
    await renderWithTheme(<PrimaryButton label="Build my plan" onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Build my plan' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not fire when disabled and reports the state', async () => {
    const onPress = jest.fn();
    await renderWithTheme(<PrimaryButton label="Go" onPress={onPress} disabled />);
    const button = screen.getByRole('button', { name: 'Go' });
    expect(button).toBeDisabled();
    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('is busy and inert while loading, keeping the label for size', async () => {
    const onPress = jest.fn();
    await renderWithTheme(<SecondaryButton label="Saving" onPress={onPress} loading />);
    const button = screen.getByRole('button', { name: 'Saving' });
    expect(button).toBeBusy();
    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe('TextButton', () => {
  it('fires onPress', async () => {
    const onPress = jest.fn();
    await renderWithTheme(<TextButton label="I already have an account" onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button', { name: 'I already have an account' }));
    expect(onPress).toHaveBeenCalled();
  });
});

describe('OptionCard', () => {
  it('reads as a selected radio in single mode', async () => {
    await renderWithTheme(<OptionCard emoji="🫃" label="My stomach" selected onPress={noop} />);
    expect(screen.getByRole('radio', { name: 'My stomach' })).toBeSelected();
  });

  it('reads as a checkbox in multi mode', async () => {
    await renderWithTheme(
      <OptionCard mode="multi" label="Coffee" selected={false} onPress={noop} />,
    );
    expect(screen.getByRole('checkbox', { name: 'Coffee' })).not.toBeChecked();
  });

  it('includes the sublabel in the accessible name and fires onPress', async () => {
    const onPress = jest.fn();
    await renderWithTheme(
      <OptionCard label="My skin" sublabel="Coming soon" selected={false} onPress={onPress} />,
    );
    await fireEvent.press(screen.getByRole('radio', { name: 'My skin. Coming soon' }));
    expect(onPress).toHaveBeenCalled();
  });
});

describe('Chip', () => {
  it('toggles via onPress and exposes checked state', async () => {
    const onPress = jest.fn();
    await renderWithTheme(<Chip label="Bloating" selected onPress={onPress} />);
    const chip = screen.getByRole('checkbox', { name: 'Bloating' });
    expect(chip).toBeChecked();
    await fireEvent.press(chip);
    expect(onPress).toHaveBeenCalled();
  });
});

describe('ProgressBar', () => {
  it('announces the step and supports back', async () => {
    const onBack = jest.fn();
    await renderWithTheme(<ProgressBar current={3} total={10} onBack={onBack} />);
    expect(screen.getByLabelText('Step 3 of 10')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: componentCopy.progress.back }));
    expect(onBack).toHaveBeenCalled();
  });
});

describe('CheckInFaces', () => {
  it('renders five faces with labels', async () => {
    await renderWithTheme(<CheckInFaces value={null} onChange={noop} />);
    for (const label of ['Great', 'Good', 'Okay', 'Bad', 'Awful']) {
      expect(screen.getByRole('radio', { name: `Stomach today: ${label}` })).toBeTruthy();
    }
  });

  it('reports the tapped score', async () => {
    const onChange = jest.fn();
    await renderWithTheme(<CheckInFaces value={null} onChange={onChange} />);
    await fireEvent.press(screen.getByRole('radio', { name: 'Stomach today: Bad' }));
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it('marks the selected face', async () => {
    await renderWithTheme(<CheckInFaces value={1} onChange={noop} />);
    expect(screen.getByRole('radio', { name: 'Stomach today: Good' })).toBeSelected();
    expect(screen.getByRole('radio', { name: 'Stomach today: Great' })).not.toBeSelected();
  });
});

describe('BudgetBar', () => {
  it('shows the amount under budget', async () => {
    await renderWithTheme(<BudgetBar total={112.4} budget={130} />);
    expect(screen.getByText('$17.60 under your $130 budget')).toBeTruthy();
  });
  it('shows near budget', async () => {
    await renderWithTheme(<BudgetBar total={128.9} budget={130} />);
    expect(screen.getByText('Right at your $130 budget')).toBeTruthy();
  });
  it('shows the amount over budget in trigger ink', async () => {
    await renderWithTheme(<BudgetBar total={141.2} budget={130} />);
    expect(screen.getByText('$11.20 over your $130 budget')).toHaveStyle({
      color: palette.light.triggerInk,
    });
  });
});

describe('StatusPill', () => {
  const statuses: PillStatus[] = [
    'untested',
    'testing',
    'trigger',
    'partial',
    'cleared',
    'unclear',
    'selfReported',
  ];
  it.each(statuses)('renders the %s label', async (status) => {
    await renderWithTheme(<StatusPill status={status} />);
    expect(screen.getByText(componentCopy.status[status])).toBeTruthy();
  });
});

describe('DinnerCard', () => {
  const base = {
    title: 'Ginger chicken stir-fry',
    emoji: '🥢',
    gradient: 'asian' as const,
    minutes: 25,
    price: '$11.40',
  };

  it('labels prices as estimates and shows the eat-by time', async () => {
    await renderWithTheme(<DinnerCard {...base} eatBy="8:00 pm" testNight onPress={noop} />);
    expect(screen.getByText('25 min · $11.40 est.')).toBeTruthy();
    expect(screen.getByText('Eat by 8:00 pm')).toBeTruthy();
    expect(screen.getByText(componentCopy.dinner.testNight)).toBeTruthy();
  });

  it('is not pressable when locked', async () => {
    const onPress = jest.fn();
    await renderWithTheme(<DinnerCard {...base} locked onPress={onPress} />);
    expect(screen.getByText(componentCopy.dinner.locked)).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('exposes the more menu', async () => {
    const onMore = jest.fn();
    await renderWithTheme(
      <DinnerCard {...base} onPress={noop} onMorePress={onMore} moreLabel="Dinner options" />,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Dinner options' }));
    expect(onMore).toHaveBeenCalled();
  });
});

describe('TestBanner', () => {
  it('shows the dose day and the why link', async () => {
    const onWhy = jest.fn();
    await renderWithTheme(
      <TestBanner
        title="Tonight’s test"
        detail="½ clove garlic"
        day={2}
        totalDays={3}
        onWhyPress={onWhy}
      />,
    );
    expect(screen.getByText('Day 2 of 3')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: componentCopy.testBanner.whyLink }));
    expect(onWhy).toHaveBeenCalled();
  });
});

describe('ScoreRing', () => {
  it('announces the clamped percentage', async () => {
    await renderWithTheme(<ScoreRing progress={1.4} label="Program progress" />);
    expect(screen.getByLabelText('Program progress: 100 percent')).toBeTruthy();
  });
});

describe('Stepper', () => {
  it('increments and decrements within bounds', async () => {
    const onChange = jest.fn();
    await renderWithTheme(
      <Stepper label="People" value={1} min={1} max={8} onChange={onChange} testID="s" />,
    );
    expect(screen.getByRole('button', { name: 'Decrease People' })).toBeDisabled();
    await fireEvent.press(screen.getByRole('button', { name: 'Increase People' }));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('supports VoiceOver adjustable actions', async () => {
    const onChange = jest.fn();
    await renderWithTheme(<Stepper label="People" value={8} min={1} max={8} onChange={onChange} />);
    const control = screen.getByRole('adjustable', { name: 'People' });
    await fireEvent(control, 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });
    expect(onChange).not.toHaveBeenCalled();
    await fireEvent(control, 'accessibilityAction', { nativeEvent: { actionName: 'decrement' } });
    expect(onChange).toHaveBeenCalledWith(7);
  });
});

describe('Slider', () => {
  it('steps via accessibility actions and formats the value', async () => {
    const onChange = jest.fn();
    await renderWithTheme(
      <Slider
        label="Budget"
        value={90}
        min={40}
        max={300}
        step={5}
        onChange={onChange}
        formatValue={(v) => `$${v}`}
      />,
    );
    expect(screen.getByText('$90')).toBeTruthy();
    const control = screen.getByRole('adjustable', { name: 'Budget' });
    await fireEvent(control, 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });
    expect(onChange).toHaveBeenCalledWith(95);
  });
});

describe('TimePicker', () => {
  it('exposes hour, minute and period wheels and steps the hour', async () => {
    const onChange = jest.fn();
    await renderWithTheme(<TimePicker label="Bedtime" value="23:00" onChange={onChange} />);
    const hour = screen.getByRole('adjustable', { name: 'Bedtime, Hour' });
    expect(screen.getByRole('adjustable', { name: 'Bedtime, Minute' })).toBeTruthy();
    expect(screen.getByRole('adjustable', { name: 'Bedtime, AM or PM' })).toBeTruthy();
    await fireEvent(hour, 'accessibilityAction', { nativeEvent: { actionName: 'decrement' } });
    expect(onChange).toHaveBeenCalledWith('22:00');
  });
});

describe('EmptyState', () => {
  it('always offers one CTA', async () => {
    const onCta = jest.fn();
    await renderWithTheme(
      <EmptyState emoji="🔍" title="No suspects yet" ctaLabel="See the plan" onCta={onCta} />,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'See the plan' }));
    expect(onCta).toHaveBeenCalled();
  });
});

describe('theming', () => {
  it.each(SCHEMES)('Text and Card use %s tokens', async (scheme) => {
    await renderWithTheme(
      <Card>
        <Text>Hello</Text>
      </Card>,
      scheme,
    );
    expect(screen.getByText('Hello')).toHaveStyle({ color: palette[scheme].textPrimary });
  });
});
