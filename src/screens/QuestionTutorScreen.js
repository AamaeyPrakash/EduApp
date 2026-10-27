import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MathText from '../components/MathText';
import ScreenHeader from '../components/ScreenHeader';
import TutorChat from '../components/TutorChat';
import { getCourse, getQuestion, topicTitle } from '../content';
import { colors } from '../theme';

const SUGGESTIONS = [
  {
    label: 'Give me a hint',
    text: 'Give me a hint for the next step, not the whole answer.',
  },
  { label: 'Check my answer', text: 'My answer is: ', send: false },
  {
    label: 'Explain the solution',
    text: 'Explain the solution step by step.',
  },
  {
    label: 'Why this method?',
    text: 'Why does this method work here, and how would I spot it in an exam?',
  },
  {
    label: 'Similar question',
    text: 'Give me a similar question to practise, without the solution.',
  },
];

// The AI tutor for one practice question (`route.params.questionId`). The tutor gets
// the question and its official solution, so its hints and answer checks follow it.
const QuestionTutorScreen = ({ route, navigation }) => {
  const question = getQuestion(route.params?.questionId);
  const [questionShown, setQuestionShown] = useState(true);

  const context = useMemo(
    () =>
      question
        ? {
            course: getCourse(question.courseKey)?.title ?? '',
            topic: topicTitle(question),
            text: question.prompt,
            answer: question.answer,
            solution: question.solution,
          }
        : null,
    [question],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScreenHeader
          onClose={() => navigation.goBack()}
          title="Ask the tutor"
        />
        {question ? (
          <>
            <View style={styles.questionBox}>
              <TouchableOpacity
                style={styles.questionHeader}
                onPress={() => setQuestionShown(shown => !shown)}
                accessibilityRole="button"
                accessibilityState={{ expanded: questionShown }}
              >
                <Text style={styles.questionTitle} numberOfLines={1}>
                  {context.topic}
                </Text>
                <Text style={styles.toggle}>
                  {questionShown ? 'Hide question' : 'Show question'}
                </Text>
              </TouchableOpacity>
              {questionShown ? (
                <ScrollView style={styles.questionScroll} nestedScrollEnabled>
                  <MathText content={question.prompt} />
                </ScrollView>
              ) : null}
            </View>
            <TutorChat
              question={context}
              suggestions={SUGGESTIONS}
              emptyTitle="Stuck on this question?"
              emptySubtitle="Ask for a hint, check your answer, or go through the solution step by step."
            />
          </>
        ) : (
          <View style={styles.missing}>
            <Text style={styles.missingText}>
              This question could not be found.
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  questionBox: {
    marginHorizontal: 20,
    marginBottom: 4,
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.surfaceSubtleBorder,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  questionTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  toggle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 12,
  },
  questionScroll: {
    maxHeight: 180,
    marginTop: 10,
  },
  missing: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  missingText: {
    fontSize: 17,
    color: colors.textMuted,
    textAlign: 'center',
  },
});

export default QuestionTutorScreen;
