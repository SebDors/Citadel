import React from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import { WorkoutProvider } from '../src/context/WorkoutContext';

function RootLayoutNav() {
  const { theme } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar style="auto" translucent />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="live-workout" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="template-editor" options={{ presentation: 'modal' }} />
        <Stack.Screen name="workout-analytics" options={{ presentation: 'card' }} />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <WorkoutProvider>
        <RootLayoutNav />
      </WorkoutProvider>
    </ThemeProvider>
  );
}


