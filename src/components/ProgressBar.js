import React from 'react';
import { StyleSheet, View } from 'react-native';
import { radius, useTheme } from '../theme';

// A thin capsule filled to `value` (0 to 1). `secondary` (also 0 to 1) is drawn after it
// in orange, e.g. questions still to review.
export default function ProgressBar({ value, secondary = 0, style }) {
  const { colors } = useTheme();
  const filled = Math.max(0, Math.min(1, value || 0));
  const extra = Math.max(0, Math.min(1 - filled, secondary || 0));
  return (
    <View
      style={[styles.track, { backgroundColor: colors.fill }, style]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(filled * 100) }}
    >
      <View style={{ flex: filled, backgroundColor: colors.tint }} />
      <View style={{ flex: extra, backgroundColor: colors.orange }} />
      <View style={{ flex: 1 - filled - extra }} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    height: 6,
    borderRadius: radius.capsule,
    overflow: 'hidden',
  },
});
