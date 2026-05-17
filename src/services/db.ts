import * as SQLite from 'expo-sqlite';
import { Meal, DailyTotals } from '../types';

let db: SQLite.SQLiteDatabase;

export async function initDatabase(): Promise<void> {
  db = await SQLite.openDatabaseAsync('macros.db');
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS meals (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      name TEXT NOT NULL,
      calories INTEGER NOT NULL,
      protein REAL NOT NULL,
      carbs REAL NOT NULL,
      fat REAL NOT NULL,
      photo_uri TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_meals_date ON meals(date);

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}

export async function insertMeal(meal: Meal): Promise<void> {
  await db.runAsync(
    `INSERT INTO meals (id, date, name, calories, protein, carbs, fat, photo_uri, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [meal.id, meal.date, meal.name, meal.calories, meal.protein,
     meal.carbs, meal.fat, meal.photoUri ?? null, meal.createdAt],
  );
}

export async function getMealsForDate(date: string): Promise<Meal[]> {
  const rows = await db.getAllAsync<{
    id: string; date: string; name: string; calories: number;
    protein: number; carbs: number; fat: number;
    photo_uri: string | null; created_at: string;
  }>(
    `SELECT id, date, name, calories, protein, carbs, fat, photo_uri, created_at
     FROM meals WHERE date = ? ORDER BY created_at ASC`,
    [date],
  );
  return rows.map(r => ({
    id: r.id, date: r.date, name: r.name,
    calories: r.calories, protein: r.protein, carbs: r.carbs, fat: r.fat,
    photoUri: r.photo_uri ?? undefined, createdAt: r.created_at,
  }));
}

export async function getDailyTotals(date: string): Promise<DailyTotals> {
  const row = await db.getFirstAsync<DailyTotals>(
    `SELECT
       COALESCE(SUM(calories), 0) as calories,
       COALESCE(SUM(protein), 0) as protein,
       COALESCE(SUM(carbs), 0) as carbs,
       COALESCE(SUM(fat), 0) as fat
     FROM meals WHERE date = ?`,
    [date],
  );
  return row ?? { calories: 0, protein: 0, carbs: 0, fat: 0 };
}

interface MealRow {
  id: string; date: string; name: string; calories: number;
  protein: number; carbs: number; fat: number;
  photo_uri: string | null; created_at: string;
}

export async function getMealsByDateRange(
  startDate: string,
  endDate: string,
): Promise<{ date: string; meals: Meal[] }[]> {
  const rows = await db.getAllAsync<MealRow>(
    `SELECT id, date, name, calories, protein, carbs, fat, photo_uri, created_at
     FROM meals WHERE date BETWEEN ? AND ?
     ORDER BY date DESC, created_at DESC`,
    [startDate, endDate],
  );
  const grouped = new Map<string, Meal[]>();
  for (const r of rows) {
    const meal: Meal = {
      id: r.id, date: r.date, name: r.name,
      calories: r.calories, protein: r.protein, carbs: r.carbs, fat: r.fat,
      photoUri: r.photo_uri ?? undefined, createdAt: r.created_at,
    };
    if (!grouped.has(r.date)) grouped.set(r.date, []);
    grouped.get(r.date)!.push(meal);
  }
  return Array.from(grouped.entries()).map(([date, meals]) => ({ date, meals }));
}

export async function deleteMeal(id: string): Promise<void> {
  await db.runAsync('DELETE FROM meals WHERE id = ?', [id]);
}

export async function getSetting(key: string): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?', [key],
  );
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db.runAsync(
    'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
    [key, value],
  );
}
