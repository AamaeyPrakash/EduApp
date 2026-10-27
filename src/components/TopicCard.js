import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../theme';
import ProgressBar from './ProgressBar';

function progressLabel({ total, known, review }) {
  if (known === 0 && review === 0) {
    return 'Not started';
  }
  const parts = [`${known} of ${total} got it`];
  if (review > 0) {
    parts.push(`${review} to review`);
  }
  return parts.join(' · ');
}

// A topic/chapter with its progress and "Revisions" (study mode) and "Quiz" buttons.
export default function TopicCard({
  title,
  subtitle,
  progress,
  onRevise,
  onQuiz,
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {subtitle ? <Text style={styles.cardSubtitle}>{subtitle}</Text> : null}
      {progress ? (
        <View style={styles.progress}>
          <ProgressBar
            value={progress.known / progress.total}
            secondary={progress.review / progress.total}
          />
          <Text style={styles.progressText}>{progressLabel(progress)}</Text>
        </View>
      ) : null}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.buttonSecondary}
          onPress={onRevise}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={`Revise ${title}`}
        >
          <Text style={styles.buttonText}>Revisions</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.buttonPrimary}
          onPress={onQuiz}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={`Quiz on ${title}`}
        >
          <Text style={styles.buttonText}>Quiz</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const button = {
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 18,
  paddingVertical: 16,
  borderWidth: 1,
  borderColor: colors.surfaceSubtleBorder,
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    opacity: 0.7,
    marginBottom: 12,
    letterSpacing: -0.14,
  },
  progress: {
    marginBottom: 8,
  },
  progressText: {
    fontSize: 13,
    color: colors.textFaint,
    marginTop: 6,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  buttonSecondary: {
    ...button,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  buttonPrimary: {
    ...button,
    backgroundColor: colors.primaryStrong,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.16,
  },
});
