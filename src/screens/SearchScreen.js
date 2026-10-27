import React, { useMemo, useState } from 'react';
import { TextInput, View } from 'react-native';
import AppText from '../components/AppText';
import CourseTile from '../components/CourseTile';
import Icon from '../components/Icon';
import PressableScale from '../components/PressableScale';
import Screen from '../components/Screen';
import { getCourse, searchQuestions, topicTitle } from '../content';
import { continuous, makeStyles, radius, type, useTheme } from '../theme';

// Readable one-line preview of a question that may contain TeX.
function preview(text) {
  return text
    .replace(/\$+/g, '')
    .replace(/\\(?:frac|dfrac)\{([^{}]*)\}\{([^{}]*)\}/g, '$1/$2')
    .replace(/\\[A-Za-z]+/g, ' ')
    .replace(/[{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const SUGGESTIONS = [
  'Bayes',
  'Integration by parts',
  'Inverse of a matrix',
  'Limits',
];

// Finds questions across every course by words in the topic, concept or question.
const SearchScreen = ({ navigation }) => {
  const styles = useStyles();
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const results = useMemo(() => searchQuestions(query), [query]);
  const searched = query.trim().length > 0;

  const header = (
    <View>
      <View style={styles.field}>
        <Icon name="search" size={18} color="secondaryLabel" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Topics and questions"
          placeholderTextColor={theme.colors.placeholder}
          selectionColor={theme.colors.tint}
          keyboardAppearance={theme.dark ? 'dark' : 'light'}
          style={styles.input}
          autoFocus
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Search questions"
        />
      </View>
      {searched ? (
        <AppText variant="footnote" color="secondaryLabel" style={styles.count}>
          {results.length === 50 ? '50+' : results.length} result
          {results.length === 1 ? '' : 's'}
        </AppText>
      ) : (
        <View style={styles.suggestions}>
          <AppText
            variant="footnote"
            color="secondaryLabel"
            style={styles.count}
          >
            Try searching for
          </AppText>
          {SUGGESTIONS.map(suggestion => (
            <PressableScale
              key={suggestion}
              onPress={() => setQuery(suggestion)}
              accessibilityRole="button"
            >
              <AppText variant="body" color="tint" style={styles.suggestion}>
                {suggestion}
              </AppText>
            </PressableScale>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <Screen
      title="Search"
      onBack={() => navigation.goBack()}
      list={{
        data: results,
        keyExtractor: question => question.id,
        renderItem: ({ item }) => {
          const course = getCourse(item.courseKey);
          return (
            <PressableScale
              scaleTo={0.98}
              onPress={() =>
                navigation.navigate('Practice', {
                  title: topicTitle(item),
                  questionIds: [item.id],
                })
              }
              accessibilityRole="button"
            >
              <View style={styles.result}>
                <CourseTile course={course} size={28} />
                <View style={styles.resultText}>
                  <AppText
                    variant="footnote"
                    color="secondaryLabel"
                    weight="600"
                  >
                    {course.title} · {topicTitle(item)}
                  </AppText>
                  <AppText
                    variant="subheadline"
                    numberOfLines={3}
                    style={styles.preview}
                  >
                    {preview(item.prompt)}
                  </AppText>
                </View>
              </View>
            </PressableScale>
          );
        },
      }}
    >
      {header}
    </Screen>
  );
};

const useStyles = makeStyles(theme => ({
  field: {
    ...continuous,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.fill,
    borderRadius: radius.medium,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  input: {
    ...type.body,
    flex: 1,
    minHeight: 44,
    marginLeft: 8,
    color: theme.colors.label,
  },
  count: {
    marginBottom: 8,
    marginLeft: 4,
  },
  suggestions: {
    marginTop: 4,
  },
  suggestion: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  result: {
    ...continuous,
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.surface,
    borderRadius: radius.card,
    padding: 14,
    marginBottom: 10,
  },
  resultText: {
    flex: 1,
    marginLeft: 12,
  },
  preview: {
    marginTop: 2,
  },
}));

export default SearchScreen;
