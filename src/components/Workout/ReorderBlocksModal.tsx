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

const ROW_HEIGHT = 64;
const ROW_MARGIN_BOTTOM = 10;
const ITEM_STRIDE = ROW_HEIGHT + ROW_MARGIN_BOTTOM;

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
  const startIdxRef = useRef<number>(-1);
  const targetIdxRef = useRef<number>(-1);
  const onReorderRef = useRef(onReorder);
  onReorderRef.current = onReorder;

  const dragY = useRef(new Animated.Value(0)).current;
  const shiftAnimsRef = useRef<Record<string, Animated.Value>>({});
  const panRespondersRef = useRef<Record<string, ReturnType<typeof PanResponder.create>>>({});

  const getShiftAnim = (key: string): Animated.Value => {
    if (!shiftAnimsRef.current[key]) {
      shiftAnimsRef.current[key] = new Animated.Value(0);
    }
    return shiftAnimsRef.current[key];
  };

  useEffect(() => {
    if (draggingKeyRef.current === null) {
      localBlocksRef.current = blocks;
      setLocalBlocks(blocks);
      Object.values(shiftAnimsRef.current).forEach((anim) => {
        anim.stopAnimation();
        anim.setValue(0);
      });
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

  const updateSiblingShifts = (startIdx: number, targetIdx: number) => {
    const list = localBlocksRef.current;
    list.forEach((b, i) => {
      if (i === startIdx) return;
      const key = getBlockKey(b, i);
      const anim = getShiftAnim(key);
      let toValue = 0;
      if (startIdx < i && i <= targetIdx) {
        toValue = -ITEM_STRIDE;
      } else if (targetIdx <= i && i < startIdx) {
        toValue = ITEM_STRIDE;
      }
      Animated.spring(anim, {
        toValue,
        useNativeDriver: true,
        speed: 32,
        bounciness: 0,
      }).start();
    });
  };

  const finishDrag = () => {
    const from = startIdxRef.current;
    const to = targetIdxRef.current;
    const currentList = localBlocksRef.current;

    let finalBlocks = currentList;
    if (from !== -1 && to !== -1 && from !== to) {
      const next = [...currentList];
      const [moved] = next.splice(from, 1);
      if (moved) {
        next.splice(to, 0, moved);
        finalBlocks = next;
      }
    }

    // Reset all animated values synchronously before committing the final order
    dragY.stopAnimation();
    dragY.setValue(0);
    Object.values(shiftAnimsRef.current).forEach((anim) => {
      anim.stopAnimation();
      anim.setValue(0);
    });

    draggingKeyRef.current = null;
    startIdxRef.current = -1;
    targetIdxRef.current = -1;

    localBlocksRef.current = finalBlocks;
    setLocalBlocks(finalBlocks);
    setDraggingKey(null);

    if (from !== to && from !== -1 && to !== -1) {
      onReorderRef.current(finalBlocks);
    }
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
          const idx = localBlocksRef.current.findIndex(
            (b, i) => getBlockKey(b, i) === blockKey
          );
          if (idx === -1) return;

          draggingKeyRef.current = blockKey;
          startIdxRef.current = idx;
          targetIdxRef.current = idx;
          dragY.setValue(0);
          Object.values(shiftAnimsRef.current).forEach((anim) => {
            anim.stopAnimation();
            anim.setValue(0);
          });
          setDraggingKey(blockKey);
          triggerHapticMedium();
        },
        onPanResponderMove: (_, gestureState) => {
          if (draggingKeyRef.current !== blockKey) return;
          const startIdx = startIdxRef.current;
          const total = localBlocksRef.current.length;
          if (startIdx === -1 || total <= 1) return;

          // Keep dragged card strictly 1:1 with finger delta (clamp within list bounds)
          const minDy = -startIdx * ITEM_STRIDE;
          const maxDy = (total - 1 - startIdx) * ITEM_STRIDE;
          const clampedDy = Math.max(minDy, Math.min(maxDy, gestureState.dy));
          dragY.setValue(clampedDy);

          const nextTarget = Math.max(
            0,
            Math.min(total - 1, Math.round(startIdx + clampedDy / ITEM_STRIDE))
          );

          if (nextTarget !== targetIdxRef.current) {
            targetIdxRef.current = nextTarget;
            updateSiblingShifts(startIdx, nextTarget);
            triggerHapticLight();
          }
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
              const shiftAnim = getShiftAnim(blockKey);

              return (
                <Animated.View
                  key={blockKey}
                  style={[
                    styles.blockRow,
                    {
                      backgroundColor: isDragging ? theme.surface : theme.cardBg,
                      borderColor: isDragging ? theme.accent : theme.border,
                      borderWidth: isDragging ? 2 : 1,
                      transform: isDragging
                        ? [{ translateY: dragY }, { scale: 1.02 }]
                        : [{ translateY: shiftAnim }],
                      zIndex: isDragging ? 99 : 1,
                      elevation: isDragging ? 8 : 0,
                      opacity: draggingKey !== null && !isDragging ? 0.9 : 1,
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
    paddingBottom: 24,
  },
  blockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    height: ROW_HEIGHT,
    marginBottom: ROW_MARGIN_BOTTOM,
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
    fontSize: 14,
    lineHeight: 18,
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
