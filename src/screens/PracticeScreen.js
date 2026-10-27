import React, { useMemo, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MathText from '../components/MathText';
import PrimaryButton from '../components/PrimaryButton';
import ProgressBar from '../components/ProgressBar';
import {
  AskTutorLink,
  cardStyle,
  QuestionMeta,
} from '../components/QuestionCard';
import ScreenHeader from '../components/ScreenHeader';
import { getCourse, getQuestions, topicTitle } from '../content';
import { isTutorConfigured } from '../services/ai';
import { useStudy } from '../study/StudyContext';
import { colors } from '../theme';

function Panel({ label, content }) {
  return (
    <View style={styles.panel}>
      <Text style={styles.panelLabel}>{label}</Text>
      <MathText content={content} />
    </View>
  );
}

function Summary({ results, onRetry, onDone }) {
  const right = results.filter(result => result.gotIt).length;
  const missed = results.length - right;
  let message = 'You skipped every question. Come back when you are ready.';
  if (results.length > 0) {
    message =
      missed === 0
        ? "Every one right. They'll come back later to make sure they stick."
        : `${missed} question${
            missed === 1 ? '' : 's'
          } will come back for review tomorrow.`;
  }
  return (
    <View style={styles.summary}>
      <Text style={styles.summaryTitle} accessibilityRole="header">
        Session complete
      </Text>
      {results.length > 0 ? (
        <Text style={styles.score}>
          {right} / {results.length}
        </Text>
      ) : null}
      {results.length > 0 ? (
        <Text style={styles.scoreLabel}>got it</Text>
      ) : null}
      <Text style={styles.summaryText}>{message}</Text>
      {missed > 0 ? (
        <PrimaryButton
          title={`Try the ${missed} I missed again`}
          onPress={onRetry}
          style={styles.summaryButton}
        />
      ) : null}
      <PrimaryButton
        title="Done"
        variant={missed > 0 ? 'secondary' : 'primary'}
        onPress={onDone}
        style={styles.summaryButton}
      />
    </View>
  );
}

// Practice one question at a time: try it, reveal the answer, then mark it "Got it" or
// "Not yet". Marked questions are scheduled for review (see study/progress.js).
// Params: { title, questionIds }.
const PracticeScreen = ({ route, navigation }) => {
  const { title = 'Practice', questionIds = [] } = route.params ?? {};
  const questions = useMemo(() => getQuestions(questionIds), [questionIds]);
  const { record } = useStudy();
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState([]);
  const scrollRef = useRef(null);
  const tutorReady = isTutorConfigured();

  const question = questions[index];
  const finished = index >= questions.length;

  const goToNext = () => {
    setRevealed(false);
    setIndex(current => current + 1);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const mark = gotIt => {
    record(question.id, gotIt);
    setResults(current => [...current, { id: question.id, gotIt }]);
    goToNext();
  };

  if (questions.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScreenHeader onClose={() => navigation.goBack()} title={title} />
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Nothing to practise here yet.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (finished) {
    const missedIds = results
      .filter(result => !result.gotIt)
      .map(result => result.id);
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScreenHeader onClose={() => navigation.goBack()} title={title} />
        <Summary
          results={results}
          onDone={() => navigation.goBack()}
          onRetry={() =>
            navigation.replace('Practice', {
              title: 'Questions to retry',
              questionIds: missedIds,
            })
          }
        />
      </SafeAreaView>
    );
  }

  const course = getCourse(question.courseKey);
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader
        onClose={() => navigation.goBack()}
        title={title}
        right={
          <Text style={styles.counter}>
            {index + 1} / {questions.length}
          </Text>
        }
      />
      <ProgressBar
        value={index / questions.length}
        style={styles.progressBar}
      />
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <QuestionMeta
            question={question}
            heading={`${course?.title ?? ''} · ${topicTitle(question)}`}
          />
          <MathText content={question.prompt} textStyle={styles.prompt} />
          {revealed ? (
            <>
              {question.answer ? (
                <Panel label="Answer" content={question.answer} />
              ) : null}
              <Panel
                label={question.solutionLabel}
                content={question.solution}
              />
            </>
          ) : (
            <Text style={styles.hint}>
              Work it out on paper first, then check your answer.
            </Text>
          )}
          {tutorReady ? (
            <AskTutorLink
              onPress={() =>
                navigation.navigate('QuestionTutor', {
                  questionId: question.id,
                })
              }
            />
          ) : null}
        </View>
      </ScrollView>
      <View style={styles.actions}>
        {revealed ? (
          <>
            <Text style={styles.actionsPrompt}>How did you do?</Text>
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionButton, styles.notYet]}
                onPress={() => mark(false)}
                accessibilityRole="button"
                accessibilityHint="It will come back tomorrow"
              >
                <Text style={styles.actionText}>Not yet</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.gotIt]}
                onPress={() => mark(true)}
                accessibilityRole="button"
                accessibilityHint="It will come back later for review"
              >
                <Text style={styles.actionText}>Got it</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.skip]}
              onPress={goToNext}
              accessibilityRole="button"
            >
              <Text style={styles.actionText}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.reveal]}
              onPress={() => setRevealed(true)}
              accessibilityRole="button"
            >
              <Text style={styles.actionText}>Show answer</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const actionButton = {
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 16,
  paddingVertical: 16,
  borderWidth: 1,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  counter: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textMuted,
  },
  progressBar: {
    marginHorizontal: 20,
    marginBottom: 8,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  card: cardStyle,
  prompt: {
    fontSize: 17,
    lineHeight: 25,
  },
  hint: {
    marginTop: 16,
    fontSize: 14,
    color: colors.textFaint,
    textAlign: 'center',
  },
  panel: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.surfaceSubtleBorder,
  },
  panelLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  actions: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceSubtleBorder,
  },
  actionsPrompt: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 10,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton,
  skip: {
    backgroundColor: colors.surfaceSubtle,
    borderColor: colors.surfaceSubtleBorder,
  },
  reveal: {
    backgroundColor: colors.primaryStrong,
    borderColor: colors.surfaceSubtleBorder,
  },
  notYet: {
    backgroundColor: colors.warningSurface,
    borderColor: colors.warningBorder,
  },
  gotIt: {
    backgroundColor: colors.successSurface,
    borderColor: colors.successBorder,
  },
  actionText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 17,
    color: colors.textMuted,
    textAlign: 'center',
  },
  summary: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
    paddingHorizontal: 32,
  },
  summaryTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  score: {
    fontSize: 56,
    fontWeight: '700',
    color: colors.success,
    textAlign: 'center',
  },
  scoreLabel: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 16,
  },
  summaryText: {
    fontSize: 16,
    lineHeight: 23,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  summaryButton: {
    marginTop: 12,
  },
});

export default PracticeScreen;
