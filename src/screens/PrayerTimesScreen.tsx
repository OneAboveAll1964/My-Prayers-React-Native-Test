import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {
  LocationRepository,
  PrayerTimeRepository,
  createPrayerAttribute,
  CalculationMethod,
  AsrMethod,
  HigherLatitudeMethod,
  type PrayerTime,
  type Location,
} from 'react-native-prayer-times';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card } from '../components/Card';
import { colors, spacing, fonts, radii } from '../theme';

const CALCULATION_METHODS = [
  { key: CalculationMethod.makkah, label: 'Umm al-Qura (Makkah)' },
  { key: CalculationMethod.mwl, label: 'Muslim World League' },
  { key: CalculationMethod.isna, label: 'ISNA' },
  { key: CalculationMethod.karachi, label: 'Karachi' },
  { key: CalculationMethod.egypt, label: 'Egypt' },
  { key: CalculationMethod.jafari, label: 'Jafari' },
  { key: CalculationMethod.tehran, label: 'Tehran' },
];

const PRAYER_LABELS = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
const PRAYER_ICONS = ['🌙', '🌅', '☀️', '🌤️', '🌇', '🌃'];

function formatTime(date: Date): string {
  const h = date.getHours();
  const m = date.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

export function PrayerTimesScreen() {
  const [location, setLocation] = useState<Location | null>(null);
  const [prayerTime, setPrayerTime] = useState<PrayerTime | null>(null);
  const [method, setMethod] = useState(CalculationMethod.makkah);
  const [error, setError] = useState<string | null>(null);
  const [showMethods, setShowMethods] = useState(false);

  useEffect(() => {
    try {
      const locRepo = LocationRepository.getInstance();
      const loc = locRepo.geocoder('IQ', 'Erbil');
      setLocation(loc);

      if (loc) {
        const prayerRepo = PrayerTimeRepository.getInstance();
        const attr = createPrayerAttribute({
          calculationMethod: method,
          asrMethod: AsrMethod.shafii,
          higherLatitudeMethod: HigherLatitudeMethod.angleBased,
        });
        const pt = prayerRepo.getPrayerTimes({
          location: loc,
          date: new Date(),
          attribute: attr,
        });
        setPrayerTime(pt);
      }
    } catch (e: any) {
      setError(e.message);
    }
  }, [method]);

  const prayerTimes = prayerTime
    ? [
        prayerTime.fajr,
        prayerTime.sunrise,
        prayerTime.dhuhr,
        prayerTime.asr,
        prayerTime.maghrib,
        prayerTime.isha,
      ]
    : [];

  const currentMethodLabel =
    CALCULATION_METHODS.find((m) => m.key === method)?.label ?? method;

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Prayer Times"
        subtitle={location ? `${location.name}, ${location.countryName}` : undefined}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {error ? (
          <Card>
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        ) : null}

        <Text style={styles.dateText}>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>

        {prayerTimes.map((time, i) => (
          <Card key={i}>
            <View style={styles.prayerRow}>
              <View style={styles.prayerLeft}>
                <Text style={styles.prayerIcon}>{PRAYER_ICONS[i]}</Text>
                <Text style={styles.prayerName}>{PRAYER_LABELS[i]}</Text>
              </View>
              <Text style={styles.prayerTime}>{formatTime(time)}</Text>
            </View>
          </Card>
        ))}

        {prayerTimes.length === 0 && !error && (
          <Card>
            <Text style={styles.emptyText}>Loading prayer times...</Text>
          </Card>
        )}

        <Text style={styles.sectionTitle}>Calculation Method</Text>
        <TouchableOpacity
          style={styles.methodSelector}
          onPress={() => setShowMethods(!showMethods)}
          activeOpacity={0.7}>
          <Text style={styles.methodSelectorText}>{currentMethodLabel}</Text>
          <Text style={styles.chevron}>{showMethods ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        {showMethods &&
          CALCULATION_METHODS.map((m) => (
            <TouchableOpacity
              key={m.key}
              style={[
                styles.methodOption,
                m.key === method && styles.methodOptionActive,
              ]}
              onPress={() => {
                setMethod(m.key);
                setShowMethods(false);
              }}
              activeOpacity={0.7}>
              <Text
                style={[
                  styles.methodOptionText,
                  m.key === method && styles.methodOptionTextActive,
                ]}>
                {m.label}
              </Text>
              {m.key === method && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          ))}

        {location && (
          <>
            <Text style={styles.sectionTitle}>Location Info</Text>
            <Card>
              <InfoRow label="City" value={location.name} />
              <InfoRow label="Country" value={location.countryName} />
              <InfoRow label="Lat" value={location.latitude.toFixed(4)} />
              <InfoRow label="Lng" value={location.longitude.toFixed(4)} />
              <InfoRow
                label="Fixed Times"
                value={location.hasFixedPrayerTime ? 'Yes' : 'No'}
              />
            </Card>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  dateText: {
    ...fonts.medium,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  prayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  prayerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prayerIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  prayerName: {
    ...fonts.medium,
    fontWeight: '600',
    color: colors.text,
  },
  prayerTime: {
    ...fonts.large,
    fontWeight: '700',
    color: colors.primary,
  },
  sectionTitle: {
    ...fonts.subtitle,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  methodSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xs,
  },
  methodSelectorText: {
    ...fonts.medium,
    color: colors.text,
  },
  chevron: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  methodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  methodOptionActive: {
    backgroundColor: colors.surfaceAlt,
  },
  methodOptionText: {
    ...fonts.regular,
    color: colors.text,
  },
  methodOptionTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  checkmark: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  infoLabel: {
    ...fonts.regular,
    color: colors.textSecondary,
  },
  infoValue: {
    ...fonts.regular,
    fontWeight: '600',
    color: colors.text,
  },
  emptyText: {
    ...fonts.regular,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  errorText: {
    ...fonts.regular,
    color: colors.error,
    textAlign: 'center',
  },
});
