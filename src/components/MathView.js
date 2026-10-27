import React from 'react';
import { Platform, StyleSheet, Text } from 'react-native';
import { SvgFromXml } from 'react-native-svg';
import { mathViewRender } from 'react-native-math-view/src/hooks';
import { useTheme } from '../theme';

// Renders a TeX formula as SVG using react-native-math-view's JavaScript renderer on both
// platforms. The library's native Android view can't run on the New Architecture, and
// its own JS fallback converts formulas synchronously, which freezes long lists. This
// converts after the first paint instead (conversions are cached per formula).
const SvgMath = mathViewRender(
  ({ svg, size, color, style }, ref) => (
    <SvgFromXml
      ref={ref}
      xml={svg}
      width={size.width}
      height={size.height}
      color={color}
      style={[styles.contain, style]}
    />
  ),
  { async: true },
);

function RawTeX({ math, style }) {
  const { colors } = useTheme();
  return (
    <Text style={[styles.raw, { color: colors.label }, style]}>{math}</Text>
  );
}

export default function MathView({ math, color, style }) {
  const { colors } = useTheme();
  // React 19 ignores defaultProps on function components, so the library's defaults
  // (colour, error fallback) are passed explicitly here.
  return (
    <SvgMath
      math={math}
      color={color ?? colors.label}
      style={style}
      renderError={RawTeX}
    />
  );
}

const styles = StyleSheet.create({
  contain: {
    maxWidth: '100%',
  },
  raw: {
    fontSize: 15,
    fontFamily: Platform.select({ ios: 'Courier', default: 'monospace' }),
  },
});
