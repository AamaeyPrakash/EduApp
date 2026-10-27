import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../auth/AuthContext';
import Banner from '../components/Banner';
import PrimaryButton from '../components/PrimaryButton';
import ProgressBar from '../components/ProgressBar';
import { getBoardLabel } from '../constants/educationBoards';
import { COURSES, coursesForBoard } from '../content';
import { DAILY_GOAL } from '../study/progress';
import { REVIEW_SESSION_SIZE } from '../study/sessions';
import { useStudy } from '../study/StudyContext';
import { colors } from '../theme';

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

function Stat({ value, label }) {
  return (
    <View
      style={styles.stat}
      accessible
      accessibilityLabel={`${value} ${label}`}
    >
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ListLink({ label, count, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.listLink, count === 0 && styles.listLinkEmpty]}
      onPress={onPress}
      disabled={count === 0}
      accessibilityRole="button"
      accessibilityState={{ disabled: count === 0 }}
    >
      <Text style={styles.listLinkText}>
        {label} ({count})
      </Text>
    </TouchableOpacity>
  );
}

// Streak, today's goal, reviews that are due, and the saved/mistakes lists.
function TodayPanel({ navigation }) {
  const {
    streak,
    todayCount,
    dueIds,
    savedIds,
    mistakeIds,
    attemptedCount,
    saveFailed,
  } = useStudy();
  const practise = (title, questionIds) =>
    navigation.navigate('Practice', { title, questionIds });

  return (
    <View style={styles.today}>
      <Text style={styles.sectionTitle} accessibilityRole="header">
        Today
      </Text>
      <View style={styles.stats}>
        <Stat value={streak} label="day streak" />
        <Stat
          value={`${Math.min(todayCount, 999)}/${DAILY_GOAL}`}
          label="done today"
        />
        <Stat value={dueIds.length} label="to review" />
      </View>
      <ProgressBar value={todayCount / DAILY_GOAL} style={styles.goalBar} />
      {dueIds.length > 0 ? (
        <PrimaryButton
          title={`Review ${plural(
            Math.min(dueIds.length, REVIEW_SESSION_SIZE),
            'question',
          )}`}
          onPress={() =>
            practise('Review', dueIds.slice(0, REVIEW_SESSION_SIZE))
          }
        />
      ) : (
        <Text style={styles.todayText}>
          {attemptedCount === 0
            ? 'Take a quiz from a course below. Your streak and the questions to review will show up here.'
            : "You're all caught up. Questions come back here when they're due for review."}
        </Text>
      )}
      <View style={styles.listLinks}>
        <ListLink
          label="Saved"
          count={savedIds.length}
          onPress={() => practise('Saved questions', savedIds)}
        />
        <ListLink
          label="Mistakes"
          count={mistakeIds.length}
          onPress={() => practise('Mistakes', mistakeIds)}
        />
      </View>
      <Banner
        tone="info"
        style={styles.saveBanner}
        message={
          saveFailed
            ? "Your latest progress isn't saved yet. It will be saved when you're back online."
            : null
        }
      />
    </View>
  );
}

const HomeScreen = ({ navigation }) => {
  const { user, profile } = useAuth();
  const firstName = (profile?.name || user?.name || '').trim().split(/\s+/)[0];
  const greeting = greetingFor(new Date().getHours());
  const board = profile?.educationBoard;
  const courses = coursesForBoard(board);
  const boardHasCourses = COURSES.some(course => course.board === board);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.greeting}>
            {firstName ? `${greeting}, ${firstName}` : greeting}
          </Text>
          <Text style={styles.title} accessibilityRole="header">
            Mathematics
          </Text>
        </View>

        <TouchableOpacity
          style={styles.search}
          onPress={() => navigation.navigate('Search')}
          accessibilityRole="search"
          accessibilityLabel="Search questions"
        >
          <Text style={styles.searchText}>Search topics and questions</Text>
        </TouchableOpacity>

        <TodayPanel navigation={navigation} />

        <Text style={styles.sectionTitle} accessibilityRole="header">
          Courses
        </Text>
        {board && !boardHasCourses ? (
          <Banner
            tone="info"
            message={`Courses for ${getBoardLabel(
              board,
            )} are on the way. Until then, AskGPT can help with any topic from your syllabus.`}
          />
        ) : null}
        {courses.map(course => (
          <TouchableOpacity
            key={course.key}
            style={styles.card}
            onPress={() =>
              navigation.navigate('Course', { courseKey: course.key })
            }
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`${course.title}, ${course.subtitle}`}
          >
            <View style={styles.cardIcon}>
              <Text style={styles.iconText}>{course.icon}</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{course.title}</Text>
              <Text style={styles.cardSubtitle}>{course.subtitle}</Text>
              <Text style={styles.cardDescription}>{course.description}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
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
    paddingTop: 32,
    paddingBottom: 20,
  },
  header: {
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  search: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
  },
  searchText: {
    fontSize: 16,
    color: colors.placeholder,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  today: {
    marginBottom: 28,
  },
  stats: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  stat: {
    flex: 1,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.surfaceSubtleBorder,
    paddingVertical: 14,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textFaint,
    marginTop: 2,
  },
  goalBar: {
    marginBottom: 16,
  },
  todayText: {
    fontSize: 15,
    lineHeight: 21,
    color: colors.textMuted,
  },
  listLinks: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  listLink: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 12,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.surfaceSubtleBorder,
  },
  listLinkEmpty: {
    opacity: 0.5,
  },
  listLinkText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  saveBanner: {
    marginTop: 12,
    marginBottom: 0,
  },
  greeting: {
    fontSize: 17,
    fontWeight: '400',
    color: colors.textFaint,
    marginBottom: 4,
    letterSpacing: -0.24,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    letterSpacing: -0.34,
    lineHeight: 40,
  },
  card: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    minHeight: 140,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  cardIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: colors.primaryStrong,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
    borderWidth: 1,
    borderColor: colors.surfaceSubtleBorder,
  },
  iconText: {
    fontSize: 28,
    fontWeight: '300',
    color: colors.text,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
    letterSpacing: -0.26,
  },
  cardSubtitle: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 6,
    letterSpacing: -0.24,
    opacity: 0.8,
  },
  cardDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 18,
    letterSpacing: -0.08,
    opacity: 0.6,
  },
});

export default HomeScreen;
