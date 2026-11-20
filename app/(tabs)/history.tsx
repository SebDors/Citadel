import React from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Platform,
  StatusBar as RNStatusBar,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useWorkout } from "../../src/context/WorkoutContext";
import { useTheme } from "../../src/context/ThemeContext";
import { CalendarView } from "../../src/components/History/CalendarView";
import { ActivitySummaryCard } from "../../src/components/History/ActivitySummaryCard";
import { CardioSessionCard } from "../../src/components/History/CardioSessionCard";
import { Calendar, Plus, ChevronDown, ChevronUp, Flame, Search, X } from "lucide-react-native";
import { TabSwipeWrapper } from "../../src/components/Navigation/TabSwipeWrapper";
import { LogPastWorkoutModal } from "../../src/components/History/LogPastWorkoutModal";
import { LogCardioModal } from "../../src/components/History/LogCardioModal";
import { StorageService } from "../../src/services/storage";
import { WorkoutSession, CardioSession, getSessionBlocks } from "../../src/types";
import { normalizeString } from "../../src/utils/stringUtils";

type CombinedHistoryItem =
  | { type: 'workout'; id: string; date: Date; session: WorkoutSession }
  | { type: 'cardio'; id: string; date: Date; session: CardioSession };

export default function HistoryTab() {
  const { data, deleteWorkoutSession, deleteCardioSession, restTimer } = useWorkout();
  const { theme } = useTheme();
  const [logModalVisible, setLogModalVisible] = React.useState(false);
  const [cardioModalVisible, setCardioModalVisible] = React.useState(false);
  const [editingCardioSession, setEditingCardioSession] = React.useState<CardioSession | null>(null);
  const [isLastSessionsCollapsed, setIsLastSessionsCollapsed] = React.useState(false);
  const [filterType, setFilterType] = React.useState<'all' | 'workout' | 'cardio'>('all');
  const [searchQuery, setSearchQuery] = React.useState('');

  React.useEffect(() => {
    StorageService.loadCollapsedCards().then((saved) => {
      if (saved && typeof saved['history_last_sessions'] === 'boolean') {
        setIsLastSessionsCollapsed(saved['history_last_sessions']);
      }
    });
  }, []);

  const toggleLastSessionsCollapsed = async () => {
    const nextVal = !isLastSessionsCollapsed;
    setIsLastSessionsCollapsed(nextVal);
    const saved = await StorageService.loadCollapsedCards();
    await StorageService.saveCollapsedCards({ ...saved, history_last_sessions: nextVal });
  };

  const historyList = data?.history || [];
  const cardioList = data?.cardioSessions || [];

  const combinedList = React.useMemo<CombinedHistoryItem[]>(() => {
    const workouts: CombinedHistoryItem[] = historyList.map((s) => ({
      type: 'workout',
      id: s.id,
      date: new Date(s.startTime),
      session: s,
    }));
    const cardios: CombinedHistoryItem[] = cardioList.map((c) => ({
      type: 'cardio',
      id: c.id,
      date: new Date(c.date),
      session: c,
    }));
    return [...workouts, ...cardios].sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [historyList, cardioList]);

  const uniqueExerciseNames = React.useMemo(() => {
    const counts = new Map<string, number>();
    historyList.forEach((session) => {
      getSessionBlocks(session).forEach((block) => {
        if (block.type === 'single' && block.exercise.exerciseName) {
          const name = block.exercise.exerciseName.trim();
          counts.set(name, (counts.get(name) || 0) + 1);
        } else if (block.type === 'circuit') {
          block.exercises.forEach((item) => {
            if (item.exerciseName) {
              const name = item.exerciseName.trim();
              counts.set(name, (counts.get(name) || 0) + 1);
            }
          });
        }
      });
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name);
  }, [historyList]);

  const exerciseSuggestions = React.useMemo(() => {
    const q = normalizeString(searchQuery);
    if (!q) return [];
    return uniqueExerciseNames
      .filter((name) => {
        const norm = normalizeString(name);
        return norm.includes(q) && norm !== q;
      })
      .slice(0, 6);
  }, [uniqueExerciseNames, searchQuery]);

  const displayList = React.useMemo(() => {
    let list = combinedList;
    if (filterType === 'workout') {
      list = list.filter((item) => item.type === 'workout');
    } else if (filterType === 'cardio') {
      list = list.filter((item) => item.type === 'cardio');
    }

    const q = normalizeString(searchQuery);
    if (!q) return list;

    return list.filter((item) => {
      if (item.type === 'workout') {
        if (normalizeString(item.session.title).includes(q)) return true;
        return getSessionBlocks(item.session).some((block) => {
          if (block.type === 'single') {
            return normalizeString(block.exercise.exerciseName).includes(q);
          }
          if (block.type === 'circuit') {
            return block.exercises.some((ex) => normalizeString(ex.exerciseName).includes(q));
          }
          return false;
        });
      }
      return (
        normalizeString(item.session.activity).includes(q) ||
        normalizeString(item.session.notes || '').includes(q)
      );
    });
  }, [combinedList, filterType, searchQuery]);

  const renderItem = React.useCallback(
    ({ item }: { item: CombinedHistoryItem }) => {
      if (item.type === 'workout') {
        return (
          <ActivitySummaryCard
            key={`workout_${item.id}`}
            session={item.session}
            onDeleteSession={deleteWorkoutSession}
          />
        );
      }
      return (
        <CardioSessionCard
          key={`cardio_${item.id}`}
          session={item.session}
          onDelete={deleteCardioSession}
          onEdit={(session) => setEditingCardioSession(session)}
        />
      );
    },
    [deleteWorkoutSession, deleteCardioSession]
  );

  const listHeader = (
    <>
      {/* Page Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={[styles.title, { color: theme.text }]}>
            Historique
          </Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.headerBtn,
                {
                  backgroundColor: `${theme.accent}18`,
                  borderColor: `${theme.accent}40`,
                  borderWidth: 1,
                },
              ]}
              onPress={() => setCardioModalVisible(true)}
            >
              <Flame size={14} color={theme.accent} style={{ marginRight: 4 }} />
              <Text style={[styles.headerBtnText, { color: theme.accent }]}>
                Cardio
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.headerBtn, { backgroundColor: theme.accent }]}
              onPress={() => setLogModalVisible(true)}
            >
              <Plus size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={[styles.headerBtnText, { color: "#FFFFFF" }]}>
                Séance passée
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          Calendrier d'assiduité, séances et activités
        </Text>
      </View>

      {/* 1. Calendrier d'assiduité avec modale interactive des jours (Haut de page) */}
      <CalendarView
        history={historyList}
        cardioSessions={cardioList}
        onEditCardio={(session) => setEditingCardioSession(session)}
      />

      {/* 2. Bloc de Statistiques Hebdomadaires (Milieu de page) */}
      <ActivitySummaryCard history={historyList} cardioSessions={cardioList} />

      {/* 3. Liste Chronologique Compacte des Derniers Entraînements (Bas de page) */}
      <View style={styles.listSectionHeader}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Calendar size={18} color={theme.accent} />
          <Text style={[styles.listTitle, { color: theme.text }]}>
            Derniers Entraînements
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {isLastSessionsCollapsed && displayList.length > 0 && (
            <View style={[styles.collapsedBadge, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.collapsedBadgeText, { color: theme.textMuted }]}>
                {displayList.length}
              </Text>
            </View>
          )}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={toggleLastSessionsCollapsed}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel={isLastSessionsCollapsed ? 'Développer' : 'Réduire'}
          >
            {isLastSessionsCollapsed ? (
              <ChevronDown size={18} color={theme.textMuted} />
            ) : (
              <ChevronUp size={18} color={theme.textMuted} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Filtres Type de Séance (Tous, Muscu, Cardio) & Barre de recherche */}
      {!isLastSessionsCollapsed && (
        <>
          <View style={styles.filterBar}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[
                styles.filterChip,
                filterType === 'all'
                  ? { backgroundColor: theme.accent, borderColor: theme.accent }
                  : { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
              onPress={() => setFilterType('all')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: filterType === 'all' ? '#FFFFFF' : theme.textMuted, fontWeight: filterType === 'all' ? '800' : '600' },
                ]}
              >
                Tous ({combinedList.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              style={[
                styles.filterChip,
                filterType === 'workout'
                  ? { backgroundColor: theme.accent, borderColor: theme.accent }
                  : { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
              onPress={() => setFilterType('workout')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: filterType === 'workout' ? '#FFFFFF' : theme.textMuted, fontWeight: filterType === 'workout' ? '800' : '600' },
                ]}
              >
                Muscu ({historyList.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              style={[
                styles.filterChip,
                filterType === 'cardio'
                  ? { backgroundColor: theme.accent, borderColor: theme.accent }
                  : { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
              onPress={() => setFilterType('cardio')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: filterType === 'cardio' ? '#FFFFFF' : theme.textMuted, fontWeight: filterType === 'cardio' ? '800' : '600' },
                ]}
              >
                Cardio ({cardioList.length})
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchSection}>
            <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Search size={15} color={theme.textMuted} style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Rechercher une séance ou un exercice..."
                placeholderTextColor={theme.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <X size={15} color={theme.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {exerciseSuggestions.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.suggestionsRow}
              >
                {exerciseSuggestions.map((name) => (
                  <TouchableOpacity
                    key={name}
                    activeOpacity={0.75}
                    onPress={() => setSearchQuery(name)}
                    style={[styles.suggestionChip, { backgroundColor: `${theme.accent}15`, borderColor: `${theme.accent}40` }]}
                  >
                    <Text style={[styles.suggestionChipText, { color: theme.accent }]}>{name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </>
      )}
    </>
  );

  return (
    <TabSwipeWrapper tabIndex={1}>
      <SafeAreaView
        edges={["top", "left", "right"]}
        style={[styles.safeArea, { backgroundColor: theme.background }]}
      >
        <FlatList
          data={isLastSessionsCollapsed ? [] : displayList}
          keyExtractor={(item: CombinedHistoryItem) => `${item.type}_${item.id}`}
          renderItem={renderItem}
          ListHeaderComponent={listHeader}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            !isLastSessionsCollapsed ? (
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                {searchQuery.trim()
                  ? `Aucune séance trouvée pour « ${searchQuery.trim()} ».`
                  : filterType === 'cardio'
                  ? 'Aucune séance cardio enregistrée.'
                  : filterType === 'workout'
                  ? 'Aucune séance de musculation enregistrée.'
                  : 'Aucune séance terminée pour le moment.'}
              </Text>
            ) : null
          }
          contentContainerStyle={[
            styles.scrollContent,
            restTimer.active && { paddingBottom: 100 },
          ]}
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          windowSize={7}
          removeClippedSubviews={Platform.OS === 'android'}
        />

        <LogPastWorkoutModal
          visible={logModalVisible}
          onClose={() => setLogModalVisible(false)}
        />

        <LogCardioModal
          visible={cardioModalVisible || Boolean(editingCardioSession)}
          sessionToEdit={editingCardioSession}
          onClose={() => {
            setCardioModalVisible(false);
            setEditingCardioSession(null);
          }}
        />
      </SafeAreaView>
    </TabSwipeWrapper>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 2,
    paddingBottom: 20,
  },
  header: {
    marginTop: 2,
    marginBottom: 10,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  headerBtnText: {
    fontSize: 12,
    fontWeight: "700",
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "600",
  },
  listSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    marginBottom: 10,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  collapsedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
  },
  collapsedBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  filterBar: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 11,
  },
  searchSection: {
    marginBottom: 12,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    paddingVertical: 0,
  },
  suggestionsRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 8,
  },
  suggestionChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  suggestionChipText: {
    fontSize: 11,
    fontWeight: "700",
  },
  emptyText: {
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
    marginVertical: 20,
  },
});
