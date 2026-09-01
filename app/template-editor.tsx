import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
  StatusBar as RNStatusBar,
  Alert,
  KeyboardAvoidingView,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../src/context/ThemeContext";
import { useWorkout } from "../src/context/WorkoutContext";
import { Button } from "../src/components/UI/Button";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  EXERCISE_DATABASE,
  SharedExercise,
} from "../src/constants/exerciseDatabase";
import { normalizeString } from "../src/utils/stringUtils";
import { CreateExerciseModal } from "../src/components/Workout/CreateExerciseModal";
import {
  WorkoutExercise,
  WorkoutTemplate,
  SetType,
  SET_TYPES_CONFIG,
  WorkoutBlock,
  SingleExerciseBlock,
  CircuitBlock,
  CircuitExerciseItem,
  getTemplateBlocks,
  getSessionBlocks,
  calculateEstimatedWorkoutMinutes,
} from "../src/types";
import {
  ArrowLeft,
  Plus,
  Clock,
  Trash2,
  Search,
  X,
  Check,
  Timer,
  RotateCcw,
  Layers,
  Zap,
  MoreVertical,
  ArrowUp,
  ArrowDown,
  Copy,
  ChevronUp,
  ChevronDown,
  Repeat,
  Sparkles,
  ArrowUpDown,
  ChevronsUp,
  ChevronsDown,
  RefreshCw,
} from "lucide-react-native";
import { ReorderBlocksModal } from "../src/components/Workout/ReorderBlocksModal";

const formatMinutesSeconds = (totalSeconds: number): string => {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

export default function TemplateEditorScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { data, saveTemplate, markFirstSessionCreated, allExercises } =
    useWorkout();
  const router = useRouter();
  const params = useLocalSearchParams();

  const templateIdParam = params.id as string | undefined;
  const fromSessionIdParam = params.fromSessionId as string | undefined;

  const [title, setTitle] = useState("");
  const [defaultRestSeconds, setDefaultRestSeconds] = useState<number>(75);

  // État unifié par blocs (SingleExerciseBlock & CircuitBlock)
  const [selectedBlocks, setSelectedBlocks] = useState<WorkoutBlock[]>([]);

  // Modaux et Cibles
  const [showPickerModal, setShowPickerModal] = useState(false);
  const [showCreateExerciseModal, setShowCreateExerciseModal] = useState(false);
  const [targetCircuitBlockId, setTargetCircuitBlockId] = useState<
    string | null
  >(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<Set<string>>(
    new Set(),
  );

  // Cible de remplacement d'exercice ("Modifier l'exercice")
  const [replaceTarget, setReplaceTarget] = useState<{
    type: "single" | "circuit_exercise";
    blockId: string;
    exIdx?: number;
  } | null>(null);

  // Target set pour modal de type de série: { blockId, setIdx }
  const [activeSetTarget, setActiveSetTarget] = useState<{
    blockId: string;
    setIdx: number;
  } | null>(null);

  // Target circuit item pour modal de type de série: { blockId, itemId }
  const [activeCircuitSetTarget, setActiveCircuitSetTarget] = useState<{
    blockId: string;
    itemId: string;
  } | null>(null);

  // Target circuit pour modal de réorganisation des exercices du circuit uniquement
  const [reorderCircuitBlockId, setReorderCircuitBlockId] = useState<
    string | null
  >(null);

  // Target single exercise pour modal de superset
  const [supersetModalBlockId, setSupersetModalBlockId] = useState<
    string | null
  >(null);

  // Target single block pour le choix de circuit ("Inclure dans le circuit") si multi-circuits
  const [targetIncludeSingleBlockId, setTargetIncludeSingleBlockId] = useState<
    string | null
  >(null);

  // Target block/exercise pour le modal d'options (...)
  const [activeBlockOptions, setActiveBlockOptions] = useState<{
    type: "circuit" | "circuit_exercise" | "single";
    blockId: string;
    exIdx?: number;
  } | null>(null);

  // Modale de réorganisation
  const [showReorderModal, setShowReorderModal] = useState(false);

  // Animation de surbrillance guidée (uniquement si création d'un tout premier programme neuf, pas lors de l'édition ni de la conversion)
  const isGuidedOnboardingCreation =
    !!data?.hasCompletedOnboarding &&
    !data?.hasCreatedFirstSession &&
    !templateIdParam &&
    !fromSessionIdParam;

  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isGuidedOnboardingCreation) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 750,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 750,
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }
  }, [isGuidedOnboardingCreation]);

  // Charger le template existant si édition ou depuis une séance passée
  useEffect(() => {
    if (templateIdParam && data?.templates) {
      const existing = data.templates.find((t) => t.id === templateIdParam);
      if (existing) {
        setTitle(existing.title);
        setDefaultRestSeconds(existing.defaultRestSeconds || 75);
        const blocks = getTemplateBlocks(existing);
        setSelectedBlocks(JSON.parse(JSON.stringify(blocks)));
      }
    } else if (fromSessionIdParam && data?.history) {
      const pastSession = data.history.find((s) => s.id === fromSessionIdParam);
      if (pastSession) {
        setTitle(
          pastSession.title === "Entraînement libre"
            ? "Mon Programme Libre"
            : pastSession.title,
        );
        // On récupère `getSessionBlocks` depuis types. On l'a déjà importé indirectement via getTemplateBlocks ? Wait.
        // Wait, getSessionBlocks is imported but maybe not in this file. Ah, getTemplateBlocks is imported. I will need to import getSessionBlocks if it isn't. Let's check imports.
        // I will add the getSessionBlocks import in a separate replace_file_content if needed.
        // In my current file view, getSessionBlocks is imported? I can check line 33. Yes, getSessionBlocks is already in the imported list from '../src/types'.
        const pastBlocks = getSessionBlocks(pastSession);

        // Dupliquer proprement ces blocs
        const newBlocks = pastBlocks.map((block) => {
          if (block.type === "single") {
            return {
              ...block,
              id: `blk_single_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              exercise: {
                ...block.exercise,
                id: `ex_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                sets: block.exercise.sets.map((set) => ({
                  ...set,
                  id: `s_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                  completed: false,
                })),
              },
            };
          } else if (block.type === "circuit") {
            return {
              ...block,
              id: `blk_circuit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              exercises: block.exercises.map((ex) => ({
                ...ex,
                id: `circ_ex_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              })),
            };
          }
          return block;
        });
        setSelectedBlocks(newBlocks as WorkoutBlock[]);
      }
    }
  }, [templateIdParam, fromSessionIdParam, data?.templates, data?.history]);

  // Durée estimée de la séance
  const estimatedMinutes = calculateEstimatedWorkoutMinutes(selectedBlocks);

  const isSaveDisabled = !title.trim() || selectedBlocks.length === 0;

  // Liste des blocs circuits actuellement dans la séance
  const circuitBlocks = selectedBlocks.filter(
    (b): b is CircuitBlock => b.type === "circuit",
  );

  // Ajustement du temps de repos par défaut
  const handleAdjustDefaultRest = (delta: number) => {
    setDefaultRestSeconds((prev) => Math.max(0, prev + delta));
  };

  // Superset pour exercice individuel
  const handleSetSupersetGroup = (blockId: string, supersetGroup?: string) => {
    setSelectedBlocks((prev) =>
      prev.map((b) => {
        if (b.id === blockId && b.type === "single") {
          return {
            ...b,
            exercise: {
              ...b.exercise,
              supersetGroup: supersetGroup || undefined,
            },
          };
        }
        return b;
      }),
    );
    setSupersetModalBlockId(null);
  };

  const toggleSelectExercise = (exId: string) => {
    if (replaceTarget) {
      setSelectedExerciseIds(new Set([exId]));
      return;
    }
    setSelectedExerciseIds((prev) => {
      const next = new Set(prev);
      if (next.has(exId)) {
        next.delete(exId);
      } else {
        next.add(exId);
      }
      return next;
    });
  };

  const handleClosePickerModal = () => {
    setShowPickerModal(false);
    setTargetCircuitBlockId(null);
    setReplaceTarget(null);
    setSearchQuery("");
    setSelectedExerciseIds(new Set());
  };

  // Ajouter ou remplacer les exercices sélectionnés
  const handleBatchAddSharedExercises = () => {
    if (selectedExerciseIds.size === 0) return;

    const selectedExercises = allExercises.filter((ex) =>
      selectedExerciseIds.has(ex.id),
    );
    if (selectedExercises.length === 0) return;

    // Remplacement d'un exercice existant (en conservant les séries, reps, poids, etc.)
    if (replaceTarget) {
      const newEx = selectedExercises[0];
      if (replaceTarget.type === "single") {
        setSelectedBlocks((prev) =>
          prev.map((b) => {
            if (b.id === replaceTarget.blockId && b.type === "single") {
              return {
                ...b,
                exercise: {
                  ...b.exercise,
                  exerciseId: newEx.id,
                  exerciseName: newEx.name,
                  primaryMuscle: newEx.primaryMuscle,
                  targetMuscles: newEx.targetMuscles,
                },
              };
            }
            return b;
          }),
        );
      } else if (
        replaceTarget.type === "circuit_exercise" &&
        replaceTarget.exIdx !== undefined
      ) {
        setSelectedBlocks((prev) =>
          prev.map((b) => {
            if (b.id === replaceTarget.blockId && b.type === "circuit") {
              const updatedExercises = [...b.exercises];
              if (updatedExercises[replaceTarget.exIdx!]) {
                updatedExercises[replaceTarget.exIdx!] = {
                  ...updatedExercises[replaceTarget.exIdx!],
                  exerciseName: newEx.name,
                  primaryMuscle: newEx.primaryMuscle,
                  targetMuscles: newEx.targetMuscles,
                };
              }
              return {
                ...b,
                exercises: updatedExercises,
              };
            }
            return b;
          }),
        );
      }
      handleClosePickerModal();
      return;
    }

    if (targetCircuitBlockId) {
      const newCircuitItems: CircuitExerciseItem[] = selectedExercises.map(
        (ex, idx) => ({
          id: `circ_ex_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
          exerciseName: ex.name,
          primaryMuscle: ex.primaryMuscle,
          targetMuscles: ex.targetMuscles,
          targetValue: 12,
          targetType: "reps",
        }),
      );

      setSelectedBlocks((prev) =>
        prev.map((b) => {
          if (b.id === targetCircuitBlockId && b.type === "circuit") {
            return {
              ...b,
              exercises: [...b.exercises, ...newCircuitItems],
            };
          }
          return b;
        }),
      );
    } else {
      const newBlocks: SingleExerciseBlock[] = selectedExercises.map(
        (ex, idx) => {
          const uniqueId = `${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`;
          const newEx: WorkoutExercise = {
            id: `ex_${uniqueId}`,
            exerciseId: ex.id,
            exerciseName: ex.name,
            primaryMuscle: ex.primaryMuscle,
            targetMuscles: ex.targetMuscles,
            restSeconds: defaultRestSeconds || ex.defaultRestSeconds || 75,
            sets: [
              {
                id: `s1_${uniqueId}`,
                setNumber: 1,
                type: "normal",
                rir: undefined,
                completed: false,
              },
              {
                id: `s2_${uniqueId}`,
                setNumber: 2,
                type: "normal",
                rir: undefined,
                completed: false,
              },
              {
                id: `s3_${uniqueId}`,
                setNumber: 3,
                type: "normal",
                rir: undefined,
                completed: false,
              },
            ],
          };
          return {
            id: `blk_single_${newEx.id}`,
            type: "single",
            exercise: newEx,
          };
        },
      );

      setSelectedBlocks((prev) => [...prev, ...newBlocks]);
    }

    handleClosePickerModal();
  };

  // Créer un nouveau conteneur Circuit ([+ Circuit])
  const handleAddCircuitContainer = () => {
    const circuitCount = circuitBlocks.length + 1;
    const newCircuitBlock: CircuitBlock = {
      id: `blk_circuit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: "circuit",
      title: `Circuit ${circuitCount}`,
      rounds: 3,
      restBetweenRoundsSeconds: 90,
      exercises: [],
    };
    setSelectedBlocks((prev) => [...prev, newCircuitBlock]);
  };

  // Contrôles sur le conteneur circuit (titre, type, tours, amrap, repos)
  const handleUpdateCircuitTitle = (blockId: string, newTitle: string) => {
    setSelectedBlocks((prev) =>
      prev.map((b) => {
        if (b.id === blockId && b.type === "circuit") {
          return { ...b, title: newTitle };
        }
        return b;
      }),
    );
  };

  const handleSetCircuitType = (blockId: string, type: "rounds" | "amrap") => {
    setSelectedBlocks((prev) =>
      prev.map((b) => {
        if (b.id === blockId && b.type === "circuit") {
          return {
            ...b,
            circuitType: type,
            amrapDurationMinutes: b.amrapDurationMinutes || 12,
          };
        }
        return b;
      }),
    );
  };

  const handleAdjustCircuitAmrapDuration = (
    blockId: string,
    deltaMinutes: number,
  ) => {
    setSelectedBlocks((prev) =>
      prev.map((b) => {
        if (b.id === blockId && b.type === "circuit") {
          const current = b.amrapDurationMinutes || 12;
          return {
            ...b,
            amrapDurationMinutes: Math.max(1, current + deltaMinutes),
          };
        }
        return b;
      }),
    );
  };

  const handleAdjustCircuitRounds = (blockId: string, delta: number) => {
    setSelectedBlocks((prev) =>
      prev.map((b) => {
        if (b.id === blockId && b.type === "circuit") {
          return { ...b, rounds: Math.max(1, b.rounds + delta) };
        }
        return b;
      }),
    );
  };

  const handleAdjustCircuitRest = (blockId: string, delta: number) => {
    setSelectedBlocks((prev) =>
      prev.map((b) => {
        if (b.id === blockId && b.type === "circuit") {
          return {
            ...b,
            restBetweenRoundsSeconds: Math.max(
              0,
              b.restBetweenRoundsSeconds + delta,
            ),
          };
        }
        return b;
      }),
    );
  };

  // Modification d'un exercice dans le circuit (valeur et type)
  const handleUpdateCircuitItemValue = (
    blockId: string,
    exId: string,
    valStr: string,
  ) => {
    const val = parseInt(valStr.replace(/[^0-9]/g, ""), 10) || 0;
    setSelectedBlocks((prev) =>
      prev.map((b) => {
        if (b.id === blockId && b.type === "circuit") {
          return {
            ...b,
            exercises: b.exercises.map((item) =>
              item.id === exId ? { ...item, targetValue: val } : item,
            ),
          };
        }
        return b;
      }),
    );
  };

  const handleToggleCircuitItemType = (blockId: string, exId: string) => {
    setSelectedBlocks((prev) =>
      prev.map((b) => {
        if (b.id === blockId && b.type === "circuit") {
          return {
            ...b,
            exercises: b.exercises.map((item) =>
              item.id === exId
                ? {
                    ...item,
                    targetType: item.targetType === "reps" ? "time" : "reps",
                  }
                : item,
            ),
          };
        }
        return b;
      }),
    );
  };

  const handleCycleCircuitItemSetType = (blockId: string, exId: string) => {
    const typesOrder: SetType[] = [
      "normal",
      "failure",
      "amrap",
      "drop",
      "warmup",
    ];
    setSelectedBlocks((prev) =>
      prev.map((b) => {
        if (b.id === blockId && b.type === "circuit") {
          return {
            ...b,
            exercises: b.exercises.map((item) => {
              if (item.id === exId) {
                const currentType = item.setType || "normal";
                const nextIdx =
                  (typesOrder.indexOf(currentType) + 1) % typesOrder.length;
                return { ...item, setType: typesOrder[nextIdx] };
              }
              return item;
            }),
          };
        }
        return b;
      }),
    );
  };

  const handleUpdateCircuitItemSetType = (
    blockId: string,
    itemId: string,
    newType: SetType,
  ) => {
    setSelectedBlocks((prev) =>
      prev.map((b) => {
        if (b.id === blockId && b.type === "circuit") {
          return {
            ...b,
            exercises: b.exercises.map((item) =>
              item.id === itemId ? { ...item, setType: newType } : item,
            ),
          };
        }
        return b;
      }),
    );
    setActiveCircuitSetTarget(null);
  };

  // Inclure un exercice individuel dans un circuit
  const handleIncludeInCircuit = (
    singleBlockId: string,
    targetCircuitId?: string,
  ) => {
    const singleBlock = selectedBlocks.find(
      (b): b is SingleExerciseBlock =>
        b.id === singleBlockId && b.type === "single",
    );
    if (!singleBlock) return;

    let destCircuitId = targetCircuitId;
    if (!destCircuitId) {
      if (circuitBlocks.length === 1) {
        destCircuitId = circuitBlocks[0].id;
      } else if (circuitBlocks.length > 1) {
        setTargetIncludeSingleBlockId(singleBlockId);
        return;
      } else {
        return;
      }
    }

    const firstSet = singleBlock.exercise.sets[0];
    const targetVal = firstSet?.reps || 12;
    const targetType: "reps" | "time" =
      firstSet?.durationSeconds && firstSet.durationSeconds > 0
        ? "time"
        : "reps";

    const newCircuitItem: CircuitExerciseItem = {
      id: `circ_ex_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      exerciseName: singleBlock.exercise.exerciseName,
      primaryMuscle: singleBlock.exercise.primaryMuscle,
      targetMuscles: singleBlock.exercise.targetMuscles,
      targetValue: targetVal,
      targetType,
    };

    setSelectedBlocks((prev) => {
      const filtered = prev.filter((b) => b.id !== singleBlockId);
      return filtered.map((b) => {
        if (b.id === destCircuitId && b.type === "circuit") {
          return {
            ...b,
            exercises: [...b.exercises, newCircuitItem],
          };
        }
        return b;
      });
    });

    setTargetIncludeSingleBlockId(null);
  };

  // --- ACTIONS DU MENU D'OPTIONS (...) ---

  // Monter / Descendre un bloc dans selectedBlocks
  const handleMoveBlock = (
    blockId: string,
    direction: "up" | "down" | "top" | "bottom",
  ) => {
    const blockIdx = selectedBlocks.findIndex((b) => b.id === blockId);
    if (blockIdx < 0) return;

    let newIndex = blockIdx;
    if (direction === "up") newIndex = blockIdx - 1;
    else if (direction === "down") newIndex = blockIdx + 1;
    else if (direction === "top") newIndex = 0;
    else if (direction === "bottom") newIndex = selectedBlocks.length - 1;

    if (
      newIndex < 0 ||
      newIndex >= selectedBlocks.length ||
      newIndex === blockIdx
    )
      return;

    setSelectedBlocks((prev) => {
      const updated = [...prev];
      const [movedBlock] = updated.splice(blockIdx, 1);
      updated.splice(newIndex, 0, movedBlock);
      return updated;
    });
    setActiveBlockOptions(null);
  };

  // Dupliquer un bloc circuit
  const handleDuplicateCircuitBlock = (blockId: string) => {
    const blockIdx = selectedBlocks.findIndex((b) => b.id === blockId);
    if (blockIdx < 0) return;
    const targetBlock = selectedBlocks[blockIdx];
    if (targetBlock.type !== "circuit") return;

    const dupBlock: CircuitBlock = {
      ...JSON.parse(JSON.stringify(targetBlock)),
      id: `blk_circuit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: `${targetBlock.title} (Copie)`,
      exercises: targetBlock.exercises.map((item: CircuitExerciseItem) => ({
        ...item,
        id: `circ_ex_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      })),
    };

    setSelectedBlocks((prev) => {
      const updated = [...prev];
      updated.splice(blockIdx + 1, 0, dupBlock);
      return updated;
    });
    setActiveBlockOptions(null);
  };

  // Supprimer un bloc circuit
  const handleDeleteCircuitBlock = (blockId: string) => {
    setSelectedBlocks((prev) => prev.filter((b) => b.id !== blockId));
    setActiveBlockOptions(null);
  };

  // Monter / Descendre un exercice dans un circuit
  const handleMoveCircuitExercise = (
    blockId: string,
    exIdx: number,
    direction: "up" | "down",
  ) => {
    setSelectedBlocks((prev) =>
      prev.map((b) => {
        if (b.id === blockId && b.type === "circuit") {
          const newIdx = direction === "up" ? exIdx - 1 : exIdx + 1;
          if (newIdx < 0 || newIdx >= b.exercises.length) return b;
          const updatedEx = [...b.exercises];
          const temp = updatedEx[exIdx];
          updatedEx[exIdx] = updatedEx[newIdx];
          updatedEx[newIdx] = temp;
          return { ...b, exercises: updatedEx };
        }
        return b;
      }),
    );
    setActiveBlockOptions(null);
  };

  // Dupliquer un exercice au sein d'un circuit
  const handleDuplicateCircuitExercise = (blockId: string, exIdx: number) => {
    setSelectedBlocks((prev) =>
      prev.map((b) => {
        if (b.id === blockId && b.type === "circuit") {
          const targetItem = b.exercises[exIdx];
          if (!targetItem) return b;
          const dupItem: CircuitExerciseItem = {
            ...targetItem,
            id: `circ_ex_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            exerciseName: `${targetItem.exerciseName} (Copie)`,
          };
          const updatedEx = [...b.exercises];
          updatedEx.splice(exIdx + 1, 0, dupItem);
          return { ...b, exercises: updatedEx };
        }
        return b;
      }),
    );
    setActiveBlockOptions(null);
  };

  // Convertir un exercice de circuit en exercice individuel
  const handleConvertCircuitExToSingle = (blockId: string, exIdx: number) => {
    const blockIdx = selectedBlocks.findIndex((b) => b.id === blockId);
    if (blockIdx < 0) return;
    const circuitBlock = selectedBlocks[blockIdx];
    if (circuitBlock.type !== "circuit") return;

    const item = circuitBlock.exercises[exIdx];
    if (!item) return;

    const newSingleEx: WorkoutExercise = {
      id: `ex_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      exerciseId: item.exerciseName.toLowerCase().replace(/\s+/g, "_"),
      exerciseName: item.exerciseName,
      primaryMuscle: item.primaryMuscle,
      targetMuscles: item.targetMuscles || [],
      restSeconds: defaultRestSeconds,
      sets: [
        {
          id: `s1_${Date.now()}`,
          setNumber: 1,
          type: "normal",
          reps: item.targetType === "reps" ? item.targetValue : undefined,
          durationSeconds:
            item.targetType === "time" ? item.targetValue : undefined,
          rir: undefined,
          completed: false,
        },
      ],
    };

    const newSingleBlock: SingleExerciseBlock = {
      id: `blk_single_${newSingleEx.id}`,
      type: "single",
      exercise: newSingleEx,
    };

    setSelectedBlocks((prev) => {
      const updated = prev.map((b) => {
        if (b.id === blockId && b.type === "circuit") {
          return {
            ...b,
            exercises: b.exercises.filter((_, i) => i !== exIdx),
          };
        }
        return b;
      });
      updated.splice(blockIdx + 1, 0, newSingleBlock);
      return updated;
    });

    setActiveBlockOptions(null);
  };

  // Supprimer un exercice du circuit
  const handleDeleteCircuitExercise = (blockId: string, exIdx: number) => {
    setSelectedBlocks((prev) =>
      prev.map((b) => {
        if (b.id === blockId && b.type === "circuit") {
          return {
            ...b,
            exercises: b.exercises.filter((_, i) => i !== exIdx),
          };
        }
        return b;
      }),
    );
    setActiveBlockOptions(null);
  };

  // --- ACTIONS SUR EXERCICES INDIVIDUELS ---

  const handleDuplicateSingleBlock = (blockId: string) => {
    const blockIdx = selectedBlocks.findIndex((b) => b.id === blockId);
    if (blockIdx < 0) return;
    const targetBlock = selectedBlocks[blockIdx];
    if (targetBlock.type !== "single") return;

    const dupEx: WorkoutExercise = {
      ...JSON.parse(JSON.stringify(targetBlock.exercise)),
      id: `ex_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      exerciseName: `${targetBlock.exercise.exerciseName} (Copie)`,
    };
    const dupBlock: SingleExerciseBlock = {
      id: `blk_single_${dupEx.id}`,
      type: "single",
      exercise: dupEx,
    };

    setSelectedBlocks((prev) => {
      const updated = [...prev];
      updated.splice(blockIdx + 1, 0, dupBlock);
      return updated;
    });
    setActiveBlockOptions(null);
  };

  const handleRemoveSingleBlock = (blockId: string) => {
    setSelectedBlocks((prev) => prev.filter((b) => b.id !== blockId));
    setActiveBlockOptions(null);
  };

  const handleAdjustExerciseRest = (blockId: string, delta: number) => {
    setSelectedBlocks((prev) =>
      prev.map((b) => {
        if (b.id === blockId && b.type === "single") {
          const currentRest = b.exercise.restSeconds ?? defaultRestSeconds;
          return {
            ...b,
            exercise: {
              ...b.exercise,
              restSeconds: Math.max(0, currentRest + delta),
            },
          };
        }
        return b;
      }),
    );
  };

  const handleResetExerciseRest = (blockId: string) => {
    setSelectedBlocks((prev) =>
      prev.map((b) => {
        if (b.id === blockId && b.type === "single") {
          return {
            ...b,
            exercise: { ...b.exercise, restSeconds: defaultRestSeconds },
          };
        }
        return b;
      }),
    );
  };

  const handleAddSetToSingle = (blockId: string) => {
    setSelectedBlocks((prev) =>
      prev.map((b) => {
        if (b.id === blockId && b.type === "single") {
          const newSetNumber = b.exercise.sets.length + 1;
          const newSet = {
            id: `s_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            setNumber: newSetNumber,
            type: "normal" as SetType,
            rir: undefined,
            completed: false,
          };
          return {
            ...b,
            exercise: {
              ...b.exercise,
              sets: [...b.exercise.sets, newSet],
            },
          };
        }
        return b;
      }),
    );
  };

  const handleRemoveSetFromSingle = (blockId: string, setIdx: number) => {
    setSelectedBlocks((prev) =>
      prev.map((b) => {
        if (b.id === blockId && b.type === "single") {
          if (b.exercise.sets.length <= 1) return b;
          const updatedSets = b.exercise.sets
            .filter((_, i) => i !== setIdx)
            .map((s, i) => ({ ...s, setNumber: i + 1 }));
          return {
            ...b,
            exercise: { ...b.exercise, sets: updatedSets },
          };
        }
        return b;
      }),
    );
  };

  const handleUpdateSetType = (
    blockId: string,
    setIdx: number,
    newType: SetType,
  ) => {
    setSelectedBlocks((prev) =>
      prev.map((b) => {
        if (b.id === blockId && b.type === "single") {
          const updatedSets = [...b.exercise.sets];
          updatedSets[setIdx] = { ...updatedSets[setIdx], type: newType };
          return {
            ...b,
            exercise: { ...b.exercise, sets: updatedSets },
          };
        }
        return b;
      }),
    );
    setActiveSetTarget(null);
  };

  // Enregistrement du programme
  const handleSave = async () => {
    if (!title.trim() || selectedBlocks.length === 0) {
      Alert.alert(
        "Information manquante",
        "Veuillez entrer un nom de séance et ajouter au moins un exercice ou circuit.",
      );
      return;
    }

    const singleExercises: WorkoutExercise[] = selectedBlocks
      .filter((b): b is SingleExerciseBlock => b.type === "single")
      .map((b) => b.exercise);

    const isAnyCircuit = selectedBlocks.some((b) => b.type === "circuit");
    const firstCircuitBlock = selectedBlocks.find(
      (b): b is CircuitBlock => b.type === "circuit",
    );

    const existingTpl = templateIdParam
      ? data?.templates?.find((t) => t.id === templateIdParam)
      : undefined;

    const newTemplate: WorkoutTemplate = {
      id: templateIdParam || `tpl_${Date.now()}`,
      title: title.trim(),
      createdAt: existingTpl?.createdAt || new Date().toISOString(),
      defaultRestSeconds,
      blocks: selectedBlocks,
      exercises: singleExercises,
      isCircuit: isAnyCircuit,
      circuitRounds: firstCircuitBlock?.rounds ?? 3,
      restBetweenRoundsSeconds:
        firstCircuitBlock?.restBetweenRoundsSeconds ?? 90,
    };

    await saveTemplate(newTemplate);
    if (markFirstSessionCreated) {
      await markFirstSessionCreated();
    }
    router.back();
  };

  // Filtrage et tri de la base d'exercices (ordre alphabétique + coche prioritaire)
  const filteredDatabase = useMemo(() => {
    const q = normalizeString(searchQuery);
    if (!q) {
      const selected = allExercises
        .filter((ex) => selectedExerciseIds.has(ex.id))
        .sort((a, b) =>
          a.name.localeCompare(b.name, "fr", { sensitivity: "base" }),
        );
      const unselected = allExercises
        .filter((ex) => !selectedExerciseIds.has(ex.id))
        .sort((a, b) =>
          a.name.localeCompare(b.name, "fr", { sensitivity: "base" }),
        );
      return [...selected, ...unselected];
    }
    return allExercises
      .filter(
        (ex) =>
          normalizeString(ex.name).includes(q) ||
          normalizeString(ex.primaryMuscle).includes(q) ||
          normalizeString(ex.category).includes(q) ||
          ex.targetMuscles.some((m) => normalizeString(m).includes(q)),
      )
      .sort((a, b) =>
        a.name.localeCompare(b.name, "fr", { sensitivity: "base" }),
      );
  }, [allExercises, searchQuery, selectedExerciseIds]);

  return (
    <View
      style={[
        styles.safeArea,
        {
          backgroundColor: theme.background,
        },
      ]}
    >
      {/* Barre de navigation haute */}
      <View
        style={[
          styles.topBar,
          {
            borderBottomColor: theme.border,
            paddingTop:
              Math.max(
                insets.top,
                Platform.OS === "android"
                  ? RNStatusBar.currentHeight || 24
                  : 16,
              ) + 8,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={20} color={theme.text} />
          <Text style={[styles.backText, { color: theme.text }]}>Retour</Text>
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: theme.text }]}>
          {templateIdParam ? "Modifier la séance" : "Créer une séance"}
        </Text>
        <View
          style={{
            flexDirection: "row",
            width: 60,
            justifyContent: "flex-end",
          }}
        >
          <TouchableOpacity
            onPress={() => setShowReorderModal(true)}
            style={{ padding: 4 }}
          >
            <ArrowUpDown size={20} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Card d'Onboarding Pas-à-Pas Placée en Haut de Page */}
        {isGuidedOnboardingCreation && (
          <View
            style={[
              styles.floatingOnboardingCard,
              { backgroundColor: theme.cardBg, borderColor: theme.accent },
            ]}
          >
            <View style={styles.floatingOnboardingHeader}>
              <Sparkles
                size={16}
                color={theme.accent}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.floatingOnboardingTitle,
                  { color: theme.accent },
                ]}
              >
                Tutoriel de création de séance
              </Text>
            </View>
            <Text
              style={[styles.floatingOnboardingText, { color: theme.text }]}
            >
              {!title.trim()
                ? "1. Entrez le nom de votre programme dans le champ 'Nom du programme' ci-dessous (mis en surbrillance)."
                : selectedBlocks.length === 0
                  ? "2. Cliquez sur le bouton '+ Exercice' en bas pour choisir les exercices de votre séance."
                  : "3. Prenez ceux que vous voulez, modifiez le temps de repos ou les séries si besoin, puis cliquez sur 'Enregistrer' !"}
            </Text>
          </View>
        )}

        {/* Nom du programme */}
        <Text style={[styles.label, { color: theme.text }]}>
          Nom du programme
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              color: theme.text,
              borderColor: theme.border,
              backgroundColor: theme.surface,
            },
            isGuidedOnboardingCreation &&
              !title.trim() && {
                borderColor: theme.accent,
                borderWidth: 2.5,
              },
          ]}
          placeholder="ex: Ma Séance FullBody..."
          placeholderTextColor={theme.textMuted}
          value={title}
          onChangeText={setTitle}
        />

        {/* Temps de repos par défaut de la séance */}
        <View
          style={[
            styles.defaultRestCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.rowAlign}>
            <Timer size={18} color={theme.accent} style={{ marginRight: 6 }} />
            <Text style={[styles.defaultRestTitle, { color: theme.text }]}>
              Repos par défaut de la séance
            </Text>
          </View>

          <View style={styles.restStepper}>
            <TouchableOpacity
              style={[
                styles.stepperBtn,
                { backgroundColor: theme.cardBg, borderColor: theme.border },
              ]}
              onPress={() => handleAdjustDefaultRest(-15)}
            >
              <Text style={[styles.stepperBtnText, { color: theme.text }]}>
                -15s
              </Text>
            </TouchableOpacity>
            <Text style={[styles.restValueText, { color: theme.accent }]}>
              {defaultRestSeconds}s
            </Text>
            <TouchableOpacity
              style={[
                styles.stepperBtn,
                { backgroundColor: theme.cardBg, borderColor: theme.border },
              ]}
              onPress={() => handleAdjustDefaultRest(15)}
            >
              <Text style={[styles.stepperBtnText, { color: theme.text }]}>
                +15s
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.defaultRestHint, { color: theme.textMuted }]}>
            Ce temps sera attribué par défaut aux nouveaux exercices
            individuels.
          </Text>
        </View>

        {/* Durée estimée */}
        <View
          style={[
            styles.estimatedBox,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Clock size={18} color={theme.accent} style={{ marginRight: 8 }} />
          <Text style={[styles.estimatedText, { color: theme.text }]}>
            Durée estimée :{" "}
            <Text style={{ fontWeight: "900", color: theme.accent }}>
              ~ {estimatedMinutes} min
            </Text>
          </Text>
        </View>

        {/* En-tête des Blocs */}
        <Text
          style={[
            styles.label,
            { color: theme.text, marginTop: 18, marginBottom: 8 },
          ]}
        >
          Structure de la séance ({selectedBlocks.length} bloc
          {selectedBlocks.length > 1 ? "s" : ""})
        </Text>

        {/* LISTE SÉQUENTIELLE DES BLOCS */}
        {selectedBlocks.map((block, blockIdx) => {
          // --- CASE 1: CARTE CONTENEUR CIRCUIT ---
          if (block.type === "circuit") {
            return (
              <View
                key={block.id}
                style={[
                  styles.circuitContainer,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                {/* En-tête du Circuit */}
                <View style={styles.circuitHeaderRow}>
                  <View style={[styles.rowAlign, { flex: 1, marginRight: 8 }]}>
                    {/* Badge 'C' */}
                    <View
                      style={[
                        styles.circuitBadgeC,
                        { backgroundColor: theme.accent },
                      ]}
                    >
                      <Text style={styles.circuitBadgeCText}>C</Text>
                    </View>

                    {/* Champ de Saisie du Nom du Circuit */}
                    <TextInput
                      style={[
                        styles.circuitTitleInput,
                        {
                          color: theme.text,
                          backgroundColor: theme.cardBg,
                          borderColor: theme.border,
                        },
                      ]}
                      value={block.title}
                      placeholder={`Circuit ${blockIdx + 1}`}
                      placeholderTextColor={theme.textMuted}
                      onChangeText={(newTitle) =>
                        handleUpdateCircuitTitle(block.id, newTitle)
                      }
                    />
                  </View>

                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    {/* Switcher Round vs AMRAP */}
                    <View
                      style={[
                        styles.typeToggleContainer,
                        { backgroundColor: theme.surface, marginRight: 6 },
                      ]}
                    >
                      <TouchableOpacity
                        style={[
                          styles.typeToggleBtn,
                          block.circuitType !== "amrap" && {
                            backgroundColor: theme.accent,
                          },
                        ]}
                        onPress={() => handleSetCircuitType(block.id, "rounds")}
                      >
                        <Text
                          style={[
                            styles.typeToggleText,
                            {
                              color:
                                block.circuitType !== "amrap"
                                  ? "#FFFFFF"
                                  : theme.textMuted,
                            },
                          ]}
                        >
                          Round
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.typeToggleBtn,
                          block.circuitType === "amrap" && {
                            backgroundColor: theme.accent,
                          },
                        ]}
                        onPress={() => handleSetCircuitType(block.id, "amrap")}
                      >
                        <Text
                          style={[
                            styles.typeToggleText,
                            {
                              color:
                                block.circuitType === "amrap"
                                  ? "#FFFFFF"
                                  : theme.textMuted,
                            },
                          ]}
                        >
                          AMRAP
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Bouton Réorganiser les exercices de CE circuit uniquement */}
                    <TouchableOpacity
                      style={[styles.moreOptionsBtn, { marginRight: 4 }]}
                      onPress={() => setReorderCircuitBlockId(block.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityLabel="Réorganiser les exercices du circuit"
                    >
                      <ArrowUpDown size={18} color={theme.accent} />
                    </TouchableOpacity>

                    {/* Bouton Options ... pour le circuit */}
                    <TouchableOpacity
                      style={styles.moreOptionsBtn}
                      onPress={() =>
                        setActiveBlockOptions({
                          type: "circuit",
                          blockId: block.id,
                        })
                      }
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <MoreVertical size={20} color={theme.text} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Réglage du nombre de tours (Round) ou de la durée (AMRAP) */}
                <View
                  style={[
                    styles.circuitRestRow,
                    { backgroundColor: theme.surface, marginBottom: 6 },
                  ]}
                >
                  {block.circuitType === "amrap" ? (
                    <>
                      <View style={styles.rowAlign}>
                        <Clock
                          size={14}
                          color={theme.textMuted}
                          style={{ marginRight: 6 }}
                        />
                        <Text
                          style={[
                            styles.circuitRestLabel,
                            { color: theme.textMuted },
                          ]}
                        >
                          Durée AMRAP ·{" "}
                          <Text style={{ fontWeight: "900" }}>
                            {block.amrapDurationMinutes || 12} min
                          </Text>
                        </Text>
                      </View>
                      <View style={styles.rowAlign}>
                        <TouchableOpacity
                          style={[
                            styles.smallStepperBtn,
                            {
                              backgroundColor: theme.cardBg,
                              borderColor: theme.border,
                            },
                          ]}
                          onPress={() =>
                            handleAdjustCircuitAmrapDuration(block.id, -1)
                          }
                        >
                          <Text
                            style={[
                              styles.smallStepperText,
                              { color: theme.text },
                            ]}
                          >
                            -1 min
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.smallStepperBtn,
                            {
                              backgroundColor: theme.cardBg,
                              borderColor: theme.border,
                              marginLeft: 4,
                            },
                          ]}
                          onPress={() =>
                            handleAdjustCircuitAmrapDuration(block.id, 1)
                          }
                        >
                          <Text
                            style={[
                              styles.smallStepperText,
                              { color: theme.text },
                            ]}
                          >
                            +1 min
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  ) : (
                    <>
                      <View style={styles.rowAlign}>
                        <Repeat
                          size={14}
                          color={theme.textMuted}
                          style={{ marginRight: 6 }}
                        />
                        <Text
                          style={[
                            styles.circuitRestLabel,
                            { color: theme.textMuted },
                          ]}
                        >
                          Tours ·{" "}
                          <Text style={{ fontWeight: "900" }}>
                            {block.rounds} tour{block.rounds > 1 ? "s" : ""}
                          </Text>
                        </Text>
                      </View>
                      <View style={styles.rowAlign}>
                        <TouchableOpacity
                          style={[
                            styles.smallStepperBtn,
                            {
                              backgroundColor: theme.cardBg,
                              borderColor: theme.border,
                            },
                          ]}
                          onPress={() =>
                            handleAdjustCircuitRounds(block.id, -1)
                          }
                        >
                          <Text
                            style={[
                              styles.smallStepperText,
                              { color: theme.text },
                            ]}
                          >
                            -1
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.smallStepperBtn,
                            {
                              backgroundColor: theme.cardBg,
                              borderColor: theme.border,
                              marginLeft: 4,
                            },
                          ]}
                          onPress={() => handleAdjustCircuitRounds(block.id, 1)}
                        >
                          <Text
                            style={[
                              styles.smallStepperText,
                              { color: theme.text },
                            ]}
                          >
                            +1
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </View>

                {/* Repos entre les tours · M:SS avec Steppers -15s / +15s (Masqué si AMRAP) */}
                {block.circuitType !== "amrap" && (
                  <View
                    style={[
                      styles.circuitRestRow,
                      { backgroundColor: theme.surface },
                    ]}
                  >
                    <View style={styles.rowAlign}>
                      <Timer
                        size={14}
                        color={theme.textMuted}
                        style={{ marginRight: 6 }}
                      />
                      <Text
                        style={[
                          styles.circuitRestLabel,
                          { color: theme.textMuted },
                        ]}
                      >
                        Repos entre les tours ·{" "}
                        <Text style={{ fontWeight: "900" }}>
                          {formatMinutesSeconds(block.restBetweenRoundsSeconds)}
                        </Text>
                      </Text>
                    </View>
                    <View style={styles.rowAlign}>
                      <TouchableOpacity
                        style={[
                          styles.smallStepperBtn,
                          {
                            backgroundColor: theme.cardBg,
                            borderColor: theme.border,
                          },
                        ]}
                        onPress={() => handleAdjustCircuitRest(block.id, -15)}
                      >
                        <Text
                          style={[
                            styles.smallStepperText,
                            { color: theme.text },
                          ]}
                        >
                          -15s
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.smallStepperBtn,
                          {
                            backgroundColor: theme.cardBg,
                            borderColor: theme.border,
                            marginLeft: 4,
                          },
                        ]}
                        onPress={() => handleAdjustCircuitRest(block.id, 15)}
                      >
                        <Text
                          style={[
                            styles.smallStepperText,
                            { color: theme.text },
                          ]}
                        >
                          +15s
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Liste compacte des exercices du circuit */}
                <View style={styles.circuitItemsContainer}>
                  {block.exercises.map((item, itemIdx) => {
                    const letter = String.fromCharCode(65 + itemIdx);
                    return (
                      <View
                        key={item.id}
                        style={[
                          styles.circuitItemCard,
                          {
                            backgroundColor: theme.cardBg,
                            borderColor: theme.border,
                          },
                        ]}
                      >
                        {/* Badge Lettre A, B, C... */}
                        <View
                          style={[
                            styles.letterBadge,
                            { backgroundColor: theme.accent },
                          ]}
                        >
                          <Text style={styles.letterBadgeText}>{letter}</Text>
                        </View>

                        {/* Nom de l'exercice */}
                        <Text
                          style={[
                            styles.circuitItemName,
                            { color: theme.text },
                          ]}
                          numberOfLines={1}
                        >
                          {item.exerciseName}
                        </Text>

                        {/* Champ numérique targetValue */}
                        <TextInput
                          style={[
                            styles.targetValueInput,
                            {
                              color: theme.text,
                              backgroundColor: theme.surface,
                              borderColor: theme.border,
                            },
                          ]}
                          keyboardType="numeric"
                          value={String(item.targetValue)}
                          onChangeText={(val) =>
                            handleUpdateCircuitItemValue(block.id, item.id, val)
                          }
                        />

                        {/* Basculeur [reps] / [s] */}
                        <TouchableOpacity
                          style={[
                            styles.targetTypeToggle,
                            {
                              backgroundColor:
                                item.targetType === "reps"
                                  ? "#618764"
                                  : "#D97706",
                            },
                          ]}
                          onPress={() =>
                            handleToggleCircuitItemType(block.id, item.id)
                          }
                        >
                          <Text style={styles.targetTypeToggleText}>
                            {item.targetType === "reps" ? "reps" : "s"}
                          </Text>
                        </TouchableOpacity>

                        {/* Badge Type de Série (Normale, Échec, AMRAP, Drop Set, Échauffement) */}
                        {(() => {
                          const itemSetType = item.setType || "normal";
                          const typeCfg =
                            SET_TYPES_CONFIG[itemSetType] ||
                            SET_TYPES_CONFIG.normal;
                          return (
                            <TouchableOpacity
                              activeOpacity={0.8}
                              style={[
                                styles.targetTypeToggle,
                                {
                                  backgroundColor: typeCfg.color,
                                  marginLeft: 4,
                                  paddingHorizontal: 6,
                                },
                              ]}
                              onPress={() =>
                                setActiveCircuitSetTarget({
                                  blockId: block.id,
                                  itemId: item.id,
                                })
                              }
                            >
                              <Text style={styles.targetTypeToggleText}>
                                {typeCfg.code} • {typeCfg.label.split(" ")[0]}
                              </Text>
                            </TouchableOpacity>
                          );
                        })()}

                        {/* Bouton Options ... pour cet exercice du circuit */}
                        <TouchableOpacity
                          style={styles.moreOptionsBtn}
                          onPress={() =>
                            setActiveBlockOptions({
                              type: "circuit_exercise",
                              blockId: block.id,
                              exIdx: itemIdx,
                            })
                          }
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <MoreVertical size={18} color={theme.textMuted} />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>

                {/* Bouton [+ Ajouter un exercice au circuit] */}
                <TouchableOpacity
                  style={[
                    styles.addCircuitExerciseBtn,
                    {
                      borderColor: theme.border,
                      backgroundColor: theme.surface,
                    },
                  ]}
                  onPress={() => {
                    setTargetCircuitBlockId(block.id);
                    setShowPickerModal(true);
                  }}
                >
                  <Plus
                    size={16}
                    color={theme.accent}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.addCircuitExerciseBtnText,
                      { color: theme.accent },
                    ]}
                  >
                    Ajouter un exercice au circuit
                  </Text>
                </TouchableOpacity>
              </View>
            );
          }

          // --- CASE 2: CARTE EXERCICE INDIVIDUEL (SingleExerciseBlock) ---
          const ex = block.exercise;
          const exRest = ex.restSeconds ?? defaultRestSeconds;

          return (
            <View
              key={block.id}
              style={[
                styles.exCard,
                { backgroundColor: theme.cardBg, borderColor: theme.border },
                ex.supersetGroup
                  ? { borderColor: theme.supersetTag, borderWidth: 2 }
                  : undefined,
              ]}
            >
              {/* Badge Groupe Superset */}
              {ex.supersetGroup && (
                <View
                  style={[
                    styles.supersetHeader,
                    { backgroundColor: theme.supersetTag },
                  ]}
                >
                  <Layers size={14} color="#FFFFFF" />
                  <Text style={styles.supersetText}>{ex.supersetGroup}</Text>
                </View>
              )}

              {/* En-tête de l'exercice individuel */}
              <View style={styles.exHeader}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.exName, { color: theme.text }]}>
                    {ex.exerciseName}
                  </Text>
                  <Text style={[styles.exMuscle, { color: theme.textMuted }]}>
                    {ex.primaryMuscle}
                  </Text>
                </View>

                <View style={styles.exHeaderActions}>
                  {/* Bouton [Inclure dans le circuit] si au moins un bloc circuit existe */}
                  {circuitBlocks.length > 0 && (
                    <TouchableOpacity
                      style={[
                        styles.includeCircuitBtn,
                        {
                          borderColor: theme.border,
                          backgroundColor: theme.surface,
                        },
                      ]}
                      onPress={() => handleIncludeInCircuit(block.id)}
                    >
                      <Plus
                        size={14}
                        color={theme.accent}
                        style={{ marginRight: 0 }}
                      />
                      <Text
                        style={[
                          styles.includeCircuitBtnText,
                          { color: theme.accent },
                        ]}
                      >
                        Circuit
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* Bouton Superset */}
                  <TouchableOpacity
                    style={styles.headerActionBtn}
                    onPress={() => setSupersetModalBlockId(block.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Layers
                      size={18}
                      color={
                        ex.supersetGroup ? theme.supersetTag : theme.textMuted
                      }
                    />
                  </TouchableOpacity>

                  {/* Bouton Options ... pour exercice individuel */}
                  <TouchableOpacity
                    style={styles.headerActionBtn}
                    onPress={() =>
                      setActiveBlockOptions({
                        type: "single",
                        blockId: block.id,
                      })
                    }
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <MoreVertical size={18} color={theme.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Réglage du temps de repos spécifique */}
              <View
                style={[
                  styles.exRestRow,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <View style={styles.rowAlign}>
                  <Timer
                    size={14}
                    color={theme.textMuted}
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={[styles.exRestLabel, { color: theme.textMuted }]}
                  >
                    Repos exercice :
                  </Text>
                </View>
                <View style={styles.rowAlign}>
                  {exRest !== defaultRestSeconds && (
                    <TouchableOpacity
                      style={[styles.resetRestBtn, { marginRight: 6 }]}
                      onPress={() => handleResetExerciseRest(block.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <RotateCcw size={14} color={theme.textMuted} />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[
                      styles.smallStepperBtn,
                      {
                        backgroundColor: theme.cardBg,
                        borderColor: theme.border,
                      },
                    ]}
                    onPress={() => handleAdjustExerciseRest(block.id, -15)}
                  >
                    <Text
                      style={[styles.smallStepperText, { color: theme.text }]}
                    >
                      -15s
                    </Text>
                  </TouchableOpacity>
                  <Text style={[styles.exRestValue, { color: theme.accent }]}>
                    {exRest}s
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.smallStepperBtn,
                      {
                        backgroundColor: theme.cardBg,
                        borderColor: theme.border,
                      },
                    ]}
                    onPress={() => handleAdjustExerciseRest(block.id, 15)}
                  >
                    <Text
                      style={[styles.smallStepperText, { color: theme.text }]}
                    >
                      +15s
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Liste des Séries */}
              <View style={styles.setsContainer}>

                {ex.sets.map((set, setIdx) => {
                  const setTypeInfo =
                    SET_TYPES_CONFIG[set.type] || SET_TYPES_CONFIG.normal;
                  return (
                    <View
                      key={set.id}
                      style={[
                        styles.setDetailRow,
                        { borderBottomColor: theme.border },
                      ]}
                    >
                      <Text
                        style={[styles.setIndexText, { color: theme.text }]}
                      >
                        Série {set.setNumber}
                      </Text>

                      {/* Badge / Sélecteur de Type de Série */}
                      <TouchableOpacity
                        activeOpacity={0.7}
                        style={[
                          styles.typeBadge,
                          { backgroundColor: setTypeInfo.color },
                        ]}
                        onPress={() =>
                          setActiveSetTarget({ blockId: block.id, setIdx })
                        }
                      >
                        <Text style={styles.typeBadgeCode}>
                          {setTypeInfo.code}
                        </Text>
                        <Text style={styles.typeBadgeLabel}>
                          {setTypeInfo.label}
                        </Text>
                      </TouchableOpacity>

                      {/* Supprimer une série */}
                      {ex.sets.length > 1 ? (
                        <TouchableOpacity
                          style={styles.deleteSetBtn}
                          onPress={() =>
                            handleRemoveSetFromSingle(block.id, setIdx)
                          }
                        >
                          <Trash2 size={15} color={theme.danger} />
                        </TouchableOpacity>
                      ) : (
                        <View style={{ width: 24 }} />
                      )}
                    </View>
                  );
                })}

                {/* Bouton Ajouter une série */}
                <TouchableOpacity
                  style={[
                    styles.addSetBtn,
                    {
                      borderColor: theme.border,
                      backgroundColor: theme.surface,
                    },
                  ]}
                  onPress={() => handleAddSetToSingle(block.id)}
                >
                  <Plus
                    size={14}
                    color={theme.accent}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={[styles.addSetBtnText, { color: theme.accent }]}>
                    Ajouter une série
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {/* BOUTONS JUMEAUX AU BAS DE LA SÉANCE */}
        <Animated.View
          style={[
            styles.twinButtonsRow,
            isGuidedOnboardingCreation &&
              title.trim() &&
              selectedBlocks.length === 0 && {
                transform: [{ scale: pulseAnim }],
              },
          ]}
        >
          {/* [Exercice] (Contour vert/accent pointillé) */}
          <TouchableOpacity
            style={[
              styles.twinBtn,
              {
                borderColor: theme.accent,
                backgroundColor: isDark
                  ? "rgba(156, 176, 128, 0.08)"
                  : "rgba(235, 125, 0, 0.08)",
              },
              isGuidedOnboardingCreation &&
                title.trim() &&
                selectedBlocks.length === 0 && {
                  borderWidth: 2.5,
                },
            ]}
            onPress={() => {
              setTargetCircuitBlockId(null);
              setShowPickerModal(true);
            }}
          >
            <Plus size={16} color={theme.accent} style={{ marginRight: 6 }} />
            <Text style={[styles.twinBtnText, { color: theme.accent }]}>
              Exercice
            </Text>
          </TouchableOpacity>

          {/* [Circuit] (Contour accent pointillé) */}
          <TouchableOpacity
            style={[
              styles.twinBtn,
              {
                borderColor: theme.accent,
                backgroundColor: theme.surface,
              },
            ]}
            onPress={handleAddCircuitContainer}
          >
            <Plus size={16} color={theme.accent} style={{ marginRight: 4 }} />
            <Zap size={16} color={theme.accent} style={{ marginRight: 6 }} />
            <Text style={[styles.twinBtnText, { color: theme.accent }]}>
              Circuit
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Bouton Enregistrer */}
        <Button
          title="Enregistrer le programme"
          variant="primary"
          onPress={handleSave}
          disabled={isSaveDisabled}
          style={{ marginTop: 24, marginBottom: 40 }}
        />
      </ScrollView>

      {/* --- MODAL / SHEET DES OPTIONS DE BLOC (...) --- */}
      <Modal
        visible={activeBlockOptions !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveBlockOptions(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setActiveBlockOptions(null)}
        >
          <View
            style={[
              styles.menuContainer,
              { backgroundColor: theme.cardBg, borderColor: theme.border },
            ]}
          >
            <Text
              style={[
                styles.modalTitle,
                { color: theme.text, textAlign: "center", marginBottom: 12 },
              ]}
            >
              Options
            </Text>

            {activeBlockOptions?.type === "circuit" && (
              <>
                <TouchableOpacity
                  style={[styles.menuItem, { borderBottomColor: theme.border }]}
                  onPress={() =>
                    handleDuplicateCircuitBlock(activeBlockOptions.blockId)
                  }
                >
                  <Copy
                    size={16}
                    color={theme.text}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={[styles.menuItemText, { color: theme.text }]}>
                    Dupliquer le circuit
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.menuItem,
                    { borderBottomWidth: 0, marginTop: 4 },
                  ]}
                  onPress={() =>
                    handleDeleteCircuitBlock(activeBlockOptions.blockId)
                  }
                >
                  <Trash2
                    size={16}
                    color={theme.danger}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={[styles.menuItemText, { color: theme.danger }]}>
                    Supprimer le circuit
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {activeBlockOptions?.type === "circuit_exercise" &&
              activeBlockOptions.exIdx !== undefined && (
                <>
                  <TouchableOpacity
                    style={[
                      styles.menuItem,
                      { borderBottomColor: theme.border },
                    ]}
                    onPress={() => {
                      setReplaceTarget({
                        type: "circuit_exercise",
                        blockId: activeBlockOptions.blockId,
                        exIdx: activeBlockOptions.exIdx,
                      });
                      setActiveBlockOptions(null);
                      setShowPickerModal(true);
                    }}
                  >
                    <RefreshCw
                      size={16}
                      color={theme.accent}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={[styles.menuItemText, { color: theme.text }]}>
                      Modifier l'exercice
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.menuItem,
                      { borderBottomColor: theme.border },
                    ]}
                    onPress={() =>
                      handleDuplicateCircuitExercise(
                        activeBlockOptions.blockId,
                        activeBlockOptions.exIdx!,
                      )
                    }
                  >
                    <Copy
                      size={16}
                      color={theme.text}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={[styles.menuItemText, { color: theme.text }]}>
                      Dupliquer l'exercice
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.menuItem,
                      { borderBottomColor: theme.border },
                    ]}
                    onPress={() =>
                      handleConvertCircuitExToSingle(
                        activeBlockOptions.blockId,
                        activeBlockOptions.exIdx!,
                      )
                    }
                  >
                    <Layers
                      size={16}
                      color={theme.accent}
                      style={{ marginRight: 8 }}
                    />
                    <Text
                      style={[styles.menuItemText, { color: theme.accent }]}
                    >
                      Extraire en Exercice Individuel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.menuItem,
                      { borderBottomWidth: 0, marginTop: 4 },
                    ]}
                    onPress={() =>
                      handleDeleteCircuitExercise(
                        activeBlockOptions.blockId,
                        activeBlockOptions.exIdx!,
                      )
                    }
                  >
                    <Trash2
                      size={16}
                      color={theme.danger}
                      style={{ marginRight: 8 }}
                    />
                    <Text
                      style={[styles.menuItemText, { color: theme.danger }]}
                    >
                      Supprimer de ce circuit
                    </Text>
                  </TouchableOpacity>
                </>
              )}

            {activeBlockOptions?.type === "single" && (
              <>
                <TouchableOpacity
                  style={[styles.menuItem, { borderBottomColor: theme.border }]}
                  onPress={() => {
                    setReplaceTarget({
                      type: "single",
                      blockId: activeBlockOptions.blockId,
                    });
                    setActiveBlockOptions(null);
                    setShowPickerModal(true);
                  }}
                >
                  <RefreshCw
                    size={16}
                    color={theme.accent}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={[styles.menuItemText, { color: theme.text }]}>
                    Modifier l'exercice
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.menuItem, { borderBottomColor: theme.border }]}
                  onPress={() =>
                    handleDuplicateSingleBlock(activeBlockOptions.blockId)
                  }
                >
                  <Copy
                    size={16}
                    color={theme.text}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={[styles.menuItemText, { color: theme.text }]}>
                    Dupliquer l'exercice
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.menuItem,
                    { borderBottomWidth: 0, marginTop: 4 },
                  ]}
                  onPress={() =>
                    handleRemoveSingleBlock(activeBlockOptions.blockId)
                  }
                >
                  <Trash2
                    size={16}
                    color={theme.danger}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={[styles.menuItemText, { color: theme.danger }]}>
                    Supprimer l'exercice
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* --- MODAL SÉLECTION DU CIRCUIT POUR "INCLURE DANS LE CIRCUIT" (si multi-circuits) --- */}
      <Modal
        visible={targetIncludeSingleBlockId !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setTargetIncludeSingleBlockId(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setTargetIncludeSingleBlockId(null)}
        >
          <View
            style={[
              styles.menuContainer,
              { backgroundColor: theme.cardBg, borderColor: theme.border },
            ]}
          >
            <Text
              style={[
                styles.modalTitle,
                { color: theme.text, textAlign: "center", marginBottom: 12 },
              ]}
            >
              Choisir le circuit destination
            </Text>

            {circuitBlocks.map((circ, idx) => (
              <TouchableOpacity
                key={circ.id}
                style={[styles.menuItem, { borderBottomColor: theme.border }]}
                onPress={() =>
                  targetIncludeSingleBlockId &&
                  handleIncludeInCircuit(targetIncludeSingleBlockId, circ.id)
                }
              >
                <Zap
                  size={16}
                  color={theme.accent}
                  style={{ marginRight: 8 }}
                />
                <Text style={[styles.menuItemText, { color: theme.text }]}>
                  {circ.title || `Circuit ${idx + 1}`} (
                  {circ.circuitType === "amrap"
                    ? `${circ.amrapDurationMinutes || 12} min`
                    : `${circ.rounds} tour${circ.rounds > 1 ? "s" : ""}`}
                  )
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* --- MODAL DE SÉLECTION DU TYPE DE SÉRIE --- */}
      <Modal
        visible={activeSetTarget !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveSetTarget(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setActiveSetTarget(null)}
        >
          <View
            style={[
              styles.modalSheet,
              { backgroundColor: theme.cardBg, borderColor: theme.border },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Choisir le type de série
              </Text>
              <TouchableOpacity onPress={() => setActiveSetTarget(null)}>
                <X size={20} color={theme.text} />
              </TouchableOpacity>
            </View>

            {activeSetTarget &&
              Object.values(SET_TYPES_CONFIG).map((cfg) => {
                const block = selectedBlocks.find(
                  (b) => b.id === activeSetTarget.blockId,
                );
                const currentSet =
                  block && block.type === "single"
                    ? block.exercise.sets[activeSetTarget.setIdx]
                    : undefined;
                const isSelected = currentSet?.type === cfg.type;

                return (
                  <TouchableOpacity
                    key={cfg.type}
                    style={[
                      styles.typeOptionRow,
                      { borderBottomColor: theme.border },
                      isSelected && { backgroundColor: theme.surface },
                    ]}
                    onPress={() =>
                      handleUpdateSetType(
                        activeSetTarget.blockId,
                        activeSetTarget.setIdx,
                        cfg.type,
                      )
                    }
                  >
                    <View
                      style={[
                        styles.typeBadgeCircle,
                        { backgroundColor: cfg.color },
                      ]}
                    >
                      <Text style={styles.typeBadgeText}>{cfg.code}</Text>
                    </View>
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text
                        style={[styles.typeOptionLabel, { color: theme.text }]}
                      >
                        {cfg.label}
                      </Text>
                      <Text
                        style={[
                          styles.typeOptionDesc,
                          { color: theme.textMuted },
                        ]}
                      >
                        {cfg.description}
                      </Text>
                    </View>
                    {isSelected && <Check size={18} color={theme.accent} />}
                  </TouchableOpacity>
                );
              })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* --- MODAL DE SÉLECTION DU TYPE POUR UN EXERCICE DE CIRCUIT --- */}
      <Modal
        visible={activeCircuitSetTarget !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveCircuitSetTarget(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setActiveCircuitSetTarget(null)}
        >
          <View
            style={[
              styles.modalSheet,
              { backgroundColor: theme.cardBg, borderColor: theme.border },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Type d'exercice du circuit
              </Text>
              <TouchableOpacity onPress={() => setActiveCircuitSetTarget(null)}>
                <X size={20} color={theme.text} />
              </TouchableOpacity>
            </View>

            {activeCircuitSetTarget &&
              Object.values(SET_TYPES_CONFIG).map((cfg) => {
                const block = selectedBlocks.find(
                  (b) => b.id === activeCircuitSetTarget.blockId,
                );
                const currentItem =
                  block && block.type === "circuit"
                    ? block.exercises.find(
                        (ex) => ex.id === activeCircuitSetTarget.itemId,
                      )
                    : undefined;
                const isSelected =
                  (currentItem?.setType || "normal") === cfg.type;

                return (
                  <TouchableOpacity
                    key={cfg.type}
                    style={[
                      styles.typeOptionRow,
                      { borderBottomColor: theme.border },
                      isSelected && { backgroundColor: theme.surface },
                    ]}
                    onPress={() =>
                      handleUpdateCircuitItemSetType(
                        activeCircuitSetTarget.blockId,
                        activeCircuitSetTarget.itemId,
                        cfg.type,
                      )
                    }
                  >
                    <View
                      style={[
                        styles.typeBadgeCircle,
                        { backgroundColor: cfg.color },
                      ]}
                    >
                      <Text style={styles.typeBadgeText}>{cfg.code}</Text>
                    </View>
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text
                        style={[styles.typeOptionLabel, { color: theme.text }]}
                      >
                        {cfg.label}
                      </Text>
                      <Text
                        style={[
                          styles.typeOptionDesc,
                          { color: theme.textMuted },
                        ]}
                      >
                        {cfg.description}
                      </Text>
                    </View>
                    {isSelected && <Check size={18} color={theme.accent} />}
                  </TouchableOpacity>
                );
              })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* --- MODAL RÉORGANISATION DES EXERCICES D'UN CIRCUIT --- */}
      <Modal
        visible={reorderCircuitBlockId !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setReorderCircuitBlockId(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setReorderCircuitBlockId(null)}
        >
          <View
            style={[
              styles.modalSheet,
              { backgroundColor: theme.cardBg, borderColor: theme.border },
            ]}
          >
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <ArrowUpDown
                  size={18}
                  color={theme.accent}
                  style={{ marginRight: 8 }}
                />
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  Ordre des exercices du circuit
                </Text>
              </View>
              <TouchableOpacity onPress={() => setReorderCircuitBlockId(null)}>
                <X size={20} color={theme.text} />
              </TouchableOpacity>
            </View>

            {reorderCircuitBlockId &&
              (() => {
                const circuitBlock = selectedBlocks.find(
                  (b) => b.id === reorderCircuitBlockId && b.type === "circuit",
                ) as CircuitBlock | undefined;

                if (!circuitBlock || circuitBlock.exercises.length === 0) {
                  return (
                    <Text
                      style={{
                        color: theme.textMuted,
                        textAlign: "center",
                        padding: 20,
                      }}
                    >
                      Aucun exercice dans ce circuit.
                    </Text>
                  );
                }

                return (
                  <ScrollView style={{ maxHeight: 350 }}>
                    {circuitBlock.exercises.map((item, exIdx) => {
                      const letter = String.fromCharCode(65 + exIdx);
                      const isFirst = exIdx === 0;
                      const isLast =
                        exIdx === circuitBlock.exercises.length - 1;
                      return (
                        <View
                          key={item.id}
                          style={[
                            styles.typeOptionRow,
                            {
                              borderBottomColor: theme.border,
                              paddingVertical: 10,
                            },
                          ]}
                        >
                          <View
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: 12,
                              backgroundColor: theme.accent,
                              alignItems: "center",
                              justifyContent: "center",
                              marginRight: 10,
                            }}
                          >
                            <Text
                              style={{
                                color: "#FFFFFF",
                                fontSize: 12,
                                fontWeight: "900",
                              }}
                            >
                              {letter}
                            </Text>
                          </View>

                          <View style={{ flex: 1, marginRight: 8 }}>
                            <Text
                              style={[
                                styles.typeOptionLabel,
                                { color: theme.text },
                              ]}
                              numberOfLines={1}
                            >
                              {item.exerciseName}
                            </Text>
                            <Text
                              style={[
                                styles.typeOptionDesc,
                                { color: theme.textMuted },
                              ]}
                            >
                              {item.targetValue}{" "}
                              {item.targetType === "reps" ? "reps" : "s"} ·{" "}
                              {item.primaryMuscle}
                            </Text>
                          </View>

                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                            }}
                          >
                            <TouchableOpacity
                              disabled={isFirst}
                              style={{
                                padding: 6,
                                opacity: isFirst ? 0.3 : 1,
                                backgroundColor: theme.surface,
                                borderRadius: 6,
                                marginRight: 4,
                              }}
                              onPress={() =>
                                handleMoveCircuitExercise(
                                  reorderCircuitBlockId,
                                  exIdx,
                                  "up",
                                )
                              }
                            >
                              <ChevronUp size={18} color={theme.text} />
                            </TouchableOpacity>
                            <TouchableOpacity
                              disabled={isLast}
                              style={{
                                padding: 6,
                                opacity: isLast ? 0.3 : 1,
                                backgroundColor: theme.surface,
                                borderRadius: 6,
                              }}
                              onPress={() =>
                                handleMoveCircuitExercise(
                                  reorderCircuitBlockId,
                                  exIdx,
                                  "down",
                                )
                              }
                            >
                              <ChevronDown size={18} color={theme.text} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                  </ScrollView>
                );
              })()}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* --- MODAL GROUPE SUPERSET --- */}
      <Modal
        visible={supersetModalBlockId !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSupersetModalBlockId(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSupersetModalBlockId(null)}
        >
          <View
            style={[
              styles.menuContainer,
              { backgroundColor: theme.cardBg, borderColor: theme.border },
            ]}
          >
            <Text
              style={[
                styles.modalTitle,
                { color: theme.text, textAlign: "center", marginBottom: 12 },
              ]}
            >
              Groupe Superset
            </Text>
            {["Superset A", "Superset B", "Superset C"].map((group) => {
              const currentBlock = selectedBlocks.find(
                (b) => b.id === supersetModalBlockId,
              );
              const currentGroup =
                currentBlock && currentBlock.type === "single"
                  ? currentBlock.exercise.supersetGroup
                  : undefined;
              const isSelected = currentGroup === group;
              return (
                <TouchableOpacity
                  key={group}
                  style={[
                    styles.menuItem,
                    { borderBottomColor: theme.border },
                    isSelected && { backgroundColor: theme.surface },
                  ]}
                  onPress={() =>
                    supersetModalBlockId &&
                    handleSetSupersetGroup(supersetModalBlockId, group)
                  }
                >
                  <Text style={[styles.menuItemText, { color: theme.text }]}>
                    {group}
                  </Text>
                  {isSelected && <Check size={16} color={theme.accent} />}
                </TouchableOpacity>
              );
            })}

            {supersetModalBlockId !== null &&
              selectedBlocks.find((b) => b.id === supersetModalBlockId)
                ?.type === "single" &&
              (
                selectedBlocks.find(
                  (b) => b.id === supersetModalBlockId,
                ) as SingleExerciseBlock
              ).exercise.supersetGroup && (
                <TouchableOpacity
                  style={[
                    styles.menuItem,
                    { marginTop: 6, borderBottomWidth: 0 },
                  ]}
                  onPress={() =>
                    handleSetSupersetGroup(supersetModalBlockId, undefined)
                  }
                >
                  <Text style={[styles.menuItemText, { color: theme.danger }]}>
                    Retirer du Superset
                  </Text>
                </TouchableOpacity>
              )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* --- MODAL BASE DE DONNÉES D'EXERCICES --- */}
      <Modal
        visible={showPickerModal}
        transparent
        animationType="slide"
        onRequestClose={handleClosePickerModal}
      >
        <TouchableOpacity
          style={styles.pickerModalOverlay}
          activeOpacity={1}
          onPress={handleClosePickerModal}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ width: "100%" }}
          >
            <TouchableOpacity
              activeOpacity={1}
              style={[
                styles.pickerModalContent,
                { backgroundColor: theme.cardBg, borderColor: theme.border },
              ]}
            >
              <View style={styles.pickerModalHeaderRow}>
                <Text
                  style={[
                    styles.modalTitle,
                    { color: theme.text, flex: 1, marginBottom: 0 },
                  ]}
                >
                  {replaceTarget
                    ? "Modifier l'exercice"
                    : targetCircuitBlockId
                      ? "Ajouter au Circuit"
                      : "Base de Données d'Exercices"}
                </Text>
                <TouchableOpacity
                  onPress={handleClosePickerModal}
                  style={{ padding: 4 }}
                >
                  <X size={20} color={theme.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Barre de Recherche */}
              <View
                style={[
                  styles.searchBarBox,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                    marginTop: 8,
                  },
                ]}
              >
                <Search
                  size={16}
                  color={theme.textMuted}
                  style={{ marginRight: 8 }}
                />
                <TextInput
                  style={[styles.searchInput, { color: theme.text }]}
                  placeholder="Rechercher par nom ou muscle..."
                  placeholderTextColor={theme.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus
                />
              </View>

              <ScrollView
                style={{ maxHeight: 270 }}
                keyboardShouldPersistTaps="handled"
              >
                {filteredDatabase.length === 0 ? (
                  <Text
                    style={[styles.noResultText, { color: theme.textMuted }]}
                  >
                    Aucun exercice trouvé
                  </Text>
                ) : (
                  filteredDatabase.map((ex: SharedExercise) => {
                    const isSelected = selectedExerciseIds.has(ex.id);
                    return (
                      <TouchableOpacity
                        key={ex.id}
                        activeOpacity={0.7}
                        style={[
                          styles.dbItemRow,
                          { borderBottomColor: theme.border },
                          isSelected && { backgroundColor: theme.surface },
                        ]}
                        onPress={() => toggleSelectExercise(ex.id)}
                      >
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.dbItemName,
                              { color: theme.text },
                              isSelected && {
                                fontWeight: "900",
                                color: theme.accent,
                              },
                            ]}
                          >
                            {ex.name}
                          </Text>
                          <Text
                            style={[
                              styles.dbItemMuscle,
                              { color: theme.textMuted },
                            ]}
                          >
                            {ex.primaryMuscle} • {ex.category} •{" "}
                            {defaultRestSeconds || ex.defaultRestSeconds}s repos
                          </Text>
                        </View>
                        {/* Radio Button vs Checkbox Icon */}
                        {replaceTarget ? (
                          <View
                            style={[
                              styles.radioCircle,
                              {
                                borderColor: isSelected
                                  ? theme.accent
                                  : theme.border,
                              },
                            ]}
                          >
                            {isSelected && (
                              <View
                                style={[
                                  styles.radioDot,
                                  { backgroundColor: theme.accent },
                                ]}
                              />
                            )}
                          </View>
                        ) : (
                          <View
                            style={[
                              styles.checkboxBox,
                              {
                                borderColor: isSelected
                                  ? theme.accent
                                  : theme.border,
                                backgroundColor: isSelected
                                  ? theme.accent
                                  : "transparent",
                              },
                            ]}
                          >
                            {isSelected && (
                              <Check
                                size={14}
                                color="#FFFFFF"
                                strokeWidth={3}
                              />
                            )}
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>

              {/* Barre d'action fixe en bas */}
              <View style={styles.pickerActionBar}>
                <Button
                  title={
                    replaceTarget
                      ? selectedExerciseIds.size > 0
                        ? "Remplacer l'exercice"
                        : "Sélectionner un exercice"
                      : selectedExerciseIds.size > 0
                        ? `Ajouter (${selectedExerciseIds.size})`
                        : "Ajouter (0)"
                  }
                  variant="primary"
                  disabled={selectedExerciseIds.size === 0}
                  onPress={handleBatchAddSharedExercises}
                  style={{ width: "100%" }}
                />
                <Button
                  title="+ Créer un exercice"
                  variant="outline"
                  onPress={() => setShowCreateExerciseModal(true)}
                  style={{ width: "100%", marginTop: 8 }}
                />
              </View>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>

      {/* Modale de création d'exercice */}
      <CreateExerciseModal
        visible={showCreateExerciseModal}
        onClose={() => setShowCreateExerciseModal(false)}
        onSuccess={(created) => {
          setSelectedExerciseIds((prev) => new Set(prev).add(created.id));
        }}
      />

      <ReorderBlocksModal
        visible={showReorderModal}
        onClose={() => setShowReorderModal(false)}
        blocks={selectedBlocks}
        onReorder={setSelectedBlocks}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  backText: {
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 4,
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: "900",
  },
  scrollContent: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
  },
  input: {
    height: 42,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  defaultRestCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
  },
  defaultRestTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  rowAlign: {
    flexDirection: "row",
    alignItems: "center",
  },
  restStepper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  stepperBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  stepperBtnText: {
    fontSize: 12,
    fontWeight: "700",
  },
  restValueText: {
    fontSize: 22,
    fontWeight: "900",
    marginHorizontal: 12,
  },
  defaultRestHint: {
    fontSize: 11,
    marginTop: 8,
  },
  typeToggleContainer: {
    flexDirection: "row",
    borderRadius: 8,
    padding: 2,
  },
  typeToggleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeToggleText: {
    fontSize: 11,
    fontWeight: "800",
  },
  estimatedBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
  },
  estimatedText: {
    fontSize: 14,
    fontWeight: "600",
  },

  // --- CARTE CONTENEUR CIRCUIT ---
  circuitContainer: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 14,
  },
  circuitHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  circuitBadgeC: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  circuitBadgeCText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 15,
  },
  circuitTitleText: {
    fontSize: 15,
    fontWeight: "900",
    marginRight: 8,
  },
  circuitTitleInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "800",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  circuitSteppersBox: {
    flexDirection: "row",
    alignItems: "center",
  },
  circuitRestRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  circuitRestLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  circuitItemsContainer: {
    marginBottom: 10,
  },
  circuitItemCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  letterBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  letterBadgeText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 12,
  },
  circuitItemName: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    marginRight: 6,
  },
  targetValueInput: {
    width: 44,
    height: 32,
    borderWidth: 1,
    borderRadius: 6,
    textAlign: "center",
    fontWeight: "800",
    fontSize: 13,
    paddingVertical: 0,
    marginRight: 6,
  },
  targetTypeToggle: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 4,
    minWidth: 44,
    alignItems: "center",
  },
  targetTypeToggleText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 11,
    textTransform: "lowercase",
  },
  addCircuitExerciseBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  addCircuitExerciseBtnText: {
    fontSize: 13,
    fontWeight: "800",
  },

  // --- CARTE EXERCICE INDIVIDUEL ---
  exCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  supersetHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
    alignSelf: "flex-start",
  },
  supersetText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 11,
    marginLeft: 4,
    textTransform: "uppercase",
  },
  exHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  exHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerActionBtn: {
    padding: 4,
    marginLeft: 6,
  },
  includeCircuitBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    marginRight: 4,
  },
  includeCircuitBtnText: {
    fontWeight: "800",
    fontSize: 11,
    marginLeft: 4,
  },
  exName: {
    fontSize: 15,
    fontWeight: "800",
  },
  exMuscle: {
    fontSize: 12,
  },
  exRestRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
  },
  exRestLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  exRestValue: {
    fontSize: 13,
    fontWeight: "800",
    marginHorizontal: 6,
  },
  smallStepperBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  smallStepperText: {
    fontSize: 11,
    fontWeight: "700",
  },
  resetRestBtn: {
    marginLeft: 6,
    padding: 2,
  },
  setsContainer: {
    marginTop: 4,
  },
  setsHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  setsTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  setsHint: {
    fontSize: 10,
  },
  setDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 0.5,
  },
  setIndexText: {
    fontSize: 13,
    fontWeight: "600",
    width: 60,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  typeBadgeCode: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 12,
    marginRight: 6,
  },
  typeBadgeLabel: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 12,
  },
  deleteSetBtn: {
    padding: 4,
  },
  addSetBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  addSetBtnText: {
    fontSize: 12,
    fontWeight: "700",
  },

  // --- BOUTONS JUMEAUX AU BAS DE LA SÉANCE ---
  twinButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    gap: 10,
  },
  twinBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: "dashed",
  },
  twinBtnText: {
    fontSize: 14,
    fontWeight: "800",
  },

  // --- MODAUX ---
  moreOptionsBtn: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-start",
    paddingTop: Platform.OS === "ios" ? 60 : 45,
    paddingHorizontal: 16,
  },
  pickerModalContent: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  pickerModalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  pickerActionBar: {
    marginTop: 10,
    paddingTop: 8,
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 18,
    borderTopWidth: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "800",
  },
  typeOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderBottomWidth: 0.5,
    marginVertical: 2,
  },
  typeBadgeCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  typeBadgeText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 14,
  },
  typeOptionLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
  typeOptionDesc: {
    fontSize: 12,
  },
  menuContainer: {
    width: "85%",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    alignSelf: "center",
    marginBottom: "auto",
    marginTop: "auto",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderBottomWidth: 0.5,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
  modalContent: {
    width: "90%",
    alignSelf: "center",
    marginBottom: "auto",
    marginTop: "auto",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  searchBarBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  noResultText: {
    textAlign: "center",
    fontSize: 13,
    paddingVertical: 20,
  },
  dbItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
  dbItemName: {
    fontSize: 14,
    fontWeight: "700",
  },
  dbItemMuscle: {
    fontSize: 11,
  },
  floatingOnboardingCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    marginTop: 14,
    marginBottom: 6,
  },
  floatingOnboardingHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  floatingOnboardingTitle: {
    fontSize: 14,
    fontWeight: "900",
  },
  floatingOnboardingText: {
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
  },
});
