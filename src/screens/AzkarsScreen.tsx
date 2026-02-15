import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import {
  HisnulMuslimRepository,
  Language,
  type AzkarCategory,
  type AzkarChapter,
  type AzkarItem,
} from 'react-native-prayer-times';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card } from '../components/Card';
import { colors, spacing, fonts, radii } from '../theme';

type ViewState =
  | { type: 'categories' }
  | { type: 'chapters'; category: AzkarCategory }
  | { type: 'items'; chapter: AzkarChapter };

const LANGUAGES: { key: Language; label: string }[] = [
  { key: Language.en, label: 'English' },
  { key: Language.ar, label: 'العربية' },
  { key: Language.ckb, label: 'کوردی' },
  { key: Language.fa, label: 'فارسی' },
  { key: Language.ru, label: 'Русский' },
];

export function AzkarsScreen() {
  const [viewState, setViewState] = useState<ViewState>({ type: 'categories' });
  const [language, setLanguage] = useState(Language.en);
  const [categories, setCategories] = useState<AzkarCategory[]>([]);
  const [chapters, setChapters] = useState<AzkarChapter[]>([]);
  const [items, setItems] = useState<AzkarItem[]>([]);
  const [showLangPicker, setShowLangPicker] = useState(false);

  const repo = HisnulMuslimRepository.getInstance();

  useEffect(() => {
    const cats = repo.getAzkarCategories(language);
    setCategories(cats);
    // Reset to categories when language changes
    setViewState({ type: 'categories' });
  }, [language]);

  const openCategory = (category: AzkarCategory) => {
    const chaps = repo.getAzkarChapters({ language, categoryId: category.id });
    setChapters(chaps);
    setViewState({ type: 'chapters', category });
  };

  const openChapter = (chapter: AzkarChapter) => {
    const azkarItems = repo.getAzkarItems({ language, chapterId: chapter.id });
    setItems(azkarItems);
    setViewState({ type: 'items', chapter });
  };

  const goBack = () => {
    if (viewState.type === 'items') {
      // Find the category for this chapter and go back to chapters
      const cat = categories.find((c) => c.id === viewState.chapter.categoryId);
      if (cat) {
        openCategory(cat);
      } else {
        setViewState({ type: 'categories' });
      }
    } else if (viewState.type === 'chapters') {
      setViewState({ type: 'categories' });
    }
  };

  const headerTitle =
    viewState.type === 'categories'
      ? 'Azkars'
      : viewState.type === 'chapters'
        ? viewState.category.name
        : viewState.chapter.name;

  const headerSubtitle =
    viewState.type === 'categories'
      ? 'Hisnul Muslim'
      : viewState.type === 'chapters'
        ? `${chapters.length} chapters`
        : `${items.length} items`;

  const currentLangLabel = LANGUAGES.find((l) => l.key === language)?.label ?? 'English';

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={headerTitle}
        subtitle={headerSubtitle}
        onBack={viewState.type !== 'categories' ? goBack : undefined}
      />

      {/* Language picker toggle */}
      {viewState.type === 'categories' && (
        <TouchableOpacity
          style={styles.langBar}
          onPress={() => setShowLangPicker(!showLangPicker)}
          activeOpacity={0.7}>
          <Text style={styles.langBarLabel}>Language:</Text>
          <Text style={styles.langBarValue}>{currentLangLabel}</Text>
          <Text style={styles.langChevron}>{showLangPicker ? '▲' : '▼'}</Text>
        </TouchableOpacity>
      )}

      {showLangPicker && viewState.type === 'categories' && (
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

      {/* Categories */}
      {viewState.type === 'categories' && (
        <FlatList
          data={categories}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              onPress={() => openCategory(item)}
              activeOpacity={0.7}>
              <Card>
                <View style={styles.listRow}>
                  <View style={styles.indexBadge}>
                    <Text style={styles.indexText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.listRowText}>{item.name}</Text>
                  <Text style={styles.arrow}>›</Text>
                </View>
              </Card>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Chapters */}
      {viewState.type === 'chapters' && (
        <FlatList
          data={chapters}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              onPress={() => openChapter(item)}
              activeOpacity={0.7}>
              <Card>
                <View style={styles.listRow}>
                  <View style={styles.indexBadge}>
                    <Text style={styles.indexText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.listRowText} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={styles.arrow}>›</Text>
                </View>
              </Card>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Items */}
      {viewState.type === 'items' && (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          renderItem={({ item, index }) => (
            <Card>
              {item.topNote ? (
                <Text style={styles.itemNote}>{item.topNote}</Text>
              ) : null}
              {item.item ? (
                <Text style={styles.itemArabic}>{item.item}</Text>
              ) : null}
              {item.transliteration ? (
                <Text style={styles.itemTransliteration}>
                  {item.transliteration}
                </Text>
              ) : null}
              {item.translation ? (
                <Text style={styles.itemTranslation}>{item.translation}</Text>
              ) : null}
              {item.bottomNote ? (
                <Text style={styles.itemNote}>{item.bottomNote}</Text>
              ) : null}
              <View style={styles.itemFooter}>
                {item.count != null && item.count > 0 && (
                  <View style={styles.countBadge}>
                    <Text style={styles.countText}>×{item.count}</Text>
                  </View>
                )}
                <Text style={styles.itemRef} numberOfLines={1}>
                  {item.reference}
                </Text>
              </View>
            </Card>
          )}
        />
      )}
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
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indexBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  indexText: {
    ...fonts.caption,
    fontWeight: '700',
    color: colors.primary,
  },
  listRowText: {
    ...fonts.regular,
    color: colors.text,
    flex: 1,
  },
  arrow: {
    fontSize: 20,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  itemArabic: {
    fontSize: 20,
    lineHeight: 34,
    color: colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: spacing.sm,
  },
  itemTransliteration: {
    ...fonts.regular,
    color: colors.primaryLight,
    fontStyle: 'italic',
    marginBottom: spacing.sm,
  },
  itemTranslation: {
    ...fonts.regular,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  itemNote: {
    ...fonts.caption,
    color: colors.accent,
    fontWeight: '600',
    marginBottom: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.sm,
    overflow: 'hidden',
  },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  countBadge: {
    backgroundColor: colors.primary,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  countText: {
    ...fonts.caption,
    color: colors.textLight,
    fontWeight: '700',
  },
  itemRef: {
    ...fonts.caption,
    color: colors.textSecondary,
    flex: 1,
    textAlign: 'right',
  },
});
