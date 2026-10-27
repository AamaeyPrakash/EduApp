import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PrimaryButton from '../components/PrimaryButton';
import QuestionCard from '../components/QuestionCard';
import ScreenHeader from '../components/ScreenHeader';
import { getTopic } from '../content';
import useRevealState from '../hooks/useRevealState';
import { isTutorConfigured } from '../services/ai';
import { colors } from '../theme';

// Revision ("Revisions" button): every question of a topic with its answer and
// solution already open, to read through. Practising one at a time is the quiz.
const StudyScreen = ({ route, navigation }) => {
  const { courseKey, topicKey } = route.params ?? {};
  const topic = getTopic(courseKey, topicKey);
  const { isShown, toggle } = useRevealState(true);
  const tutorReady = isTutorConfigured();

  if (!topic) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScreenHeader onClose={() => navigation.goBack()} />
        <View style={styles.missing}>
          <Text style={styles.missingText}>This topic could not be found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader onClose={() => navigation.goBack()} />
      <FlatList
        data={topic.questions}
        keyExtractor={question => question.id}
        contentContainerStyle={styles.content}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={5}
        ListHeaderComponent={
          <View style={styles.titleBlock}>
            <Text style={styles.modeLabel}>Revision</Text>
            <Text style={styles.topicText} accessibilityRole="header">
              {topic.title}
            </Text>
            <PrimaryButton
              title="Quiz me on this topic"
              variant="secondary"
              style={styles.quizButton}
              onPress={() =>
                navigation.replace('Practice', {
                  title: topic.title,
                  questionIds: topic.questions.map(question => question.id),
                })
              }
            />
          </View>
        }
        renderItem={({ item }) => (
          <QuestionCard
            question={item}
            heading={`Question ${item.number}`}
            isShown={isShown}
            onToggle={toggle}
            onAskTutor={
              tutorReady
                ? () =>
                    navigation.navigate('QuestionTutor', {
                      questionId: item.id,
                    })
                : null
            }
          />
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  titleBlock: {
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
    maxWidth: 500,
  },
  modeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  topicText: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: -0.34,
  },
  quizButton: {
    marginTop: 16,
    alignSelf: 'stretch',
  },
  missing: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  missingText: {
    fontSize: 18,
    color: colors.danger,
    textAlign: 'center',
  },
});

export default StudyScreen;
