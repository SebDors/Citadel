import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, Platform, StatusBar as RNStatusBar } from 'react-native';
import { useWorkout } from '../../src/context/WorkoutContext';
import { useTheme } from '../../src/context/ThemeContext';
import { CalendarView } from '../../src/components/History/CalendarView';
import { ActivitySummaryCard } from '../../src/components/History/ActivitySummaryCard';
import { Calendar } from 'lucide-react-native';

export default function HistoryTab() {
  const { data, deleteWorkoutSession } = useWorkout();
  const { theme } = useTheme();

  const historyList = data?.history || [];

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor: theme.background,
          paddingTop: Platform.OS === 'android' ? Math.min(RNStatusBar.currentHeight || 0, 16) : 0,
        },
      ]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Page Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Historique</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            Calendrier d'assiduité et séances passées
          </Text>
        </View>

        {/* 1. Calendrier d'assiduité avec modale interactive des jours (Haut de page) */}
        <CalendarView history={historyList} />

        {/* 2. Bloc de Statistiques (Milieu de page) */}
        <ActivitySummaryCard history={historyList} />

        {/* 3. Liste Chronologique Compacte des Derniers Entraînements (Bas de page) */}
        <View style={styles.listSectionHeader}>
          <Calendar size={18} color={theme.accent} style={{ marginRight: 6 }} />
          <Text style={[styles.listTitle, { color: theme.text }]}>Dernières Séances Effectuées</Text>
        </View>

        {historyList.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>
            Aucune séance terminée pour le moment.
          </Text>
        ) : (
          historyList.map((session) => (
            <ActivitySummaryCard
              key={session.id}
              session={session}
              onDeleteSession={deleteWorkoutSession}
            />
          ))
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
    paddingBottom: 110,
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
});
