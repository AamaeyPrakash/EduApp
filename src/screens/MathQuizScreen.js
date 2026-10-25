import React from 'react';
import { FlatList, Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CalcQues from '../assets/CalculatorIconWhite.png';
import NonCalcQues from '../assets/NonCalculatorIconWhite.png';
import MathText from '../components/MathText';
import RevealSection from '../components/RevealSection';
import ScreenHeader from '../components/ScreenHeader';
import { getIBTopic } from '../content/ib';
import useRevealState from '../hooks/useRevealState';
import { colors } from '../theme';

// IB questions for one topic. `mode: 'study'` (the "Revisions" button) opens with
// every answer and working shown; `mode: 'quiz'` hides them until asked.
const MathQuizScreen = ({ route, navigation }) => {
  const { course, topicNumber, mode } = route.params ?? {};
  const topic = getIBTopic(course, topicNumber);
  const studyMode = mode === 'study';
  const { isShown, toggle } = useRevealState(studyMode);

  const renderQuestion = ({ item: question, index }) => {
    const calculator = question.calculator === 'yes';
    return (
      <View style={styles.card}>
        <View style={styles.detailRow}>
          <Image
            source={calculator ? CalcQues : NonCalcQues}
            style={styles.calcIcon}
            accessibilityLabel={
              calculator ? 'Calculator allowed' : 'No calculator'
            }
          />
          <Text style={styles.subtopicText}>Concept: {question.subtopic}</Text>
        </View>
        <MathText content={question.question} textStyle={styles.questionText} />
        <RevealSection
          label="Answer"
          content={question.answer}
          shown={isShown(`${index}-answer`)}
          onToggle={() => toggle(`${index}-answer`)}
        />
        <RevealSection
          label="Working"
          content={question.working}
          shown={isShown(`${index}-working`)}
          onToggle={() => toggle(`${index}-working`)}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader onClose={() => navigation.goBack()} />
      {topic ? (
        <FlatList
          data={topic.questions}
          keyExtractor={(_, index) => String(index)}
          renderItem={renderQuestion}
          contentContainerStyle={styles.content}
          ListHeaderComponent={
            <View style={styles.titleBlock}>
              {studyMode ? (
                <Text style={styles.modeLabel}>Revision</Text>
              ) : null}
              <Text style={styles.topicText} accessibilityRole="header">
                {topic.topic}
              </Text>
            </View>
          }
        />
      ) : (
        <View style={styles.missing}>
          <Text style={styles.missingText}>This topic could not be found.</Text>
        </View>
      )}
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
    paddingTop: 20,
    paddingBottom: 40,
  },
  titleBlock: {
    alignItems: 'center',
    marginBottom: 32,
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
    fontSize: 34,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: -0.34,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 500,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    alignSelf: 'stretch',
    marginBottom: 16,
  },
  calcIcon: {
    width: 30,
    height: 30,
    marginRight: 15,
  },
  subtopicText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 5,
    opacity: 0.7,
    letterSpacing: -0.14,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 26,
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

export default MathQuizScreen;
