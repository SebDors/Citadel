import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { X, Flame, Plus, Minus, Clock, Zap, Check } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { CardioTemplate } from '../../types';
import { Button } from '../UI/Button';

interface CardioTemplateModalProps {
  visible: boolean;
  templateToEdit?: CardioTemplate | null;
  onClose: () => void;
  onSave: (template: CardioTemplate) => Promise<void> | void;
}

const PRESET_ACTIVITIES = [
  'Course',
  'Boxe',
  'Vélo',
  'Natation',
  'Corde à sauter',
  'HIIT',
  'Rameur',
];

const PRESET_DURATIONS = [15, 30, 45, 60];

export const CardioTemplateModal: React.FC<CardioTemplateModalProps> = ({
  visible,
  templateToEdit,
  onClose,
  onSave,
}) => {
  const { theme } = useTheme();
  const [title, setTitle] = useState('');
  const [activity, setActivity] = useState('Course');
  const [isCustomActivity, setIsCustomActivity] = useState(false);
  const [customActivityText, setCustomActivityText] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [rpe, setRpe] = useState(6);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!visible) return;
    if (templateToEdit) {
      setTitle(templateToEdit.title || '');
      const matched = PRESET_ACTIVITIES.find(
        (p) => p.toLowerCase() === (templateToEdit.activity || '').trim().toLowerCase()
      );
      if (matched) {
        setActivity(matched);
        setIsCustomActivity(false);
        setCustomActivityText('');
      } else {
        setIsCustomActivity(true);
        setActivity('');
        setCustomActivityText(templateToEdit.activity || '');
      }
      setDurationMinutes(templateToEdit.defaultDurationMinutes || 30);
      setRpe(templateToEdit.defaultRpe ?? 6);
      setNotes(templateToEdit.notes || '');
    } else {
      setTitle('');
      setActivity('Course');
      setIsCustomActivity(false);
      setCustomActivityText('');
      setDurationMinutes(30);
      setRpe(6);
      setNotes('');
    }
  }, [visible, templateToEdit]);

  const resolvedActivity = isCustomActivity ? customActivityText.trim() : activity;
  const canSave = resolvedActivity.length > 0 && durationMinutes > 0;

  const handleSave = async () => {
    if (!canSave) return;
    const finalTitle = title.trim() || resolvedActivity;
    const tpl: CardioTemplate = {
      id: templateToEdit?.id || `cardio_tpl_${Date.now()}`,
      title: finalTitle,
      activity: resolvedActivity,
      defaultDurationMinutes: Math.max(1, durationMinutes),
      defaultRpe: Math.min(10, Math.max(1, rpe)),
      notes: notes.trim() || undefined,
    };
    await onSave(tpl);
    onClose();
  };

  return (
    <Modal
      navigationBarTranslucent
      statusBarTranslucent
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View
            style={[
              styles.sheet,
              { backgroundColor: theme.cardBg, borderColor: theme.border },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.header}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[styles.iconBadge, { backgroundColor: '#F9731620' }]}>
                  <Flame size={18} color="#F97316" />
                </View>
                <Text style={[styles.title, { color: theme.text }]}>
                  {templateToEdit ? 'Modifier la séance cardio' : 'Nouvelle séance cardio'}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              style={{ maxHeight: 460 }}
            >
              {/* Titre */}
              <Text style={[styles.label, { color: theme.textMuted }]}>NOM DE LA SÉANCE</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
                placeholder={`Ex: Footing Zone 2 (sinon "${resolvedActivity || 'Cardio'}")`}
                placeholderTextColor={theme.textMuted}
                value={title}
                onChangeText={setTitle}
              />

              {/* Type d'activité */}
              <Text style={[styles.label, { color: theme.textMuted }]}>ACTIVITÉ</Text>
              <View style={styles.chipsWrap}>
                {PRESET_ACTIVITIES.map((item) => {
                  const selected = !isCustomActivity && activity === item;
                  return (
                    <TouchableOpacity
                      key={item}
                      activeOpacity={0.75}
                      onPress={() => {
                        setIsCustomActivity(false);
                        setActivity(item);
                      }}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: selected ? '#F97316' : theme.surface,
                          borderColor: selected ? '#F97316' : theme.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: selected ? '#FFFFFF' : theme.text },
                        ]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={() => setIsCustomActivity(true)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isCustomActivity ? '#F97316' : theme.surface,
                      borderColor: isCustomActivity ? '#F97316' : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: isCustomActivity ? '#FFFFFF' : theme.text },
                    ]}
                  >
                    Autre...
                  </Text>
                </TouchableOpacity>
              </View>

              {isCustomActivity && (
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.surface,
                      borderColor: '#F97316',
                      color: theme.text,
                      marginTop: 8,
                    },
                  ]}
                  placeholder="Nom de l'activité (ex: Escaliers, Elliptique)..."
                  placeholderTextColor={theme.textMuted}
                  value={customActivityText}
                  onChangeText={setCustomActivityText}
                />
              )}

              {/* Durée cible */}
              <Text style={[styles.label, { color: theme.textMuted }]}>DURÉE CIBLE</Text>
              <View style={styles.stepperRow}>
                <View style={styles.chipsWrap}>
                  {PRESET_DURATIONS.map((mins) => {
                    const selected = durationMinutes === mins;
                    return (
                      <TouchableOpacity
                        key={mins}
                        activeOpacity={0.75}
                        onPress={() => setDurationMinutes(mins)}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: selected ? theme.accent : theme.surface,
                            borderColor: selected ? theme.accent : theme.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            { color: selected ? '#FFFFFF' : theme.text },
                          ]}
                        >
                          {mins} min
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={styles.stepperControls}>
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => setDurationMinutes((d) => Math.max(5, d - 5))}
                    style={[styles.stepBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                  >
                    <Minus size={14} color={theme.text} />
                  </TouchableOpacity>
                  <View style={styles.stepValueBox}>
                    <Clock size={13} color="#F97316" style={{ marginRight: 4 }} />
                    <Text style={[styles.stepValueText, { color: theme.text }]}>
                      {durationMinutes} min
                    </Text>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => setDurationMinutes((d) => Math.min(300, d + 5))}
                    style={[styles.stepBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                  >
                    <Plus size={14} color={theme.text} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* RPE cible */}
              <Text style={[styles.label, { color: theme.textMuted }]}>INTENSITÉ CIBLE (RPE 1–10)</Text>
              <View style={[styles.rpeCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={() => setRpe((r) => Math.max(1, r - 1))}
                  style={[styles.stepBtn, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
                >
                  <Minus size={14} color={theme.text} />
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Zap size={15} color="#F97316" />
                  <Text style={[styles.stepValueText, { color: theme.text, fontSize: 16 }]}>
                    RPE {rpe} / 10
                  </Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={() => setRpe((r) => Math.min(10, r + 1))}
                  style={[styles.stepBtn, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
                >
                  <Plus size={14} color={theme.text} />
                </TouchableOpacity>
              </View>

              {/* Notes */}
              <Text style={[styles.label, { color: theme.textMuted }]}>NOTES / OBJECTIFS (OPTIONNEL)</Text>
              <TextInput
                style={[
                  styles.notesInput,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
                placeholder="Ex: Zone 2 (135-145 bpm), fractions 30/30..."
                placeholderTextColor={theme.textMuted}
                value={notes}
                onChangeText={setNotes}
                multiline
              />
            </ScrollView>

            <View style={styles.footer}>
              <Button
                title="Annuler"
                variant="outline"
                onPress={onClose}
                style={{ flex: 1 }}
              />
              <TouchableOpacity
                activeOpacity={0.8}
                disabled={!canSave}
                onPress={handleSave}
                style={[
                  styles.saveBtn,
                  {
                    backgroundColor: canSave ? '#F97316' : theme.border,
                  },
                ]}
              >
                <Check size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.saveBtnText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 1,
    paddingTop: 18,
    paddingHorizontal: 18,
    paddingBottom: Platform.OS === 'android' ? 40 : 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  stepperRow: {
    gap: 10,
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValueBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepValueText: {
    fontSize: 15,
    fontWeight: '800',
  },
  rpeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  notesInput: {
    minHeight: 68,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontWeight: '500',
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  saveBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
