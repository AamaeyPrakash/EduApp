import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { continuous, useTheme } from '../theme';

// A course's symbol (∫, π, Σ) on a squircle in the course's colour.
export default function CourseTile({ course, size = 44 }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.tile,
        {
          width: size,
          height: size,
          borderRadius: size * 0.26,
          backgroundColor: colors[course.color] ?? colors.tint,
        },
      ]}
    >
      <Text style={[styles.glyph, { fontSize: size * 0.5 }]}>
        {course.icon}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    ...continuous,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
