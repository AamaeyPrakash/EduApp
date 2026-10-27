import React from 'react';
import { Text } from 'react-native';
import { type, useTheme } from '../theme';

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
