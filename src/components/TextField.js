import React, { forwardRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../theme';

// Text input in the app's style, with an inline error message and an optional
// show/hide toggle for passwords.
const TextField = forwardRef(function TextField(
  { error, secureTextEntry, placeholder, style, ...inputProps },
  ref,
) {
  const [revealed, setRevealed] = useState(false);
  const hidden = Boolean(secureTextEntry) && !revealed;
  return (
    <View style={[styles.container, style]}>
      <View style={[styles.inputRow, error && styles.inputRowError]}>
        <TextInput
          ref={ref}
          placeholder={placeholder}
          accessibilityLabel={inputProps.accessibilityLabel || placeholder}
          placeholderTextColor={colors.placeholder}
          secureTextEntry={hidden}
          style={styles.input}
          keyboardAppearance="dark"
          {...inputProps}
        />
        {secureTextEntry ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
            onPress={() => setRevealed(value => !value)}
            style={styles.toggle}
          >
            <Text style={styles.toggleText}>{revealed ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
});

export default TextField;

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 15,
  },
  inputRowError: {
    borderColor: colors.danger,
  },
  input: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: colors.text,
  },
  toggle: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  toggleText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    marginTop: 6,
    marginLeft: 4,
  },
});
