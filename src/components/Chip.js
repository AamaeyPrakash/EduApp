import React from 'react';
import { StyleSheet, View } from 'react-native';
import { continuous, radius, useTheme } from '../theme';
import AppText from './AppText';
import Icon from './Icon';
import PressableScale from './PressableScale';

// A capsule that can be selected, for choices and suggestions.
export default function Chip({
  label,
  selected = false,
  onPress,
  icon,
  disabled,
  accessibilityLabel,
  testID,
}) {
  const { colors } = useTheme();
  const foreground = selected ? colors.onTint : colors.label;
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected, disabled }}
      testID={testID}
    >
      <View
        style={[
          styles.chip,
          { backgroundColor: selected ? colors.tint : colors.fill },
        ]}
      >
        {icon ? (
          <View style={styles.icon}>
            <Icon name={icon} size={15} color={foreground} strokeWidth={2} />
          </View>
        ) : null}
        <AppText
          variant="subheadline"
          weight="500"
          style={{ color: foreground }}
        >
          {label}
        </AppText>
      </View>
    </PressableScale>
  );
}

// A labelled set of chips where one option can be chosen, e.g. board or grade.
export function ChoiceChips({ label, options, value, onChange, error }) {
  return (
    <View style={styles.group}>
      <AppText variant="footnote" color="secondaryLabel" style={styles.label}>
        {label}
      </AppText>
      <View
        style={styles.wrap}
        accessibilityRole="radiogroup"
        accessibilityLabel={label}
      >
        {options.map(option => (
          <Chip
            key={option.value}
            label={option.label}
            selected={option.value === value}
            onPress={() => onChange(option.value)}
            accessibilityLabel={`${label}: ${option.label}`}
          />
        ))}
      </View>
      {error ? (
        <AppText variant="footnote" color="red" style={styles.error}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    ...continuous,
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    paddingHorizontal: 14,
    borderRadius: radius.capsule,
  },
  icon: {
    marginRight: 6,
  },
  group: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  error: {
    marginTop: 6,
    marginLeft: 4,
  },
});
