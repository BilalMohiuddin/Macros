import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  label: string;
  consumed: number;
  target: number;
  color: string;
  unit?: string;
}

export function MacroBar({ label, consumed, target, color, unit = 'g' }: Props) {
  const progress = Math.min(1, target > 0 ? consumed / target : 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.values}>
          <Text style={[styles.consumed, { color }]}>{Math.round(consumed)}</Text>
          <Text style={styles.target}> / {target}{unit}</Text>
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    color: '#AEAEB2',
    fontSize: 13,
    fontWeight: '600',
  },
  values: {
    fontSize: 13,
  },
  consumed: {
    fontWeight: '700',
  },
  target: {
    color: '#636366',
  },
  track: {
    height: 6,
    backgroundColor: '#2C2C2E',
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
});
