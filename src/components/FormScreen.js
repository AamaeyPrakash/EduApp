import React, { useRef } from 'react';
import { Animated, KeyboardAvoidingView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { gutter, makeStyles } from '../theme';
import AmbientGlow from './AmbientGlow';
import { TopBar } from './Screen';

// A scrolling form that keeps the focused field above the keyboard. Android draws
// edge-to-edge, so the window no longer resizes for the keyboard and both platforms use
// padding. `onBack` adds a back button, whose bar gains a background once the form
// scrolls under it; `glow` adds the ambient colour wash.
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
  const scrollY = useRef(new Animated.Value(0)).current;
  const backgroundOpacity = scrollY.interpolate({
    inputRange: [0, 20],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  return (
    <View style={styles.container}>
      {glow ? <AmbientGlow height={460} /> : null}
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <Animated.ScrollView
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true },
          )}
          scrollEventThrottle={16}
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
        </Animated.ScrollView>
      </KeyboardAvoidingView>
      {onBack ? (
        <TopBar
          onBack={onBack}
          backIcon={backIcon}
          backLabel={backLabel}
          backgroundOpacity={backgroundOpacity}
        />
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
