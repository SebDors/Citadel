import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { BodyMeasurement } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { Activity, Plus, Trash2 } from 'lucide-react-native';

interface BodyMeasurementsCardProps {
  measurements: BodyMeasurement[];
  onAddMeasurement: (m: BodyMeasurement) => void;
  onDeleteMeasurement: (id: string) => void;
}

export const BodyMeasurementsCard: React.FC<BodyMeasurementsCardProps> = ({
  measurements,
  onAddMeasurement,
  onDeleteMeasurement,
}) => {
  const { theme } = useTheme();
  const [showAdd, setShowAdd] = useState(false);
  const [weight, setWeight] = useState('');
  const [chest, setChest] = useState('');
  const [thigh, setThigh] = useState('');
  const [biceps, setBiceps] = useState('');

  const handleSave = () => {
    if (!weight) return;
    const newM: BodyMeasurement = {
      id: `m_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      weightKg: parseFloat(weight),
      chestCm: chest ? parseFloat(chest) : undefined,
      thighCm: thigh ? parseFloat(thigh) : undefined,
      bicepsCm: biceps ? parseFloat(biceps) : undefined,
    };
    onAddMeasurement(newM);
    setShowAdd(false);
    setWeight('');
    setChest('');
    setThigh('');
    setBiceps('');
  };

  return (
    <Card>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Activity size={18} color={theme.accent} />
          <Text style={[styles.title, { color: theme.text }]}>Poids & Mensurations</Text>
        </View>
        <TouchableOpacity activeOpacity={0.7} onPress={() => setShowAdd(!showAdd)}>
          <Plus size={20} color={theme.accent} />
        </TouchableOpacity>
      </View>

      {/* Formulaire d'ajout rapide */}
      {showAdd && (
        <View style={[styles.form, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.formTitle, { color: theme.text }]}>Nouvelle mesure aujourd'hui</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border }]}
              placeholder="Poids (kg)"
              placeholderTextColor={theme.textMuted}
              keyboardType="numeric"
              value={weight}
              onChangeText={setWeight}
            />
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border }]}
              placeholder="Poitrine (cm)"
              placeholderTextColor={theme.textMuted}
              keyboardType="numeric"
              value={chest}
              onChangeText={setChest}
            />
          </View>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border }]}
              placeholder="Cuisse (cm)"
              placeholderTextColor={theme.textMuted}
              keyboardType="numeric"
              value={thigh}
              onChangeText={setThigh}
            />
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border }]}
              placeholder="Bras (cm)"
              placeholderTextColor={theme.textMuted}
              keyboardType="numeric"
              value={biceps}
              onChangeText={setBiceps}
            />
          </View>
          <Button title="Enregistrer" variant="primary" onPress={handleSave} style={{ marginTop: 6 }} />
        </View>
      )}

      {/* Liste des dernières mesures avec bouton de suppression */}
      {measurements.map((m) => (
        <View key={m.id} style={[styles.mRow, { borderBottomColor: theme.border }]}>
          <Text style={[styles.mDate, { color: theme.textMuted }]}>{m.date}</Text>
          <View style={styles.mStats}>
            <Text style={[styles.mVal, { color: theme.text }]}>{m.weightKg} kg</Text>
            {m.chestCm && <Text style={[styles.mSub, { color: theme.textMuted }]}>P: {m.chestCm}cm</Text>}
            {m.thighCm && <Text style={[styles.mSub, { color: theme.textMuted }]}>C: {m.thighCm}cm</Text>}
            {m.bicepsCm && <Text style={[styles.mSub, { color: theme.textMuted }]}>B: {m.bicepsCm}cm</Text>}

            <TouchableOpacity onPress={() => onDeleteMeasurement(m.id)} style={{ marginLeft: 10 }}>
              <Trash2 size={15} color={theme.danger} />
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </Card>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 6,
  },
  form: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  formTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  input: {
    flex: 0.48,
    height: 36,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    fontSize: 13,
  },
  mRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  mDate: {
    fontSize: 13,
    fontWeight: '600',
  },
  mStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mVal: {
    fontSize: 14,
    fontWeight: '800',
    marginRight: 4,
  },
  mSub: {
    fontSize: 12,
    marginLeft: 4,
  },
});
