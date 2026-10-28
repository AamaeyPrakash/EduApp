import React, { useId } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { continuous, useTheme } from '../theme';

// The app's mark: a Σ on a blue-to-indigo squircle, like an app icon.
export default function AppMark({ size = 72 }) {
  const { colors } = useTheme();
  const id = useId().replace(/:/g, '');
  const corner = size * 0.24;
  return (
    <View
      style={[styles.mark, { width: size, height: size, borderRadius: corner }]}
      accessibilityRole="image"
      accessibilityLabel="EduApp"
    >
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={`mark${id}`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.teal} />
            <Stop offset="0.5" stopColor={colors.tint} />
            <Stop offset="1" stopColor={colors.indigo} />
          </LinearGradient>
        </Defs>
        <Rect width={size} height={size} rx={corner} fill={`url(#mark${id})`} />
      </Svg>
      <Text style={[styles.glyph, { fontSize: size * 0.52 }]}>Σ</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  mark: {
    ...continuous,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  glyph: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginTop: -2,
  },
});
