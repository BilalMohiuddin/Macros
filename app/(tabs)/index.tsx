import React, { useEffect, useCallback } from 'react';
import {
  View, FlatList, Text, Pressable, StyleSheet, Alert,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { CalorieRing } from '@/components/CalorieRing';
import { MacroBar } from '@/components/MacroBar';
import { MealCard } from '@/components/MealCard';
import { getMealsForDate, getDailyTotals, deleteMeal } from '@/services/db';
import { updateWidget } from '@/services/widget';
import { useStore } from '@/store/useStore';

function todayDate() {
  return new Date().toISOString().split('T')[0];
}

export default function HomeScreen() {
  const router = useRouter();
  const {
    todayMeals, todayTotals, settings,
    setTodayMeals, setTodayTotals, removeMealFromStore,
  } = useStore();

  const loadToday = useCallback(async () => {
    const date = todayDate();
    const [meals, totals] = await Promise.all([
      getMealsForDate(date),
      getDailyTotals(date),
    ]);
    setTodayMeals(meals);
    setTodayTotals(totals);
  }, [setTodayMeals, setTodayTotals]);

  useFocusEffect(useCallback(() => { loadToday(); }, [loadToday]));

  const handleDelete = async (id: string) => {
    try {
      await deleteMeal(id);
      removeMealFromStore(id);
      const totals = await getDailyTotals(todayDate());
      setTodayTotals(totals);
      await updateWidget(totals, settings);
    } catch {
      Alert.alert('Error', 'Could not delete meal.');
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={todayMeals}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => (
          <MealCard meal={item} onDelete={handleDelete} />
        )}
        ListHeaderComponent={
          <View>
            <View style={styles.ringSection}>
              <CalorieRing
                consumed={todayTotals.calories}
                target={settings.calorieTarget}
              />
              <Text style={styles.targetLabel}>
                Daily target: {settings.calorieTarget} kcal
              </Text>
            </View>
            <View style={styles.macrosSection}>
              <MacroBar
                label="Protein"
                consumed={todayTotals.protein}
                target={settings.proteinTarget}
                color="#4FC3F7"
              />
              <MacroBar
                label="Carbs"
                consumed={todayTotals.carbs}
                target={settings.carbsTarget}
                color="#FFD54F"
              />
              <MacroBar
                label="Fat"
                consumed={todayTotals.fat}
                target={settings.fatTarget}
                color="#EF9A9A"
              />
            </View>
            {todayMeals.length > 0 && (
              <Text style={styles.mealsHeader}>Today's Meals</Text>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No meals logged yet.</Text>
            <Text style={styles.emptySubtext}>Tap the camera tab to add food.</Text>
          </View>
        }
        contentContainerStyle={styles.list}
      />

      <Pressable
        style={styles.fab}
        onPress={() => router.push('/(tabs)/add')}
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  list: { padding: 16, paddingBottom: 100 },
  ringSection: { alignItems: 'center', marginBottom: 24 },
  targetLabel: { color: '#636366', fontSize: 13, marginTop: 8 },
  macrosSection: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  mealsHeader: {
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  empty: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#636366', fontSize: 16 },
  emptySubtext: { color: '#48484A', fontSize: 13, marginTop: 4 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
  fabText: { color: '#FFFFFF', fontSize: 28, lineHeight: 32 },
});
