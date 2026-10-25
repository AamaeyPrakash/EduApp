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
import { colors } from '../theme';

const COURSES = [
  {
    route: 'Math AA',
    icon: '∫',
    title: 'Mathematics AA',
    subtitle: 'Analysis & Approaches',
    description: 'Advanced calculus and pure mathematics',
  },
  {
    route: 'Math AI',
    icon: 'π',
    title: 'Mathematics AI',
    subtitle: 'Applications & Interpretation',
    description: 'Real-world problem solving',
  },
  {
    route: 'CBSE 12',
    icon: 'Σ',
    title: 'Grade 12 CBSE',
    subtitle: 'Complete Curriculum',
    description: 'Notes, guides & practice tests',
  },
];

export function greetingFor(hour) {
  if (hour < 12) {
    return 'Good morning';
  }
  if (hour < 17) {
    return 'Good afternoon';
  }
  return 'Good evening';
}

const HomeScreen = ({ navigation }) => {
  const { user, profile } = useAuth();
  const firstName = (profile?.name || user?.name || '').trim().split(/\s+/)[0];
  const greeting = greetingFor(new Date().getHours());

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
          <Text style={styles.description}>
            Master your mathematics journey with comprehensive resources and
            intelligent practice.
          </Text>
        </View>

        {COURSES.map(course => (
          <TouchableOpacity
            key={course.route}
            style={styles.card}
            onPress={() => navigation.navigate(course.route)}
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
    paddingTop: 40,
    paddingBottom: 20,
  },
  header: {
    marginBottom: 40,
    paddingHorizontal: 4,
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
  description: {
    fontSize: 17,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 24,
    letterSpacing: -0.24,
    opacity: 0.6,
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
