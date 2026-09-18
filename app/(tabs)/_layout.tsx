import React from "react";
import { Platform, StyleSheet } from "react-native";
import { Tabs } from "expo-router";
import { useTheme } from "../../src/context/ThemeContext";
import { TrendingUp, Activity, User } from "lucide-react-native";

export default function TabLayout() {
  const { theme, isDark } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.text,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopColor: theme.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: Platform.OS === "android" ? 72 : 66,
          paddingBottom: Platform.OS === "android" ? 14 : 10,
          paddingTop: 8,
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          letterSpacing: 0.3,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Portefeuille",
          tabBarIcon: ({ color, focused }) => (
            <TrendingUp size={22} color={focused ? theme.accent : color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "Activité",
          tabBarIcon: ({ color, focused }) => (
            <Activity size={22} color={focused ? theme.accent : color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Compte",
          tabBarIcon: ({ color, focused }) => (
            <User size={22} color={focused ? theme.accent : color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
    </Tabs>
  );
}
