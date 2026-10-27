import React from 'react';
import { KeyboardAvoidingView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TutorChat from '../components/TutorChat';
import { colors } from '../theme';

// Starters for students who aren't sure what to ask. Most go into the message box so
// the student can finish the sentence.
const SUGGESTIONS = [
  {
    label: 'Explain a topic',
    text: 'Explain this topic simply: ',
    send: false,
  },
  {
    label: 'Practice questions',
    text: 'Give me 3 practice questions on ',
    send: false,
  },
  {
    label: 'Check my working',
    text: 'Can you check my working? ',
    send: false,
  },
  {
    label: 'Revision plan',
    text: 'Help me make a one-week revision plan for my next maths test.',
  },
];

const PromptScreen = () => (
  <SafeAreaView style={styles.container} edges={['top']}>
    <KeyboardAvoidingView style={styles.flex} behavior="padding">
      <View style={styles.header}>
        <Text style={styles.headerTitle} accessibilityRole="header">
          AskGPT
        </Text>
      </View>
      <TutorChat suggestions={SUGGESTIONS} />
    </KeyboardAvoidingView>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
  },
});

export default PromptScreen;
