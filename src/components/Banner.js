import React from 'react';
import { View } from 'react-native';
import { continuous, makeStyles, radius } from '../theme';
import AppText from './AppText';
import Icon from './Icon';

const TONES = {
  error: { color: 'red', fill: 'redFill', icon: 'info' },
  success: { color: 'green', fill: 'greenFill', icon: 'check' },
  info: { color: 'tint', fill: 'tintFill', icon: 'info' },
  warning: { color: 'orange', fill: 'orangeFill', icon: 'info' },
};

// An inline message, e.g. a form error or a notice.
export default function Banner({ message, tone = 'error', style }) {
  const styles = useStyles();
  if (!message) {
    return null;
  }
  const { color, fill, icon } = TONES[tone];
  return (
    <View
      style={[styles.banner, styles[fill], style]}
      accessibilityRole={tone === 'error' ? 'alert' : undefined}
      accessibilityLiveRegion="polite"
    >
      <View style={styles.icon}>
        <Icon name={icon} size={18} color={color} strokeWidth={2} />
      </View>
      <AppText variant="subheadline" style={styles.text}>
        {message}
      </AppText>
    </View>
  );
}

const useStyles = makeStyles(theme => ({
  banner: {
    ...continuous,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: radius.medium,
    padding: 12,
    marginBottom: 16,
  },
  redFill: { backgroundColor: theme.colors.redFill },
  greenFill: { backgroundColor: theme.colors.greenFill },
  tintFill: { backgroundColor: theme.colors.tintFill },
  orangeFill: { backgroundColor: theme.colors.orangeFill },
  icon: {
    marginRight: 10,
    marginTop: 1,
  },
  text: {
    flex: 1,
  },
}));
