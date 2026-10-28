import React, { forwardRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { continuous, makeStyles, radius, type, useTheme } from '../theme';
import AppText from './AppText';

// A text field with a label above it, an inline error (or `hint`) below it and, for
// passwords, a Show/Hide toggle. The label stays visible while typing, unlike the
// placeholder, which can hold an example.
const TextField = forwardRef(function TextField(
  { label, hint, error, secureTextEntry, placeholder, style, ...inputProps },
  ref,
) {
  const theme = useTheme();
  const styles = useStyles();
  const [revealed, setRevealed] = useState(false);
  const hidden = Boolean(secureTextEntry) && !revealed;
  return (
    <View style={[styles.container, style]}>
      {label ? (
        <AppText
          variant="footnote"
          color="secondaryLabel"
          style={styles.label}
          importantForAccessibility="no"
          accessibilityElementsHidden
        >
          {label}
        </AppText>
      ) : null}
      <View style={[styles.field, error && styles.fieldError]}>
        <TextInput
          ref={ref}
          placeholder={placeholder}
          accessibilityLabel={
            inputProps.accessibilityLabel || label || placeholder
          }
          accessibilityHint={error || hint}
          placeholderTextColor={theme.colors.placeholder}
          selectionColor={theme.colors.tint}
          keyboardAppearance={theme.dark ? 'dark' : 'light'}
          secureTextEntry={hidden}
          style={styles.input}
          {...inputProps}
        />
        {secureTextEntry ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
            onPress={() => setRevealed(value => !value)}
            style={styles.toggle}
          >
            <AppText variant="subheadline" color="tint" weight="600">
              {revealed ? 'Hide' : 'Show'}
            </AppText>
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <AppText variant="footnote" color="red" style={styles.error}>
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="footnote" color="secondaryLabel" style={styles.error}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
});

export default TextField;

const useStyles = makeStyles(theme => ({
  container: {
    marginBottom: 14,
  },
  label: {
    marginBottom: 6,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  field: {
    ...continuous,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: radius.medium,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  fieldError: {
    borderColor: theme.colors.red,
  },
  input: {
    ...type.body,
    flex: 1,
    minWidth: 0,
    minHeight: 52,
    paddingHorizontal: 16,
    color: theme.colors.label,
  },
  toggle: {
    alignSelf: 'stretch',
    justifyContent: 'center',
    paddingHorizontal: 16,
    minWidth: 64,
  },
  error: {
    marginTop: 6,
    marginLeft: 4,
  },
}));
