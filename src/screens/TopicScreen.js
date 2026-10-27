import React, { useEffect, useState } from 'react';
import { Switch, View } from 'react-native';
import AppText from '../components/AppText';
import Button from '../components/Button';
import { GlassIconButton } from '../components/Glass';
import ProgressRing from '../components/ProgressRing';
import QuestionCard from '../components/QuestionCard';
import Screen from '../components/Screen';
import { getCourse, getTopic } from '../content';
import { isTutorConfigured } from '../services/ai';
import { progressFor, questionStatus } from '../study/progress';
import { useStudy } from '../study/StudyContext';
import { continuous, makeStyles, radius, useTheme } from '../theme';

// One topic: progress and practice buttons, then every question with its answer and
// solution a tap away ("Show solutions" opens them all, for reading through).
const TopicScreen = ({ route, navigation }) => {
  const styles = useStyles();
  const { colors } = useTheme();
  const { courseKey, topicKey } = route.params ?? {};
  const topic = getTopic(courseKey, topicKey);
  const course = getCourse(courseKey);
  const { study, noteTopic } = useStudy();
  const [showAll, setShowAll] = useState(false);
  const [overrides, setOverrides] = useState({});
  const tutorReady = isTutorConfigured();

  useEffect(() => {
    if (topic) {
      noteTopic(courseKey, topicKey);
    }
    // Only when the topic changes; noteTopic changes with every progress update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseKey, topicKey]);

  if (!topic) {
    return (
      <Screen title="Not found" onBack={() => navigation.goBack()}>
        <AppText variant="body" color="secondaryLabel">
          This topic could not be found.
        </AppText>
      </Screen>
    );
  }

  const isShown = key => (key in overrides ? overrides[key] : showAll);
  const toggle = key =>
    setOverrides(current => ({ ...current, [key]: !isShown(key) }));
  const ids = topic.questions.map(question => question.id);
  const { known, review, total } = progressFor(study, ids);
  const reviewIds = ids.filter(id => questionStatus(study, id) === 'review');
  // Questions not mastered yet come first.
  const practiceIds = [
    ...ids.filter(id => questionStatus(study, id) !== 'known'),
    ...ids.filter(id => questionStatus(study, id) === 'known'),
  ];
  const askTutor = questionId =>
    navigation.navigate('QuestionTutor', { questionId });

  return (
    <Screen
      title={topic.title}
      eyebrow={course.title}
      subtitle={[topic.label, `${total} questions`].filter(Boolean).join(' · ')}
      onBack={() => navigation.goBack()}
      right={
        tutorReady ? (
          <GlassIconButton
            icon="sparkles"
            color="purple"
            accessibilityLabel="Ask the tutor about this topic"
            onPress={() =>
              navigation.navigate('Tabs', {
                screen: 'Tutor',
                params: {
                  prompt: `Give me a short overview of ${topic.title} (${course.title}): the key ideas, the formulas to remember and the most common mistakes.`,
                },
              })
            }
          />
        ) : null
      }
      list={{
        data: topic.questions,
        keyExtractor: question => question.id,
        renderItem: ({ item }) => (
          <QuestionCard
            question={item}
            heading={`Question ${item.number}`}
            isShown={isShown}
            onToggle={toggle}
            onAskTutor={tutorReady ? () => askTutor(item.id) : null}
          />
        ),
      }}
    >
      <View style={styles.progressCard}>
        <View style={styles.progressRow}>
          <ProgressRing
            size={64}
            strokeWidth={8}
            value={known / total}
            secondary={review / total}
            accessibilityLabel={`${known} of ${total} mastered`}
          >
            <AppText variant="footnote" weight="600">
              {Math.round((known / total) * 100)}%
            </AppText>
          </ProgressRing>
          <View style={styles.progressText}>
            <AppText variant="headline">
              {known} of {total} mastered
            </AppText>
            <AppText variant="subheadline" color="secondaryLabel">
              {review > 0
                ? `${review} to review`
                : known === 0
                ? 'Not started yet'
                : 'Nothing to review'}
            </AppText>
          </View>
        </View>
        <Button
          title="Practise"
          icon="play"
          onPress={() =>
            navigation.navigate('Practice', {
              title: topic.title,
              questionIds: practiceIds,
            })
          }
        />
        {reviewIds.length > 0 ? (
          <Button
            title={`Review ${reviewIds.length} missed`}
            variant="tinted"
            color="orange"
            style={styles.secondaryButton}
            onPress={() =>
              navigation.navigate('Practice', {
                title: `${topic.title}: missed`,
                questionIds: reviewIds,
              })
            }
          />
        ) : null}
      </View>

      <View style={styles.listHeader}>
        <AppText variant="title3" weight="700" accessibilityRole="header">
          Questions
        </AppText>
        <View style={styles.switchRow}>
          <AppText
            variant="subheadline"
            color="secondaryLabel"
            style={styles.switchLabel}
          >
            Show solutions
          </AppText>
          <Switch
            value={showAll}
            onValueChange={value => {
              setShowAll(value);
              setOverrides({});
            }}
            trackColor={{ true: colors.green, false: colors.fill }}
            accessibilityLabel="Show all solutions"
          />
        </View>
      </View>
    </Screen>
  );
};

const useStyles = makeStyles(theme => ({
  progressCard: {
    ...continuous,
    backgroundColor: theme.colors.surface,
    borderRadius: radius.large,
    padding: 18,
    marginBottom: 28,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  progressText: {
    marginLeft: 16,
    flex: 1,
  },
  secondaryButton: {
    marginTop: 10,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: {
    marginRight: 8,
  },
}));

export default TopicScreen;
