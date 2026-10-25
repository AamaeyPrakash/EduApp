import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../theme';

// Top bar with the round "✕" button used to leave topic and quiz screens.
export default function ScreenHeader({ onClose, title, style }) {
  return (
    <View style={[styles.header, style]}>
      <TouchableOpacity
        style={styles.closeButton}
        onPress={onClose}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Close"
        hitSlop={8}
      >
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>
      {title ? (
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  closeButton: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  closeText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    opacity: 0.9,
  },
  title: {
    flex: 1,
    marginLeft: 16,
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
});
