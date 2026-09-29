import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { CardioSession } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { Trash2, Clock, Flame, Zap, FileText } from 'lucide-react-native';

interface CardioSessionCardProps {
  session: CardioSession;
  onDelete: (id: string) => void;
}

const getActivityEmoji = (activity: string): string => {
  const lower = activity.toLowerCase();
  if (lower.includes('boxe')) return '🥊';
  if (lower.includes('cour')) return '🏃';
  if (lower.includes('corde')) return '⚡';
  if (lower.includes('nat')) return '🏊';
  if (lower.includes('vél') || lower.includes('velo')) return '🚴';
  return '🔥';
};

const getRpeDetails = (rpe: number): { label: string; color: string; bg: string } => {
  if (rpe <= 3) {
    return { label: 'Facile', color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' };
  }
  if (rpe <= 6) {
    return { label: 'Modéré', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' };
  }
  if (rpe <= 8) {
    return { label: 'Intense', color: '#F97316', bg: 'rgba(249, 115, 22, 0.15)' };
  }
  return { label: 'Maximal', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.18)' };
};

export const CardioSessionCard: React.FC<CardioSessionCardProps> = ({
  session,
  onDelete,
}) => {
  const { theme } = useTheme();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const dateObj = new Date(session.date);
  const formattedDate = dateObj.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const formattedTime = dateObj.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const emoji = getActivityEmoji(session.activity);
  const rpeInfo = getRpeDetails(session.perceivedExertion);

  return (
    <Card style={styles.cardMargin}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <View style={styles.titleWithEmoji}>
            <Text style={styles.emoji}>{emoji}</Text>
            <Text style={[styles.activityTitle, { color: theme.text }]} numberOfLines={1}>
              {session.activity}
            </Text>
            <View style={[styles.cardioBadge, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)' }]}>
              <Text style={styles.cardioBadgeText}>Cardio</Text>
            </View>
          </View>
          <Text style={[styles.dateText, { color: theme.textMuted }]}>
            {formattedDate} · {formattedTime}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.deleteBtn, { backgroundColor: theme.surface }]}
          onPress={() => setShowDeleteModal(true)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Supprimer la séance cardio"
        >
          <Trash2 size={16} color={theme.danger} />
        </TouchableOpacity>
      </View>

      {/* Metrics Row */}
      <View style={[styles.statsRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.statItem}>
          <Clock size={13} color={theme.accent} />
          <Text style={[styles.statValue, { color: theme.text }]}>
            {session.durationMinutes} min
          </Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <View style={[styles.rpePill, { backgroundColor: rpeInfo.bg, borderColor: `${rpeInfo.color}50` }]}>
            <Zap size={11} color={rpeInfo.color} style={{ marginRight: 3 }} />
            <Text style={[styles.rpePillText, { color: rpeInfo.color }]}>
              RPE {session.perceivedExertion} · {rpeInfo.label}
            </Text>
          </View>
        </View>
      </View>

      {/* Optional Notes */}
      {session.notes ? (
        <View style={styles.notesContainer}>
          <FileText size={12} color={theme.textMuted} style={{ marginRight: 4, marginTop: 2 }} />
          <Text style={[styles.notesText, { color: theme.textMuted }]} numberOfLines={2}>
            {session.notes}
          </Text>
        </View>
      ) : null}

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDeleteModal(false)}
        >
          <View
            style={[
              styles.deleteModalContent,
              { backgroundColor: theme.cardBg, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.deleteModalTitle, { color: theme.text }]}>
              Supprimer la séance cardio
            </Text>
            <Text style={[styles.deleteModalSub, { color: theme.textMuted }]}>
              Voulez-vous vraiment supprimer cette séance de {session.activity} de votre historique ?
            </Text>
            <View style={{ flexDirection: 'row', marginTop: 16 }}>
              <Button
                title="Annuler"
                variant="outline"
                onPress={() => setShowDeleteModal(false)}
                style={{ flex: 1, marginRight: 6 }}
              />
              <Button
                title="Supprimer"
                variant="danger"
                onPress={() => {
                  onDelete(session.id);
                  setShowDeleteModal(false);
                }}
                style={{ flex: 1, marginLeft: 6 }}
              />
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </Card>
  );
};

const styles = StyleSheet.create({
  cardMargin: {
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    marginRight: 8,
  },
  titleWithEmoji: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  emoji: {
    fontSize: 16,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  cardioBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
  },
  cardioBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#EF4444',
    textTransform: 'uppercase',
  },
  dateText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  deleteBtn: {
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 4,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(150, 150, 150, 0.2)',
  },
  rpePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  rpePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 2,
  },
  notesText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    fontStyle: 'italic',
    lineHeight: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteModalContent: {
    width: '85%',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
  },
  deleteModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  deleteModalSub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
