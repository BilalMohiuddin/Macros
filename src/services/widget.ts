import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestWidgetUpdate } from 'react-native-android-widget';
import { CalorieMacrosWidget } from '../widget/CalorieMacrosWidget';
import { DailyTotals, UserSettings } from '../types';

export async function updateWidget(
  totals: DailyTotals,
  settings: UserSettings,
): Promise<void> {
  const data = {
    calories: Math.round(totals.calories),
    target: settings.calorieTarget,
    protein: Math.round(totals.protein),
    carbs: Math.round(totals.carbs),
    fat: Math.round(totals.fat),
  };

  try {
    await AsyncStorage.setItem('widget_data', JSON.stringify(data));
    await requestWidgetUpdate({
      widgetName: 'CalorieMacros',
      renderWidget: () =>
        React.createElement(CalorieMacrosWidget, data),
      widgetNotFound: () => {},
    });
  } catch {
    // widget not added yet or update failed — non-critical
  }
}
