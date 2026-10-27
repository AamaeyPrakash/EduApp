import React from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { gutter, makeStyles } from '../theme';
import AmbientGlow from './AmbientGlow';
import { TopBar } from './Screen';

// A scrolling form that keeps the focused field above the keyboard. Android draws
// edge-to-edge, so the window no longer resizes for the keyboard and both platforms use
// padding. `onBack` adds a back button; `glow` the ambient colour wash.
export default function FormScreen({
  children,
  onBack,
  backIcon,
  backLabel,
  glow = false,
  contentContainerStyle,
}) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.container}>
      {glow ? <AmbientGlow height={460} /> : null}
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: insets.top + (onBack ? 64 : 24),
              paddingBottom: insets.bottom + 24,
            },
            contentContainerStyle,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
      {onBack ? (
        <TopBar onBack={onBack} backIcon={backIcon} backLabel={backLabel} />
      ) : null}
    </View>
  );
}

const useStyles = makeStyles(theme => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: gutter + 8,
  },
}));

export const formStyles = StyleSheet.create({
  header: {
    marginTop: 24,
    marginBottom: 28,
  },
  subtitle: {
    marginTop: 8,
  },
  button: {
    marginTop: 8,
  },
  link: {
    alignSelf: 'center',
    paddingVertical: 14,
  },
});
