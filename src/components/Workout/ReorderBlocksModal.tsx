import React, { useState, useRef, useEffect } from 'react';
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
  Animated,
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

const getBlockKey = (block: WorkoutBlock, fallbackIdx: number): string =>
  block.id || `block_${fallbackIdx}`;

export const ReorderBlocksModal: React.FC<ReorderBlocksModalProps> = ({
  visible,
  onClose,
  blocks,
  onReorder,
}) => {
  const { theme } = useTheme();
  const [localBlocks, setLocalBlocks] = useState<WorkoutBlock[]>(blocks);
  const [draggingKey, setDraggingKey] = useState<string | null>(null);

  const localBlocksRef = useRef<WorkoutBlock[]>(blocks);
  const draggingKeyRef = useRef<string | null>(null);
  const accumulatedSwapOffsetRef = useRef(0);
  const onReorderRef = useRef(onReorder);
  onReorderRef.current = onReorder;

  const dragY = useRef(new Animated.Value(0)).current;
  const panRespondersRef = useRef<Record<string, ReturnType<typeof PanResponder.create>>>({});

  useEffect(() => {
    if (draggingKeyRef.current === null) {
      localBlocksRef.current = blocks;
      setLocalBlocks(blocks);
    }
  }, [blocks, visible]);

  const getBlockTitle = (block: WorkoutBlock): string => {
    if (block.type === 'circuit') {
      return (block as CircuitBlock).title || 'Circuit';
    } else if (block.type === 'single') {
      return (block as SingleExerciseBlock).exercise.exerciseName || 'Exercice';
    }
    return 'Bloc inconnu';
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const newBlocks = [...localBlocksRef.current];
    const blockToMove = newBlocks.splice(index, 1)[0];
    if (!blockToMove) return;
    const newIndex =
      direction === 'up'
        ? Math.max(0, index - 1)
        : Math.min(newBlocks.length, index + 1);
    newBlocks.splice(newIndex, 0, blockToMove);
    localBlocksRef.current = newBlocks;
    setLocalBlocks(newBlocks);
    triggerHapticLight();
    onReorderRef.current(newBlocks);
  };

  const finishDrag = () => {
    draggingKeyRef.current = null;
    accumulatedSwapOffsetRef.current = 0;
    dragY.setValue(0);
    setDraggingKey(null);
    onReorderRef.current(localBlocksRef.current);
    triggerHapticMedium();
  };

  const getResponderForKey = (blockKey: string) => {
    if (!panRespondersRef.current[blockKey]) {
      panRespondersRef.current[blockKey] = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponderCapture: () => true,
        onPanResponderTerminationRequest: () => false,
        onShouldBlockNativeResponder: () => true,
        onPanResponderGrant: () => {
          draggingKeyRef.current = blockKey;
          accumulatedSwapOffsetRef.current = 0;
          dragY.setValue(0);
          setDraggingKey(blockKey);
          triggerHapticMedium();
        },
        onPanResponderMove: (_, gestureState) => {
          if (draggingKeyRef.current !== blockKey) return;

          let relDy = gestureState.dy - accumulatedSwapOffsetRef.current;
          let curIdx = localBlocksRef.current.findIndex(
            (b, i) => getBlockKey(b, i) === blockKey
          );

          if (curIdx !== -1) {
            let nextList: WorkoutBlock[] | null = null;
            const threshold = ROW_HEIGHT * 0.55;

            while (relDy > threshold && curIdx < (nextList || localBlocksRef.current).length - 1) {
              const working: WorkoutBlock[] = nextList ? [...nextList] : [...localBlocksRef.current];
              const temp = working[curIdx];
              working[curIdx] = working[curIdx + 1];
              working[curIdx + 1] = temp;
              nextList = working;
              accumulatedSwapOffsetRef.current += ROW_HEIGHT;
              relDy -= ROW_HEIGHT;
              curIdx += 1;
            }

            while (relDy < -threshold && curIdx > 0) {
              const working: WorkoutBlock[] = nextList ? [...nextList] : [...localBlocksRef.current];
              const temp = working[curIdx];
              working[curIdx] = working[curIdx - 1];
              working[curIdx - 1] = temp;
              nextList = working;
              accumulatedSwapOffsetRef.current -= ROW_HEIGHT;
              relDy += ROW_HEIGHT;
              curIdx -= 1;
            }

            if (nextList) {
              localBlocksRef.current = nextList;
              setLocalBlocks(nextList);
              triggerHapticLight();
            }
          }

          dragY.setValue(gestureState.dy - accumulatedSwapOffsetRef.current);
        },
        onPanResponderRelease: () => {
          finishDrag();
        },
        onPanResponderTerminate: () => {
          finishDrag();
        },
      });
    }
    return panRespondersRef.current[blockKey];
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
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
            scrollEnabled={draggingKey === null}
          >
            {localBlocks.map((block, index) => {
              const blockKey = getBlockKey(block, index);
              const isDragging = draggingKey === blockKey;
              const responder = getResponderForKey(blockKey);

              return (
                <Animated.View
                  key={blockKey}
                  style={[
                    styles.blockRow,
                    {
                      backgroundColor: isDragging ? theme.surface : theme.cardBg,
                      borderColor: isDragging ? theme.accent : theme.border,
                      borderWidth: isDragging ? 2 : 1,
                      transform: isDragging ? [{ translateY: dragY }, { scale: 1.02 }] : [],
                      zIndex: isDragging ? 99 : 1,
                      elevation: isDragging ? 8 : 0,
                      opacity: draggingKey !== null && !isDragging ? 0.85 : 1,
                    },
                  ]}
                >
                  <View
                    {...responder.panHandlers}
                    style={styles.dragHandle}
                    hitSlop={{ top: 12, bottom: 12, left: 10, right: 12 }}
                  >
                    <GripVertical color={isDragging ? theme.accent : theme.textMuted} size={22} />
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
                      disabled={index === 0 || draggingKey !== null}
                      onPress={() => moveBlock(index, 'up')}
                    >
                      <ArrowUp color={theme.text} size={18} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        { backgroundColor: theme.surface },
                        index === localBlocks.length - 1 && { opacity: 0.3 },
                      ]}
                      disabled={index === localBlocks.length - 1 || draggingKey !== null}
                      onPress={() => moveBlock(index, 'down')}
                    >
                      <ArrowDown color={theme.text} size={18} />
                    </TouchableOpacity>
                  </View>
                </Animated.View>
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
    marginTop: Platform.OS === 'ios' ? 40 : 28,
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
    paddingVertical: 8,
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
    paddingBottom: Platform.OS === 'android' ? 36 : 24,
    borderTopWidth: 1,
  },
});
