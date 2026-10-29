import React, { useMemo, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import AppText from '../components/AppText';
import CourseTile from '../components/CourseTile';
import Icon from '../components/Icon';
import { Row, Section } from '../components/List';
import PressableScale from '../components/PressableScale';
import Screen from '../components/Screen';
import {
  getCourse,
  searchQuestions,
  searchTopics,
  topicTitle,
} from '../content';
import { texToPlain } from '../lib/mathSpeech';
import { continuous, makeStyles, radius, type, useTheme } from '../theme';

const RESULT_LIMIT = 50;

// Readable one-line preview of a question that may contain TeX: "∫ x cos x dx".
function preview(text) {
  return text
    .replace(/\$\$([\s\S]+?)\$\$|\$([^$]+)\$/g, (match, display, inline) =>
      texToPlain(display ?? inline),
    )
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
  const { profile } = useAuth();
  const board = profile?.educationBoard;
  const [query, setQuery] = useState('');
  const results = useMemo(
    () => searchQuestions(query, { limit: RESULT_LIMIT, board }),
    [query, board],
  );
  const topics = useMemo(() => searchTopics(query, { board }), [query, board]);
  const searched = query.trim().length > 0;
  const nothingFound = searched && results.length === 0 && topics.length === 0;

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
          clearButtonMode="never"
          accessibilityLabel="Search questions"
        />
        {query ? (
          <Pressable
            onPress={() => setQuery('')}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            style={styles.clear}
          >
            <View style={styles.clearCircle}>
              <Icon name="close" size={12} color="background" strokeWidth={3} />
            </View>
          </Pressable>
        ) : null}
      </View>
      {nothingFound ? (
        <View style={styles.empty}>
          <AppText variant="headline" align="center">
            No matches for “{query.trim()}”
          </AppText>
          <AppText
            variant="subheadline"
            color="secondaryLabel"
            align="center"
            style={styles.emptyHint}
          >
            Try a topic name such as Probability, fewer words, or a different
            spelling.
          </AppText>
        </View>
      ) : searched ? (
        <>
          {topics.length > 0 ? (
            <Section title="Topics">
              {topics.map(topic => {
                const course = getCourse(topic.courseKey);
                return (
                  <Row
                    key={`${topic.courseKey}:${topic.key}`}
                    leading={<CourseTile course={course} size={28} />}
                    title={topic.title}
                    subtitle={`${course.title} · ${
                      topic.questions.length
                    } question${topic.questions.length === 1 ? '' : 's'}`}
                    onPress={() =>
                      navigation.navigate('Topic', {
                        courseKey: topic.courseKey,
                        topicKey: topic.key,
                      })
                    }
                  />
                );
              })}
            </Section>
          ) : null}
          {results.length > 0 ? (
            <AppText
              variant="footnote"
              color="secondaryLabel"
              style={styles.count}
              accessibilityRole="header"
            >
              {results.length === RESULT_LIMIT
                ? `QUESTIONS · FIRST ${RESULT_LIMIT}, ADD A WORD TO NARROW THEM DOWN`
                : `QUESTIONS · ${results.length}`}
            </AppText>
          ) : null}
        </>
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
        keyboardDismissMode: 'on-drag',
        automaticallyAdjustKeyboardInsets: true,
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
    minWidth: 0,
    minHeight: 44,
    marginLeft: 8,
    color: theme.colors.label,
  },
  clear: {
    width: 44,
    height: 44,
    marginRight: -12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.tertiaryLabel,
  },
  empty: {
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  emptyHint: {
    marginTop: 6,
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
