import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../theme';

const VARIANTS = {
  primary: { backgroundColor: colors.primary, shadowColor: colors.primary },
  secondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    shadowOpacity: 0,
    elevation: 0,
  },
  danger: { backgroundColor: colors.dangerStrong, shadowColor: colors.danger },
};

export default function PrimaryButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  style,
  testID,
}) {
  const inactive = disabled || loading;
  return (
    <TouchableOpacity
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={[
        styles.button,
        VARIANTS[variant],
        inactive && styles.inactive,
        style,
      ]}
      onPress={onPress}
      disabled={inactive}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={colors.text} style={styles.spinner} />
        ) : null}
        <Text style={styles.text}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceSubtleBorder,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  inactive: {
    opacity: 0.55,
    shadowOpacity: 0,
    elevation: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spinner: {
    marginRight: 10,
  },
  text: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
