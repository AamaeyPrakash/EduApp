import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppText from '../components/AppText';
import { TopBar } from '../components/Screen';
import TutorChat from '../components/TutorChat';
import { getCourse, getTopic } from '../content';
import { makeStyles } from '../theme';

// The AI tutor for one topic (`route.params.courseKey` / `topicKey`), opened from the
// topic screen as a sheet so the student goes back to where they were. It starts with
// an overview of the topic.
const TopicTutorScreen = ({ route, navigation }) => {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { courseKey, topicKey } = route.params ?? {};
  const topic = getTopic(courseKey, topicKey);
  const course = getCourse(courseKey);
  const name = topic ? `${topic.title} (${course.title})` : '';
  const [pending, setPending] = useState(() =>
    topic
      ? `Give me a short overview of ${name}: the key ideas, the formulas to remember and the most common mistakes.`
      : undefined,
  );

  const suggestions = useMemo(
    () => [
      {
        label: 'Practice question',
        text: `Give me one exam-style question on ${name}, without the solution.`,
        icon: 'book',
      },
      {
        label: 'Key formulas',
        text: `List the formulas I need for ${name}, with when to use each one.`,
        icon: 'lightbulb',
      },
      {
        label: 'Common mistakes',
        text: `What mistakes do students often make in ${name}, and how do I avoid them?`,
        icon: 'mistake',
      },
      {
        label: 'Explain something',
        text: `In ${topic?.title ?? 'this topic'}, explain `,
        icon: 'compose',
        send: false,
      },
    ],
    [name, topic],
  );

  return (
    <View style={styles.screen}>
      <TopBar
        title={topic ? topic.title : 'Tutor'}
        onBack={() => navigation.goBack()}
        backIcon="close"
        backLabel="Close"
      />
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        {topic ? (
          <TutorChat
            chips
            suggestions={suggestions}
            bottomInset={Math.max(insets.bottom, 12)}
            pendingPrompt={pending}
            onPendingSent={() => setPending(undefined)}
            emptyTitle={topic.title}
            emptySubtitle="Ask anything about this topic."
            renderHeader={() => <View style={{ height: insets.top + 56 }} />}
          />
        ) : (
          <View style={styles.missing}>
            <AppText variant="body" color="secondaryLabel" align="center">
              This topic could not be found.
            </AppText>
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
};

const useStyles = makeStyles(theme => ({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  flex: {
    flex: 1,
  },
  missing: {
    flex: 1,
    justifyContent: 'center',
    padding: 32,
  },
}));

export default TopicTutorScreen;
