import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { EDUCATION_BOARDS } from '../constants/educationBoards';
import { LIMITS } from '../lib/validation';
import { colors } from '../theme';
import TextField from './TextField';

const digitsOnly = text => text.replace(/[^0-9]/g, '');

// Student details collected at sign-up and on the "complete/edit profile" screen.
// `accountFields` (email and password at sign-up) are shown after the age field.
export default function ProfileFields({
  values,
  errors,
  onChange,
  accountFields = null,
}) {
  return (
    <>
      <TextField
        placeholder="Full Name"
        value={values.name}
        onChangeText={text => onChange('name', text)}
        error={errors.name}
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        maxLength={LIMITS.nameMax}
      />
      <TextField
        placeholder="Age"
        value={values.age}
        onChangeText={text => onChange('age', digitsOnly(text))}
        error={errors.age}
        keyboardType="number-pad"
        maxLength={2}
      />
      {accountFields}
      <View style={styles.dropdownContainer}>
        <Dropdown
          style={[
            styles.dropdown,
            errors.educationBoard && styles.dropdownError,
          ]}
          placeholderStyle={styles.placeholder}
          inputSearchStyle={styles.inputSearch}
          itemTextStyle={styles.itemText}
          containerStyle={styles.dropdownList}
          selectedTextStyle={styles.selectedText}
          iconColor={colors.placeholder}
          data={EDUCATION_BOARDS}
          search
          labelField="label"
          valueField="value"
          placeholder="Select Education Board"
          searchPlaceholder="Search boards..."
          accessibilityLabel="Education board"
          value={values.educationBoard}
          onChange={item => onChange('educationBoard', item.value)}
        />
        {errors.educationBoard ? (
          <Text style={styles.error}>{errors.educationBoard}</Text>
        ) : null}
      </View>
      <TextField
        placeholder="Current Grade/Year"
        value={values.grade}
        onChangeText={text => onChange('grade', digitsOnly(text))}
        error={errors.grade}
        keyboardType="number-pad"
        maxLength={2}
      />
      <TextField
        placeholder="School Name"
        value={values.school}
        onChangeText={text => onChange('school', text)}
        error={errors.school}
        autoCapitalize="words"
        maxLength={LIMITS.schoolMax}
      />
    </>
  );
}

const styles = StyleSheet.create({
  dropdownContainer: {
    marginBottom: 12,
  },
  dropdown: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: 16,
    borderRadius: 15,
  },
  dropdownError: {
    borderColor: colors.danger,
  },
  placeholder: {
    fontSize: 16,
    color: colors.placeholder,
  },
  inputSearch: {
    fontSize: 16,
    color: '#000000',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  itemText: {
    fontSize: 16,
    color: '#000000',
  },
  dropdownList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  selectedText: {
    color: colors.text,
    fontSize: 16,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    marginTop: 6,
    marginLeft: 4,
  },
});
