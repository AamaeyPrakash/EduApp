import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '../components/ScreenHeader';
import TopicCard from '../components/TopicCard';
import { IB_COURSES } from '../content/ib';
import { colors } from '../theme';

const countLabel = count => `${count} question${count === 1 ? '' : 's'}`;

// Topic list for IB Mathematics AA or AI (`route.params.course`).
const IBTopicsScreen = ({ navigation, route }) => {
  const courseKey = IB_COURSES[route.params?.course]
    ? route.params.course
    : 'AA';
  const course = IB_COURSES[courseKey];

  const openTopic = (topic, mode) =>
    navigation.navigate('QuizScreen', {
      course: courseKey,
      topicNumber: topic.topicNumber,
      mode,
    });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader onClose={() => navigation.goBack()} title={course.title} />
      <FlatList
        data={course.topics}
        keyExtractor={topic => topic.topicNumber}
        contentContainerStyle={styles.content}
        renderItem={({ item }) => (
          <TopicCard
            title={`${item.topicNumber} - ${item.topic}`}
            subtitle={`${item.level} · ${countLabel(item.questions.length)}`}
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
    paddingTop: 20,
    paddingBottom: 40,
  },
});

export default IBTopicsScreen;
