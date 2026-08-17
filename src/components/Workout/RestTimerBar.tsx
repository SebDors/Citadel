import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useWorkout } from '../../context/WorkoutContext';
import { useTheme } from '../../context/ThemeContext';
import { Clock, Plus, Minus, X } from 'lucide-react-native';

export const RestTimerBar: React.FC = () => {
  const { restTimer, dismissRestTimer, adjustRestTimer } = useWorkout();
  const { theme } = useTheme();

  if (!restTimer.active || restTimer.secondsRemaining <= 0) return null;

  const mins = Math.floor(restTimer.secondsRemaining / 60);
  const secs = restTimer.secondsRemaining % 60;
  const formatted = `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;

  const nextInfo = restTimer.nextSetInfo;
  let nextText = '';
  if (nextInfo) {
    const hasDetails = nextInfo.weightKg !== undefined || nextInfo.reps !== undefined;
    const details = hasDetails
      ? ` (${nextInfo.weightKg ? `${nextInfo.weightKg} kg` : ''}${nextInfo.weightKg && nextInfo.reps ? ' × ' : ''}${nextInfo.reps ? `${nextInfo.reps} reps` : ''})`
      : '';
    if (nextInfo.isNextExercise) {
      nextText = `Suivant : ${nextInfo.exerciseName} · S${nextInfo.setNumber}${details}`;
    } else {
      nextText = `Prochaine : Série ${nextInfo.setNumber}${details}`;
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.accent }]}>
      <View style={styles.left}>
        <Clock size={20} color={theme.accent} style={{ marginRight: 8 }} />
        <View style={{ flex: 1, marginRight: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[styles.timerText, { color: theme.accent }]}>{formatted}</Text>
            <Text style={[styles.exerciseText, { color: theme.textMuted, marginLeft: 8 }]} numberOfLines={1}>
              Repos · {restTimer.exerciseName}
            </Text>
          </View>
          {nextInfo ? (
            <Text style={[styles.nextSetText, { color: theme.text }]} numberOfLines={1}>
              {nextText}
            </Text>
          ) : (
            <Text style={[styles.nextSetText, { color: theme.accent }]} numberOfLines={1}>
              Dernière série terminée ! 🎉
            </Text>
          )}
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.btnAdjust, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
          onPress={() => adjustRestTimer(-30)}
        >
          <Minus size={14} color={theme.text} />
          <Text style={[styles.adjustText, { color: theme.text }]}>30s</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btnAdjust, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
          onPress={() => adjustRestTimer(30)}
        >
          <Plus size={14} color={theme.text} />
          <Text style={[styles.adjustText, { color: theme.text }]}>30s</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnDismiss} onPress={dismissRestTimer}>
          <X size={18} color={theme.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    borderRadius: 16,
    borderWidth: 2,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  timerText: {
    fontSize: 18,
    fontWeight: '900',
  },
  exerciseText: {
    fontSize: 11,
    fontWeight: '600',
    maxWidth: 140,
  },
  nextSetText: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btnAdjust: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginLeft: 6,
  },
  adjustText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 2,
  },
  btnDismiss: {
    padding: 6,
    marginLeft: 6,
  },
});
