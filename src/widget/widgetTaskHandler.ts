import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { CalorieMacrosWidget } from './CalorieMacrosWidget';

const DEFAULT_DATA = { calories: 0, target: 2000, protein: 0, carbs: 0, fat: 0 };

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      let data = DEFAULT_DATA;
      try {
        const stored = await AsyncStorage.getItem('widget_data');
        if (stored) data = { ...DEFAULT_DATA, ...JSON.parse(stored) };
      } catch {
        // use defaults
      }

      props.renderWidget(
        React.createElement(CalorieMacrosWidget, {
          calories: Math.round(data.calories),
          target: data.target,
          protein: Math.round(data.protein),
          carbs: Math.round(data.carbs),
          fat: Math.round(data.fat),
        }),
      );
      break;
    }
    default:
      break;
  }
}
