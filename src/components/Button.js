import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { continuous, radius, type, useTheme } from '../theme';
import AppText from './AppText';
import Glass from './Glass';
import Icon from './Icon';
import PressableScale from './PressableScale';

// Heights are minimums, so buttons grow with larger text sizes. Small buttons get
// extra touch area to reach the 44 pt minimum.
const SIZES = {
  large: { height: 52, paddingHorizontal: 24, text: type.headline, icon: 20 },
  medium: {
    height: 44,
    paddingHorizontal: 18,
    text: type.subheadline,
    icon: 18,
  },
  small: {
    height: 34,
    paddingHorizontal: 14,
    text: type.footnote,
    icon: 15,
    hitSlop: 5,
  },
};

// Capsule buttons in the iOS styles:
//   filled  solid colour, for the one main action on a screen
//   tinted  pale colour with coloured text, for secondary actions
//   gray    neutral fill
//   glass   for buttons floating over content
//   plain   text only
// `color` is a theme colour name: tint, green, orange or red. `detail` adds a small
// second line, e.g. "Back in 7 days".
export default function Button({
  title,
  detail,
  onPress,
  variant = 'filled',
  size = 'large',
  color = 'tint',
  icon,
  loading = false,
  disabled = false,
  style,
  testID,
  accessibilityLabel,
  accessibilityHint,
}) {
  const { colors } = useTheme();
  const metrics = SIZES[size];
  const inactive = disabled || loading;
  const text = colors[`${color}Text`] ?? colors[color];
  const foreground = {
    filled: colors.onTint,
    tinted: text,
    gray: colors.label,
    glass: color === 'tint' ? colors.label : text,
    plain: text,
  }[variant];
  const background = {
    filled: colors[`${color}Solid`] ?? colors[color],
    tinted: colors[`${color}Fill`] ?? colors.tintFill,
    gray: colors.fill,
    glass: 'transparent',
    plain: 'transparent',
  }[variant];

  const content = (
    <View style={styles.content}>
      {loading ? (
        <ActivityIndicator color={foreground} style={styles.icon} />
      ) : icon ? (
        <View style={styles.icon}>
          <Icon
            name={icon}
            size={metrics.icon}
            color={foreground}
            strokeWidth={2}
          />
        </View>
      ) : null}
      <View style={styles.titles}>
        <AppText
          style={[metrics.text, styles.label, { color: foreground }]}
          numberOfLines={1}
        >
          {title}
        </AppText>
        {detail ? (
          <AppText
            variant="caption"
            style={[styles.detail, { color: foreground }]}
            numberOfLines={1}
          >
            {detail}
          </AppText>
        ) : null}
      </View>
    </View>
  );

  const shape = {
    minHeight: metrics.height,
    paddingVertical: detail ? 6 : 4,
    paddingHorizontal: metrics.paddingHorizontal,
    borderRadius: radius.capsule,
  };

  return (
    <PressableScale
      testID={testID}
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint ?? detail}
      accessibilityState={{ disabled: inactive, busy: loading }}
      hitSlop={metrics.hitSlop}
      style={style}
    >
      {variant === 'glass' ? (
        <Glass style={[styles.base, shape]}>{content}</Glass>
      ) : (
        <View style={[styles.base, shape, { backgroundColor: background }]}>
          {content}
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    ...continuous,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  titles: {
    alignItems: 'center',
    flexShrink: 1,
  },
  label: {
    fontWeight: '600',
  },
  detail: {
    opacity: 0.85,
  },
});
