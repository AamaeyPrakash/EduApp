import React from 'react';
import { View } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import AppText from '../components/AppText';
import Banner from '../components/Banner';
import Button from '../components/Button';
import CourseTile from '../components/CourseTile';
import { GlassIconButton } from '../components/Glass';
import Icon from '../components/Icon';
import { IconTile, Row, Section } from '../components/List';
import PressableScale from '../components/PressableScale';
import ProgressRing from '../components/ProgressRing';
import Screen from '../components/Screen';
import { getBoardLabel } from '../constants/educationBoards';
import {
  COURSES,
  courseQuestions,
  coursesForBoard,
  getCourse,
  getTopic,
} from '../content';
import { progressFor } from '../study/progress';
import { mixedPracticeIds, REVIEW_SESSION_SIZE } from '../study/sessions';
import { useStudy } from '../study/StudyContext';
import { continuous, makeStyles, radius } from '../theme';

export function greetingFor(hour) {
  if (hour < 12) {
    return 'Good morning';
  }
  if (hour < 17) {
    return 'Good afternoon';
  }
  return 'Good evening';
}

const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;

function StatLine({ icon, color, label }) {
  const styles = useStyles();
  return (
    <View style={styles.statLine} accessible accessibilityLabel={label}>
      <Icon name={icon} size={18} color={color} strokeWidth={2.2} />
      <AppText variant="subheadline" weight="500" style={styles.statText}>
        {label}
      </AppText>
    </View>
  );
}

// Today's goal as an Activity-style ring, the streak and reviews due, and one button
// for the most useful thing to do next.
function TodayCard({ navigation, board }) {
  const styles = useStyles();
  const {
    study,
    streak,
    todayCount,
    dailyGoal,
    dueIds,
    knownCount,
    attemptedCount,
  } = useStudy();
  const firstCourse = coursesForBoard(board)[0];

  return (
    <View style={styles.card}>
      <View style={styles.today}>
        <ProgressRing
          size={108}
          strokeWidth={14}
          value={todayCount / dailyGoal}
          gradient={['teal', 'tint']}
          accessibilityLabel={`${todayCount} of ${dailyGoal} questions today`}
        >
          <AppText variant="title2">{todayCount}</AppText>
          <AppText variant="caption" color="secondaryLabel">
            of {dailyGoal}
          </AppText>
        </ProgressRing>
        <View style={styles.stats}>
          <StatLine
            icon="flame"
            color="orange"
            label={`${streak} day streak`}
          />
          <StatLine
            icon="clock"
            color="tint"
            label={`${dueIds.length} to review`}
          />
          <StatLine
            icon="check"
            color="green"
            label={`${knownCount} mastered`}
          />
        </View>
      </View>
      {dueIds.length > 0 ? (
        <Button
          title={`Review ${plural(
            Math.min(dueIds.length, REVIEW_SESSION_SIZE),
            'question',
          )}`}
          icon="retry"
          onPress={() =>
            navigation.navigate('Practice', {
              title: 'Review',
              questionIds: dueIds.slice(0, REVIEW_SESSION_SIZE),
            })
          }
        />
      ) : (
        <Button
          title={
            attemptedCount === 0 ? 'Start practising' : 'Practise something new'
          }
          icon="play"
          variant="tinted"
          onPress={() =>
            navigation.navigate('Practice', {
              title: `${firstCourse.title}: mixed`,
              questionIds: mixedPracticeIds(study, firstCourse.key),
            })
          }
        />
      )}
    </View>
  );
}

function ContinueCard({ navigation }) {
  const { lastTopic, study } = useStudy();
  const topic = lastTopic && getTopic(lastTopic[0], lastTopic[1]);
  if (!topic) {
    return null;
  }
  const course = getCourse(topic.courseKey);
  const { known, total } = progressFor(
    study,
    topic.questions.map(question => question.id),
  );
  return (
    <Section>
      <Row
        leading={<CourseTile course={course} size={30} />}
        title={`Continue: ${topic.title}`}
        subtitle={`${course.title} · ${known} of ${total} mastered`}
        onPress={() =>
          navigation.navigate('Topic', {
            courseKey: topic.courseKey,
            topicKey: topic.key,
          })
        }
      />
    </Section>
  );
}

function ListTile({ icon, color, title, count, onPress }) {
  const styles = useStyles();
  return (
    <PressableScale
      style={styles.tileWrap}
      onPress={onPress}
      disabled={count === 0}
      accessibilityRole="button"
      accessibilityLabel={`${title} (${count})`}
    >
      <View style={styles.tile}>
        <IconTile name={icon} color={color} />
        <AppText variant="title2" style={styles.tileCount}>
          {count}
        </AppText>
        <AppText variant="subheadline" color="secondaryLabel" weight="500">
          {title}
        </AppText>
      </View>
    </PressableScale>
  );
}

const HomeScreen = ({ navigation }) => {
  const styles = useStyles();
  const { user, profile } = useAuth();
  const { study, savedIds, mistakeIds, saveFailed } = useStudy();
  const firstName = (profile?.name || user?.name || '').trim().split(/\s+/)[0];
  const greeting = greetingFor(new Date().getHours());
  const board = profile?.educationBoard;
  const courses = coursesForBoard(board);
  const boardHasCourses = COURSES.some(course => course.board === board);
  const practise = (title, questionIds) =>
    navigation.navigate('Practice', { title, questionIds });

  return (
    <Screen
      title="Today"
      eyebrow={firstName ? `${greeting}, ${firstName}` : greeting}
      glow
      tabBar
      right={
        <GlassIconButton
          icon="search"
          accessibilityLabel="Search questions"
          onPress={() => navigation.navigate('Search')}
        />
      }
    >
      <TodayCard navigation={navigation} board={board} />
      <Banner
        tone="warning"
        message={
          saveFailed
            ? "Your latest progress isn't saved yet. It will be saved when you're back online."
            : null
        }
      />
      <ContinueCard navigation={navigation} />

      <View style={styles.tiles}>
        <ListTile
          icon="bookmarkFill"
          color="orange"
          title="Saved"
          count={savedIds.length}
          onPress={() => practise('Saved questions', savedIds)}
        />
        <ListTile
          icon="mistake"
          color="red"
          title="Mistakes"
          count={mistakeIds.length}
          onPress={() => practise('Mistakes', mistakeIds)}
        />
      </View>

      {board && !boardHasCourses ? (
        <Banner
          tone="info"
          message={`Courses for ${getBoardLabel(
            board,
          )} are on the way. Until then, the Tutor can help with any topic from your syllabus.`}
        />
      ) : null}
      <Section title="Courses">
        {courses.map(course => {
          const ids = courseQuestions(course.key).map(question => question.id);
          const { known, review, total } = progressFor(study, ids);
          return (
            <Row
              key={course.key}
              leading={<CourseTile course={course} />}
              title={course.title}
              subtitle={course.subtitle}
              accessibilityLabel={`${course.title}, ${course.subtitle}`}
              accessory={
                <ProgressRing
                  size={30}
                  strokeWidth={4}
                  value={known / total}
                  secondary={review / total}
                  accessibilityLabel={`${known} of ${total} mastered`}
                />
              }
              onPress={() =>
                navigation.navigate('Course', { courseKey: course.key })
              }
            />
          );
        })}
      </Section>
    </Screen>
  );
};

const useStyles = makeStyles(theme => ({
  card: {
    ...continuous,
    backgroundColor: theme.colors.surface,
    borderRadius: radius.large,
    padding: 20,
    marginBottom: 20,
  },
  today: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  stats: {
    flex: 1,
    marginLeft: 20,
    gap: 12,
  },
  statLine: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    marginLeft: 8,
  },
  tiles: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  tileWrap: {
    flex: 1,
  },
  tile: {
    ...continuous,
    backgroundColor: theme.colors.surface,
    borderRadius: radius.card,
    padding: 16,
  },
  tileCount: {
    marginTop: 12,
  },
}));

export default HomeScreen;
