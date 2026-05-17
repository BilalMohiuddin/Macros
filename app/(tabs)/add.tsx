import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, Image, ScrollView,
  ActivityIndicator, Alert, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Crypto from 'expo-crypto';
import { useRouter } from 'expo-router';
import { analyzeFoodPhoto } from '@/services/anthropic';
import { insertMeal, getDailyTotals } from '@/services/db';
import { updateWidget } from '@/services/widget';
import { scheduleDailyReminder } from '@/services/notifications';
import { useStore } from '@/store/useStore';
import { AIFoodAnalysis } from '@/types';

function todayDate() {
  return new Date().toISOString().split('T')[0];
}

export default function AddFoodScreen() {
  const router = useRouter();
  const { settings, addMealToStore, setTodayTotals } = useStore();

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');

  const applyAnalysis = (result: AIFoodAnalysis) => {
    setName(result.foodName);
    setCalories(String(result.calories));
    setProtein(String(result.protein));
    setCarbs(String(result.carbs));
    setFat(String(result.fat));
  };

  const pickImage = async (fromCamera: boolean) => {
    const launchFn = fromCamera
      ? ImagePicker.launchCameraAsync
      : ImagePicker.launchImageLibraryAsync;

    const result = await launchFn({
      mediaTypes: 'images',
      quality: 0.7,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];

    const resized = await ImageManipulator.manipulateAsync(
      asset.uri,
      [{ resize: { width: 800 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true },
    );

    setPhotoUri(resized.uri);
    setPhotoBase64(resized.base64 ?? null);
    setName('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
  };

  const handleAnalyze = async () => {
    if (!photoBase64) return;
    if (!settings.anthropicApiKey) {
      Alert.alert('API Key Missing', 'Please add your Anthropic API key in Settings.');
      return;
    }
    setAnalyzing(true);
    try {
      const result = await analyzeFoodPhoto(photoBase64, 'image/jpeg', settings.anthropicApiKey);
      applyAnalysis(result);
    } catch (e) {
      Alert.alert('Analysis Failed', String(e instanceof Error ? e.message : e));
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    const cal = parseFloat(calories);
    const pro = parseFloat(protein);
    const crb = parseFloat(carbs);
    const ft = parseFloat(fat);

    if (!name.trim() || isNaN(cal) || isNaN(pro) || isNaN(crb) || isNaN(ft)) {
      Alert.alert('Missing Info', 'Please fill in all fields before saving.');
      return;
    }

    setSaving(true);
    try {
      const id = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        `${Date.now()}${Math.random()}`,
      );
      const date = todayDate();
      const meal = {
        id,
        date,
        name: name.trim(),
        calories: Math.round(cal),
        protein: pro,
        carbs: crb,
        fat: ft,
        photoUri: photoUri ?? undefined,
        createdAt: new Date().toISOString(),
      };

      await insertMeal(meal);
      addMealToStore(meal);

      const totals = await getDailyTotals(date);
      setTodayTotals(totals);

      await updateWidget(totals, settings);

      const remaining = Math.max(0, settings.calorieTarget - totals.calories);
      await scheduleDailyReminder(
        settings.notificationTime,
        Math.round(remaining),
        settings.calorieTarget,
      );

      router.back();
    } catch (e) {
      Alert.alert('Save Failed', String(e instanceof Error ? e.message : e));
    } finally {
      setSaving(false);
    }
  };

  const hasFields = name || calories;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Add Food</Text>

        <View style={styles.photoRow}>
          <Pressable style={styles.photoBtn} onPress={() => pickImage(true)}>
            <Text style={styles.photoBtnIcon}>📷</Text>
            <Text style={styles.photoBtnText}>Camera</Text>
          </Pressable>
          <Pressable style={styles.photoBtn} onPress={() => pickImage(false)}>
            <Text style={styles.photoBtnIcon}>🖼️</Text>
            <Text style={styles.photoBtnText}>Gallery</Text>
          </Pressable>
        </View>

        {photoUri && (
          <Image source={{ uri: photoUri }} style={styles.preview} />
        )}

        {photoBase64 && (
          <Pressable
            style={[styles.analyzeBtn, analyzing && styles.disabled]}
            onPress={handleAnalyze}
            disabled={analyzing}
          >
            {analyzing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.analyzeBtnText}>✨ Analyze with AI</Text>
            )}
          </Pressable>
        )}

        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Nutritional Info</Text>

          <Text style={styles.fieldLabel}>Food Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Chicken Caesar Salad"
            placeholderTextColor="#48484A"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.fieldLabel}>Calories (kcal)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 450"
            placeholderTextColor="#48484A"
            value={calories}
            onChangeText={setCalories}
            keyboardType="numeric"
          />

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.fieldLabel}>Protein (g)</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor="#48484A"
                value={protein}
                onChangeText={setProtein}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.fieldLabel}>Carbs (g)</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor="#48484A"
                value={carbs}
                onChangeText={setCarbs}
                keyboardType="numeric"
              />
            </View>
          </View>

          <Text style={styles.fieldLabel}>Fat (g)</Text>
          <TextInput
            style={[styles.input, styles.halfWidth]}
            placeholder="0"
            placeholderTextColor="#48484A"
            value={fat}
            onChangeText={setFat}
            keyboardType="numeric"
          />
        </View>

        {hasFields && (
          <Pressable
            style={[styles.saveBtn, saving && styles.disabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveBtnText}>Save Meal</Text>
            )}
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#000000' },
  content: { padding: 20, paddingBottom: 60 },
  title: { color: '#FFFFFF', fontSize: 28, fontWeight: '700', marginBottom: 20 },
  photoRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  photoBtn: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  photoBtnIcon: { fontSize: 28 },
  photoBtnText: { color: '#AEAEB2', fontSize: 13, marginTop: 6 },
  preview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
    resizeMode: 'cover',
  },
  analyzeBtn: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  analyzeBtnText: { color: '#4CAF50', fontWeight: '700', fontSize: 15 },
  disabled: { opacity: 0.5 },
  form: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  fieldLabel: { color: '#AEAEB2', fontSize: 13, marginBottom: 6, marginTop: 4 },
  input: {
    backgroundColor: '#2C2C2E',
    borderRadius: 10,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 15,
    marginBottom: 8,
  },
  row: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1 },
  halfWidth: { width: '48%' },
  saveBtn: {
    backgroundColor: '#4CAF50',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  saveBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
});
