import { useCallback } from 'react';
import { WorkoutBlock } from '../types';

/**
 * Hook réutilisable de manipulation des blocs d'entraînement (single & circuit).
 * Partagé entre live-workout.tsx et template-editor.tsx (MO-07).
 */
export function useWorkoutBlocksManager(
  blocks: WorkoutBlock[],
  onChangeBlocks: (nextBlocks: WorkoutBlock[]) => void
) {
  const moveBlock = useCallback(
    (blockId: string, direction: 'up' | 'down') => {
      const idx = blocks.findIndex((b) => b.id === blockId);
      if (idx === -1) return;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= blocks.length) return;

      const next = [...blocks];
      const [moved] = next.splice(idx, 1);
      next.splice(targetIdx, 0, moved);
      onChangeBlocks(next);
    },
    [blocks, onChangeBlocks]
  );

  const removeBlock = useCallback(
    (blockId: string) => {
      onChangeBlocks(blocks.filter((b) => b.id !== blockId));
    },
    [blocks, onChangeBlocks]
  );

  return {
    moveBlock,
    removeBlock,
  };
}
