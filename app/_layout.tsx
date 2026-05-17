import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { AppState } from 'react-native';
import { initDatabase, getSetting } from '@/services/db';
import {
  setupNotificationChannel,
  requestNotificationPermission,
  scheduleDailyReminder,
} from '@/services/notifications';
import { updateWidget } from '@/services/widget';
import { useStore, DEFAULT_SETTINGS } from '@/store/useStore';

export default function RootLayout() {
  const { updateSettings, settings, todayTotals } = useStore();

  useEffect(() => {
    async function init() {
      await initDatabase();

      const keys: (keyof typeof DEFAULT_SETTINGS)[] = [
        'calorieTarget', 'proteinTarget', 'carbsTarget', 'fatTarget',
        'notificationTime', 'anthropicApiKey',
      ];
      const partial: Partial<typeof DEFAULT_SETTINGS> = {};
      for (const key of keys) {
        const val = await getSetting(key);
        if (val !== null) {
          if (key === 'notificationTime' || key === 'anthropicApiKey') {
            (partial as Record<string, unknown>)[key] = val;
          } else {
            (partial as Record<string, unknown>)[key] = Number(val);
          }
        }
      }
      if (Object.keys(partial).length > 0) updateSettings(partial);

      await setupNotificationChannel();
      await requestNotificationPermission();
    }
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        updateWidget(todayTotals, settings).catch(() => {});
        const remaining = Math.max(0, settings.calorieTarget - todayTotals.calories);
        scheduleDailyReminder(
          settings.notificationTime,
          Math.round(remaining),
          settings.calorieTarget,
        ).catch(() => {});
      }
    });
    return () => sub.remove();
  }, [todayTotals, settings]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
