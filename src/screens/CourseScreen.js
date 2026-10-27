import React from 'react';
import { View } from 'react-native';
import AppText from '../components/AppText';
import { IconTile, Row, Section } from '../components/List';
import PressableScale from '../components/PressableScale';
import ProgressRing from '../components/ProgressRing';
import Screen from '../components/Screen';
import { COURSES, getCourse } from '../content';
import { progressFor } from '../study/progress';
import {
  mixedPracticeIds,
  SESSION_SIZE,
  TIMED_TEST_MINUTES,
} from '../study/sessions';
import { useStudy } from '../study/StudyContext';
import { continuous, makeStyles, radius } from '../theme';

const countLabel = count => `${count} question${count === 1 ? '' : 's'}`;

function ActionTile({ icon, color, title, caption, onPress }) {
  const styles = useStyles();
  return (
    <PressableScale
      style={styles.actionWrap}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={styles.action}>
        <IconTile name={icon} color={color} />
        <AppText variant="headline" style={styles.actionTitle}>
          {title}
        </AppText>
        <AppText variant="footnote" color="secondaryLabel">
          {caption}
        </AppText>
      </View>
    </PressableScale>
  );
}

// One course: ways to practise across it, then its topics with their progress.
const CourseScreen = ({ navigation, route }) => {
  const styles = useStyles();
  const course = getCourse(route.params?.courseKey) || COURSES[0];
  const { study } = useStudy();
  const hasNoCalculatorQuestions = course.topics.some(topic =>
    topic.questions.some(question => question.calculator === false),
  );

  const start = (title, options = {}) =>
    navigation.navigate('Practice', {
      title,
      questionIds: mixedPracticeIds(study, course.key, options),
      timeLimit: options.timed ? TIMED_TEST_MINUTES * 60 : undefined,
    });

  return (
    <Screen
      title={course.title}
      subtitle={course.subtitle}
      onBack={() => navigation.goBack()}
    >
      <View style={styles.actions}>
        <ActionTile
          icon="shuffle"
          color="tint"
          title="Mixed practice"
          caption={`${SESSION_SIZE} questions from every topic`}
          onPress={() => start(`${course.title}: mixed`)}
        />
        <ActionTile
          icon="timer"
          color="purple"
          title="Timed test"
          caption={`${SESSION_SIZE} questions in ${TIMED_TEST_MINUTES} minutes`}
          onPress={() => start('Timed test', { timed: true })}
        />
      </View>
      {hasNoCalculatorQuestions ? (
        <Section>
          <Row
            icon="noCalculator"
            iconColor="indigo"
            title="No-calculator set"
            subtitle="Paper 1 style questions only"
            onPress={() => start('No-calculator set', { noCalculator: true })}
          />
        </Section>
      ) : null}

      <Section title="Topics">
        {course.topics.map(topic => {
          const { known, review, total } = progressFor(
            study,
            topic.questions.map(question => question.id),
          );
          return (
            <Row
              key={topic.key}
              title={topic.title}
              subtitle={[topic.label, countLabel(total)]
                .filter(Boolean)
                .join(' · ')}
              accessibilityLabel={`Open ${topic.title}`}
              accessory={
                <ProgressRing
                  size={28}
                  strokeWidth={4}
                  value={known / total}
                  secondary={review / total}
                  accessibilityLabel={`${known} of ${total} mastered`}
                />
              }
              onPress={() =>
                navigation.navigate('Topic', {
                  courseKey: course.key,
                  topicKey: topic.key,
                })
              }
            />
          );
        })}
      </Section>
    </Screen>
  );
};

const useStyles = makeStyles(theme => ({
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  actionWrap: {
    flex: 1,
  },
  action: {
    ...continuous,
    backgroundColor: theme.colors.surface,
    borderRadius: radius.card,
    padding: 16,
    minHeight: 132,
  },
  actionTitle: {
    marginTop: 12,
    marginBottom: 2,
  },
}));

export default CourseScreen;
