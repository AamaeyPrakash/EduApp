import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { continuous, radius, type, useTheme } from '../theme';
import AppText from './AppText';
import Glass from './Glass';
import Icon from './Icon';
import PressableScale from './PressableScale';

const SIZES = {
  large: { height: 52, paddingHorizontal: 24, text: type.headline, icon: 20 },
  medium: {
    height: 44,
    paddingHorizontal: 18,
    text: type.subheadline,
    icon: 18,
  },
  small: { height: 34, paddingHorizontal: 14, text: type.footnote, icon: 15 },
};

// Capsule buttons in the iOS styles:
//   filled  solid colour, for the one main action on a screen
//   tinted  pale colour with coloured text, for secondary actions
//   gray    neutral fill
//   glass   for buttons floating over content
//   plain   text only
// `color` is a theme colour name: tint, green, orange or red.
export default function Button({
  title,
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
}) {
  const { colors } = useTheme();
  const metrics = SIZES[size];
  const inactive = disabled || loading;
  const foreground = {
    filled: colors.onTint,
    tinted: colors[color],
    gray: colors.label,
    glass: color === 'tint' ? colors.label : colors[color],
    plain: colors[color],
  }[variant];
  const background = {
    filled: colors[color],
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
      <AppText
        style={[metrics.text, styles.label, { color: foreground }]}
        numberOfLines={1}
      >
        {title}
      </AppText>
    </View>
  );

  const shape = {
    height: metrics.height,
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
      accessibilityState={{ disabled: inactive, busy: loading }}
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
  label: {
    fontWeight: '600',
  },
});
