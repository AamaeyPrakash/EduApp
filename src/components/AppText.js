import React from 'react';
import { Text } from 'react-native';
import { type, useTheme } from '../theme';

// How far each text style grows with the system text size, as on iOS, where a large
// title grows to 60 pt at the largest size (body text to 53 pt from 17).
const MAX_SCALE = { largeTitle: 1.75 };

// Text in one of the iOS text styles (`variant`) and theme colours (`color` is a theme
// colour name such as "secondaryLabel", or any CSS colour).
export default function AppText({
  variant = 'body',
  color = 'label',
  weight,
  align,
  style,
  children,
  ...props
}) {
  const { colors } = useTheme();
  return (
    <Text
      maxFontSizeMultiplier={MAX_SCALE[variant]}
      style={[
        type[variant],
        { color: colors[color] ?? color },
        weight ? { fontWeight: weight } : null,
        align ? { textAlign: align } : null,
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}
