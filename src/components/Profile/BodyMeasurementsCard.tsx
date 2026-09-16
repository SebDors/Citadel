import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { BodyMeasurement } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { parseFloatFrench, formatWeight } from '../../utils/numberUtils';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import {
  Activity,
  Plus,
  Edit2,
  Trash2,
  Calendar as CalendarIcon,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';

interface BodyMeasurementsCardProps {
  measurements: BodyMeasurement[];
  onAddMeasurement: (m: BodyMeasurement) => void;
  onDeleteMeasurement: (id: string) => void;
}

const MONTHS_NAMES = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export const BodyMeasurementsCard: React.FC<BodyMeasurementsCardProps> = ({
  measurements,
  onAddMeasurement,
  onDeleteMeasurement,
}) => {
  const { theme } = useTheme();

  // Modal & Collapsible Calendar State
  const [modalVisible, setModalVisible] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Today Date
  const now = new Date();
  const getISOString = (d: Date) =>
    `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;

  const todayStr = getISOString(now);

  // Selected Date state (YYYY-MM-DD)
  const [selectedDateStr, setSelectedDateStr] = useState(todayStr);

  // Calendar View month & year
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [calYear, setCalYear] = useState(now.getFullYear());

  // Measurement Inputs state
  const [weight, setWeight] = useState('');
  const [chest, setChest] = useState('');
  const [thigh, setThigh] = useState('');
  const [biceps, setBiceps] = useState('');

  // Editing measurement state
  const [editingMeasurementId, setEditingMeasurementId] = useState<string | null>(null);

  // Set inputs when selected date changes
  const updateInputsForDate = (dateStr: string) => {
    const existing = (measurements || []).find((m) => m.date === dateStr);
    if (existing) {
      setWeight(existing.weightKg ? String(existing.weightKg) : '');
      setChest(existing.chestCm !== undefined ? String(existing.chestCm) : '');
      setThigh(existing.thighCm !== undefined ? String(existing.thighCm) : '');
      setBiceps(existing.bicepsCm !== undefined ? String(existing.bicepsCm) : '');
    } else {
      setWeight('');
      setChest('');
      setThigh('');
      setBiceps('');
    }
  };

  const handleOpenModal = () => {
    setEditingMeasurementId(null);
    const currentDate = new Date();
    const currentISO = getISOString(currentDate);
    setSelectedDateStr(currentISO);
    setCalMonth(currentDate.getMonth());
    setCalYear(currentDate.getFullYear());
    setIsCalendarOpen(false); // Calendrier replié par défaut
    updateInputsForDate(currentISO);
    setModalVisible(true);
  };

  const handleEditMeasurement = (m: BodyMeasurement) => {
    setEditingMeasurementId(m.id);
    setSelectedDateStr(m.date);
    const parts = m.date.split('-').map(Number);
    if (parts.length === 3) {
      setCalYear(parts[0]);
      setCalMonth(parts[1] - 1);
    }
    setIsCalendarOpen(false);
    setWeight(m.weightKg ? String(m.weightKg) : '');
    setChest(m.chestCm !== undefined ? String(m.chestCm) : '');
    setThigh(m.thighCm !== undefined ? String(m.thighCm) : '');
    setBiceps(m.bicepsCm !== undefined ? String(m.bicepsCm) : '');
    setModalVisible(true);
  };

  const handleSelectDate = (dateStr: string) => {
    setSelectedDateStr(dateStr);
    updateInputsForDate(dateStr);
    setIsCalendarOpen(false); // Replie le calendrier après sélection d'un jour
  };

  const handlePrevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((y) => y - 1);
    } else {
      setCalMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((y) => y + 1);
    } else {
      setCalMonth((m) => m + 1);
    }
  };

  const handleSave = () => {
    const w = parseFloatFrench(weight);
    if (!w || w <= 0) return;

    const newM: BodyMeasurement = {
      id: editingMeasurementId || `m_${Date.now()}`,
      date: selectedDateStr,
      weightKg: w,
      chestCm: parseFloatFrench(chest),
      thighCm: parseFloatFrench(thigh),
      bicepsCm: parseFloatFrench(biceps),
    };

    onAddMeasurement(newM);
    setEditingMeasurementId(null);
    setModalVisible(false);
  };

  // Calendar Calculation for Month Grid
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayIndex = (new Date(calYear, calMonth, 1).getDay() + 6) % 7; // Monday = 0
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Existing dates set for indicator dots
  const existingDateMap = new Set((measurements || []).map((m) => m.date));

  // Sort measurements descending for profile list display
  const sortedMeasurements = [...(measurements || [])].sort((a, b) => b.date.localeCompare(a.date));

  // Formatted date label for modal title
  const formatDisplayDateLabel = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Formatage pour l'affichage de la date dans la liste (ex: 2026-08-30 -> 30/08/2026)
  const formatDateToListDisplay = (dateStr: string): string => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day}/${month}/${year}`;
    }
    return dateStr;
  };

  // Formatage pour l'affichage de la date courte (ex: 2026-08-30 -> 30/08)
  const formatShortDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const [, month, day] = parts;
      return `${day}/${month}`;
    }
    return dateStr;
  };

  const handleConfirmDelete = (m: BodyMeasurement) => {
    const displayDate = formatDateToListDisplay(m.date);
    const displayWeight = m.weightKg ? ` (${formatWeight(m.weightKg)} kg)` : '';
    Alert.alert(
      'Supprimer la mesure',
      `Voulez-vous vraiment supprimer la mesure du ${displayDate}${displayWeight} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => onDeleteMeasurement(m.id),
        },
      ]
    );
  };

  return (
    <Card>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Activity size={18} color={theme.accent} />
          <Text style={[styles.title, { color: theme.text }]}>Poids & Mensurations</Text>
        </View>
        <TouchableOpacity activeOpacity={0.7} onPress={handleOpenModal}>
          <Plus size={20} color={theme.accent} />
        </TouchableOpacity>
      </View>

      {/* Liste des dernières mesures */}
      {sortedMeasurements.length === 0 ? (
        <Text style={[styles.emptyText, { color: theme.textMuted }]}>
          Aucune mesure enregistrée. Cliquez sur + pour en ajouter.
        </Text>
      ) : (
        sortedMeasurements.map((m) => {
          const secondaryParts: string[] = [];
          if (m.chestCm !== undefined) secondaryParts.push(`P ${formatWeight(m.chestCm)}`);
          if (m.thighCm !== undefined) secondaryParts.push(`C ${formatWeight(m.thighCm)}`);
          if (m.bicepsCm !== undefined) secondaryParts.push(`B ${formatWeight(m.bicepsCm)}`);
          const secondarySummary = secondaryParts.join(' · ');

          return (
            <View key={m.id} style={[styles.mCompactRow, { borderBottomColor: theme.border }]}>
              {/* Contenu gauche : Date courte, Poids principal et Mensurations condensées */}
              <View style={styles.mLeftContent}>
                <Text style={[styles.mDate, { color: theme.textMuted }]}>
                  {formatShortDate(m.date)}
                </Text>

                {m.weightKg !== undefined && (
                  <Text style={[styles.mWeight, { color: theme.text }]}>
                    {formatWeight(m.weightKg)}
                    <Text style={[styles.mUnit, { color: theme.textMuted }]}> kg</Text>
                  </Text>
                )}

                {secondarySummary.length > 0 && (
                  <Text
                    style={[styles.mSecondarySummary, { color: theme.textMuted }]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {secondarySummary}
                  </Text>
                )}
              </View>

              {/* Boutons d'action compacts à droite : Edit et Delete */}
              <View style={styles.mActions}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleEditMeasurement(m)}
                  style={styles.miniActionBtn}
                  accessibilityLabel="Modifier cette mesure"
                  hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                >
                  <Edit2 size={14} color={theme.accent} />
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleConfirmDelete(m)}
                  style={styles.miniActionBtn}
                  accessibilityLabel="Supprimer cette mesure"
                  hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                >
                  <Trash2 size={14} color={theme.danger} />
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}

      {/* ---------------- MODALE POP-UP DE SAISIE AVEC CALENDRIER REPLIABLE ---------------- */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ width: '100%', alignItems: 'center' }}
          >
            <TouchableOpacity
              activeOpacity={1}
              style={[styles.modalCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
            >
              <ScrollView style={{ maxHeight: 540 }} keyboardShouldPersistTaps="handled">
                {/* Header Modale */}
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: theme.text }]}>
                    {editingMeasurementId ? 'Modifier la mesure' : 'Saisir vos Mensurations'}
                  </Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                    <X size={20} color={theme.textMuted} />
                  </TouchableOpacity>
                </View>

                {/* Barre de Date + Bouton "Aujourd'hui" sur la même ligne */}
                <View style={styles.dateSelectorRow}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[
                      styles.dateBar,
                      { backgroundColor: theme.surface, borderColor: theme.border },
                    ]}
                    onPress={() => setIsCalendarOpen((prev) => !prev)}
                  >
                    <View style={styles.dateBarLeft}>
                      <CalendarIcon size={16} color={theme.accent} style={{ marginRight: 6 }} />
                      <Text
                        style={[styles.dateBarText, { color: theme.text }]}
                        numberOfLines={1}
                      >
                        {formatDisplayDateLabel(selectedDateStr)}
                      </Text>
                    </View>
                    {isCalendarOpen ? (
                      <ChevronUp size={18} color={theme.textMuted} />
                    ) : (
                      <ChevronDown size={18} color={theme.textMuted} />
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[
                      styles.todayPill,
                      {
                        backgroundColor: selectedDateStr === todayStr ? theme.accent : theme.surface,
                        borderColor: theme.border,
                      },
                    ]}
                    onPress={() => handleSelectDate(todayStr)}
                  >
                    <Text
                      style={[
                        styles.todayPillText,
                        { color: selectedDateStr === todayStr ? '#FFFFFF' : theme.text },
                      ]}
                    >
                      Aujourd'hui
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Mini Calendrier Interactif Dépliable (Masqué par défaut) */}
                {isCalendarOpen && (
                  <View style={[styles.calendarBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    {/* Navigation Mois / Année */}
                    <View style={styles.calendarMonthHeader}>
                      <TouchableOpacity onPress={handlePrevMonth} style={styles.calNavBtn}>
                        <ChevronLeft size={18} color={theme.text} />
                      </TouchableOpacity>
                      <Text style={[styles.calMonthTitle, { color: theme.text }]}>
                        {MONTHS_NAMES[calMonth]} {calYear}
                      </Text>
                      <TouchableOpacity onPress={handleNextMonth} style={styles.calNavBtn}>
                        <ChevronRight size={18} color={theme.text} />
                      </TouchableOpacity>
                    </View>

                    {/* Ligne des jours de la semaine */}
                    <View style={styles.weekHeader}>
                      {WEEKDAYS.map((wd) => (
                        <Text key={wd} style={[styles.weekDayText, { color: theme.textMuted }]}>
                          {wd}
                        </Text>
                      ))}
                    </View>

                    {/* Grille des jours */}
                    <View style={styles.daysGrid}>
                      {/* Emplacements vides du début de mois */}
                      {Array.from({ length: firstDayIndex }).map((_, i) => (
                        <View key={`empty_${i}`} style={styles.dayCell} />
                      ))}

                      {/* Jours du mois */}
                      {calendarDays.map((d) => {
                        const dayStr = `${calYear}-${(calMonth + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
                        const isSelected = dayStr === selectedDateStr;
                        const isToday = dayStr === todayStr;
                        const hasRecord = existingDateMap.has(dayStr);

                        return (
                          <TouchableOpacity
                            key={dayStr}
                            activeOpacity={0.7}
                            style={[
                              styles.dayCell,
                              isSelected && { backgroundColor: theme.accent, borderRadius: 8 },
                              !isSelected && isToday && { borderWidth: 1, borderColor: theme.accent, borderRadius: 8 },
                            ]}
                            onPress={() => handleSelectDate(dayStr)}
                          >
                            <Text
                              style={[
                                styles.dayNumber,
                                { color: isSelected ? '#FFFFFF' : theme.text },
                                isToday && !isSelected && { color: theme.accent, fontWeight: '800' },
                              ]}
                            >
                              {d}
                            </Text>
                            {/* Pastille indicatrice si une mesure existe déjà à cette date */}
                            {hasRecord && (
                              <View
                                style={[
                                  styles.recordDot,
                                  { backgroundColor: isSelected ? '#FFFFFF' : theme.accent },
                                ]}
                              />
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Champs de Saisie de Poids & Mensurations */}
                <View style={styles.inputsSection}>
                  <View style={styles.inputRow}>
                    <TextInput
                      style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                      placeholder="Poids (kg) *"
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
                </View>

                {/* Boutons d'Action Modale */}
                <View style={styles.modalBtnRow}>
                  <Button
                    title="Annuler"
                    variant="outline"
                    onPress={() => setModalVisible(false)}
                    style={{ flex: 1, marginRight: 6 }}
                  />
                  <Button
                    title="Enregistrer"
                    variant="primary"
                    onPress={handleSave}
                    style={{ flex: 1, marginLeft: 6 }}
                  />
                </View>
              </ScrollView>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>
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
  emptyText: {
    fontSize: 12,
    fontStyle: 'italic',
    paddingVertical: 10,
  },
  mCompactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 7,
    borderBottomWidth: 1,
  },
  mLeftContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 8,
  },
  mDate: {
    fontSize: 12,
    fontWeight: '600',
  },
  mWeight: {
    fontSize: 13,
    fontWeight: '800',
  },
  mUnit: {
    fontSize: 11,
    fontWeight: '500',
  },
  mSecondarySummary: {
    fontSize: 11,
    fontWeight: '500',
    flexShrink: 1,
  },
  mActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
  },
  miniActionBtn: {
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  /* Modale Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '92%',
    maxWidth: 380,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
  },
  closeBtn: {
    padding: 4,
  },
  dateSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  dateBar: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 8,
  },
  dateBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dateBarText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  todayPill: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  todayPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  /* Calendar Styles */
  calendarBox: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  calendarMonthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  calNavBtn: {
    padding: 4,
  },
  calMonthTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 4,
  },
  weekDayText: {
    fontSize: 11,
    fontWeight: '700',
    width: 32,
    textAlign: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 1,
  },
  dayNumber: {
    fontSize: 12,
    fontWeight: '600',
  },
  recordDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 1,
  },
  /* Form Inputs Styles */
  inputsSection: {
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  input: {
    flex: 0.48,
    height: 38,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 13,
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
});
