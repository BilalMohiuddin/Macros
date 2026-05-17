import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

interface Props {
  calories: number;
  target: number;
  protein: number;
  carbs: number;
  fat: number;
}

export function CalorieMacrosWidget({ calories, target, protein, carbs, fat }: Props) {
  const remaining = Math.max(0, target - calories);
  const pct = target > 0 ? Math.min(100, Math.round((calories / target) * 100)) : 0;
  const isOver = calories > target;

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        padding: 12,
      }}
    >
      <TextWidget
        text="MACROS"
        style={{ fontSize: 10, color: '#636366', letterSpacing: 1 }}
      />
      <TextWidget
        text={`${calories} / ${target} kcal`}
        style={{ fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', marginTop: 4 }}
      />
      <TextWidget
        text={isOver ? `${calories - target} over goal` : `${remaining} remaining · ${pct}%`}
        style={{ fontSize: 11, color: isOver ? '#FF453A' : '#4CAF50', marginTop: 2 }}
      />
      <FlexWidget
        style={{ flexDirection: 'row', marginTop: 10, justifyContent: 'center' }}
      >
        <TextWidget
          text={`P ${protein}g`}
          style={{ color: '#4FC3F7', fontSize: 11, marginRight: 10 }}
        />
        <TextWidget
          text={`C ${carbs}g`}
          style={{ color: '#FFD54F', fontSize: 11, marginRight: 10 }}
        />
        <TextWidget
          text={`F ${fat}g`}
          style={{ color: '#EF9A9A', fontSize: 11 }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}
