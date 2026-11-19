import React from "react";
import { Platform } from "react-native";
import { withLayoutContext } from "expo-router";
import {
  createMaterialTopTabNavigator,
  MaterialTopTabNavigationOptions,
  MaterialTopTabNavigationEventMap,
} from "@react-navigation/material-top-tabs";
import { ParamListBase, TabNavigationState } from "@react-navigation/native";
import { useTheme } from "../../src/context/ThemeContext";
import { useWorkout } from "../../src/context/WorkoutContext";
import { Dumbbell, Calendar, TrendingUp, User } from "lucide-react-native";

const { Navigator } = createMaterialTopTabNavigator();

export const MaterialTopTabs = withLayoutContext<
  MaterialTopTabNavigationOptions,
  typeof Navigator,
  TabNavigationState<ParamListBase>,
  MaterialTopTabNavigationEventMap
>(Navigator);

export default function TabLayout() {
  const { theme } = useTheme();
  const { data, loading } = useWorkout();
  const isOnboarding = !loading && !!data && !data.hasCompletedOnboarding;

  return (
    <MaterialTopTabs
      tabBarPosition="bottom"
      screenOptions={{
        swipeEnabled: !isOnboarding,
        animationEnabled: true,
        tabBarShowIcon: true,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarIndicatorStyle: {
          backgroundColor: theme.accent,
          height: 2.5,
          top: 0,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          height: Platform.OS === "android" ? 78 : 70,
          paddingBottom: Platform.OS === "android" ? 16 : 12,
          paddingTop: 4,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          textTransform: "none",
          marginTop: 2,
        },
      }}
    >
      <MaterialTopTabs.Screen
        name="index"
        options={{
          title: "Entraînement",
          tabBarIcon: ({ color }) => <Dumbbell size={22} color={color} />,
        }}
      />
      <MaterialTopTabs.Screen
        name="history"
        options={{
          title: "Historique",
          tabBarIcon: ({ color }) => <Calendar size={22} color={color} />,
        }}
      />
      <MaterialTopTabs.Screen
        name="analytics"
        options={{
          title: "Analyse",
          tabBarIcon: ({ color }) => <TrendingUp size={22} color={color} />,
        }}
      />
      <MaterialTopTabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color }) => <User size={22} color={color} />,
        }}
      />
    </MaterialTopTabs>
  );
}
