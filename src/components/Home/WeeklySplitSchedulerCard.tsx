import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Platform,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { CalendarDays, Play, X, Check, Coffee, Flame, Dumbbell } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { WorkoutTemplate, CardioTemplate } from '../../types';
import { Card } from '../UI/Card';

export const CARDIO_SCHEDULE_PREFIX = 'cardio:';
export const CARDIO_TEMPLATE_PREFIX = 'cardio_tpl:';
const CARDIO_SCHEDULE_PRESETS = ['Cardio', 'Course', 'Boxe', 'Vélo', 'Natation', 'Corde à sauter'];

export function isCardioScheduleValue(val?: string | null): boolean {
  return (
    typeof val === 'string' &&
    (val.startsWith(CARDIO_SCHEDULE_PREFIX) || val.startsWith(CARDIO_TEMPLATE_PREFIX))
  );
}

export function getCardioActivityFromSchedule(val?: string | null): string | null {
  if (typeof val !== 'string' || !val.startsWith(CARDIO_SCHEDULE_PREFIX)) return null;
  return val.slice(CARDIO_SCHEDULE_PREFIX.length).trim() || 'Cardio';
}

export function getCardioTemplateIdFromSchedule(val?: string | null): string | null {
  if (typeof val !== 'string' || !val.startsWith(CARDIO_TEMPLATE_PREFIX)) return null;
  return val.slice(CARDIO_TEMPLATE_PREFIX.length).trim() || null;
}

interface WeeklySplitSchedulerCardProps {
  templates: WorkoutTemplate[];
  cardioTemplates?: CardioTemplate[];
  weeklySchedule: Record<number, string | null>;
  onUpdateSchedule: (nextSchedule: Record<number, string | null>) => void;
  onStartTemplate: (template: WorkoutTemplate) => void;
  onStartCardio?: (activityName: string, template?: CardioTemplate) => void;
}

const DAYS_ORDER = [
  { dayIndex: 1, short: 'Lun', full: 'Lundi' },
  { dayIndex: 2, short: 'Mar', full: 'Mardi' },
  { dayIndex: 3, short: 'Mer', full: 'Mercredi' },
  { dayIndex: 4, short: 'Jeu', full: 'Jeudi' },
  { dayIndex: 5, short: 'Ven', full: 'Vendredi' },
  { dayIndex: 6, short: 'Sam', full: 'Samedi' },
  { dayIndex: 0, short: 'Dim', full: 'Dimanche' },
];

export const WeeklySplitSchedulerCard: React.FC<WeeklySplitSchedulerCardProps> = ({
  templates,
  cardioTemplates = [],
  weeklySchedule,
  onUpdateSchedule,
  onStartTemplate,
  onStartCardio,
}) => {
  const { theme } = useTheme();
  const [selectedDayIdx, setSelectedDayIdx] = useState<number | null>(null);
  const [customCardioName, setCustomCardioName] = useState('');

  const resolveScheduledItem = (val?: string | null) => {
    const cardioTplId = getCardioTemplateIdFromSchedule(val);
    if (cardioTplId) {
      const tpl = cardioTemplates.find((c) => c.id === cardioTplId);
      if (tpl) {
        return {
          kind: 'cardio' as const,
          label: tpl.title,
          activity: tpl.activity,
          cardioTemplate: tpl,
        };
      }
    }
    const rawCardio = getCardioActivityFromSchedule(val);
    if (rawCardio) {
      return {
        kind: 'cardio' as const,
        label: rawCardio,
        activity: rawCardio,
        cardioTemplate: undefined,
      };
    }
    const tpl = val ? templates.find((t) => t.id === val) : undefined;
    if (tpl) {
      return {
        kind: 'workout' as const,
        label: tpl.title,
        workoutTemplate: tpl,
      };
    }
    return null;
  };

  const todayDayIdx = new Date().getDay();
  const todayItem = resolveScheduledItem(weeklySchedule?.[todayDayIdx]);
  const selectedDayInfo = DAYS_ORDER.find((d) => d.dayIndex === selectedDayIdx);

  const selectedDayValue = selectedDayIdx !== null ? weeklySchedule?.[selectedDayIdx] : null;
  const selectedCustomCardio =
    selectedDayValue &&
    selectedDayValue.startsWith(CARDIO_SCHEDULE_PREFIX) &&
    !CARDIO_SCHEDULE_PRESETS.some(
      (p) => `${CARDIO_SCHEDULE_PREFIX}${p}`.toLowerCase() === selectedDayValue.toLowerCase()
    )
      ? getCardioActivityFromSchedule(selectedDayValue)
      : null;

  const handleCloseModal = () => {
    setSelectedDayIdx(null);
    setCustomCardioName('');
  };

  const handleAssignTemplate = (templateId: string | null) => {
    if (selectedDayIdx === null) return;
    onUpdateSchedule({
      ...weeklySchedule,
      [selectedDayIdx]: templateId,
    });
    handleCloseModal();
  };

  const handleAssignCustomCardio = () => {
    const trimmed = customCardioName.trim();
    if (!trimmed) return;
    handleAssignTemplate(`${CARDIO_SCHEDULE_PREFIX}${trimmed}`);
  };

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <CalendarDays size={18} color={theme.accent} />
          <Text style={[styles.title, { color: theme.text }]}>Planning Hebdomadaire</Text>
        </View>
        {todayItem?.kind === 'workout' ? (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onStartTemplate(todayItem.workoutTemplate)}
            style={[styles.quickStartPill, { backgroundColor: theme.accent }]}
          >
            <Play size={11} color="#FFFFFF" fill="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.quickStartText} numberOfLines={1}>
              {todayItem.label}
            </Text>
          </TouchableOpacity>
        ) : todayItem?.kind === 'cardio' ? (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onStartCardio?.(todayItem.activity, todayItem.cardioTemplate)}
            style={[styles.quickStartPill, { backgroundColor: '#F97316' }]}
          >
            <Flame size={11} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.quickStartText} numberOfLines={1}>
              {todayItem.label}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.daysRow}>
        {DAYS_ORDER.map((day) => {
          const isToday = day.dayIndex === todayDayIdx;
          const scheduled = resolveScheduledItem(weeklySchedule?.[day.dayIndex]);

          return (
            <TouchableOpacity
              key={day.dayIndex}
              activeOpacity={0.7}
              onPress={() => {
                setCustomCardioName('');
                setSelectedDayIdx(day.dayIndex);
              }}
              style={[
                styles.dayChip,
                {
                  backgroundColor: isToday ? `${theme.accent}20` : theme.surface,
                  borderColor: isToday ? theme.accent : theme.border,
                  borderWidth: isToday ? 1.5 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.dayShort,
                  { color: isToday ? theme.accent : theme.textMuted },
                ]}
              >
                {day.short}
              </Text>
              <View
                style={[
                  styles.dayDot,
                  {
                    backgroundColor:
                      scheduled?.kind === 'cardio'
                        ? '#F97316'
                        : scheduled?.kind === 'workout'
                        ? theme.accent
                        : theme.border,
                  },
                ]}
              />
              <Text
                style={[
                  styles.dayLabel,
                  { color: scheduled ? theme.text : theme.textMuted },
                ]}
                numberOfLines={1}
              >
                {scheduled ? scheduled.label.slice(0, 5) : 'Repos'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Modale d'assignation de séance à un jour */}
      <Modal
        navigationBarTranslucent
        statusBarTranslucent
        visible={selectedDayIdx !== null}
        transparent
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleCloseModal}
        >
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View
              style={[
                styles.modalSheet,
                { backgroundColor: theme.cardBg, borderColor: theme.border },
              ]}
              onStartShouldSetResponder={() => true}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  Programme du {selectedDayInfo?.full}
                </Text>
                <TouchableOpacity onPress={handleCloseModal}>
                  <X size={20} color={theme.text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 380 }} keyboardShouldPersistTaps="handled">
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleAssignTemplate(null)}
                  style={[
                    styles.optionRow,
                    { borderBottomColor: theme.border },
                    selectedDayIdx !== null && !selectedDayValue && {
                      backgroundColor: `${theme.accent}15`,
                    },
                  ]}
                >
                  <Coffee size={18} color={theme.textMuted} style={{ marginRight: 10 }} />
                  <Text style={[styles.optionText, { color: theme.text, flex: 1 }]}>
                    Jour de repos
                  </Text>
                  {selectedDayIdx !== null && !selectedDayValue && (
                    <Check size={18} color={theme.accent} />
                  )}
                </TouchableOpacity>

                {templates.length > 0 && (
                  <>
                    <Text style={[styles.modalSectionLabel, { color: theme.textMuted }]}>
                      MUSCULATION
                    </Text>
                    {templates.map((tpl) => {
                      const isSelected =
                        selectedDayIdx !== null && selectedDayValue === tpl.id;
                      return (
                        <TouchableOpacity
                          key={tpl.id}
                          activeOpacity={0.7}
                          onPress={() => handleAssignTemplate(tpl.id)}
                          style={[
                            styles.optionRow,
                            { borderBottomColor: theme.border },
                            isSelected && { backgroundColor: `${theme.accent}15` },
                          ]}
                        >
                          <Dumbbell
                            size={16}
                            color={isSelected ? theme.accent : theme.textMuted}
                            style={{ marginRight: 10 }}
                          />
                          <Text
                            style={[
                              styles.optionText,
                              { color: isSelected ? theme.accent : theme.text, flex: 1 },
                            ]}
                          >
                            {tpl.title}
                          </Text>
                          {isSelected && <Check size={18} color={theme.accent} />}
                        </TouchableOpacity>
                      );
                    })}
                  </>
                )}

                <Text style={[styles.modalSectionLabel, { color: '#F97316' }]}>
                  CARDIO
                </Text>

                {cardioTemplates.map((ctpl) => {
                  const valueKey = `${CARDIO_TEMPLATE_PREFIX}${ctpl.id}`;
                  const isSelected = selectedDayIdx !== null && selectedDayValue === valueKey;
                  return (
                    <TouchableOpacity
                      key={ctpl.id}
                      activeOpacity={0.7}
                      onPress={() => handleAssignTemplate(valueKey)}
                      style={[
                        styles.optionRow,
                        { borderBottomColor: theme.border },
                        isSelected && { backgroundColor: '#F9731618' },
                      ]}
                    >
                      <Flame size={16} color="#F97316" style={{ marginRight: 10 }} />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.optionText,
                            { color: isSelected ? '#F97316' : theme.text },
                          ]}
                        >
                          {ctpl.title}
                        </Text>
                        <Text style={{ fontSize: 11, color: theme.textMuted }}>
                          {ctpl.activity} · {ctpl.defaultDurationMinutes} min
                        </Text>
                      </View>
                      {isSelected && <Check size={18} color="#F97316" />}
                    </TouchableOpacity>
                  );
                })}

                {CARDIO_SCHEDULE_PRESETS.map((preset) => {
                  const valueKey = `${CARDIO_SCHEDULE_PREFIX}${preset}`;
                  const isSelected =
                    selectedDayIdx !== null &&
                    selectedDayValue?.toLowerCase() === valueKey.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={preset}
                      activeOpacity={0.7}
                      onPress={() => handleAssignTemplate(valueKey)}
                      style={[
                        styles.optionRow,
                        { borderBottomColor: theme.border },
                        isSelected && { backgroundColor: '#F9731618' },
                      ]}
                    >
                      <Flame size={16} color="#F97316" style={{ marginRight: 10 }} />
                      <Text
                        style={[
                          styles.optionText,
                          { color: isSelected ? '#F97316' : theme.text, flex: 1 },
                        ]}
                      >
                        {preset}
                      </Text>
                      {isSelected && <Check size={18} color="#F97316" />}
                    </TouchableOpacity>
                  );
                })}

                {selectedCustomCardio && (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleAssignTemplate(`${CARDIO_SCHEDULE_PREFIX}${selectedCustomCardio}`)}
                    style={[
                      styles.optionRow,
                      { borderBottomColor: theme.border, backgroundColor: '#F9731618' },
                    ]}
                  >
                    <Flame size={16} color="#F97316" style={{ marginRight: 10 }} />
                    <Text style={[styles.optionText, { color: '#F97316', flex: 1 }]}>
                      {selectedCustomCardio}
                    </Text>
                    <Check size={18} color="#F97316" />
                  </TouchableOpacity>
                )}

                <View style={styles.customCardioRow}>
                  <TextInput
                    style={[
                      styles.customCardioInput,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                        color: theme.text,
                      },
                    ]}
                    placeholder="Autre activité cardio (ex: HIIT, Rameur)..."
                    placeholderTextColor={theme.textMuted}
                    value={customCardioName}
                    onChangeText={setCustomCardioName}
                    onSubmitEditing={handleAssignCustomCardio}
                    returnKeyType="done"
                  />
                  <TouchableOpacity
                    activeOpacity={0.8}
                    disabled={!customCardioName.trim()}
                    onPress={handleAssignCustomCardio}
                    style={[
                      styles.customCardioBtn,
                      {
                        backgroundColor: customCardioName.trim() ? '#F97316' : theme.surface,
                        borderColor: customCardioName.trim() ? '#F97316' : theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: customCardioName.trim() ? '#FFFFFF' : theme.textMuted,
                        fontSize: 13,
                        fontWeight: '800',
                      }}
                    >
                      OK
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
  },
  quickStartPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    maxWidth: 160,
  },
  quickStartText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  dayChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 2,
    borderRadius: 10,
  },
  dayShort: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 4,
  },
  dayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginBottom: 4,
  },
  dayLabel: {
    fontSize: 9,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'android' ? 42 : 34,
    borderTopWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
  },
  optionText: {
    fontSize: 15,
    fontWeight: '700',
  },
  modalSectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
    marginTop: 14,
    marginBottom: 4,
    marginLeft: 8,
  },
  customCardioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  customCardioInput: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: '600',
  },
  customCardioBtn: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
