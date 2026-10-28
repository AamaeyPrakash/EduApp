import React, { useId, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { continuous, makeStyles, radius, useTheme } from '../theme';
import Icon from './Icon';
import PressableScale from './PressableScale';

// Liquid Glass, approximated: a translucent surface with a light rim along its top
// edge and a soft shadow. Apple reserves glass for the controls that float above
// content (tab bar, toolbar buttons, action bars), so that's where the app uses it.
export default function Glass({ style, children, pointerEvents, ...props }) {
  const theme = useTheme();
  const styles = useStyles();
  const id = useId().replace(/:/g, '');
  const [size, setSize] = useState(null);
  const corner = Math.min(
    StyleSheet.flatten(style)?.borderRadius ?? radius.capsule,
    size ? size.height / 2 : radius.capsule,
  );
  return (
    <View
      style={[styles.shadow, style]}
      pointerEvents={pointerEvents}
      onLayout={event => setSize(event.nativeEvent.layout)}
      {...props}
    >
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, styles.fill, { borderRadius: corner }]}
      />
      {size ? (
        <Svg
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
          width={size.width}
          height={size.height}
        >
          <Defs>
            <LinearGradient id={`rim${id}`} x1="0" y1="0" x2="0" y2="1">
              <Stop
                offset="0"
                stopColor={theme.colors.glassHighlight}
                stopOpacity="0.9"
              />
              <Stop
                offset="0.5"
                stopColor={theme.colors.glassHighlight}
                stopOpacity="0"
              />
            </LinearGradient>
          </Defs>
          <Rect
            x={0.75}
            y={0.75}
            width={Math.max(size.width - 1.5, 0)}
            height={Math.max(size.height - 1.5, 0)}
            rx={Math.max(corner - 0.75, 0)}
            fill="none"
            stroke={`url(#rim${id})`}
            strokeWidth={1.2}
          />
        </Svg>
      ) : null}
      {children}
    </View>
  );
}

// A round glass button holding an icon, e.g. back, close, search or bookmark.
export function GlassIconButton({
  icon,
  onPress,
  accessibilityLabel,
  color = 'label',
  size = 44,
  selected,
  testID,
}) {
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={selected === undefined ? undefined : { selected }}
      hitSlop={6}
      testID={testID}
    >
      <Glass
        style={[
          styles.iconButton,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
      >
        <Icon name={icon} size={size * 0.5} color={color} />
      </Glass>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const useStyles = makeStyles(theme => ({
  shadow: {
    ...continuous,
    borderRadius: radius.capsule,
    // Android's elevation shadow shows through translucent surfaces, so the border
    // carries the edge there instead.
    ...(Platform.OS === 'ios'
      ? {
          shadowColor: '#000000',
          shadowOpacity: theme.shadowOpacity,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 8 },
        }
      : null),
  },
  fill: {
    ...continuous,
    backgroundColor: theme.colors.glass,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: theme.colors.glassBorder,
  },
}));
