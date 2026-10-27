import React, { useId } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import { useTheme } from '../theme';

// Soft colour washes behind the top of a screen, giving glass and large titles
// something to sit on. Purely decorative.
export default function AmbientGlow({ height = 380 }) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const id = useId().replace(/:/g, '');
  const blobs = [
    {
      cx: width * 0.15,
      cy: height * 0.15,
      rx: width * 0.75,
      ry: height * 0.55,
    },
    { cx: width * 0.95, cy: height * 0.05, rx: width * 0.6, ry: height * 0.5 },
    { cx: width * 0.6, cy: height * 0.55, rx: width * 0.55, ry: height * 0.35 },
  ];
  return (
    <Svg pointerEvents="none" width={width} height={height} style={styles.glow}>
      <Defs>
        {colors.glow.map((color, index) => (
          <RadialGradient
            key={color}
            id={`glow${id}${index}`}
            cx="50%"
            cy="50%"
            r="50%"
          >
            <Stop
              offset="0"
              stopColor={color}
              stopOpacity={colors.glowOpacity}
            />
            <Stop offset="1" stopColor={color} stopOpacity="0" />
          </RadialGradient>
        ))}
      </Defs>
      {blobs.map((blob, index) => (
        <Ellipse key={index} {...blob} fill={`url(#glow${id}${index})`} />
      ))}
    </Svg>
  );
}

const styles = StyleSheet.create({
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
