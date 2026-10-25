import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme';
import PrimaryButton from './PrimaryButton';

// Full-screen spinner or message, used while the app starts or when it can't continue.
export default function StatusScreen({
  loading = false,
  title,
  message,
  actions = [],
}) {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            accessibilityLabel="Loading"
          />
        ) : null}
        {title ? <Text style={styles.title}>{title}</Text> : null}
        {message ? <Text style={styles.message}>{message}</Text> : null}
        {actions.map(action => (
          <PrimaryButton
            key={action.title}
            title={action.title}
            onPress={action.onPress}
            loading={action.loading}
            variant={action.variant}
            style={styles.action}
          />
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    lineHeight: 22,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 24,
  },
  action: {
    marginBottom: 12,
  },
});
