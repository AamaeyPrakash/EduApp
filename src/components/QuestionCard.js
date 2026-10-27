import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CalculatorIcon from '../assets/CalculatorIconWhite.png';
import NoCalculatorIcon from '../assets/NonCalculatorIconWhite.png';
import { useStudy } from '../study/StudyContext';
import { colors } from '../theme';
import MathText from './MathText';
import RevealSection from './RevealSection';

// Where a question is from, its concept, whether a calculator is allowed (IB), and a
// star to save it for later.
export function QuestionMeta({ question, heading }) {
  const { isBookmarked, toggleBookmark } = useStudy();
  const saved = isBookmarked(question.id);
  return (
    <View style={styles.meta}>
      {question.calculator === null ? null : (
        <Image
          source={question.calculator ? CalculatorIcon : NoCalculatorIcon}
          style={styles.calculatorIcon}
          accessibilityLabel={
            question.calculator ? 'Calculator allowed' : 'No calculator'
          }
        />
      )}
      <View style={styles.metaText}>
        <Text style={styles.heading}>{heading}</Text>
        {question.label ? (
          <Text style={styles.label}>{question.label}</Text>
        ) : null}
      </View>
      <TouchableOpacity
        onPress={() => toggleBookmark(question.id)}
        accessibilityRole="button"
        accessibilityLabel={saved ? 'Remove from saved' : 'Save question'}
        accessibilityState={{ selected: saved }}
        hitSlop={10}
      >
        <Text style={[styles.star, saved && styles.starSaved]}>
          {saved ? '★' : '☆'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export function AskTutorLink({ onPress }) {
  return (
    <TouchableOpacity
      style={styles.askTutor}
      onPress={onPress}
      accessibilityRole="button"
      hitSlop={6}
    >
      <Text style={styles.askTutorText}>Stuck? Ask the tutor about this</Text>
    </TouchableOpacity>
  );
}

// A question with "Show Answer" and "Show Solution/Working" buttons. Which parts are
// open is kept by the screen (`isShown`/`onToggle`), so it survives list scrolling.
export default function QuestionCard({
  question,
  heading,
  isShown,
  onToggle,
  onAskTutor,
}) {
  const answerKey = `${question.id}:answer`;
  const solutionKey = `${question.id}:solution`;
  return (
    <View style={styles.card}>
      <QuestionMeta question={question} heading={heading} />
      <MathText content={question.prompt} textStyle={styles.prompt} />
      {question.answer ? (
        <RevealSection
          label="Answer"
          content={question.answer}
          shown={isShown(answerKey)}
          onToggle={() => onToggle(answerKey)}
        />
      ) : null}
      <RevealSection
        label={question.solutionLabel}
        content={question.solution}
        shown={isShown(solutionKey)}
        onToggle={() => onToggle(solutionKey)}
      />
      {onAskTutor ? <AskTutorLink onPress={onAskTutor} /> : null}
    </View>
  );
}

export const cardStyle = {
  backgroundColor: colors.surface,
  borderRadius: 24,
  padding: 24,
  width: '100%',
  maxWidth: 500,
  marginBottom: 20,
  borderWidth: 1,
  borderColor: colors.surfaceBorder,
};

const styles = StyleSheet.create({
  card: cardStyle,
  meta: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  calculatorIcon: {
    width: 30,
    height: 30,
    marginRight: 12,
  },
  metaText: {
    flex: 1,
  },
  heading: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    opacity: 0.8,
  },
  label: {
    fontSize: 13,
    color: colors.textFaint,
    marginTop: 2,
  },
  star: {
    fontSize: 24,
    lineHeight: 26,
    color: colors.textFaint,
    marginLeft: 12,
  },
  starSaved: {
    color: colors.warning,
  },
  prompt: {
    fontSize: 17,
    lineHeight: 25,
  },
  askTutor: {
    marginTop: 16,
    alignSelf: 'center',
  },
  askTutorText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
});
