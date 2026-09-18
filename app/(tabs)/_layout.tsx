import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Tabs, useRouter, usePathname } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import {
  SWISS_COLORS,
  SWISS_TYPOGRAPHY,
  SWISS_GRID,
} from '../../src/constants/swissTheme';

function SwissTopNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { isDark } = useTheme();
  const palette = isDark ? SWISS_COLORS.dark : SWISS_COLORS.light;

  const tabs = [
    { key: 'index', path: '/', indexNum: '01', label: 'SÉANCE' },
    { key: 'history', path: '/history', indexNum: '02', label: 'JOURNAL' },
    { key: 'profile', path: '/profile', indexNum: '03', label: 'DONNÉES' },
  ];

  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: palette.background }}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={palette.background}
      />
      <View style={[styles.navContainer, { backgroundColor: palette.background }]}>
        <View style={styles.tabsRow}>
          {tabs.map((tab, idx) => {
            const isActive =
              tab.path === '/'
                ? pathname === '/' || pathname === '' || pathname === '/index'
                : pathname.startsWith(tab.path);

            return (
              <React.Fragment key={tab.key}>
                {idx > 0 && (
                  <View
                    style={[
                      styles.separatorVertical,
                      { backgroundColor: palette.border },
                    ]}
                  />
                )}
                <TouchableOpacity
                  onPress={() => router.replace(tab.path as any)}
                  activeOpacity={0.65}
                  style={[
                    styles.tabItem,
                    isActive && styles.tabItemActive,
                    isActive && { borderBottomColor: palette.accent },
                  ]}
                >
                  <Text
                    style={[
                      styles.tabIndexNum,
                      {
                        color: isActive ? palette.accent : palette.textDimmed,
                      },
                    ]}
                  >
                    {tab.indexNum}
                  </Text>
                  <Text
                    style={[
                      styles.tabLabel,
                      {
                        color: isActive ? palette.text : palette.textMuted,
                        fontFamily: SWISS_TYPOGRAPHY.fonts.sans,
                      },
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              </React.Fragment>
            );
          })}
        </View>
        <View style={[styles.bottomHairline, { backgroundColor: palette.border }]} />
      </View>
    </SafeAreaView>
  );
}

export default function TabLayout() {
  const { isDark } = useTheme();
  const palette = isDark ? SWISS_COLORS.dark : SWISS_COLORS.light;

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        header: () => <SwissTopNav />,
        tabBarStyle: {
          display: 'none', // Suppression définitive de la barre d'onglets inférieure
        },
        sceneStyle: {
          backgroundColor: palette.background,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Séance' }} />
      <Tabs.Screen name="history" options={{ title: 'Journal' }} />
      <Tabs.Screen name="profile" options={{ title: 'Données' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  navContainer: {
    paddingHorizontal: SWISS_GRID.margin,
    paddingTop: 8,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomWidth: 2,
  },
  tabIndexNum: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  separatorVertical: {
    width: SWISS_GRID.hairline,
    height: 14,
  },
  bottomHairline: {
    height: SWISS_GRID.divider,
    width: '100%',
  },
});
