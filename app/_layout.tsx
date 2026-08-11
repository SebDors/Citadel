import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from '../src/context/ThemeContext';
import { WorkoutProvider } from '../src/context/WorkoutContext';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <WorkoutProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="live-workout" options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="template-editor" options={{ presentation: 'modal' }} />
        </Stack>
      </WorkoutProvider>
    </ThemeProvider>
  );
}
