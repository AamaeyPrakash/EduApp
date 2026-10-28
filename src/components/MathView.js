import React, { useMemo } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
} from 'react-native';
import { SvgFromXml } from 'react-native-svg';
import '../lib/mathjaxVersion';
import { mathViewRender } from 'react-native-math-view/src/hooks';
import { useTheme } from '../theme';

// Renders a TeX formula as SVG using react-native-math-view's JavaScript renderer on both
// platforms. The library's native Android view can't run on the New Architecture, and
// its own JS fallback converts formulas synchronously, which freezes long lists. This
// converts after the first paint instead (conversions are cached per formula).

// MathJax draws the border of a framed table (\begin{array}{|c|c|}) as a rect that
// relies on its CSS for `fill: none`; without that the rect fills with the text colour.
const unfillFrames = svg =>
  svg.replace(/<rect(?=[^>]*data-frame)/g, '<rect fill="none"');

// Body text is 17 pt; MathJax's ex is half its em.
const EM = 17;
// Narrowest place a formula appears: a solution panel inside a question card.
const NARROWEST_INSET = 96;

const SvgMath = mathViewRender(
  ({ svg, size, color, style, scrollAfter }, ref) => {
    const scrolls = size.width > scrollAfter;
    const image = (
      <SvgFromXml
        ref={ref}
        xml={unfillFrames(svg)}
        width={size.width}
        height={size.height}
        color={color}
        // Inside the scroll view it keeps its full width.
        style={scrolls ? style : [styles.contain, style]}
      />
    );
    if (!scrolls) {
      return image;
    }
    // Too wide to be sure it fits: keep it full size and let it scroll sideways
    // rather than shrinking it until it's unreadable.
    return (
      <ScrollView
        horizontal
        style={[styles.scroll, { width: size.width, height: size.height }]}
        contentContainerStyle={styles.scrollContent}
        showsHorizontalScrollIndicator
        persistentScrollbar
      >
        {image}
      </ScrollView>
    );
  },
  { async: true },
);

function RawTeX({ math, style }) {
  const { colors } = useTheme();
  return (
    <Text style={[styles.raw, { color: colors.label }, style]}>{math}</Text>
  );
}

// `display` sets display-style maths ($$...$$): larger fractions, limits under sums.
// Formulas follow the system text size, like the text around them.
export default function MathView({ math, color, style, display = false }) {
  const { colors } = useTheme();
  const { width, fontScale } = useWindowDimensions();
  const scale = Math.min(fontScale || 1, 2);
  const config = useMemo(
    () => ({ em: EM * scale, ex: (EM * scale) / 2, inline: !display }),
    [scale, display],
  );
  // React 19 ignores defaultProps on function components, so the library's defaults
  // (colour, error fallback) are passed explicitly here.
  return (
    <SvgMath
      math={math}
      config={config}
      color={color ?? colors.label}
      style={style}
      scrollAfter={width - NARROWEST_INSET}
      renderError={RawTeX}
    />
  );
}

const styles = StyleSheet.create({
  contain: {
    maxWidth: '100%',
  },
  scroll: {
    maxWidth: '100%',
    flexGrow: 0,
  },
  scrollContent: {
    alignItems: 'center',
  },
  raw: {
    fontSize: 15,
    fontFamily: Platform.select({ ios: 'Courier', default: 'monospace' }),
  },
});
