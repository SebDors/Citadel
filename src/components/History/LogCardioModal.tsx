import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
  PanResponder,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useWorkout } from '../../context/WorkoutContext';
import { Button } from '../UI/Button';
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  Flame,
  HeartPulse,
  Timer,
  Plus,
  Minus,
  FileText,
  Check,
  Zap,
} from 'lucide-react-native';
import { CardioSession } from '../../types';

interface LogCardioModalProps {
  visible: boolean;
  onClose: () => void;
  onSave?: (session: CardioSession) => void;
  initialDate?: string;
}

const PRESET_ACTIVITIES = [
  { label: 'Boxe' },
  { label: 'Course' },
  { label: 'Corde à sauter' },
  { label: 'Natation' },
  { label: 'Vélo' },
];

const PRESET_DURATIONS = [15, 30, 45, 60];

const RPE_LEVELS: { [key: number]: { title: string; desc: string; color: string; bg: string } } = {
  1: { title: 'Très facile', desc: 'Effort minimal, aucun essoufflement', color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' },
  2: { title: 'Facile', desc: 'Récupération active, respiration aisée', color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' },
  3: { title: 'Aisé', desc: 'Rythme confortable, conversation fluide', color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' },
  4: { title: 'Modéré', desc: 'Rythme de croisière, essoufflement léger', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' },
  5: { title: 'Soutenu', desc: 'Effort sensible, transpiration débutante', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' },
  6: { title: 'Rythmé', desc: 'Bonne intensité, phrases courtes possibles', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' },
  7: { title: 'Intense', desc: 'Effort exigeant, difficile de parler', color: '#F97316', bg: 'rgba(249, 115, 22, 0.15)' },
  8: { title: 'Très intense', desc: 'Effort lourd, cadence élevée, fatigue nette', color: '#F97316', bg: 'rgba(249, 115, 22, 0.15)' },
  9: { title: 'Maximal', desc: 'Très dur, proche de l’épuisement physique', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.18)' },
  10: { title: 'Extrême', desc: 'Épuisement total, effort absolu intenable', color: '#DC2626', bg: 'rgba(220, 38, 38, 0.22)' },
};

export const LogCardioModal: React.FC<LogCardioModalProps> = ({
  visible,
  onClose,
  onSave,
  initialDate,
}) => {
  const { theme } = useTheme();
  const { logCardioSession } = useWorkout();

  const formatISOToFrench = (isoStr?: string): string => {
    if (!isoStr) {
      const d = new Date();
      const day = d.getDate().toString().padStart(2, '0');
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
    if (isoStr.includes('/')) return isoStr;
    const parts = isoStr.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
    }
    return isoStr;
  };

  const parseFrenchToISO = (frenchStr: string): string => {
    if (!frenchStr) return new Date().toISOString().split('T')[0];
    const clean = frenchStr.trim().replace(/-/g, '/');
    const parts = clean.split('/');
    if (parts.length === 3) {
      const d = parts[0].padStart(2, '0');
      const m = parts[1].padStart(2, '0');
      let y = parts[2].trim();
      if (y.length === 2) y = `20${y}`;
      return `${y}-${m}-${d}`;
    }
    return frenchStr;
  };

  const todayFrenchStr = formatISOToFrench();

  const [activity, setActivity] = useState('Boxe');
  const [isCustomActivity, setIsCustomActivity] = useState(false);
  const [customActivityText, setCustomActivityText] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [rpe, setRpe] = useState(7);
  const [dateStr, setDateStr] = useState(formatISOToFrench(initialDate) || todayFrenchStr);
  const [timeStr, setTimeStr] = useState(() => {
    const d = new Date();
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  });
  const [notes, setNotes] = useState('');

  // Swipe-down dismiss animation
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    translateY.stopAnimation();
    translateY.setValue(0);
    if (visible) {
      setDateStr(formatISOToFrench(initialDate) || todayFrenchStr);
      setActivity('Boxe');
      setIsCustomActivity(false);
      setCustomActivityText('');
      setDurationMinutes(45);
      setRpe(7);
      const d = new Date();
      setTimeStr(`${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`);
      setNotes('');
    }
  }, [visible, initialDate, translateY]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderMove: (_, gesture) => {
          if (gesture.dy > 0) {
            translateY.setValue(gesture.dy);
          }
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dy > 70 || gesture.vy > 0.5) {
            Animated.timing(translateY, {
              toValue: 600,
              duration: 180,
              useNativeDriver: true,
            }).start(() => {
              onClose();
              setTimeout(() => {
                translateY.stopAnimation();
                translateY.setValue(0);
              }, 150);
            });
          } else {
            Animated.spring(translateY, {
              toValue: 0,
              bounciness: 4,
              useNativeDriver: true,
            }).start();
          }
        },
      }),
    [onClose, translateY]
  );

  const handleSelectPresetActivity = (actLabel: string) => {
    setIsCustomActivity(false);
    setActivity(actLabel);
  };

  const handleSelectCustomActivity = () => {
    setIsCustomActivity(true);
    if (!customActivityText) {
      setCustomActivityText('');
    }
  };

  const handleDurationChange = (delta: number) => {
    setDurationMinutes((prev) => Math.max(5, Math.min(300, prev + delta)));
  };

  const handleSave = async () => {
    const finalActivity = isCustomActivity ? customActivityText.trim() : activity.trim();
    if (!finalActivity) {
      Alert.alert('Activité requise', 'Veuillez sélectionner ou saisir le nom de l’activité.');
      return;
    }

    const isoDateStr = parseFrenchToISO(dateStr);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDateStr)) {
      Alert.alert('Format de date invalide', 'Veuillez saisir la date au format JJ/MM/AAAA (ex: 29/08/2026)');
      return;
    }

    let dateTimeISO: string;
    try {
      const [h, m] = (timeStr || '12:00').split(':').map((v) => parseInt(v, 10));
      const validH = isNaN(h) ? 12 : Math.min(23, Math.max(0, h));
      const validM = isNaN(m) ? 0 : Math.min(59, Math.max(0, m));
      const dt = new Date(`${isoDateStr}T${validH.toString().padStart(2, '0')}:${validM.toString().padStart(2, '0')}:00`);
      dateTimeISO = isNaN(dt.getTime()) ? new Date().toISOString() : dt.toISOString();
    } catch {
      dateTimeISO = new Date().toISOString();
    }

    const newSession: CardioSession = {
      id: `cardio_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      date: dateTimeISO,
      activity: finalActivity,
      durationMinutes: durationMinutes > 0 ? durationMinutes : 45,
      perceivedExertion: Math.min(10, Math.max(1, rpe)),
      notes: notes.trim() ? notes.trim() : undefined,
    };

    if (onSave) {
      onSave(newSession);
    } else {
      await logCardioSession(newSession);
    }

    onClose();
  };

  const currentRpeInfo = RPE_LEVELS[rpe] || RPE_LEVELS[7];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
          accessibilityLabel="Fermer la modal"
        />
        <Animated.View
          style={[
            styles.content,
            {
              backgroundColor: theme.background,
              borderColor: theme.border,
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Header Draggable */}
          <View style={[styles.headerContainer, { borderBottomColor: theme.border, backgroundColor: theme.surface }]}>
            <View style={StyleSheet.absoluteFillObject} {...panResponder.panHandlers} />

            <View pointerEvents="box-none" style={{ width: '100%' }}>
              <View pointerEvents="none" style={styles.dragHandleContainer}>
                <View style={[styles.dragHandle, { backgroundColor: theme.background }]} />
              </View>

              <View pointerEvents="box-none" style={styles.header}>
                <View pointerEvents="none" style={styles.headerLeft}>
                  <View style={[styles.headerIconBadge, { backgroundColor: `${theme.accent}15`, borderColor: `${theme.accent}30` }]}>
                    <HeartPulse size={18} color={theme.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.title, { color: theme.text }]}>Séance Cardio</Text>
                    <Text style={[styles.subtitle, { color: theme.textMuted }]}>Consigner une activité hors musculation</Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  style={[styles.closeBtn, { backgroundColor: theme.background, borderColor: theme.border }]}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel="Fermer"
                >
                  <X size={18} color={theme.text} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* 1. Sélection de l'Activité */}
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconBadge, { backgroundColor: `${theme.accent}15` }]}>
                  <Flame size={14} color={theme.accent} />
                </View>
                <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>ACTIVITÉ</Text>
              </View>

              <View style={styles.chipsRow}>
                {PRESET_ACTIVITIES.map((act) => {
                  const isSelected = !isCustomActivity && activity === act.label;
                  return (
                    <TouchableOpacity
                      key={act.label}
                      activeOpacity={0.7}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isSelected ? theme.accent : theme.background,
                          borderColor: isSelected ? theme.accent : theme.border,
                        },
                      ]}
                      onPress={() => handleSelectPresetActivity(act.label)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: isSelected ? '#FFFFFF' : theme.text, fontWeight: isSelected ? '800' : '600' },
                        ]}
                      >
                        {act.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isCustomActivity ? theme.accent : theme.background,
                      borderColor: isCustomActivity ? theme.accent : theme.border,
                    },
                  ]}
                  onPress={handleSelectCustomActivity}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: isCustomActivity ? '#FFFFFF' : theme.text, fontWeight: isCustomActivity ? '800' : '600' },
                    ]}
                  >
                    Autre...
                  </Text>
                </TouchableOpacity>
              </View>

              {isCustomActivity && (
                <View style={{ marginTop: 12 }}>
                  <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Nom de l'activité personnalisée</Text>
                  <View style={[styles.inputBox, { backgroundColor: theme.background, borderColor: theme.border }]}>
                    <TextInput
                      style={[styles.inputField, { color: theme.text }]}
                      value={customActivityText}
                      onChangeText={setCustomActivityText}
                      placeholder="Ex: Rameur, HIIT, Sac de frappe, Corde..."
                      placeholderTextColor={theme.textMuted}
                      autoFocus
                    />
                  </View>
                </View>
              )}
            </View>

            {/* 2. Durée de la séance */}
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconBadge, { backgroundColor: `${theme.accent}15` }]}>
                  <Timer size={14} color={theme.accent} />
                </View>
                <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>DURÉE</Text>
              </View>

              {/* Stepper + Input */}
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[styles.stepperBtn, { backgroundColor: theme.background, borderColor: theme.border }]}
                  onPress={() => handleDurationChange(-5)}
                >
                  <Minus size={18} color={theme.text} />
                </TouchableOpacity>

                <View style={[styles.stepperDisplay, { backgroundColor: theme.background, borderColor: theme.border }]}>
                  <TextInput
                    style={[styles.stepperInput, { color: theme.text }]}
                    keyboardType="numeric"
                    value={durationMinutes.toString()}
                    onChangeText={(val) => {
                      const parsed = parseInt(val, 10);
                      setDurationMinutes(isNaN(parsed) ? 0 : parsed);
                    }}
                  />
                  <Text style={[styles.stepperUnit, { color: theme.textMuted }]}>min</Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[styles.stepperBtn, { backgroundColor: theme.background, borderColor: theme.border }]}
                  onPress={() => handleDurationChange(5)}
                >
                  <Plus size={18} color={theme.text} />
                </TouchableOpacity>
              </View>

              {/* Quick Preset Chips */}
              <View style={styles.quickDurationRow}>
                {PRESET_DURATIONS.map((dur) => {
                  const isSel = durationMinutes === dur;
                  return (
                    <TouchableOpacity
                      key={dur}
                      activeOpacity={0.7}
                      style={[
                        styles.quickDurationChip,
                        {
                          backgroundColor: isSel ? `${theme.accent}20` : theme.background,
                          borderColor: isSel ? theme.accent : theme.border,
                        },
                      ]}
                      onPress={() => setDurationMinutes(dur)}
                    >
                      <Text
                        style={[
                          styles.quickDurationText,
                          { color: isSel ? theme.accent : theme.text, fontWeight: isSel ? '800' : '600' },
                        ]}
                      >
                        {dur} min
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 3. Échelle RPE de séance (1 à 10) */}
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconBadge, { backgroundColor: `${currentRpeInfo.color}20` }]}>
                  <Zap size={14} color={currentRpeInfo.color} />
                </View>
                <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>
                  EFFORT PERÇU (RPE : {rpe} / 10)
                </Text>
              </View>

              {/* 10 Pills row */}
              <View style={styles.rpeGrid}>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((val) => {
                  const isSelected = rpe === val;
                  const itemColor = RPE_LEVELS[val].color;
                  return (
                    <TouchableOpacity
                      key={val}
                      activeOpacity={0.7}
                      style={[
                        styles.rpePill,
                        {
                          backgroundColor: isSelected ? itemColor : theme.background,
                          borderColor: isSelected ? itemColor : theme.border,
                        },
                      ]}
                      onPress={() => setRpe(val)}
                    >
                      <Text
                        style={[
                          styles.rpePillText,
                          {
                            color: isSelected ? '#FFFFFF' : theme.text,
                            fontWeight: isSelected ? '900' : '600',
                          },
                        ]}
                      >
                        {val}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* RPE Explanatory Badge */}
              <View style={[styles.rpeExplainerBox, { backgroundColor: currentRpeInfo.bg, borderColor: `${currentRpeInfo.color}40` }]}>
                <View style={styles.rpeExplainerHeader}>
                  <View style={[styles.rpeBadgeDot, { backgroundColor: currentRpeInfo.color }]} />
                  <Text style={[styles.rpeExplainerTitle, { color: currentRpeInfo.color }]}>
                    RPE {rpe} — {currentRpeInfo.title}
                  </Text>
                </View>
                <Text style={[styles.rpeExplainerDesc, { color: theme.text }]}>
                  {currentRpeInfo.desc}
                </Text>
              </View>
            </View>

            {/* 4. Date & Heure */}
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconBadge, { backgroundColor: `${theme.accent}15` }]}>
                  <Clock size={14} color={theme.accent} />
                </View>
                <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>DATE & HEURE</Text>
              </View>

              <View style={styles.row}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Date (JJ/MM/AAAA)</Text>
                  <View style={[styles.inputBox, { backgroundColor: theme.background, borderColor: theme.border }]}>
                    <CalendarIcon size={15} color={theme.accent} style={{ marginRight: 8 }} />
                    <TextInput
                      style={[styles.inputField, { color: theme.text }]}
                      value={dateStr}
                      onChangeText={setDateStr}
                      placeholder="29/08/2026"
                      placeholderTextColor={theme.textMuted}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Heure (HH:MM)</Text>
                  <View style={[styles.inputBox, { backgroundColor: theme.background, borderColor: theme.border }]}>
                    <Clock size={15} color={theme.accent} style={{ marginRight: 8 }} />
                    <TextInput
                      style={[styles.inputField, { color: theme.text }]}
                      value={timeStr}
                      onChangeText={setTimeStr}
                      placeholder="18:00"
                      placeholderTextColor={theme.textMuted}
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* 5. Notes Optionnelles */}
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconBadge, { backgroundColor: `${theme.primary}15` }]}>
                  <FileText size={14} color={theme.primary} />
                </View>
                <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>NOTES (OPTIONNEL)</Text>
              </View>

              <View style={[styles.notesBox, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <TextInput
                  style={[styles.notesInput, { color: theme.text }]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Ex: 5 rounds de sac, travail des esquives, fractionné 30/30..."
                  placeholderTextColor={theme.textMuted}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>

            {/* Bouton de Validation */}
            <Button
              title="Enregistrer la séance cardio"
              variant="primary"
              icon={<Check size={18} color="#FFFFFF" />}
              onPress={handleSave}
              style={{ marginTop: 6, marginBottom: 20 }}
            />
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  content: {
    height: '78%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  headerContainer: {
    borderBottomWidth: 1,
    paddingBottom: 12,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    opacity: 0.6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIconBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipEmoji: {
    fontSize: 15,
    marginRight: 6,
  },
  chipText: {
    fontSize: 13,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
  },
  inputField: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 12,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    height: 44,
    minWidth: 110,
  },
  stepperInput: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    minWidth: 45,
  },
  stepperUnit: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 4,
  },
  quickDurationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  quickDurationChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickDurationText: {
    fontSize: 12,
  },
  rpeGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  rpePill: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  rpePillText: {
    fontSize: 13,
  },
  rpeExplainerBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
  },
  rpeExplainerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rpeBadgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  rpeExplainerTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  rpeExplainerDesc: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGroup: {
    flex: 1,
  },
  notesBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    minHeight: 70,
  },
  notesInput: {
    fontSize: 13,
    fontWeight: '500',
    textAlignVertical: 'top',
  },
});
