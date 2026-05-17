import { create } from 'zustand';
import { Meal, DailyTotals, UserSettings } from '../types';

interface AppState {
  todayMeals: Meal[];
  todayTotals: DailyTotals;
  settings: UserSettings;
  isAnalyzing: boolean;
  analysisError: string | null;

  setTodayMeals: (meals: Meal[]) => void;
  setTodayTotals: (totals: DailyTotals) => void;
  addMealToStore: (meal: Meal) => void;
  removeMealFromStore: (id: string) => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
  setIsAnalyzing: (v: boolean) => void;
  setAnalysisError: (e: string | null) => void;
}

export const DEFAULT_SETTINGS: UserSettings = {
  calorieTarget: 2000,
  proteinTarget: 150,
  carbsTarget: 250,
  fatTarget: 65,
  notificationTime: '20:00',
  anthropicApiKey: '',
};

export const useStore = create<AppState>((set) => ({
  todayMeals: [],
  todayTotals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
  settings: DEFAULT_SETTINGS,
  isAnalyzing: false,
  analysisError: null,

  setTodayMeals: (todayMeals) => set({ todayMeals }),
  setTodayTotals: (todayTotals) => set({ todayTotals }),

  addMealToStore: (meal) =>
    set((state) => ({
      todayMeals: [...state.todayMeals, meal],
      todayTotals: {
        calories: state.todayTotals.calories + meal.calories,
        protein: state.todayTotals.protein + meal.protein,
        carbs: state.todayTotals.carbs + meal.carbs,
        fat: state.todayTotals.fat + meal.fat,
      },
    })),

  removeMealFromStore: (id) =>
    set((state) => {
      const meal = state.todayMeals.find((m) => m.id === id);
      if (!meal) return {};
      return {
        todayMeals: state.todayMeals.filter((m) => m.id !== id),
        todayTotals: {
          calories: Math.max(0, state.todayTotals.calories - meal.calories),
          protein: Math.max(0, state.todayTotals.protein - meal.protein),
          carbs: Math.max(0, state.todayTotals.carbs - meal.carbs),
          fat: Math.max(0, state.todayTotals.fat - meal.fat),
        },
      };
    }),

  updateSettings: (partial) =>
    set((state) => ({ settings: { ...state.settings, ...partial } })),

  setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  setAnalysisError: (analysisError) => set({ analysisError }),
}));
