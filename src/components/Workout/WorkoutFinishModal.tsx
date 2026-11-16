import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Switch,
  TextInput,
  Platform,
  StyleSheet,
} from 'react-native';
import { CheckCircle, Clock, Zap, Check, AlertTriangle } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../UI/Button';
import { EXCEPTION_REASONS_CONFIG, SessionExceptionReason } from '../../types';

interface WorkoutSummaryStats {
  durationFormatted: string;
  totalVolumeKg: number;
  completedSetsCount: number;
  totalSetsCount: number;
}

interface WorkoutFinishModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirmFinish: () => void;
  workoutSummaryStats: WorkoutSummaryStats;
  isExceptionActive: boolean;
  onToggleException: (val: boolean) => void;
  selectedExceptionReason: SessionExceptionReason;
  onSelectExceptionReason: (reason: SessionExceptionReason) => void;
  exceptionNoteText: string;
  onChangeExceptionNoteText: (text: string) => void;
}

export const WorkoutFinishModal: React.FC<WorkoutFinishModalProps> = ({
  visible,
  onClose,
  onConfirmFinish,
  workoutSummaryStats,
  isExceptionActive,
  onToggleException,
  selectedExceptionReason,
  onSelectExceptionReason,
  exceptionNoteText,
  onChangeExceptionNoteText,
}) => {
  const { theme } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          style={[
            styles.card,
            { backgroundColor: theme.cardBg, borderColor: theme.border },
          ]}
          onStartShouldSetResponder={() => true}
        >
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: `${theme.accent}18` },
            ]}
          >
            <CheckCircle size={36} color={theme.accent} />
          </View>

          <Text style={[styles.title, { color: theme.text }]}>
            Terminer la séance ?
          </Text>

          <Text style={[styles.desc, { color: theme.textMuted }]}>
            Récapitulatif de votre progression avant enregistrement :
          </Text>

          <View
            style={[
              styles.statsGrid,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            {/* Durée de la séance */}
            <View style={styles.statRow}>
              <View style={styles.statLabelContainer}>
                <Clock size={16} color={theme.accent} />
                <Text style={[styles.statLabelText, { color: theme.textMuted }]}>
                  Durée de la séance
                </Text>
              </View>
              <Text style={[styles.statValueText, { color: theme.text }]}>
                {workoutSummaryStats.durationFormatted}
              </Text>
            </View>

            <View style={[styles.statDivider, { backgroundColor: theme.border }]} />

            {/* Volume total */}
            <View style={styles.statRow}>
              <View style={styles.statLabelContainer}>
                <Zap size={16} color={theme.accent} />
                <Text style={[styles.statLabelText, { color: theme.textMuted }]}>
                  Volume total
                </Text>
              </View>
              <Text style={[styles.statValueText, { color: theme.text }]}>
                {workoutSummaryStats.totalVolumeKg.toLocaleString('fr-FR')} kg
              </Text>
            </View>

            <View style={[styles.statDivider, { backgroundColor: theme.border }]} />

            {/* Séries validées */}
            <View style={styles.statRow}>
              <View style={styles.statLabelContainer}>
                <Check size={16} color={theme.accent} />
                <Text style={[styles.statLabelText, { color: theme.textMuted }]}>
                  Séries validées
                </Text>
              </View>
              <Text style={[styles.statValueText, { color: theme.text }]}>
                {workoutSummaryStats.completedSetsCount}/{workoutSummaryStats.totalSetsCount}
              </Text>
            </View>
          </View>

          {/* Toggle Séance Exceptionnelle */}
          <View
            style={[
              styles.exceptionToggleCard,
              {
                backgroundColor: isExceptionActive ? '#F59E0B12' : theme.surface,
                borderColor: isExceptionActive ? '#F59E0B50' : theme.border,
              },
            ]}
          >
            <View style={styles.exceptionToggleHeader}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <AlertTriangle
                    size={15}
                    color={isExceptionActive ? '#F59E0B' : theme.textMuted}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.exceptionToggleTitle,
                      { color: isExceptionActive ? '#F59E0B' : theme.text },
                    ]}
                  >
                    Séance exceptionnelle ?
                  </Text>
                </View>
                <Text style={[styles.exceptionToggleSubtitle, { color: theme.textMuted }]}>
                  Écarte cette séance de la référence pour le calcul du previous
                </Text>
              </View>
              <Switch
                value={isExceptionActive}
                onValueChange={onToggleException}
                trackColor={{ false: theme.border, true: '#F59E0B' }}
                thumbColor={
                  Platform.OS === 'android'
                    ? isExceptionActive
                      ? '#FFFFFF'
                      : '#888888'
                    : undefined
                }
              />
            </View>

            {isExceptionActive && (
              <View style={styles.exceptionDetailsBox}>
                <Text style={[styles.exceptionReasonLabel, { color: theme.textMuted }]}>
                  Raison de l'écart :
                </Text>
                <View style={styles.exceptionChipsGrid}>
                  {(Object.keys(EXCEPTION_REASONS_CONFIG) as SessionExceptionReason[]).map(
                    (rKey) => {
                      const cfg = EXCEPTION_REASONS_CONFIG[rKey];
                      const isSelected = selectedExceptionReason === rKey;
                      return (
                        <TouchableOpacity
                          key={rKey}
                          activeOpacity={0.7}
                          style={[
                            styles.exceptionReasonChip,
                            {
                              backgroundColor: isSelected ? '#F59E0B25' : theme.cardBg,
                              borderColor: isSelected ? '#F59E0B' : theme.border,
                            },
                          ]}
                          onPress={() => onSelectExceptionReason(rKey)}
                        >
                          <Text
                            style={[
                              styles.exceptionReasonChipText,
                              {
                                color: isSelected ? '#F59E0B' : theme.text,
                                fontWeight: isSelected ? '800' : '600',
                              },
                            ]}
                          >
                            {cfg.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    }
                  )}
                </View>

                <TextInput
                  style={[
                    styles.exceptionNoteInput,
                    {
                      backgroundColor: theme.cardBg,
                      borderColor: theme.border,
                      color: theme.text,
                    },
                  ]}
                  placeholder="Précisez la contrainte (optionnel : appareil en panne, séance partagée...)"
                  placeholderTextColor={theme.textMuted}
                  value={exceptionNoteText}
                  onChangeText={onChangeExceptionNoteText}
                  multiline
                  numberOfLines={2}
                />
              </View>
            )}
          </View>

          <View style={styles.actions}>
            <Button
              title="Confirmer & Terminer"
              variant="primary"
              onPress={onConfirmFinish}
            />
            <Button
              title="Reprendre l'entraînement"
              variant="outline"
              onPress={onClose}
            />
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 4,
  },
  desc: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
  },
  statsGrid: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statLabelText: {
    fontSize: 13,
    fontWeight: '600',
  },
  statValueText: {
    fontSize: 14,
    fontWeight: '800',
  },
  statDivider: {
    height: 1,
    width: '100%',
  },
  exceptionToggleCard: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  exceptionToggleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exceptionToggleTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  exceptionToggleSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  exceptionDetailsBox: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(245, 158, 11, 0.2)',
  },
  exceptionReasonLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  exceptionChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  exceptionReasonChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  exceptionReasonChipText: {
    fontSize: 11,
  },
  exceptionNoteInput: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    textAlignVertical: 'top',
  },
  actions: {
    width: '100%',
    gap: 8,
  },
});
