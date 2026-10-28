import React from 'react';
import { StyleSheet, View } from 'react-native';
import { EDUCATION_BOARDS } from '../constants/educationBoards';
import { LIMITS } from '../lib/validation';
import { ChoiceChips } from './Chip';
import TextField from './TextField';

const GRADES = Array.from(
  { length: LIMITS.gradeMax - LIMITS.gradeMin + 1 },
  (_, index) => {
    const grade = String(LIMITS.gradeMin + index);
    return { label: grade, value: grade };
  },
);

// Name, board and grade, shared by sign-up and the profile form. `accountFields`
// (email and password on sign-up) go after the name; `nameProps` go to the name field
// (e.g. what its return key does).
export default function ProfileFields({
  values,
  errors,
  onChange,
  accountFields,
  nameProps,
}) {
  return (
    <View>
      <TextField
        testID="profile-name"
        label="Name"
        placeholder="Your first name or full name"
        value={values.name}
        onChangeText={text => onChange('name', text)}
        error={errors.name}
        autoComplete="name"
        textContentType="name"
        maxLength={LIMITS.nameMax}
        returnKeyType="done"
        {...nameProps}
      />
      {accountFields}
      <View style={styles.gap} />
      <ChoiceChips
        label="Education board"
        options={EDUCATION_BOARDS}
        value={values.educationBoard}
        onChange={value => onChange('educationBoard', value)}
        error={errors.educationBoard}
      />
      <ChoiceChips
        label="Grade or year"
        options={GRADES}
        value={String(values.grade ?? '')}
        onChange={value => onChange('grade', value)}
        error={errors.grade}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  gap: {
    height: 12,
  },
});
