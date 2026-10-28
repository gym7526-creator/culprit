import { useRouter } from 'expo-router';
import { Alert, Platform } from 'react-native';

import { PrimaryButton, SecondaryButton, StatusPill, Text, type PillStatus } from '@/components';
import { settingsCopy } from '@/copy';
import { content } from '@/data/content';
import { groupStatus, requestRetest } from '@/engines/program';
import { track } from '@/analytics';
import { useAppStore } from '@/features/appStore';
import { useClock } from '@/features/clock';
import { restartProgram, setPaused } from '@/features/settings/actions';
import { SettingsRow, SettingsScreen, SettingsSection } from '@/features/settings/components';
import { useUiStore } from '@/features/uiStore';
import { dayKind } from '@/engines/today';

const p = settingsCopy.program;
const pill: Record<string, PillStatus> = {
  trigger: 'trigger',
  partial: 'partial',
  cleared: 'cleared',
  unclear: 'unclear',
  self_reported: 'selfReported',
  testing: 'testing',
  untested: 'untested',
};

/** Program controls: pause / resume, retest a food, restart. */
export default function ProgramSettings() {
  const router = useRouter();
  const { today } = useClock();
  const program = useAppStore((s) => s.program);
  const setProgram = useAppStore((s) => s.setProgram);
  const toast = useUiStore((s) => s.showToast);
  if (!program) return null;
  const paused = dayKind(program, today).type === 'paused';
  const tested = [
    ...new Set(
      program.completed.filter((t) => t.kind !== 'control' && t.result).map((t) => t.group),
    ),
  ];

  const confirmRestart = () => {
    const run = () => {
      restartProgram();
      toast(p.restarted);
      router.replace('/');
    };
    if (Platform.OS === 'web') return run();
    Alert.alert(p.restartTitle, p.restartBody, [
      { text: settingsCopy.cancel, style: 'cancel' },
      { text: p.restartConfirm, style: 'destructive', onPress: run },
    ]);
  };

  return (
    <SettingsScreen title={p.title} testID="program-settings">
      {!program.gentle ? (
        <SettingsSection>
          <Text variant="callout" color="textSecondary">
            {paused ? p.paused : p.pauseBody}
          </Text>
          {paused ? (
            <PrimaryButton
              label={p.resume}
              onPress={() => {
                setPaused(false);
                toast(p.resumed);
              }}
              testID="resume"
            />
          ) : (
            <SecondaryButton label={p.pause} onPress={() => setPaused(true)} testID="pause" />
          )}
        </SettingsSection>
      ) : null}

      {!program.gentle ? (
        <SettingsSection title={p.retestTitle}>
          {tested.length === 0 ? (
            <SettingsRow label={p.retestNone} />
          ) : (
            tested.map((g) => {
              const queued = program.queue.some((q) => q.group === g && q.kind === 'retest');
              return (
                <SettingsRow
                  key={g}
                  label={content.tests.tests.find((t) => t.id === g)?.name ?? g}
                  detail={queued ? settingsCopy.program.retestTitle : undefined}
                  onPress={
                    queued
                      ? undefined
                      : () => {
                          setProgram(requestRetest(program, g));
                          track({ name: 'retest_requested' });
                          toast(settingsCopy.program.retestTitle);
                        }
                  }
                  right={<StatusPill status={pill[groupStatus(program, g)] ?? 'unclear'} />}
                />
              );
            })
          )}
        </SettingsSection>
      ) : null}

      <SettingsSection>
        <SettingsRow label={p.restart} onPress={confirmRestart} destructive testID="restart" />
      </SettingsSection>
    </SettingsScreen>
  );
}
