import React, { useRef, useEffect } from 'react';
import { StyleSheet, Animated, PanResponder, Dimensions, View } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { useWorkout } from '../../context/WorkoutContext';

interface TabSwipeWrapperProps {
  children: React.ReactNode;
  tabIndex: number; // 0: Entraînement, 1: Historique, 2: Profil
  disabled?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const TabSwipeWrapper: React.FC<TabSwipeWrapperProps> = ({ children, tabIndex, disabled = false }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { theme } = useTheme();
  const { data, loading } = useWorkout();

  const isOnboarding = !loading && !!data && !data.hasCompletedOnboarding;
  const isGestureDisabled = Boolean(disabled || isOnboarding);
  const disabledRef = useRef(isGestureDisabled);
  disabledRef.current = isGestureDisabled;

  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const isNavigating = useRef(false);

  // Re-centrer et rétablir l'opacité lors du changement d'onglet
  useEffect(() => {
    translateX.setValue(0);
    opacity.setValue(1);
    isNavigating.current = false;
  }, [pathname]);

  const handleNavigate = (direction: 'left' | 'right') => {
    if (isNavigating.current) return;
    isNavigating.current = true;

    const targetX = direction === 'left' ? -30 : 30;

    Animated.parallel([
      Animated.timing(translateX, {
        toValue: targetX,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0.6,
        duration: 60,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (direction === 'left') {
        if (tabIndex === 0) router.navigate('/(tabs)/history');
        else if (tabIndex === 1) router.navigate('/(tabs)/profile');
      } else {
        if (tabIndex === 2) router.navigate('/(tabs)/history');
        else if (tabIndex === 1) router.navigate('/(tabs)');
      }
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,

      onMoveShouldSetPanResponder: (_, gestureState) => {
        if (disabledRef.current || isNavigating.current) return false;
        const isHorizontal = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5;
        const isSignificant = Math.abs(gestureState.dx) > 15;

        if (tabIndex === 0 && gestureState.dx > 0) return false;
        if (tabIndex === 2 && gestureState.dx < 0) return false;

        return isHorizontal && isSignificant;
      },

      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        if (disabledRef.current || isNavigating.current) return false;
        const isHorizontal = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5;
        const isSignificant = Math.abs(gestureState.dx) > 18;

        if (tabIndex === 0 && gestureState.dx > 0) return false;
        if (tabIndex === 2 && gestureState.dx < 0) return false;

        return isHorizontal && isSignificant;
      },

      onPanResponderGrant: () => {
        if (disabledRef.current) return;
        translateX.stopAnimation();
        opacity.stopAnimation();
      },

      onPanResponderMove: (_, gestureState) => {
        if (disabledRef.current) return;
        let dx = gestureState.dx;
        if ((tabIndex === 0 && dx > 0) || (tabIndex === 2 && dx < 0)) {
          dx = dx * 0.1;
        }
        translateX.setValue(dx * 0.25);

        const progress = Math.min(Math.abs(dx) / (SCREEN_WIDTH * 0.4), 1);
        opacity.setValue(1 - progress * 0.3);
      },

      onPanResponderRelease: (_, gestureState) => {
        if (disabledRef.current) return;
        const dx = gestureState.dx;
        const vx = gestureState.vx;

        if (dx < -35 || vx < -0.25) {
          if (tabIndex < 2) {
            handleNavigate('left');
          } else {
            Animated.parallel([
              Animated.timing(translateX, { toValue: 0, duration: 60, useNativeDriver: true }),
              Animated.timing(opacity, { toValue: 1, duration: 60, useNativeDriver: true }),
            ]).start();
          }
        } else if (dx > 35 || vx > 0.25) {
          if (tabIndex > 0) {
            handleNavigate('right');
          } else {
            Animated.parallel([
              Animated.timing(translateX, { toValue: 0, duration: 60, useNativeDriver: true }),
              Animated.timing(opacity, { toValue: 1, duration: 60, useNativeDriver: true }),
            ]).start();
          }
        } else {
          Animated.parallel([
            Animated.timing(translateX, { toValue: 0, duration: 60, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 1, duration: 60, useNativeDriver: true }),
          ]).start();
        }
      },

      onPanResponderTerminate: () => {
        Animated.parallel([
          Animated.timing(translateX, { toValue: 0, duration: 60, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 60, useNativeDriver: true }),
        ]).start();
      },
    })
  ).current;

  return (
    <View style={[styles.outerContainer, { backgroundColor: theme.background }]}>
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ translateX }],
            opacity,
          },
        ]}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
});
