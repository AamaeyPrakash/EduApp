import React from 'react';
import { StyleSheet, View } from 'react-native';
import { continuous, radius, useTheme } from '../theme';
import AppText from './AppText';
import Glass from './Glass';
import Icon from './Icon';
import PressableScale from './PressableScale';

// A capsule that can be selected, for choices and suggestions. `glass` is for chips
// floating over content, such as suggestions above the tutor's message box.
export default function Chip({
  label,
  selected = false,
  onPress,
  icon,
  disabled,
  glass = false,
  accessibilityLabel,
  testID,
}) {
  const { colors } = useTheme();
  const foreground = selected ? colors.onTint : colors.label;
  const content = (
    <>
      {icon ? (
        <View style={styles.icon}>
          <Icon name={icon} size={15} color={foreground} strokeWidth={2} />
        </View>
      ) : null}
      <AppText variant="subheadline" weight="500" style={{ color: foreground }}>
        {label}
      </AppText>
    </>
  );
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected, disabled }}
      hitSlop={HIT_SLOP}
      testID={testID}
    >
      {glass && !selected ? (
        <Glass style={styles.chip}>{content}</Glass>
      ) : (
        <View
          style={[
            styles.chip,
            { backgroundColor: selected ? colors.tintSolid : colors.fill },
          ]}
        >
          {content}
        </View>
      )}
    </PressableScale>
  );
}

// Chips are 36 pt tall; this brings the touch area to 44 pt.
const HIT_SLOP = { top: 4, bottom: 4, left: 2, right: 2 };

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
    minHeight: 36,
    paddingHorizontal: 14,
    paddingVertical: 6,
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
