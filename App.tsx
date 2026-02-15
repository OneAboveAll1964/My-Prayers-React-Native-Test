import React, { useState, useEffect } from 'react';
import { StatusBar, StyleSheet, View, Text } from 'react-native';
import { MuslimDb } from '@shkomaghdid/react-native-prayer-times';
import { TabBar, type TabId } from './src/components/TabBar';
import { PrayerTimesScreen } from './src/screens/PrayerTimesScreen';
import { LocationScreen } from './src/screens/LocationScreen';
import { AzkarsScreen } from './src/screens/AzkarsScreen';
import { NamesOfAllahScreen } from './src/screens/NamesOfAllahScreen';
import { colors } from './src/theme';

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('prayer');
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    MuslimDb.getInstance()
      .open()
      .then(() => setDbReady(true))
      .catch((e: any) => setDbError(e.message ?? 'Failed to open database'));
  }, []);

  if (dbError) {
    return (
      <View style={styles.center}>
        <StatusBar barStyle="dark-content" />
        <Text style={styles.errorEmoji}>⚠️</Text>
        <Text style={styles.errorTitle}>Database Error</Text>
        <Text style={styles.errorText}>{dbError}</Text>
        <Text style={styles.errorHint}>
          Make sure muslim_db_v3.0.0.db is bundled with the app.
        </Text>
      </View>
    );
  }

  if (!dbReady) {
    return (
      <View style={styles.center}>
        <StatusBar barStyle="dark-content" />
        <Text style={styles.loadingText}>Opening database...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      {activeTab === 'prayer' && <PrayerTimesScreen />}
      {activeTab === 'location' && <LocationScreen />}
      {activeTab === 'azkars' && <AzkarsScreen />}
      {activeTab === 'names' && <NamesOfAllahScreen />}
      <TabBar activeTab={activeTab} onTabPress={setActiveTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  errorHint: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default App;
