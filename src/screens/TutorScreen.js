import React from 'react';
import { KeyboardAvoidingView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AmbientGlow from '../components/AmbientGlow';
import AppText from '../components/AppText';
import { GlassIconButton } from '../components/Glass';
import { useTabBarTop } from '../components/TabBar';
import TutorChat from '../components/TutorChat';
import { gutter, makeStyles } from '../theme';

// Starters for students who aren't sure what to ask. Most go into the message box so
// the student can finish the sentence.
const SUGGESTIONS = [
  {
    label: 'Explain a topic',
    text: 'Explain this topic simply: ',
    icon: 'lightbulb',
    send: false,
  },
  {
    label: 'Practice questions',
    text: 'Give me 3 practice questions on ',
    icon: 'book',
    send: false,
  },
  {
    label: 'Check my working',
    text: 'Can you check my working? ',
    icon: 'check',
    send: false,
  },
  {
    label: 'Revision plan',
    text: 'Help me make a one-week revision plan for my next maths test.',
    icon: 'chart',
  },
];

// The Tutor tab: a general maths chat.
const TutorScreen = () => {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const tabBarTop = useTabBarTop();

  return (
    <View style={styles.screen}>
      <AmbientGlow height={300} />
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <TutorChat
          suggestions={SUGGESTIONS}
          bottomInset={tabBarTop + 10}
          renderHeader={({ hasMessages, clear, sending }) => (
            <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
              <AppText variant="largeTitle" accessibilityRole="header">
                Tutor
              </AppText>
              {hasMessages && !sending ? (
                <GlassIconButton
                  icon="compose"
                  accessibilityLabel="New chat"
                  onPress={clear}
                />
              ) : null}
            </View>
          )}
        />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: gutter + 4,
    paddingBottom: 8,
    minHeight: 52,
  },
}));

export default TutorScreen;
