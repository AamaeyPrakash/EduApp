import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ScrollView,
  useWindowDimensions,
  View,
} from 'react-native';
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

// The second tap of a double tap lands on the button that replaced the first one
// (Show answer becomes Got it), so presses this soon after the last are ignored.
const DOUBLE_TAP_MS = 400;

const formatTime = seconds =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

const spokenTime = seconds => {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return [
    minutes > 0 ? `${minutes} minute${minutes === 1 ? '' : 's'}` : null,
    rest > 0 || minutes === 0 ? `${rest} second${rest === 1 ? '' : 's'}` : null,
  ]
    .filter(Boolean)
    .join(' ');
};

// Seconds left until `endsAt`, updated every second; null without a time limit.
function useCountdown(endsAt, running) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!endsAt || !running) {
      return undefined;
    }
    const timer = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= endsAt) {
        clearInterval(timer);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [endsAt, running]);
  return endsAt ? Math.max(0, Math.ceil((endsAt - now) / 1000)) : null;
}

const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;

const SUMMARY_TITLES = {
  finished: 'Session complete',
  timeUp: "Time's up",
  ended: 'Session ended',
};

function Summary({
  results,
  skipped,
  total,
  reason,
  goalReached,
  onRetry,
  onDone,
}) {
  const styles = useStyles();
  const { streak } = useStudy();
  const right = results.filter(result => result.gotIt).length;
  const missed = results.length - right;
  let message = "You didn't mark any questions. Come back when you're ready.";
  if (results.length > 0) {
    message =
      missed === 0
        ? "They'll come back later to check they've stuck."
        : `${
            missed === 1 ? 'The one' : `The ${missed}`
          } you missed will come back tomorrow.`;
  }
  if (reason === 'timeUp') {
    message = `You answered ${results.length} of ${total}. ${message}`;
  }
  const breakdown = [`${right} right`, `${missed} not yet`];
  if (skipped > 0) {
    breakdown.push(`${skipped} skipped`);
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
        {SUMMARY_TITLES[reason]}
      </AppText>
      {results.length > 0 || skipped > 0 ? (
        <AppText
          variant="subheadline"
          weight="600"
          color="secondaryLabel"
          align="center"
          style={styles.breakdown}
        >
          {breakdown.join(' · ')}
        </AppText>
      ) : null}
      <AppText variant="body" color="secondaryLabel" align="center">
        {message}
      </AppText>
      {streak > 0 || goalReached ? (
        <View style={styles.badges}>
          {streak > 0 ? (
            <View style={[styles.badge, styles.streakBadge]}>
              <Icon name="flame" size={16} color="orange" />
              <AppText
                variant="subheadline"
                weight="600"
                style={styles.badgeText}
              >
                {streak}-day streak
              </AppText>
            </View>
          ) : null}
          {goalReached ? (
            <View style={[styles.badge, styles.goalBadge]}>
              <Icon name="target" size={16} color="green" />
              <AppText
                variant="subheadline"
                weight="600"
                style={styles.badgeText}
              >
                Daily goal reached
              </AppText>
            </View>
          ) : null}
        </View>
      ) : null}
      <View style={styles.summaryButtons}>
        {missed > 0 ? (
          <Button
            title={
              missed === 1
                ? 'Retry the missed question'
                : `Retry ${plural(missed, 'missed question')}`
            }
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
  const { record, reviewAfter, todayCount, dailyGoal } = useStudy();
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState([]);
  const [skipped, setSkipped] = useState(0);
  const [ended, setEnded] = useState(false);
  const [startCount] = useState(todayCount);
  const [endsAt] = useState(() =>
    timeLimit ? Date.now() + timeLimit * 1000 : null,
  );
  const scrollRef = useRef(null);
  // The buttons at the bottom float over the question, so it scrolls clear of them;
  // with large text they are taller, and side by side only while they fit.
  const [dockHeight, setDockHeight] = useState(66);
  const stackActions = useWindowDimensions().fontScale >= 1.6;
  const actionStyle = stackActions ? null : styles.action;
  const lastPress = useRef(0);
  const markedIndex = useRef(-1);
  // A timed test is a mock exam, so the tutor waits until it's over.
  const tutorReady = isTutorConfigured() && !timeLimit;

  const finished = index >= questions.length;
  const secondsLeft = useCountdown(endsAt, !finished && !ended);
  const timeUp = secondsLeft === 0;
  const question = questions[index];

  useEffect(() => {
    if (secondsLeft === 60) {
      AccessibilityInfo.announceForAccessibility('One minute left');
    } else if (timeUp && !finished) {
      AccessibilityInfo.announceForAccessibility("Time's up");
    }
  }, [secondsLeft, timeUp, finished]);

  // Leaving part-way through shows what was done so far.
  const close = () => {
    if (results.length > 0 && !finished && !timeUp && !ended) {
      setEnded(true);
    } else {
      navigation.goBack();
    }
  };

  const once = action => () => {
    const now = Date.now();
    if (now - lastPress.current < DOUBLE_TAP_MS) {
      return;
    }
    lastPress.current = now;
    action();
  };

  const goToNext = () => {
    setRevealed(false);
    setIndex(current => current + 1);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const mark = gotIt => {
    if (markedIndex.current === index) {
      return;
    }
    markedIndex.current = index;
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

  if (finished || timeUp || ended) {
    const missedIds = results
      .filter(result => !result.gotIt)
      .map(result => result.id);
    let reason = 'finished';
    if (!finished) {
      reason = timeUp ? 'timeUp' : 'ended';
    }
    return (
      <View style={styles.screen}>
        <TopBar
          title={title}
          onBack={() => navigation.goBack()}
          backIcon="close"
          backLabel="Close"
        />
        <Summary
          results={results}
          skipped={skipped}
          total={questions.length}
          reason={reason}
          goalReached={startCount < dailyGoal && todayCount >= dailyGoal}
          onDone={() => navigation.goBack()}
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
            accessible
            accessibilityRole="timer"
            accessibilityLabel={`${spokenTime(secondsLeft)} left`}
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
          { paddingBottom: Math.max(insets.bottom, 12) + dockHeight + 54 },
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
            color="secondaryLabel"
            align="center"
            style={styles.hint}
          >
            Work it out on paper first, then check your answer.
          </AppText>
        )}
      </ScrollView>
      <View
        style={[styles.dock, { bottom: Math.max(insets.bottom, 12) }]}
        onLayout={event => setDockHeight(event.nativeEvent.layout.height)}
      >
        <Glass style={[styles.actions, stackActions && styles.actionsStacked]}>
          {revealed ? (
            <>
              <Button
                title="Not yet"
                detail={`Back ${reviewAfter(question.id, false)}`}
                variant="tinted"
                color="orange"
                style={actionStyle}
                accessibilityLabel="Not yet"
                onPress={once(() => mark(false))}
              />
              <Button
                title="Got it"
                detail={`Back ${reviewAfter(question.id, true)}`}
                variant="filled"
                color="green"
                style={actionStyle}
                accessibilityLabel="Got it"
                onPress={once(() => mark(true))}
              />
            </>
          ) : (
            <>
              <Button
                title="Skip"
                variant="gray"
                style={actionStyle}
                onPress={once(() => {
                  setSkipped(count => count + 1);
                  goToNext();
                })}
              />
              <Button
                title="Show answer"
                style={actionStyle}
                onPress={once(() => setRevealed(true))}
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
  actionsStacked: {
    flexDirection: 'column',
    borderRadius: radius.large,
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
    marginBottom: 6,
  },
  breakdown: {
    marginBottom: 8,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  badge: {
    ...continuous,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 36,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.capsule,
  },
  streakBadge: {
    backgroundColor: theme.colors.orangeFill,
  },
  goalBadge: {
    backgroundColor: theme.colors.greenFill,
  },
  badgeText: {
    marginLeft: 6,
  },
  summaryButtons: {
    alignSelf: 'stretch',
    gap: 10,
    marginTop: 32,
  },
}));

export default PracticeScreen;
