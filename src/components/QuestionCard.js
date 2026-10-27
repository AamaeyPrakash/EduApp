import React from 'react';
import { Pressable, View } from 'react-native';
import { useStudy } from '../study/StudyContext';
import { continuous, makeStyles, radius } from '../theme';
import AppText from './AppText';
import Icon from './Icon';
import MathText from './MathText';
import PressableScale from './PressableScale';

// "Calculator" / "No calculator" for IB questions (Paper 2 and Paper 1 style).
export function CalculatorBadge({ allowed }) {
  const styles = useStyles();
  return (
    <View
      style={styles.badge}
      accessible
      accessibilityLabel={allowed ? 'Calculator allowed' : 'No calculator'}
    >
      <Icon
        name={allowed ? 'calculator' : 'noCalculator'}
        size={14}
        color="secondaryLabel"
        strokeWidth={2}
      />
      <AppText
        variant="caption"
        color="secondaryLabel"
        weight="500"
        style={styles.badgeText}
      >
        {allowed ? 'Calculator' : 'No calculator'}
      </AppText>
    </View>
  );
}

export function BookmarkButton({ questionId, size = 22 }) {
  const { isBookmarked, toggleBookmark } = useStudy();
  const saved = isBookmarked(questionId);
  return (
    <Pressable
      onPress={() => toggleBookmark(questionId)}
      accessibilityRole="button"
      accessibilityLabel={saved ? 'Remove from saved' : 'Save question'}
      accessibilityState={{ selected: saved }}
      hitSlop={10}
    >
      <Icon
        name={saved ? 'bookmarkFill' : 'bookmark'}
        size={size}
        color={saved ? 'orange' : 'secondaryLabel'}
      />
    </Pressable>
  );
}

// Where a question is from, its concept and, for IB, whether a calculator is allowed.
export function QuestionMeta({ question, heading, right }) {
  const styles = useStyles();
  return (
    <View style={styles.meta}>
      <View style={styles.metaText}>
        <AppText variant="footnote" color="secondaryLabel" weight="600">
          {heading}
        </AppText>
        {question.label ? (
          <AppText variant="footnote" color="tertiaryLabel">
            {question.label}
          </AppText>
        ) : null}
        {question.calculator === null ? null : (
          <CalculatorBadge allowed={question.calculator} />
        )}
      </View>
      {right}
    </View>
  );
}

// A titled block revealed under a question, e.g. the answer or worked solution.
export function AnswerPanel({ label, content, tone = 'neutral' }) {
  const styles = useStyles();
  return (
    <View style={[styles.panel, tone === 'answer' && styles.answerPanel]}>
      <AppText
        variant="footnote"
        weight="600"
        color={tone === 'answer' ? 'green' : 'secondaryLabel'}
        style={styles.panelLabel}
      >
        {label.toUpperCase()}
      </AppText>
      <MathText content={content} />
    </View>
  );
}

function Disclosure({ label, open, onPress }) {
  const styles = useStyles();
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.97}
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      accessibilityLabel={`${open ? 'Hide' : 'Show'} ${label}`}
      style={styles.disclosure}
    >
      <AppText variant="subheadline" color="tint" weight="600">
        {open ? `Hide ${label}` : `Show ${label}`}
      </AppText>
      <Icon
        name={open ? 'chevronUp' : 'chevronDown'}
        size={14}
        color="tint"
        strokeWidth={2.4}
      />
    </PressableScale>
  );
}

// A question in a topic's list, with its answer and solution behind disclosures. Which
// parts are open is kept by the screen (`isShown`/`onToggle`), so it survives scrolling.
export default function QuestionCard({
  question,
  heading,
  isShown,
  onToggle,
  onAskTutor,
}) {
  const styles = useStyles();
  const answerKey = `${question.id}:answer`;
  const solutionKey = `${question.id}:solution`;
  const answerOpen = Boolean(question.answer) && isShown(answerKey);
  const solutionOpen = isShown(solutionKey);
  return (
    <View style={styles.card}>
      <QuestionMeta
        question={question}
        heading={heading}
        right={<BookmarkButton questionId={question.id} />}
      />
      <MathText content={question.prompt} />
      {answerOpen ? (
        <AnswerPanel label="Answer" content={question.answer} tone="answer" />
      ) : null}
      {solutionOpen ? (
        <AnswerPanel
          label={question.solutionLabel}
          content={question.solution}
        />
      ) : null}
      <View style={styles.actions}>
        {question.answer ? (
          <Disclosure
            label="Answer"
            open={answerOpen}
            onPress={() => onToggle(answerKey)}
          />
        ) : null}
        <Disclosure
          label={question.solutionLabel}
          open={solutionOpen}
          onPress={() => onToggle(solutionKey)}
        />
        {onAskTutor ? (
          <Pressable
            onPress={onAskTutor}
            accessibilityRole="button"
            accessibilityLabel="Ask the tutor about this question"
            hitSlop={8}
            style={styles.tutor}
          >
            <Icon name="sparkles" size={18} color="purple" />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const useStyles = makeStyles(theme => ({
  card: {
    ...continuous,
    backgroundColor: theme.colors.surface,
    borderRadius: radius.card,
    padding: 18,
    marginBottom: 12,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  metaText: {
    flex: 1,
    gap: 2,
  },
  badge: {
    ...continuous,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.capsule,
    backgroundColor: theme.colors.secondaryFill,
  },
  badgeText: {
    marginLeft: 4,
  },
  panel: {
    ...continuous,
    marginTop: 14,
    padding: 14,
    borderRadius: radius.medium,
    backgroundColor: theme.colors.secondaryFill,
  },
  answerPanel: {
    backgroundColor: theme.colors.greenFill,
  },
  panelLabel: {
    marginBottom: 6,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  disclosure: {
    ...continuous,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    height: 32,
    borderRadius: radius.capsule,
    backgroundColor: theme.colors.tintFill,
  },
  tutor: {
    marginLeft: 'auto',
    padding: 4,
  },
}));
