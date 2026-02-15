import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {
  LocationRepository,
  type Location,
} from 'react-native-muslim-data';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card } from '../components/Card';
import { colors, spacing, fonts, radii } from '../theme';

type DemoMode = 'search' | 'geocode' | 'reverse';

export function LocationScreen() {
  const [mode, setMode] = useState<DemoMode>('search');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Location[]>([]);

  // Geocode state
  const [geoCountry, setGeoCountry] = useState('GB');
  const [geoCity, setGeoCity] = useState('London');
  const [geoResult, setGeoResult] = useState<Location | null>(null);

  // Reverse geocode state
  const [revLat, setRevLat] = useState('51.5074');
  const [revLng, setRevLng] = useState('-0.1278');
  const [revResult, setRevResult] = useState<Location | null>(null);

  const [loading, setLoading] = useState(false);

  const locRepo = LocationRepository.getInstance();

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const results = locRepo.searchLocations(searchQuery.trim());
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    }
    setLoading(false);
  };

  const handleGeocode = () => {
    setLoading(true);
    try {
      const result = locRepo.geocoder(geoCountry.trim(), geoCity.trim());
      setGeoResult(result);
    } catch {
      setGeoResult(null);
    }
    setLoading(false);
  };

  const handleReverseGeocode = () => {
    const lat = parseFloat(revLat);
    const lng = parseFloat(revLng);
    if (isNaN(lat) || isNaN(lng)) return;
    setLoading(true);
    try {
      const result = locRepo.reverseGeocoder(lat, lng);
      setRevResult(result);
    } catch {
      setRevResult(null);
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Location Services" subtitle="Offline geocoding" />

      <View style={styles.modeBar}>
        {(['search', 'geocode', 'reverse'] as DemoMode[]).map((m) => (
          <TouchableOpacity
            key={m}
            style={[styles.modeTab, mode === m && styles.modeTabActive]}
            onPress={() => setMode(m)}
            activeOpacity={0.7}>
            <Text
              style={[
                styles.modeTabText,
                mode === m && styles.modeTabTextActive,
              ]}>
              {m === 'search'
                ? 'Search'
                : m === 'geocode'
                  ? 'Geocode'
                  : 'Reverse'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {mode === 'search' && (
          <>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="Search city name..."
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
              <TouchableOpacity
                style={styles.goButton}
                onPress={handleSearch}
                activeOpacity={0.7}>
                <Text style={styles.goButtonText}>Go</Text>
              </TouchableOpacity>
            </View>

            {loading && <ActivityIndicator color={colors.primary} />}

            {searchResults.length > 0 && (
              <Text style={styles.resultCount}>
                {searchResults.length} result
                {searchResults.length !== 1 ? 's' : ''} found
              </Text>
            )}

            {searchResults.map((loc, i) => (
              <LocationCard key={`${loc.id}-${i}`} location={loc} />
            ))}

            {!loading && searchQuery && searchResults.length === 0 && (
              <Text style={styles.emptyText}>No locations found</Text>
            )}
          </>
        )}

        {mode === 'geocode' && (
          <>
            <Text style={styles.fieldLabel}>Country Code</Text>
            <TextInput
              style={styles.inputFull}
              placeholder="e.g. GB, US, IQ"
              placeholderTextColor={colors.textSecondary}
              value={geoCountry}
              onChangeText={setGeoCountry}
              autoCapitalize="characters"
            />
            <Text style={styles.fieldLabel}>City Name</Text>
            <TextInput
              style={styles.inputFull}
              placeholder="e.g. London"
              placeholderTextColor={colors.textSecondary}
              value={geoCity}
              onChangeText={setGeoCity}
            />
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleGeocode}
              activeOpacity={0.7}>
              <Text style={styles.actionButtonText}>Geocode</Text>
            </TouchableOpacity>

            {loading && <ActivityIndicator color={colors.primary} />}

            {geoResult ? (
              <LocationCard location={geoResult} />
            ) : (
              geoCountry &&
              geoCity &&
              !loading && (
                <Text style={styles.emptyText}>
                  Press Geocode to find the location
                </Text>
              )
            )}
          </>
        )}

        {mode === 'reverse' && (
          <>
            <Text style={styles.fieldLabel}>Latitude</Text>
            <TextInput
              style={styles.inputFull}
              placeholder="e.g. 51.5074"
              placeholderTextColor={colors.textSecondary}
              value={revLat}
              onChangeText={setRevLat}
              keyboardType="decimal-pad"
            />
            <Text style={styles.fieldLabel}>Longitude</Text>
            <TextInput
              style={styles.inputFull}
              placeholder="e.g. -0.1278"
              placeholderTextColor={colors.textSecondary}
              value={revLng}
              onChangeText={setRevLng}
              keyboardType="decimal-pad"
            />
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleReverseGeocode}
              activeOpacity={0.7}>
              <Text style={styles.actionButtonText}>Reverse Geocode</Text>
            </TouchableOpacity>

            {loading && <ActivityIndicator color={colors.primary} />}

            {revResult ? (
              <LocationCard location={revResult} />
            ) : (
              !loading && (
                <Text style={styles.emptyText}>
                  Press Reverse Geocode to find the nearest location
                </Text>
              )
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function LocationCard({ location }: { location: Location }) {
  return (
    <Card>
      <Text style={styles.locName}>{location.name}</Text>
      <Text style={styles.locCountry}>
        {location.countryName} ({location.countryCode})
      </Text>
      <View style={styles.locDetails}>
        <DetailChip
          label="Lat"
          value={location.latitude.toFixed(4)}
        />
        <DetailChip
          label="Lng"
          value={location.longitude.toFixed(4)}
        />
        <DetailChip
          label="Fixed"
          value={location.hasFixedPrayerTime ? 'Yes' : 'No'}
        />
      </View>
    </Card>
  );
}

function DetailChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipLabel}>{label}</Text>
      <Text style={styles.chipValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modeBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modeTab: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
  },
  modeTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  modeTabText: {
    ...fonts.regular,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  modeTabTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    ...fonts.regular,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  goButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  goButtonText: {
    color: colors.textLight,
    fontWeight: '700',
    ...fonts.regular,
  },
  fieldLabel: {
    ...fonts.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  inputFull: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    ...fonts.regular,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.sm + 4,
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  actionButtonText: {
    color: colors.textLight,
    fontWeight: '700',
    ...fonts.medium,
  },
  resultCount: {
    ...fonts.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  locName: {
    ...fonts.medium,
    fontWeight: '700',
    color: colors.text,
  },
  locCountry: {
    ...fonts.regular,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  locDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipLabel: {
    ...fonts.caption,
    color: colors.textSecondary,
    marginRight: spacing.xs,
  },
  chipValue: {
    ...fonts.caption,
    fontWeight: '700',
    color: colors.text,
  },
  emptyText: {
    ...fonts.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
