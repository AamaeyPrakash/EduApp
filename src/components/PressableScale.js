import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// A Pressable that shrinks slightly while held, like iOS buttons and cards.
export default function PressableScale({
  style,
  scaleTo = 0.96,
  disabled = false,
  children,
  ...props
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const animate = toValue =>
    Animated.spring(scale, {
      toValue,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();
  return (
    <AnimatedPressable
      disabled={disabled}
      onPressIn={() => animate(scaleTo)}
      onPressOut={() => animate(1)}
      style={[style, { transform: [{ scale }] }, disabled && styles.disabled]}
      {...props}
    >
      {children}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.45,
  },
});
