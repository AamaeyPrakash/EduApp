import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MathText from '../components/MathText';
import RevealSection from '../components/RevealSection';
import ScreenHeader from '../components/ScreenHeader';
import { getChapterQuestions } from '../content/cbse';
import useRevealState from '../hooks/useRevealState';
import { colors } from '../theme';

// Worked examples for one CBSE chapter. `mode: 'study'` (the "Revisions" button)
// opens with every solution shown; `mode: 'quiz'` hides them until asked.
const QuizScreenCB12 = ({ route, navigation }) => {
  const { topicTitle, mode } = route.params ?? {};
  const questions = getChapterQuestions(topicTitle);
  const studyMode = mode === 'study';
  const { isShown, toggle } = useRevealState(studyMode);

  const renderQuestion = ({ item: question, index }) => {
    const finalAnswer = (question.Final_answer || '').trim();
    return (
      <View style={styles.card}>
        <Text style={styles.subtopicText}>
          Question {index + 1}
          {question.Subtitle ? ` · ${question.Subtitle}` : ''}
        </Text>
        <View style={styles.questionContainer}>
          <MathText content={question.Example} />
        </View>
        <RevealSection
          label="Solution"
          content={question.Solution}
          shown={isShown(index)}
          onToggle={() => toggle(index)}
          extra={
            finalAnswer ? (
              <View style={styles.finalAnswer}>
                <Text style={styles.finalAnswerLabel}>Final answer:</Text>
                <MathText content={finalAnswer} />
              </View>
            ) : null
          }
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader onClose={() => navigation.goBack()} />
      {questions.length > 0 ? (
        <FlatList
          data={questions}
          keyExtractor={(_, index) => String(index)}
          renderItem={renderQuestion}
          contentContainerStyle={styles.content}
          initialNumToRender={3}
          maxToRenderPerBatch={3}
          windowSize={5}
          ListHeaderComponent={
            <View style={styles.titleBlock}>
              {studyMode ? (
                <Text style={styles.modeLabel}>Revision</Text>
              ) : null}
              <Text style={styles.topicText} accessibilityRole="header">
                {topicTitle}
              </Text>
            </View>
          }
        />
      ) : (
        <View style={styles.errorContainer}>
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>
              No questions found for this topic.
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  titleBlock: {
    alignItems: 'center',
    marginBottom: 32,
  },
  modeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  topicText: {
    fontSize: 34,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: -0.34,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 500,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  subtopicText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 16,
    opacity: 0.7,
    letterSpacing: -0.14,
  },
  questionContainer: {
    width: '100%',
    marginBottom: 4,
  },
  finalAnswer: {
    width: '100%',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceSubtleBorder,
  },
  finalAnswerLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 6,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  errorText: {
    fontSize: 18,
    color: colors.danger,
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: -0.18,
  },
});

export default QuizScreenCB12;
