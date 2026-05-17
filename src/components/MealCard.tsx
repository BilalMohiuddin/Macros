import React from 'react';
import { View, Text, Image, Pressable, Alert, StyleSheet } from 'react-native';
import { Meal } from '../types';

interface Props {
  meal: Meal;
  onDelete: (id: string) => void;
}

export function MealCard({ meal, onDelete }: Props) {
  const handleLongPress = () => {
    Alert.alert('Delete Meal', `Remove "${meal.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(meal.id) },
    ]);
  };

  return (
    <Pressable style={styles.card} onLongPress={handleLongPress}>
      {meal.photoUri && (
        <Image source={{ uri: meal.photoUri }} style={styles.thumb} />
      )}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{meal.name}</Text>
        <Text style={styles.macros}>
          {`P ${Math.round(meal.protein)}g  C ${Math.round(meal.carbs)}g  F ${Math.round(meal.fat)}g`}
        </Text>
      </View>
      <Text style={styles.calories}>{Math.round(meal.calories)} kcal</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  macros: {
    color: '#8E8E93',
    fontSize: 12,
  },
  calories: {
    color: '#4CAF50',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
});
