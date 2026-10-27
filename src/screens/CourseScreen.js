import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PrimaryButton from '../components/PrimaryButton';
import ScreenHeader from '../components/ScreenHeader';
import TopicCard from '../components/TopicCard';
import { COURSES, getCourse } from '../content';
import { progressFor } from '../study/progress';
import { mixedPracticeIds } from '../study/sessions';
import { useStudy } from '../study/StudyContext';
import { colors } from '../theme';

const countLabel = count => `${count} question${count === 1 ? '' : 's'}`;

// The topics of one course (`route.params.courseKey`) with their progress.
const CourseScreen = ({ navigation, route }) => {
  const course = getCourse(route.params?.courseKey) || COURSES[0];
  const { study } = useStudy();
  const hasNoCalculatorQuestions = course.topics.some(topic =>
    topic.questions.some(question => question.calculator === false),
  );

  const openTopic = (topic, mode) =>
    mode === 'study'
      ? navigation.navigate('Study', {
          courseKey: course.key,
          topicKey: topic.key,
        })
      : navigation.navigate('Practice', {
          title: topic.title,
          questionIds: topic.questions.map(question => question.id),
        });

  const startMixed = noCalculator =>
    navigation.navigate('Practice', {
      title: noCalculator ? 'No-calculator set' : `${course.title}: mixed`,
      questionIds: mixedPracticeIds(study, course.key, { noCalculator }),
    });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader onClose={() => navigation.goBack()} title={course.title} />
      <FlatList
        data={course.topics}
        keyExtractor={topic => topic.key}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.mixed}>
            <Text style={styles.mixedText}>
              Mixed practice picks questions from every topic, the way exam
              papers do.
            </Text>
            <PrimaryButton
              title="Mixed practice"
              onPress={() => startMixed(false)}
            />
            {hasNoCalculatorQuestions ? (
              <PrimaryButton
                title="No-calculator set (Paper 1 style)"
                variant="secondary"
                onPress={() => startMixed(true)}
                style={styles.secondaryButton}
              />
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <TopicCard
            title={item.title}
            subtitle={[item.label, countLabel(item.questions.length)]
              .filter(Boolean)
              .join(' · ')}
            progress={progressFor(
              study,
              item.questions.map(question => question.id),
            )}
            onRevise={() => openTopic(item, 'study')}
            onQuiz={() => openTopic(item, 'quiz')}
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
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  mixed: {
    marginBottom: 24,
  },
  mixedText: {
    fontSize: 15,
    lineHeight: 21,
    color: colors.textMuted,
    marginBottom: 12,
  },
  secondaryButton: {
    marginTop: 10,
  },
});

export default CourseScreen;
