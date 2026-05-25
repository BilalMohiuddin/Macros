import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { AppState, View, Text, StyleSheet } from 'react-native';
import { initDatabase, getSetting } from '@/services/db';
import {
  setupNotificationChannel,
  requestNotificationPermission,
  scheduleDailyReminder,
} from '@/services/notifications';
import { useStore, DEFAULT_SETTINGS } from '@/store/useStore';

export default function RootLayout() {
  const { updateSettings, settings, todayTotals } = useStore();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
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
      } catch (e) {
        console.error('Database init failed:', e);
        setError(String(e));
        setReady(true);
        return;
      }

      try {
        await setupNotificationChannel();
        await requestNotificationPermission();
      } catch (e) {
        console.warn('Notification setup failed:', e);
      }

      setReady(true);
    }
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
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

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Startup Error</Text>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!ready) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorTitle: {
    color: '#FF453A',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  errorText: {
    color: '#AEAEB2',
    fontSize: 13,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
});
