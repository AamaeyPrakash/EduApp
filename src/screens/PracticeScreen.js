import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppText from '../components/AppText';
import Button from '../components/Button';
import Glass, { GlassIconButton } from '../components/Glass';
import Icon from '../components/Icon';
import MathText from '../components/MathText';
import ProgressBar from '../components/ProgressBar';
import ProgressRing from '../components/ProgressRing';
import {
  AnswerPanel,
  BookmarkButton,
  QuestionMeta,
} from '../components/QuestionCard';
import { TopBar } from '../components/Screen';
import { getCourse, getQuestions, topicTitle } from '../content';
import { isTutorConfigured } from '../services/ai';
import { useStudy } from '../study/StudyContext';
import { continuous, gutter, makeStyles, radius } from '../theme';

const formatTime = seconds =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

// Seconds left until `endsAt`, updated every second; null without a time limit.
function useCountdown(endsAt, running) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!endsAt || !running) {
      return undefined;
    }
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [endsAt, running]);
  return endsAt ? Math.max(0, Math.ceil((endsAt - now) / 1000)) : null;
}

function Summary({ results, total, timeUp, onRetry, onDone }) {
  const styles = useStyles();
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
  if (timeUp) {
    message = `Time's up: you answered ${results.length} of ${total}. ${message}`;
  }
  return (
    <View style={styles.summary}>
      {results.length > 0 ? (
        <ProgressRing
          size={160}
          strokeWidth={16}
          value={right / results.length}
          gradient={['green', 'teal']}
          accessibilityLabel={`${right} of ${results.length} right`}
        >
          <AppText variant="largeTitle">
            {right} / {results.length}
          </AppText>
          <AppText variant="footnote" color="secondaryLabel">
            got it
          </AppText>
        </ProgressRing>
      ) : null}
      <AppText
        variant="title1"
        align="center"
        accessibilityRole="header"
        style={styles.summaryTitle}
      >
        {timeUp ? "Time's up" : 'Session complete'}
      </AppText>
      <AppText variant="body" color="secondaryLabel" align="center">
        {message}
      </AppText>
      <View style={styles.summaryButtons}>
        {missed > 0 ? (
          <Button
            title={`Try the ${missed} I missed again`}
            onPress={onRetry}
          />
        ) : null}
        <Button
          title="Done"
          variant={missed > 0 ? 'gray' : 'filled'}
          onPress={onDone}
        />
      </View>
    </View>
  );
}

// Practice one question at a time: try it, reveal the answer, then mark it "Got it" or
// "Not yet". Marked questions are scheduled for review (see study/progress.js).
// Params: { title, questionIds, timeLimit? } with timeLimit in seconds.
const PracticeScreen = ({ route, navigation }) => {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const {
    title = 'Practice',
    questionIds = [],
    timeLimit,
  } = route.params ?? {};
  const questions = useMemo(() => getQuestions(questionIds), [questionIds]);
  const { record } = useStudy();
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState([]);
  const [endsAt] = useState(() =>
    timeLimit ? Date.now() + timeLimit * 1000 : null,
  );
  const scrollRef = useRef(null);
  const tutorReady = isTutorConfigured();

  const finished = index >= questions.length;
  const secondsLeft = useCountdown(endsAt, !finished);
  const timeUp = secondsLeft === 0;
  const question = questions[index];
  const close = () => navigation.goBack();

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
      <View style={styles.screen}>
        <TopBar
          title={title}
          onBack={close}
          backIcon="close"
          backLabel="Close"
        />
        <View style={styles.centered}>
          <AppText variant="body" color="secondaryLabel" align="center">
            Nothing to practise here yet.
          </AppText>
        </View>
      </View>
    );
  }

  if (finished || timeUp) {
    const missedIds = results
      .filter(result => !result.gotIt)
      .map(result => result.id);
    return (
      <View style={styles.screen}>
        <TopBar
          title={title}
          onBack={close}
          backIcon="close"
          backLabel="Close"
        />
        <Summary
          results={results}
          total={questions.length}
          timeUp={timeUp && !finished}
          onDone={close}
          onRetry={() =>
            navigation.replace('Practice', {
              title: 'Questions to retry',
              questionIds: missedIds,
            })
          }
        />
      </View>
    );
  }

  const course = getCourse(question.courseKey);
  return (
    <View style={styles.screen}>
      <TopBar
        title={title}
        onBack={close}
        backIcon="close"
        backLabel="Close"
        right={
          <>
            <Glass style={styles.bookmarkButton}>
              <BookmarkButton questionId={question.id} />
            </Glass>
            {tutorReady ? (
              <GlassIconButton
                icon="sparkles"
                color="purple"
                accessibilityLabel="Ask the tutor about this question"
                onPress={() =>
                  navigation.navigate('QuestionTutor', {
                    questionId: question.id,
                  })
                }
              />
            ) : null}
          </>
        }
      />
      <View style={[styles.progress, { marginTop: insets.top + 60 }]}>
        <ProgressBar
          value={index / questions.length}
          style={styles.progressBar}
        />
        <AppText variant="footnote" color="secondaryLabel" weight="600">
          {index + 1} / {questions.length}
        </AppText>
        {secondsLeft !== null ? (
          <View
            style={[styles.timer, secondsLeft <= 60 && styles.timerLow]}
            accessibilityLabel={`${formatTime(secondsLeft)} left`}
          >
            <Icon
              name="timer"
              size={14}
              color={secondsLeft <= 60 ? 'red' : 'secondaryLabel'}
              strokeWidth={2.2}
            />
            <AppText
              variant="footnote"
              weight="600"
              color={secondsLeft <= 60 ? 'red' : 'secondaryLabel'}
              style={styles.timerText}
            >
              {formatTime(secondsLeft)}
            </AppText>
          </View>
        ) : null}
      </View>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <QuestionMeta
            question={question}
            heading={`${course?.title ?? ''} · ${topicTitle(question)}`}
          />
          <MathText content={question.prompt} />
        </View>
        {revealed ? (
          <>
            {question.answer ? (
              <AnswerPanel
                label="Answer"
                content={question.answer}
                tone="answer"
              />
            ) : null}
            <AnswerPanel
              label={question.solutionLabel}
              content={question.solution}
            />
          </>
        ) : (
          <AppText
            variant="footnote"
            color="tertiaryLabel"
            align="center"
            style={styles.hint}
          >
            Work it out on paper first, then check your answer.
          </AppText>
        )}
      </ScrollView>
      <View style={[styles.dock, { bottom: Math.max(insets.bottom, 12) }]}>
        <Glass style={styles.actions}>
          {revealed ? (
            <>
              <Button
                title="Not yet"
                variant="tinted"
                color="orange"
                style={styles.action}
                accessibilityLabel="Not yet"
                onPress={() => mark(false)}
              />
              <Button
                title="Got it"
                variant="filled"
                color="green"
                style={styles.action}
                accessibilityLabel="Got it"
                onPress={() => mark(true)}
              />
            </>
          ) : (
            <>
              <Button
                title="Skip"
                variant="gray"
                style={styles.action}
                onPress={goToNext}
              />
              <Button
                title="Show answer"
                style={styles.action}
                onPress={() => setRevealed(true)}
              />
            </>
          )}
        </Glass>
      </View>
    </View>
  );
};

const useStyles = makeStyles(theme => ({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    padding: 32,
  },
  bookmarkButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progress: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: gutter + 4,
    marginBottom: 8,
    gap: 12,
  },
  progressBar: {
    flex: 1,
  },
  timer: {
    ...continuous,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    height: 24,
    borderRadius: radius.capsule,
    backgroundColor: theme.colors.secondaryFill,
  },
  timerLow: {
    backgroundColor: theme.colors.redFill,
  },
  timerText: {
    marginLeft: 4,
    fontVariant: ['tabular-nums'],
  },
  content: {
    paddingHorizontal: gutter,
    paddingTop: 8,
  },
  card: {
    ...continuous,
    backgroundColor: theme.colors.surface,
    borderRadius: radius.large,
    padding: 20,
  },
  hint: {
    marginTop: 16,
  },
  dock: {
    position: 'absolute',
    left: gutter,
    right: gutter,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    padding: 8,
    borderRadius: radius.capsule,
  },
  action: {
    flex: 1,
  },
  summary: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  summaryTitle: {
    marginTop: 28,
    marginBottom: 8,
  },
  summaryButtons: {
    alignSelf: 'stretch',
    gap: 10,
    marginTop: 32,
  },
}));

export default PracticeScreen;
