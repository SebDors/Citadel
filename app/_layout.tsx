import React from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import { WorkoutProvider } from '../src/context/WorkoutContext';
import { GlobalErrorBoundary, RootErrorBoundary } from '../src/components/UI/GlobalErrorBoundary';

/**
 * Gestionnaire d'erreur natif Expo Router (AJ-04)
 */
export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  return <RootErrorBoundary error={error} retry={retry} />;
}

function RootLayoutNav() {
  const { theme, isReady } = useTheme();

  if (!isReady) {
    return <View style={{ flex: 1, backgroundColor: '#273338' }} />;
  }

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
    <GlobalErrorBoundary>
      <ThemeProvider>
        <WorkoutProvider>
          <RootLayoutNav />
        </WorkoutProvider>
      </ThemeProvider>
    </GlobalErrorBoundary>
  );
}
