import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import {
  NameOfAllahRepository,
  Language,
  type NameOfAllah,
} from '@shkomaghdid/react-native-prayer-times';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card } from '../components/Card';
import { colors, spacing, fonts, radii } from '../theme';

const LANGUAGES: { key: Language; label: string }[] = [
  { key: Language.en, label: 'English' },
  { key: Language.ar, label: 'العربية' },
  { key: Language.ckb, label: 'کوردی' },
  { key: Language.fa, label: 'فارسی' },
  { key: Language.ru, label: 'Русский' },
];

export function NamesOfAllahScreen() {
  const [names, setNames] = useState<NameOfAllah[]>([]);
  const [language, setLanguage] = useState(Language.en);
  const [showLangPicker, setShowLangPicker] = useState(false);

  const repo = NameOfAllahRepository.getInstance();

  useEffect(() => {
    const result = repo.getNames(language);
    setNames(result);
  }, [language]);

  const currentLangLabel =
    LANGUAGES.find((l) => l.key === language)?.label ?? 'English';

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="99 Names of Allah"
        subtitle={`${names.length} names · ${currentLangLabel}`}
      />

      <TouchableOpacity
        style={styles.langBar}
        onPress={() => setShowLangPicker(!showLangPicker)}
        activeOpacity={0.7}>
        <Text style={styles.langBarLabel}>Language:</Text>
        <Text style={styles.langBarValue}>{currentLangLabel}</Text>
        <Text style={styles.langChevron}>{showLangPicker ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {showLangPicker && (
        <View style={styles.langPicker}>
          {LANGUAGES.map((l) => (
            <TouchableOpacity
              key={l.key}
              style={[
                styles.langOption,
                l.key === language && styles.langOptionActive,
              ]}
              onPress={() => {
                setLanguage(l.key);
                setShowLangPicker(false);
              }}
              activeOpacity={0.7}>
              <Text
                style={[
                  styles.langOptionText,
                  l.key === language && styles.langOptionTextActive,
                ]}>
                {l.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <FlatList
        data={names}
        keyExtractor={(item) => String(item.id)}
        numColumns={1}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Card>
            <View style={styles.nameRow}>
              <View style={styles.numberCircle}>
                <Text style={styles.numberText}>{item.id}</Text>
              </View>
              <View style={styles.nameContent}>
                <Text style={styles.arabicName}>{item.name}</Text>
                <Text style={styles.transliteration}>
                  {item.transliteration}
                </Text>
                <Text style={styles.translation}>{item.translation}</Text>
              </View>
            </View>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  langBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  langBarLabel: {
    ...fonts.caption,
    color: colors.textSecondary,
    marginRight: spacing.xs,
  },
  langBarValue: {
    ...fonts.regular,
    fontWeight: '600',
    color: colors.primary,
    flex: 1,
  },
  langChevron: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  langPicker: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  langOption: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  langOptionActive: {
    backgroundColor: colors.surfaceAlt,
  },
  langOptionText: {
    ...fonts.regular,
    color: colors.text,
  },
  langOptionTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  numberCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  numberText: {
    ...fonts.caption,
    fontWeight: '700',
    color: colors.textLight,
  },
  nameContent: {
    flex: 1,
  },
  arabicName: {
    fontSize: 22,
    lineHeight: 30,
    color: colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
    fontWeight: '600',
  },
  transliteration: {
    ...fonts.regular,
    color: colors.primaryLight,
    fontStyle: 'italic',
    marginTop: 2,
  },
  translation: {
    ...fonts.regular,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
