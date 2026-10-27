import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../theme';

// A thin bar filled to `value` (0 to 1). `secondary` (also 0 to 1) is drawn after it in
// a second colour, e.g. questions still to review.
export default function ProgressBar({ value, secondary = 0, style }) {
  const filled = Math.max(0, Math.min(1, value || 0));
  const extra = Math.max(0, Math.min(1 - filled, secondary || 0));
  return (
    <View
      style={[styles.track, style]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(filled * 100) }}
    >
      <View style={[styles.fill, { flex: filled }]} />
      <View style={[styles.secondary, { flex: extra }]} />
      <View style={{ flex: 1 - filled - extra }} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: colors.surfaceSubtle,
  },
  fill: {
    backgroundColor: colors.success,
  },
  secondary: {
    backgroundColor: colors.warning,
  },
});
