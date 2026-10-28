import React, { useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '../theme';

// A ring like Apple's Activity rings. `value` (0 to 1) fills in `color`, or in a
// gradient between `gradient` colours; `secondary` (0 to 1) continues after it in
// `secondaryColor`, e.g. questions still to review. Children sit in the middle.
export default function ProgressRing({
  size = 44,
  strokeWidth = 5,
  value = 0,
  secondary = 0,
  color = 'green',
  secondaryColor = 'orange',
  gradient,
  children,
  accessibilityLabel,
}) {
  const { colors } = useTheme();
  const id = useId().replace(/:/g, '');
  const center = size / 2;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const filled = Math.max(0, Math.min(1, value || 0));
  const extra = Math.max(0, Math.min(1 - filled, secondary || 0));
  const paint = name => colors[name] ?? name;

  const arc = (start, length, stroke) =>
    length > 0 ? (
      <Circle
        cx={center}
        cy={center}
        r={r}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={`${length * circumference} ${circumference}`}
        transform={`rotate(${-90 + start * 360} ${center} ${center})`}
      />
    ) : null;

  return (
    <View
      style={{ width: size, height: size }}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(filled * 100) }}
    >
      <Svg width={size} height={size}>
        {gradient ? (
          <Defs>
            <LinearGradient id={`ring${id}`} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={paint(gradient[0])} />
              <Stop offset="1" stopColor={paint(gradient[1])} />
            </LinearGradient>
          </Defs>
        ) : null}
        <Circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke={colors.fill}
          strokeWidth={strokeWidth}
        />
        {arc(0, filled, gradient ? `url(#ring${id})` : paint(color))}
        {arc(filled, extra, paint(secondaryColor))}
      </Svg>
      {children ? <View style={styles.center}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
