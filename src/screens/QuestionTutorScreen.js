import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppText from '../components/AppText';
import Icon from '../components/Icon';
import MathText from '../components/MathText';
import { TopBar } from '../components/Screen';
import TutorChat from '../components/TutorChat';
import { getCourse, getQuestion, topicTitle } from '../content';
import { continuous, gutter, makeStyles, radius } from '../theme';

const SUGGESTIONS = [
  {
    label: 'Give me a hint',
    text: 'Give me a hint for the next step, not the whole answer.',
    icon: 'lightbulb',
  },
  {
    label: 'Check my answer',
    text: 'My answer is: ',
    icon: 'check',
    send: false,
  },
  {
    label: 'Explain the solution',
    text: 'Explain the solution step by step.',
    icon: 'book',
  },
  {
    label: 'Why this method?',
    text: 'Why does this method work here, and how would I spot it in an exam?',
    icon: 'target',
  },
  {
    label: 'Similar question',
    text: 'Give me a similar question to practise, without the solution.',
    icon: 'shuffle',
  },
];

// The AI tutor for one practice question (`route.params.questionId`). The tutor gets
// the question and its official solution, so its hints and answer checks follow it.
const QuestionTutorScreen = ({ route, navigation }) => {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
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
    <View style={styles.screen}>
      <TopBar
        title="Ask the tutor"
        onBack={() => navigation.goBack()}
        backIcon="close"
        backLabel="Close"
      />
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        {question ? (
          <TutorChat
            question={context}
            suggestions={SUGGESTIONS}
            bottomInset={Math.max(insets.bottom, 12)}
            emptyTitle="Stuck on this question?"
            emptySubtitle="Ask for a hint, check your answer, or go through the solution step by step."
            renderHeader={() => (
              <View style={{ paddingTop: insets.top + 56 }}>
                <View style={styles.questionBox}>
                  <Pressable
                    style={styles.questionHeader}
                    onPress={() => setQuestionShown(shown => !shown)}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: questionShown }}
                  >
                    <AppText
                      variant="footnote"
                      color="secondaryLabel"
                      weight="600"
                      numberOfLines={1}
                      style={styles.questionTitle}
                    >
                      {context.course} · {context.topic}
                    </AppText>
                    <AppText variant="footnote" color="tint" weight="600">
                      {questionShown ? 'Hide question' : 'Show question'}
                    </AppText>
                    <Icon
                      name={questionShown ? 'chevronUp' : 'chevronDown'}
                      size={14}
                      color="tint"
                      strokeWidth={2.4}
                    />
                  </Pressable>
                  {questionShown ? (
                    <ScrollView
                      style={styles.questionScroll}
                      nestedScrollEnabled
                    >
                      <MathText content={question.prompt} />
                    </ScrollView>
                  ) : null}
                </View>
              </View>
            )}
          />
        ) : (
          <View style={styles.missing}>
            <AppText variant="body" color="secondaryLabel" align="center">
              This question could not be found.
            </AppText>
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
};

const useStyles = makeStyles(theme => ({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  flex: {
    flex: 1,
  },
  questionBox: {
    ...continuous,
    marginHorizontal: gutter,
    marginBottom: 4,
    padding: 14,
    borderRadius: radius.card,
    backgroundColor: theme.colors.surface,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 44,
    marginVertical: -12,
  },
  questionTitle: {
    flex: 1,
    marginRight: 8,
  },
  questionScroll: {
    maxHeight: 180,
    marginTop: 18,
  },
  missing: {
    flex: 1,
    justifyContent: 'center',
    padding: 32,
  },
}));

export default QuestionTutorScreen;
