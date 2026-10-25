import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../theme';
import MathText from './MathText';

// A "Show/Hide <label>" button with the revealed content above it.
export default function RevealSection({
  label,
  content,
  shown,
  onToggle,
  extra,
}) {
  return (
    <>
      {shown ? (
        <View style={styles.panel}>
          <Text style={styles.panelLabel}>{label}:</Text>
          <MathText content={content} />
          {extra}
        </View>
      ) : null}
      <TouchableOpacity
        style={styles.button}
        onPress={onToggle}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityState={{ expanded: shown }}
      >
        <Text style={styles.buttonText}>
          {shown ? `Hide ${label}` : `Show ${label}`}
        </Text>
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    width: '100%',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: colors.surfaceSubtleBorder,
  },
  panelLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    letterSpacing: -0.24,
  },
  button: {
    backgroundColor: colors.primaryStrong,
    borderRadius: 18,
    padding: 16,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.surfaceSubtleBorder,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: -0.16,
  },
});
