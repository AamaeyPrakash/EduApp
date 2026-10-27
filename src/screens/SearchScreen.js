import React, { useMemo, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '../components/ScreenHeader';
import { getCourse, searchQuestions, topicTitle } from '../content';
import { colors } from '../theme';

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

// Finds questions across every course by words in the topic, concept or question,
// e.g. "bayes", "integration by parts", "matrix inverse".
const SearchScreen = ({ navigation }) => {
  const [query, setQuery] = useState('');
  const results = useMemo(() => searchQuestions(query), [query]);
  const searched = query.trim().length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader onClose={() => navigation.goBack()} title="Search" />
      <View style={styles.searchBox}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search topics and questions"
          placeholderTextColor={colors.placeholder}
          style={styles.input}
          autoFocus
          autoCorrect={false}
          returnKeyType="search"
          keyboardAppearance="dark"
          accessibilityLabel="Search questions"
        />
      </View>
      <FlatList
        data={results}
        keyExtractor={question => question.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          searched ? (
            <Text style={styles.count}>
              {results.length === 50 ? '50+' : results.length} result
              {results.length === 1 ? '' : 's'}
            </Text>
          ) : (
            <Text style={styles.tip}>
              Try a topic or method, like “Bayes”, “integration by parts” or
              “inverse of a matrix”.
            </Text>
          )
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.result}
            onPress={() =>
              navigation.navigate('Practice', {
                title: topicTitle(item),
                questionIds: [item.id],
              })
            }
            accessibilityRole="button"
          >
            <Text style={styles.resultHeading}>
              {getCourse(item.courseKey)?.title} · {topicTitle(item)}
            </Text>
            <Text style={styles.resultText} numberOfLines={3}>
              {preview(item.prompt)}
            </Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchBox: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  input: {
    color: colors.text,
    fontSize: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  count: {
    fontSize: 13,
    color: colors.textFaint,
    marginBottom: 8,
  },
  tip: {
    fontSize: 15,
    lineHeight: 21,
    color: colors.textMuted,
    marginTop: 8,
  },
  result: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.surfaceSubtleBorder,
    padding: 16,
    marginBottom: 10,
  },
  resultHeading: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 6,
  },
  resultText: {
    fontSize: 15,
    lineHeight: 21,
    color: colors.text,
  },
});

export default SearchScreen;
