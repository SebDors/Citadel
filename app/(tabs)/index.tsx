import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useWorkout } from '../../src/context/WorkoutContext';
import { useTheme } from '../../src/context/ThemeContext';
import { Button } from '../../src/components/UI/Button';
import { Card } from '../../src/components/UI/Card';
import { Badge } from '../../src/components/UI/Badge';
import { RestTimerBar } from '../../src/components/Workout/RestTimerBar';
import { useRouter } from 'expo-router';
import { Play, Plus, Dumbbell, Zap, Flame, Repeat } from 'lucide-react-native';

export default function WorkoutTab() {
  const { data, activeSession, startWorkout } = useWorkout();
  const { theme } = useTheme();
  const router = useRouter();

  const handleStartFreestyle = () => {
    startWorkout();
    router.push('/live-workout');
  };

  const handleStartTemplate = (templateId: string) => {
    const tpl = data?.templates.find((t) => t.id === templateId);
    if (tpl) {
      startWorkout(tpl);
      router.push('/live-workout');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Title */}
        <View style={styles.pageHeader}>
          <Text style={[styles.appTitle, { color: theme.text }]}>WarriorFit</Text>
          <Text style={[styles.pageSubtitle, { color: theme.textMuted }]}>
            Suivi de musculation Offline-First
          </Text>
        </View>

        {/* Live Workout Banner if active */}
        {activeSession && (
          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.activeBanner, { backgroundColor: theme.cardBg, borderColor: theme.accent }]}
            onPress={() => router.push('/live-workout')}
          >
            <View style={styles.activeBannerLeft}>
              <Flame size={22} color={theme.accent} />
              <View style={{ marginLeft: 10 }}>
                <Text style={[styles.activeBannerTitle, { color: theme.text }]}>
                  Séance en cours : {activeSession.title}
                </Text>
                <Text style={[styles.activeBannerSub, { color: theme.textMuted }]}>
                  {activeSession.completedSetsCount} / {activeSession.totalSetsCount} séries complétées
                </Text>
              </View>
            </View>
            <Button title="Reprendre" variant="primary" onPress={() => router.push('/live-workout')} />
          </TouchableOpacity>
        )}

        {/* Top Action Buttons (Side by Side) */}
        <View style={styles.actionButtonsRow}>
          <Button
            title="Lancer entraînement libre"
            variant="primary"
            onPress={handleStartFreestyle}
            icon={<Play size={16} color="#FFFFFF" />}
            style={styles.actionBtn}
          />
          <Button
            title="Créer une séance"
            variant="outline"
            onPress={() => router.push('/template-editor')}
            icon={<Plus size={16} color={theme.text} />}
            style={styles.actionBtn}
          />
        </View>

        {/* Templates Section Title */}
        <View style={styles.sectionHeader}>
          <Dumbbell size={20} color={theme.accent} style={{ marginRight: 6 }} />
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Mes Programmes & Séances</Text>
        </View>

        {/* Cards list of Workout Templates */}
        {data?.templates.map((tpl) => (
          <Card key={tpl.id} style={{ marginBottom: 12 }}>
            <View style={styles.cardHeader}>
              <View>
                <View style={styles.cardTitleRow}>
                  <Text style={[styles.templateTitle, { color: theme.text }]}>{tpl.title}</Text>
                  {tpl.isCircuit && (
                    <View style={[styles.circuitTag, { backgroundColor: theme.secondary }]}>
                      <Repeat size={12} color="#FFFFFF" />
                      <Text style={styles.circuitTagText}>Circuit 3 tours</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.templateDesc, { color: theme.textMuted }]}>{tpl.description}</Text>
              </View>
            </View>

            {/* Target Muscles Badges (Demande explicite) */}
            <View style={styles.musclesContainer}>
              {tpl.targetMuscles.map((m, idx) => (
                <Badge key={idx} label={m} variant="secondary" />
              ))}
            </View>

            {/* Exercises list preview */}
            <View style={[styles.previewBox, { backgroundColor: theme.surface }]}>
              <Text style={[styles.previewCount, { color: theme.text }]}>
                {tpl.exercises.length} Exercices :
              </Text>

              {tpl.exercises.map((ex, idx) => (
                <View key={idx} style={styles.exPreviewRow}>
                  <Text style={[styles.exName, { color: theme.text }]}>
                    • {ex.exerciseName} ({ex.sets.length} séries)
                  </Text>
                  <Badge label={ex.primaryMuscle} variant="accent" style={{ transform: [{ scale: 0.85 }] }} />
                </View>
              ))}
            </View>

            {/* Start Button */}
            <Button
              title="Démarrer la séance"
              variant="primary"
              onPress={() => handleStartTemplate(tpl.id)}
              icon={<Zap size={16} color="#FFFFFF" />}
              style={{ marginTop: 10 }}
            />
          </Card>
        ))}
      </ScrollView>

      {/* Floating Rest Timer Bar */}
      <RestTimerBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 90,
  },
  pageHeader: {
    marginTop: 10,
    marginBottom: 16,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  pageSubtitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  activeBanner: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  activeBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  activeBannerTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  activeBannerSub: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionBtn: {
    flex: 0.48,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  cardHeader: {
    marginBottom: 8,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  templateTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  circuitTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  circuitTagText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 3,
  },
  templateDesc: {
    fontSize: 13,
    marginTop: 2,
  },
  musclesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 6,
  },
  previewBox: {
    padding: 10,
    borderRadius: 10,
    marginTop: 6,
  },
  previewCount: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  exPreviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 2,
  },
  exName: {
    fontSize: 13,
    fontWeight: '600',
  },
});
