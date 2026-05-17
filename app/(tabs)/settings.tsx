import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView,
  Alert, StyleSheet, ActivityIndicator,
} from 'react-native';
import { setSetting } from '@/services/db';
import { scheduleDailyReminder } from '@/services/notifications';
import { useStore } from '@/store/useStore';

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: 'numeric' | 'default';
  secureTextEntry?: boolean;
  placeholder?: string;
}

function SettingField({
  label, value, onChangeText, keyboardType = 'default',
  secureTextEntry = false, placeholder,
}: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        placeholder={placeholder}
        placeholderTextColor="#48484A"
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}

export default function SettingsScreen() {
  const { settings, updateSettings, todayTotals } = useStore();
  const [saving, setSaving] = useState(false);

  const [calorieTarget, setCalorieTarget] = useState(String(settings.calorieTarget));
  const [proteinTarget, setProteinTarget] = useState(String(settings.proteinTarget));
  const [carbsTarget, setCarbsTarget] = useState(String(settings.carbsTarget));
  const [fatTarget, setFatTarget] = useState(String(settings.fatTarget));
  const [notificationTime, setNotificationTime] = useState(settings.notificationTime);
  const [apiKey, setApiKey] = useState(settings.anthropicApiKey);

  useEffect(() => {
    setCalorieTarget(String(settings.calorieTarget));
    setProteinTarget(String(settings.proteinTarget));
    setCarbsTarget(String(settings.carbsTarget));
    setFatTarget(String(settings.fatTarget));
    setNotificationTime(settings.notificationTime);
    setApiKey(settings.anthropicApiKey);
  }, [settings]);

  const handleSave = async () => {
    const cal = parseInt(calorieTarget, 10);
    const pro = parseInt(proteinTarget, 10);
    const crb = parseInt(carbsTarget, 10);
    const ft = parseInt(fatTarget, 10);

    if ([cal, pro, crb, ft].some(isNaN) || cal < 1 || pro < 0 || crb < 0 || ft < 0) {
      Alert.alert('Invalid Values', 'Please enter valid positive numbers for all targets.');
      return;
    }

    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(notificationTime)) {
      Alert.alert('Invalid Time', 'Enter notification time as HH:MM (24-hour format, e.g. 20:00).');
      return;
    }

    setSaving(true);
    try {
      const updates = {
        calorieTarget: cal,
        proteinTarget: pro,
        carbsTarget: crb,
        fatTarget: ft,
        notificationTime,
        anthropicApiKey: apiKey.trim(),
      };

      await Promise.all([
        setSetting('calorieTarget', String(cal)),
        setSetting('proteinTarget', String(pro)),
        setSetting('carbsTarget', String(crb)),
        setSetting('fatTarget', String(ft)),
        setSetting('notificationTime', notificationTime),
        setSetting('anthropicApiKey', apiKey.trim()),
      ]);

      updateSettings(updates);

      const remaining = Math.max(0, cal - todayTotals.calories);
      await scheduleDailyReminder(notificationTime, Math.round(remaining), cal);

      Alert.alert('Saved', 'Your settings have been updated.');
    } catch (e) {
      Alert.alert('Error', String(e instanceof Error ? e.message : e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Daily Targets</Text>
        <SettingField
          label="Calories (kcal)"
          value={calorieTarget}
          onChangeText={setCalorieTarget}
          keyboardType="numeric"
        />
        <SettingField
          label="Protein (g)"
          value={proteinTarget}
          onChangeText={setProteinTarget}
          keyboardType="numeric"
        />
        <SettingField
          label="Carbohydrates (g)"
          value={carbsTarget}
          onChangeText={setCarbsTarget}
          keyboardType="numeric"
        />
        <SettingField
          label="Fat (g)"
          value={fatTarget}
          onChangeText={setFatTarget}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <SettingField
          label="Reminder Time (HH:MM, 24-hr)"
          value={notificationTime}
          onChangeText={setNotificationTime}
          placeholder="20:00"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI Analysis</Text>
        <Text style={styles.hint}>
          Get your API key at console.anthropic.com
        </Text>
        <SettingField
          label="Anthropic API Key"
          value={apiKey}
          onChangeText={setApiKey}
          secureTextEntry
          placeholder="sk-ant-..."
        />
      </View>

      <Pressable
        style={[styles.saveBtn, saving && styles.disabled]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.saveBtnText}>Save Settings</Text>
        )}
      </Pressable>

      <View style={styles.widgetInfo}>
        <Text style={styles.widgetInfoTitle}>Home Screen Widget</Text>
        <Text style={styles.widgetInfoText}>
          Long-press your Android home screen → Widgets → find "Macros Calories" to add the widget.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  content: { padding: 20, paddingBottom: 60 },
  title: { color: '#FFFFFF', fontSize: 28, fontWeight: '700', marginBottom: 24 },
  section: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  hint: {
    color: '#636366',
    fontSize: 12,
    marginBottom: 8,
  },
  field: { marginBottom: 12 },
  fieldLabel: { color: '#AEAEB2', fontSize: 13, marginBottom: 6 },
  input: {
    backgroundColor: '#2C2C2E',
    borderRadius: 10,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 15,
  },
  saveBtn: {
    backgroundColor: '#4CAF50',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  saveBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  disabled: { opacity: 0.5 },
  widgetInfo: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  widgetInfoTitle: { color: '#AEAEB2', fontSize: 14, fontWeight: '600', marginBottom: 6 },
  widgetInfoText: { color: '#636366', fontSize: 13, lineHeight: 18 },
});
