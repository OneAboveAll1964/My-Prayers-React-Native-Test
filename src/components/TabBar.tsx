import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../theme';

export type TabId = 'prayer' | 'location' | 'azkars' | 'names';

interface Tab {
  id: TabId;
  label: string;
  icon: string;
}

const tabs: Tab[] = [
  { id: 'prayer', label: 'Prayer', icon: '🕌' },
  { id: 'location', label: 'Location', icon: '📍' },
  { id: 'azkars', label: 'Azkars', icon: '📖' },
  { id: 'names', label: 'Names', icon: '✨' },
];

interface TabBarProps {
  activeTab: TabId;
  onTabPress: (tab: TabId) => void;
}

export function TabBar({ activeTab, onTabPress }: TabBarProps) {
  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, isActive && styles.activeTab]}
            onPress={() => onTabPress(tab.id)}
            activeOpacity={0.7}>
            <Text style={styles.icon}>{tab.icon}</Text>
            <Text style={[styles.label, isActive && styles.activeLabel]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingBottom: 20,
    paddingTop: spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  activeTab: {
    // no border needed, label color handles it
  },
  icon: {
    fontSize: 22,
    marginBottom: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  activeLabel: {
    color: colors.primary,
    fontWeight: '700',
  },
});
