import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { WorkoutBlock, CircuitBlock, SingleExerciseBlock } from '../../types';
import {
  X,
  ChevronsUp,
  ArrowUp,
  ArrowDown,
  ChevronsDown,
} from 'lucide-react-native';
import { Button } from '../UI/Button';

interface ReorderBlocksModalProps {
  visible: boolean;
  onClose: () => void;
  blocks: WorkoutBlock[];
  onReorder: (newBlocks: WorkoutBlock[]) => void;
}

export const ReorderBlocksModal: React.FC<ReorderBlocksModalProps> = ({
  visible,
  onClose,
  blocks,
  onReorder,
}) => {
  const { theme } = useTheme();

  const getBlockTitle = (block: WorkoutBlock): string => {
    if (block.type === 'circuit') {
      return (block as CircuitBlock).title || 'Circuit';
    } else if (block.type === 'single') {
      return (block as SingleExerciseBlock).exercise.exerciseName || 'Exercice';
    }
    return 'Bloc inconnu';
  };

  const moveBlock = (index: number, direction: 'top' | 'up' | 'down' | 'bottom') => {
    const newBlocks = [...blocks];
    const blockToMove = newBlocks.splice(index, 1)[0];

    if (direction === 'top') {
      newBlocks.unshift(blockToMove);
    } else if (direction === 'bottom') {
      newBlocks.push(blockToMove);
    } else if (direction === 'up') {
      const newIndex = Math.max(0, index - 1);
      newBlocks.splice(newIndex, 0, blockToMove);
    } else if (direction === 'down') {
      const newIndex = Math.min(newBlocks.length, index + 1);
      newBlocks.splice(newIndex, 0, blockToMove);
    }

    onReorder(newBlocks);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <SafeAreaView style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Réorganiser
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X color={theme.text} size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
            {blocks.map((block, index) => (
              <View
                key={block.id || index.toString()}
                style={[
                  styles.blockRow,
                  { backgroundColor: theme.cardBg, borderColor: theme.border },
                ]}
              >
                <View style={styles.blockInfo}>
                  <View style={[styles.badge, { backgroundColor: theme.surface }]}>
                    <Text style={[styles.badgeText, { color: theme.text }]}>#{index + 1}</Text>
                  </View>
                  <Text style={[styles.blockTitle, { color: theme.text }]} numberOfLines={2}>
                    {getBlockTitle(block)}
                  </Text>
                </View>

                <View style={styles.actionsContainer}>
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      { backgroundColor: theme.surface },
                      index === 0 && { opacity: 0.3 },
                    ]}
                    disabled={index === 0}
                    onPress={() => moveBlock(index, 'top')}
                  >
                    <ChevronsUp color={theme.text} size={18} />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      { backgroundColor: theme.surface },
                      index === 0 && { opacity: 0.3 },
                    ]}
                    disabled={index === 0}
                    onPress={() => moveBlock(index, 'up')}
                  >
                    <ArrowUp color={theme.text} size={18} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      { backgroundColor: theme.surface },
                      index === blocks.length - 1 && { opacity: 0.3 },
                    ]}
                    disabled={index === blocks.length - 1}
                    onPress={() => moveBlock(index, 'down')}
                  >
                    <ArrowDown color={theme.text} size={18} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      { backgroundColor: theme.surface },
                      index === blocks.length - 1 && { opacity: 0.3 },
                    ]}
                    disabled={index === blocks.length - 1}
                    onPress={() => moveBlock(index, 'bottom')}
                  >
                    <ChevronsDown color={theme.text} size={18} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: theme.border }]}>
            <Button
              title="Terminer"
              variant="primary"
              onPress={onClose}
              style={styles.doneButton}
            />
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    flex: 1,
    marginTop: Platform.OS === 'ios' ? 40 : 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  blockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  blockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  blockTitle: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  doneButton: {
    width: '100%',
  },
});
