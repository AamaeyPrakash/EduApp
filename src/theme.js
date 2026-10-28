import { Platform, StyleSheet, useColorScheme } from 'react-native';

// Apple's system colours (iOS 26) for dark and light appearance. The app follows the
// phone's appearance setting. Where text sits on a colour, the colours are Apple's
// higher-contrast variants so text meets WCAG AA (4.5:1): `xSolid` is a fill behind
// white text and `xText` is coloured text on `xFill` or the background.
const dark = {
  dark: true,
  colors: {
    background: '#000000',
    surface: '#1C1C1E',
    surfaceRaised: '#2C2C2E',
    label: '#FFFFFF',
    secondaryLabel: 'rgba(235, 235, 245, 0.6)',
    tertiaryLabel: 'rgba(235, 235, 245, 0.3)',
    placeholder: 'rgba(235, 235, 245, 0.45)',
    separator: 'rgba(84, 84, 88, 0.6)',
    fill: 'rgba(120, 120, 128, 0.36)',
    secondaryFill: 'rgba(120, 120, 128, 0.24)',
    tint: '#0A84FF',
    tintSolid: '#0071E3',
    tintText: '#409CFF',
    tintFill: 'rgba(10, 132, 255, 0.2)',
    green: '#30D158',
    greenSolid: '#23843A',
    greenText: '#30D158',
    greenFill: 'rgba(48, 209, 88, 0.2)',
    orange: '#FF9F0A',
    orangeSolid: '#C93400',
    orangeText: '#FF9F0A',
    orangeFill: 'rgba(255, 159, 10, 0.2)',
    red: '#FF453A',
    redSolid: '#D70015',
    redText: '#FF6961',
    redFill: 'rgba(255, 69, 58, 0.2)',
    indigo: '#5E5CE6',
    purple: '#BF5AF2',
    teal: '#64D2FF',
    pink: '#FF375F',
    onTint: '#FFFFFF',
    // Liquid Glass approximation for floating controls (tab bar, toolbar buttons).
    // Real glass blurs what's behind it; without blur, legibility needs a fairly
    // opaque fill that only lets content show through faintly.
    glass: 'rgba(36, 36, 38, 0.94)',
    glassBorder: 'rgba(255, 255, 255, 0.14)',
    glassHighlight: 'rgba(255, 255, 255, 0.45)',
    glow: ['#0A84FF', '#5E5CE6', '#64D2FF'],
    glowOpacity: 0.32,
  },
  shadowOpacity: 0.45,
};

const light = {
  dark: false,
  colors: {
    background: '#F2F2F7',
    surface: '#FFFFFF',
    surfaceRaised: '#F2F2F7',
    label: '#000000',
    secondaryLabel: 'rgba(60, 60, 67, 0.76)',
    tertiaryLabel: 'rgba(60, 60, 67, 0.3)',
    placeholder: 'rgba(60, 60, 67, 0.55)',
    separator: 'rgba(60, 60, 67, 0.29)',
    fill: 'rgba(120, 120, 128, 0.2)',
    secondaryFill: 'rgba(120, 120, 128, 0.12)',
    tint: '#0066CC',
    tintSolid: '#0066CC',
    tintText: '#005BB8',
    tintFill: 'rgba(0, 102, 204, 0.12)',
    green: '#34C759',
    greenSolid: '#1F7A35',
    greenText: '#1A7031',
    greenFill: 'rgba(52, 199, 89, 0.14)',
    orange: '#FF9500',
    orangeSolid: '#C93400',
    orangeText: '#B83000',
    orangeFill: 'rgba(255, 149, 0, 0.14)',
    red: '#D70015',
    redSolid: '#D70015',
    redText: '#D70015',
    redFill: 'rgba(215, 0, 21, 0.1)',
    indigo: '#5856D6',
    purple: '#AF52DE',
    teal: '#32ADE6',
    pink: '#FF2D55',
    onTint: '#FFFFFF',
    glass: 'rgba(252, 252, 254, 0.94)',
    glassBorder: 'rgba(0, 0, 0, 0.08)',
    glassHighlight: 'rgba(255, 255, 255, 1)',
    glow: ['#5AC8FA', '#AF52DE', '#007AFF'],
    glowOpacity: 0.18,
  },
  shadowOpacity: 0.12,
};

// iOS text styles. Letter spacing follows SF Pro's tracking; Android's Roboto is
// already spaced for its sizes, so it gets none.
const tracking = value => (Platform.OS === 'ios' ? value : 0);
export const type = {
  largeTitle: {
    fontSize: 34,
    lineHeight: 41,
    fontWeight: '700',
    letterSpacing: tracking(0.37),
  },
  title1: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    letterSpacing: tracking(0.36),
  },
  title2: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    letterSpacing: tracking(0.35),
  },
  title3: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '600',
    letterSpacing: tracking(0.38),
  },
  headline: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: tracking(-0.43),
  },
  body: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400',
    letterSpacing: tracking(-0.43),
  },
  callout: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '400',
    letterSpacing: tracking(-0.31),
  },
  subheadline: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400',
    letterSpacing: tracking(-0.23),
  },
  footnote: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    letterSpacing: tracking(-0.08),
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  },
  caption2: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '500',
    letterSpacing: tracking(0.06),
  },
};

// Corner radii. Controls are capsules; containers use continuous ("squircle") corners
// that sit concentrically inside one another.
export const radius = {
  small: 10,
  medium: 14,
  card: 22,
  large: 28,
  capsule: 999,
};

// Side margin for content, matching iOS's standard layout margins.
export const gutter = 16;

export const continuous =
  Platform.OS === 'ios' ? { borderCurve: 'continuous' } : {};

export function useTheme() {
  return useColorScheme() === 'light' ? light : dark;
}

// Creates styles once per appearance: `const useStyles = makeStyles(theme => ({...}))`,
// then `const styles = useStyles()` inside a component.
export function makeStyles(factory) {
  const cache = new Map();
  return function useStyles() {
    const theme = useTheme();
    if (!cache.has(theme)) {
      cache.set(theme, StyleSheet.create(factory(theme)));
    }
    return cache.get(theme);
  };
}

export const themes = { dark, light };
