import React from 'react';
import { SafeAreaView, StatusBar as RNStatusBar, Platform, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from '../src/context/ThemeContext';
import { WorkoutProvider } from '../src/context/WorkoutContext';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <WorkoutProvider>
        <SafeAreaView style={styles.safeArea}>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="live-workout" options={{ presentation: 'fullScreenModal' }} />
            <Stack.Screen name="template-editor" options={{ presentation: 'modal' }} />
            <Stack.Screen name="workout-analytics" options={{ presentation: 'card' }} />
          </Stack>
        </SafeAreaView>
      </WorkoutProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 24) : 0,
    backgroundColor: '#000000',
  },
});

