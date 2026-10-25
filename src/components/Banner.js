import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

const TONES = {
  error: {
    backgroundColor: colors.dangerSurface,
    borderColor: colors.dangerBorder,
    color: colors.danger,
  },
  success: {
    backgroundColor: colors.successSurface,
    borderColor: colors.successBorder,
    color: colors.success,
  },
  info: {
    backgroundColor: colors.primaryTint,
    borderColor: 'rgba(10, 132, 255, 0.35)',
    color: colors.textSecondary,
  },
};

// Inline message box for form errors and notices.
export default function Banner({ message, tone = 'error', style }) {
  if (!message) {
    return null;
  }
  const { color, ...box } = TONES[tone];
  return (
    <View
      style={[styles.container, box, style]}
      accessibilityRole={tone === 'error' ? 'alert' : undefined}
      accessibilityLiveRegion="polite"
    >
      <Text style={[styles.text, { color }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
});
