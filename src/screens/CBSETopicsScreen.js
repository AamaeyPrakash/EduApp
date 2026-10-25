import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '../components/ScreenHeader';
import TopicCard from '../components/TopicCard';
import { CBSE_CHAPTERS } from '../content/cbse';
import { colors } from '../theme';

const countLabel = count => `${count} question${count === 1 ? '' : 's'}`;

const CBSETopicsScreen = ({ navigation }) => {
  const openChapter = (chapter, mode) =>
    navigation.navigate('CBQuizScreen', { topicTitle: chapter.title, mode });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader onClose={() => navigation.goBack()} title="Grade 12 CBSE" />
      <FlatList
        data={CBSE_CHAPTERS}
        keyExtractor={chapter => chapter.title}
        contentContainerStyle={styles.content}
        renderItem={({ item }) => (
          <TopicCard
            title={item.title}
            subtitle={countLabel(item.questionCount)}
            onRevise={() => openChapter(item, 'study')}
            onQuiz={() => openChapter(item, 'quiz')}
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

export default CBSETopicsScreen;
