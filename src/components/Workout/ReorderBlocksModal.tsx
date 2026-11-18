import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  ScrollView,
  SafeAreaView,
  PanResponder,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { WorkoutBlock, CircuitBlock, SingleExerciseBlock } from '../../types';
import { X, GripVertical, ArrowUp, ArrowDown } from 'lucide-react-native';
import { Button } from '../UI/Button';
import { triggerHapticLight, triggerHapticMedium } from '../../utils/haptics';

interface ReorderBlocksModalProps {
  visible: boolean;
  onClose: () => void;
  blocks: WorkoutBlock[];
  onReorder: (newBlocks: WorkoutBlock[]) => void;
}

const ROW_HEIGHT = 68;

export const ReorderBlocksModal: React.FC<ReorderBlocksModalProps> = ({
  visible,
  onClose,
  blocks,
  onReorder,
}) => {
  const { theme } = useTheme();
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [dragDy, setDragDy] = useState(0);

  const blocksRef = useRef(blocks);
  blocksRef.current = blocks;
  const hoverIdxRef = useRef<number | null>(null);

  const getBlockTitle = (block: WorkoutBlock): string => {
    if (block.type === 'circuit') {
      return (block as CircuitBlock).title || 'Circuit';
    } else if (block.type === 'single') {
      return (block as SingleExerciseBlock).exercise.exerciseName || 'Exercice';
    }
    return 'Bloc inconnu';
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const newBlocks = [...blocks];
    const blockToMove = newBlocks.splice(index, 1)[0];
    const newIndex =
      direction === 'up'
        ? Math.max(0, index - 1)
        : Math.min(newBlocks.length, index + 1);
    newBlocks.splice(newIndex, 0, blockToMove);
    triggerHapticLight();
    onReorder(newBlocks);
  };

  const createDragResponder = (index: number) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        triggerHapticMedium();
        setDraggingIdx(index);
        setHoverIdx(index);
        hoverIdxRef.current = index;
        setDragDy(0);
      },
      onPanResponderMove: (_, gestureState) => {
        setDragDy(gestureState.dy);
        const total = blocksRef.current.length;
        const nextHover = Math.max(
          0,
          Math.min(total - 1, Math.round(index + gestureState.dy / ROW_HEIGHT))
        );
        if (nextHover !== hoverIdxRef.current) {
          hoverIdxRef.current = nextHover;
          setHoverIdx(nextHover);
          triggerHapticLight();
        }
      },
      onPanResponderRelease: () => {
        const target = hoverIdxRef.current;
        if (target !== null && target !== index) {
          const nextBlocks = [...blocksRef.current];
          const [moved] = nextBlocks.splice(index, 1);
          nextBlocks.splice(target, 0, moved);
          onReorder(nextBlocks);
          triggerHapticMedium();
        }
        setDraggingIdx(null);
        setHoverIdx(null);
        hoverIdxRef.current = null;
        setDragDy(0);
      },
      onPanResponderTerminate: () => {
        setDraggingIdx(null);
        setHoverIdx(null);
        hoverIdxRef.current = null;
        setDragDy(0);
      },
    });

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <SafeAreaView style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <View>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Réorganiser
              </Text>
              <Text style={[styles.modalSubtitle, { color: theme.textMuted }]}>
                Maintenez et glissez la poignée ≡ pour déplacer
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X color={theme.text} size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            scrollEnabled={draggingIdx === null}
          >
            {blocks.map((block, index) => {
              const isDragging = draggingIdx === index;
              const isDropTarget =
                draggingIdx !== null && hoverIdx === index && draggingIdx !== index;
              const responder = createDragResponder(index);

              return (
                <View
                  key={block.id || index.toString()}
                  style={[
                    styles.blockRow,
                    {
                      backgroundColor: isDragging ? theme.surface : theme.cardBg,
                      borderColor: isDragging || isDropTarget ? theme.accent : theme.border,
                      borderWidth: isDragging || isDropTarget ? 2 : 1,
                      transform: isDragging ? [{ translateY: dragDy }, { scale: 1.02 }] : [],
                      zIndex: isDragging ? 99 : 1,
                      elevation: isDragging ? 8 : 0,
                    },
                  ]}
                >
                  <View
                    {...responder.panHandlers}
                    style={styles.dragHandle}
                    hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
                  >
                    <GripVertical color={isDragging ? theme.accent : theme.textMuted} size={20} />
                  </View>

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
                  </View>
                </View>
              );
            })}
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: theme.border }]}>
            <Button title="Terminer" variant="primary" onPress={onClose} />
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    flex: 1,
    marginTop: Platform.OS === 'ios' ? 40 : 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 10,
  },
  blockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 16,
    minHeight: 58,
  },
  dragHandle: {
    paddingRight: 10,
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 10,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  blockTitle: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
});
