import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../src/context/ThemeContext';
import { Button } from '../src/components/UI/Button';
import { useRouter } from 'expo-router';
import { ArrowLeft, Save, Plus, Dumbbell } from 'lucide-react-native';

export default function TemplateEditorScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [muscles, setMuscles] = useState('');

  const handleSave = () => {
    // Enregistrement du programme / template
    router.back();
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={[styles.topBar, { borderBottomColor: theme.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={20} color={theme.text} />
          <Text style={[styles.backText, { color: theme.text }]}>Retour</Text>
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: theme.text }]}>Créer une séance</Text>
        <TouchableOpacity onPress={handleSave}>
          <Save size={20} color={theme.accent} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.label, { color: theme.text }]}>Nom du programme</Text>
        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
          placeholder="ex: Upper A, Legs, Pull..."
          placeholderTextColor={theme.textMuted}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={[styles.label, { color: theme.text }]}>Description</Text>
        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
          placeholder="Description et objectifs de la séance..."
          placeholderTextColor={theme.textMuted}
          value={description}
          onChangeText={setDescription}
        />

        <Text style={[styles.label, { color: theme.text }]}>Muscles ciblés (séparés par des virgules)</Text>
        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
          placeholder="ex: Pectoraux, Triceps, Épaules"
          placeholderTextColor={theme.textMuted}
          value={muscles}
          onChangeText={setMuscles}
        />

        <Button title="Sauvegarder le programme" variant="primary" onPress={handleSave} style={{ marginTop: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 4,
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  scrollContent: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    height: 42,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
  },
});
