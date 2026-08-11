import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { useWorkout } from '../../src/context/WorkoutContext';
import { useTheme } from '../../src/context/ThemeContext';
import { CalendarView } from '../../src/components/History/CalendarView';
import { ActivitySummaryCard } from '../../src/components/History/ActivitySummaryCard';
import { Card } from '../../src/components/UI/Card';
import { Badge } from '../../src/components/UI/Badge';
import { Calendar, Clock, Dumbbell, CheckCircle2 } from 'lucide-react-native';

export default function HistoryTab() {
  const { data } = useWorkout();
  const { theme } = useTheme();

  const historyList = data?.history || [];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Page Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Historique</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            Calendrier d'assiduité et séances passées
          </Text>
        </View>

        {/* 1. Calendrier d'assiduité (Haut de page) */}
        <CalendarView history={historyList} />

        {/* 2. Bloc de Statistiques (Milieu de page) */}
        <ActivitySummaryCard history={historyList} />

        {/* 3. Liste Chronologique des Derniers Entraînements (Bas de page) */}
        <View style={styles.listSectionHeader}>
          <Calendar size={18} color={theme.accent} style={{ marginRight: 6 }} />
          <Text style={[styles.listTitle, { color: theme.text }]}>Dernières Séances Effectuées</Text>
        </View>

        {historyList.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>
            Aucune séance terminée pour le moment.
          </Text>
        ) : (
          historyList.map((session) => {
            const formattedDate = new Date(session.startTime).toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            });

            return (
              <Card key={session.id} style={{ marginBottom: 10 }}>
                <View style={styles.sessionHeader}>
                  <Text style={[styles.sessionTitle, { color: theme.text }]}>{session.title}</Text>
                  <Badge label="Terminée" variant="primary" />
                </View>

                <Text style={[styles.sessionDate, { color: theme.textMuted }]}>
                  {formattedDate}
                </Text>

                <View style={[styles.sessionStatsRow, { backgroundColor: theme.surface }]}>
                  <View style={styles.sessionStat}>
                    <Clock size={14} color={theme.textMuted} />
                    <Text style={[styles.sessionStatVal, { color: theme.text }]}>
                      {Math.floor(session.durationSeconds / 60)} min
                    </Text>
                  </View>

                  <View style={styles.sessionStat}>
                    <Dumbbell size={14} color={theme.secondary} />
                    <Text style={[styles.sessionStatVal, { color: theme.text }]}>
                      {session.totalVolumeKg} kg
                    </Text>
                  </View>

                  <View style={styles.sessionStat}>
                    <CheckCircle2 size={14} color={theme.primary} />
                    <Text style={[styles.sessionStatVal, { color: theme.text }]}>
                      {session.completedSetsCount} séries
                    </Text>
                  </View>
                </View>

                {/* Résumé des exercices avec muscles travaillés */}
                <View style={styles.exSummaryList}>
                  {session.exercises.map((ex, idx) => (
                    <View key={idx} style={styles.exSummaryItem}>
                      <Text style={[styles.exSummaryName, { color: theme.text }]}>
                        • {ex.exerciseName}
                      </Text>
                      <Badge label={ex.primaryMuscle} variant="secondary" />
                    </View>
                  ))}
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginTop: 10,
    marginBottom: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  listSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 10,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 20,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  sessionDate: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  sessionStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    borderRadius: 8,
  },
  sessionStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionStatVal: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 4,
  },
  exSummaryList: {
    marginTop: 8,
  },
  exSummaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 2,
  },
  exSummaryName: {
    fontSize: 13,
    fontWeight: '600',
  },
});
