import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Easing } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CONFETTI_COLORS = [
  '#FF3B30', // Rouge vif
  '#FF9500', // Orange
  '#FFCC00', // Jaune
  '#34C759', // Vert
  '#00C7BE', // Turquoise
  '#30B0C7', // Bleu ciel
  '#5856D6', // Violet
  '#AF52DE', // Pourpre
  '#FF2D55', // Rose
];

interface ConfettiParticle {
  id: number;
  x: number;
  size: number;
  color: string;
  isCircle: boolean;
  yAnim: Animated.Value;
  rotateAnim: Animated.Value;
  duration: number;
  delay: number;
}

export const ConfettiEffect: React.FC = () => {
  const particles = useRef<ConfettiParticle[]>([]);

  if (particles.current.length === 0) {
    const list: ConfettiParticle[] = [];
    for (let i = 0; i < 45; i++) {
      list.push({
        id: i,
        x: Math.random() * SCREEN_WIDTH,
        size: Math.random() * 8 + 6, // 6px à 14px
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        isCircle: Math.random() > 0.5,
        yAnim: new Animated.Value(-40),
        rotateAnim: new Animated.Value(0),
        duration: Math.random() * 2000 + 2500, // 2.5s à 4.5s
        delay: Math.random() * 1200, // Décalage de 0 à 1.2s
      });
    }
    particles.current = list;
  }

  useEffect(() => {
    const animations = particles.current.map((p) => {
      return Animated.sequence([
        Animated.delay(p.delay),
        Animated.parallel([
          Animated.timing(p.yAnim, {
            toValue: SCREEN_HEIGHT + 50,
            duration: p.duration,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(p.rotateAnim, {
            toValue: 1,
            duration: p.duration,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ]),
      ]);
    });

    const loop = Animated.loop(Animated.parallel(animations));
    loop.start();

    return () => loop.stop();
  }, []);

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {particles.current.map((p) => {
        const spin = p.rotateAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '720deg'],
        });

        return (
          <Animated.View
            key={p.id}
            style={[
              styles.particle,
              {
                left: p.x,
                width: p.size,
                height: p.isCircle ? p.size : p.size * 1.5,
                borderRadius: p.isCircle ? p.size / 2 : 2,
                backgroundColor: p.color,
                transform: [
                  { translateY: p.yAnim },
                  { rotate: spin },
                  { rotateX: spin },
                ],
              },
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    top: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
});
