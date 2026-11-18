import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { CalendarDays, Play, X, Check, Coffee } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { WorkoutTemplate } from '../../types';
import { Card } from '../UI/Card';

interface WeeklySplitSchedulerCardProps {
  templates: WorkoutTemplate[];
  weeklySchedule: Record<number, string | null>;
  onUpdateSchedule: (nextSchedule: Record<number, string | null>) => void;
  onStartTemplate: (template: WorkoutTemplate) => void;
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
  weeklySchedule,
  onUpdateSchedule,
  onStartTemplate,
}) => {
  const { theme } = useTheme();
  const [selectedDayIdx, setSelectedDayIdx] = useState<number | null>(null);

  const todayDayIdx = new Date().getDay();
  const todayTemplateId = weeklySchedule?.[todayDayIdx];
  const todayTemplate = templates.find((t) => t.id === todayTemplateId);
  const selectedDayInfo = DAYS_ORDER.find((d) => d.dayIndex === selectedDayIdx);

  const handleAssignTemplate = (templateId: string | null) => {
    if (selectedDayIdx === null) return;
    onUpdateSchedule({
      ...weeklySchedule,
      [selectedDayIdx]: templateId,
    });
    setSelectedDayIdx(null);
  };

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <CalendarDays size={18} color={theme.accent} />
          <Text style={[styles.title, { color: theme.text }]}>Planning Hebdomadaire</Text>
        </View>
        {todayTemplate && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onStartTemplate(todayTemplate)}
            style={[styles.quickStartPill, { backgroundColor: theme.accent }]}
          >
            <Play size={11} color="#FFFFFF" fill="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.quickStartText} numberOfLines={1}>
              {todayTemplate.title}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.daysRow}>
        {DAYS_ORDER.map((day) => {
          const isToday = day.dayIndex === todayDayIdx;
          const assignedId = weeklySchedule?.[day.dayIndex];
          const assignedTemplate = templates.find((t) => t.id === assignedId);

          return (
            <TouchableOpacity
              key={day.dayIndex}
              activeOpacity={0.7}
              onPress={() => setSelectedDayIdx(day.dayIndex)}
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
                    backgroundColor: assignedTemplate
                      ? theme.accent
                      : theme.border,
                  },
                ]}
              />
              <Text
                style={[
                  styles.dayLabel,
                  { color: assignedTemplate ? theme.text : theme.textMuted },
                ]}
                numberOfLines={1}
              >
                {assignedTemplate ? assignedTemplate.title.slice(0, 5) : 'Repos'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Modale d'assignation de séance à un jour */}
      <Modal
        visible={selectedDayIdx !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedDayIdx(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedDayIdx(null)}
        >
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
              <TouchableOpacity onPress={() => setSelectedDayIdx(null)}>
                <X size={20} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 340 }}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleAssignTemplate(null)}
                style={[
                  styles.optionRow,
                  { borderBottomColor: theme.border },
                  selectedDayIdx !== null && !weeklySchedule?.[selectedDayIdx] && {
                    backgroundColor: `${theme.accent}15`,
                  },
                ]}
              >
                <Coffee size={18} color={theme.textMuted} style={{ marginRight: 10 }} />
                <Text style={[styles.optionText, { color: theme.text, flex: 1 }]}>
                  Jour de repos
                </Text>
                {selectedDayIdx !== null && !weeklySchedule?.[selectedDayIdx] && (
                  <Check size={18} color={theme.accent} />
                )}
              </TouchableOpacity>

              {templates.map((tpl) => {
                const isSelected =
                  selectedDayIdx !== null && weeklySchedule?.[selectedDayIdx] === tpl.id;
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
            </ScrollView>
          </View>
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
    padding: 20,
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
});
