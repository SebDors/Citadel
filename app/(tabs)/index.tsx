import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useWorkout } from '../../src/context/WorkoutContext';
import { useTheme } from '../../src/context/ThemeContext';
import { Button } from '../../src/components/UI/Button';
import { Card } from '../../src/components/UI/Card';
import { RestTimerBar } from '../../src/components/Workout/RestTimerBar';
import { useRouter } from 'expo-router';
import { Play, Plus, Flame, TrendingUp, ChevronRight, MoreHorizontal } from 'lucide-react-native';

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
          <Text style={[styles.appTitle, { color: theme.text }]}>Séances</Text>
        </View>

        {/* Active Workout Banner (non-colliding layout) */}
        {activeSession && (
          <View style={[styles.activeBanner, { backgroundColor: theme.cardBg, borderColor: theme.accent }]}>
            <View style={styles.activeBannerInfo}>
              <Flame size={20} color={theme.accent} style={{ marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.activeBannerTitle, { color: theme.text }]} numberOfLines={1}>
                  Séance en cours : {activeSession.title}
                </Text>
                <Text style={[styles.activeBannerSub, { color: theme.textMuted }]}>
                  {activeSession.completedSetsCount} / {activeSession.totalSetsCount} séries complétées
                </Text>
              </View>
            </View>
            <Button title="Reprendre" variant="primary" onPress={() => router.push('/live-workout')} style={styles.resumeBtn} />
          </View>
        )}

        {/* Top Action Buttons (Side by Side matching Screenshot 2) */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.mainActionBox, { backgroundColor: theme.accent }]}
            onPress={handleStartFreestyle}
          >
            <View style={styles.playIconCircle}>
              <Play size={16} color={theme.accent} fill={theme.accent} />
            </View>
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.mainActionTitle}>Entraînement libre</Text>
              <Text style={styles.mainActionSub}>Démarre direct sans plan</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.createActionBox, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => router.push('/template-editor')}
          >
            <Plus size={22} color={theme.text} />
            <Text style={[styles.createActionTitle, { color: theme.text }]}>SÉANCE</Text>
          </TouchableOpacity>
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>MES SÉANCES</Text>
        </View>

        {/* Program Cards matching Epilog Screenshot 2 */}
        {data?.templates.map((tpl) => {
          // Format exercise names inline: "Dips, Low cable fly, Tirage horizontal..."
          const inlineExercisesText = tpl.exercises.map((ex) => ex.exerciseName).join(', ');

          return (
            <Card key={tpl.id} style={styles.programCard}>
              {/* Card Header: Title + Graph Icon + Options */}
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleArea}>
                  <Text style={[styles.templateTitle, { color: theme.text }]}>{tpl.title}</Text>
                  <Text style={[styles.exCountText, { color: theme.textMuted }]}>
                    {tpl.exercises.length} exos
                  </Text>
                </View>

                <View style={styles.cardHeaderIcons}>
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => router.push({ pathname: '/workout-analytics', params: { id: tpl.id } })}
                  >
                    <TrendingUp size={18} color={theme.text} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconBtn}>
                    <MoreHorizontal size={18} color={theme.text} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Inline Exercises List (Small font, clear and inline) */}
              <Text style={[styles.inlineExText, { color: theme.textMuted }]} numberOfLines={2}>
                {inlineExercisesText}
              </Text>

              {/* Last Workout Date Badge */}
              <TouchableOpacity style={[styles.recapBadge, { backgroundColor: theme.surface }]}>
                <View style={[styles.recapBar, { backgroundColor: '#8B5CF6' }]} />
                <View style={styles.recapTextRow}>
                  <Text style={[styles.recapSub, { color: theme.textMuted }]}>DERNIER ENTRAÎNEMENT</Text>
                  <Text style={[styles.recapDate, { color: theme.text }]}>7 août - voir le récap</Text>
                </View>
                <ChevronRight size={14} color={theme.textMuted} />
              </TouchableOpacity>

              {/* Big Green Start Button */}
              <Button
                title="Démarrer"
                variant="primary"
                onPress={() => handleStartTemplate(tpl.id)}
                icon={<Play size={14} color="#FFFFFF" fill="#FFFFFF" />}
                style={styles.startBtn}
              />
            </Card>
          );
        })}
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
    marginBottom: 14,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '900',
  },
  activeBanner: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 2,
    marginBottom: 16,
  },
  activeBannerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  activeBannerTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  activeBannerSub: {
    fontSize: 12,
  },
  resumeBtn: {
    marginTop: 4,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  mainActionBox: {
    flex: 0.65,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
  },
  playIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainActionTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  mainActionSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
  },
  createActionBox: {
    flex: 0.32,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  createActionTitle: {
    fontSize: 13,
    fontWeight: '900',
    marginTop: 4,
  },
  sectionHeader: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  programCard: {
    marginBottom: 14,
    padding: 16,
    borderRadius: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitleArea: {
    flex: 1,
  },
  templateTitle: {
    fontSize: 19,
    fontWeight: '900',
  },
  exCountText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  cardHeaderIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    padding: 6,
    marginLeft: 6,
  },
  inlineExText: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    marginVertical: 10,
  },
  recapBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  recapBar: {
    width: 3,
    height: 24,
    borderRadius: 2,
    marginRight: 10,
  },
  recapTextRow: {
    flex: 1,
  },
  recapSub: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  recapDate: {
    fontSize: 12,
    fontWeight: '700',
  },
  startBtn: {
    borderRadius: 12,
    paddingVertical: 12,
  },
});
