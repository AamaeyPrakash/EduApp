import React, { useId, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { PROFILE_STATUS, useAuth } from '../auth/AuthContext';
import AppText from '../components/AppText';
import Banner from '../components/Banner';
import Button from '../components/Button';
import Chip from '../components/Chip';
import { Row, Section } from '../components/List';
import Screen from '../components/Screen';
import config from '../config';
import { getBoardLabel } from '../constants/educationBoards';
import { getErrorMessage } from '../lib/errors';
import { openLink } from '../lib/links';
import { GOAL_OPTIONS } from '../study/progress';
import { useStudy } from '../study/StudyContext';
import { continuous, makeStyles, radius, useTheme } from '../theme';

function Avatar({ initial }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const id = useId().replace(/:/g, '');
  return (
    <View style={styles.avatar}>
      <Svg width={72} height={72} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={`avatar${id}`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.teal} />
            <Stop offset="1" stopColor={colors.indigo} />
          </LinearGradient>
        </Defs>
        <Rect width={72} height={72} rx={36} fill={`url(#avatar${id})`} />
      </Svg>
      <AppText variant="title1" color="onTint">
        {initial}
      </AppText>
    </View>
  );
}

function Stat({ value, label }) {
  const styles = useStyles();
  return (
    <View
      style={styles.stat}
      accessible
      accessibilityLabel={`${label}: ${value}`}
    >
      <AppText variant="title2">{value}</AppText>
      <AppText variant="footnote" color="secondaryLabel">
        {label}
      </AppText>
    </View>
  );
}

const ProfileScreen = ({ navigation }) => {
  const styles = useStyles();
  const {
    user,
    profile,
    profileStatus,
    profileError,
    reloadProfile,
    signOut,
    deleteAccount,
  } = useAuth();
  const {
    flush,
    attemptedCount,
    knownCount,
    bestStreak,
    dailyGoal,
    setDailyGoal,
  } = useStudy();
  const [busyAction, setBusyAction] = useState(null);
  const [actionError, setActionError] = useState(null);

  const name = (profile?.name || user?.name || '').trim();
  const email = profile?.email || user?.email || '';
  const initial = (name || email || '?').charAt(0).toUpperCase();

  const runAction = async (action, run, fallbackMessage) => {
    setBusyAction(action);
    setActionError(null);
    try {
      await run();
    } catch (error) {
      setActionError(getErrorMessage(error, fallbackMessage));
      setBusyAction(null);
    }
  };

  // Saves the latest answers first; they are lost once the session ends.
  const handleSignOut = () =>
    runAction(
      'signOut',
      async () => {
        await flush();
        await signOut();
      },
      "We couldn't sign you out. Check your connection and try again.",
    );

  const confirmDeleteAccount = () => {
    // Without the delete function, say how to ask for deletion before anything else.
    if (!config.deleteAccountFunctionId) {
      Alert.alert(
        'Delete your account',
        config.supportEmail
          ? `Email ${config.supportEmail} and we'll delete your account, profile and progress.`
          : "Contact support and we'll delete your account, profile and progress.",
        config.supportEmail
          ? [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Email Support',
                onPress: () =>
                  openLink(
                    `mailto:${config.supportEmail}?subject=${encodeURIComponent(
                      'Delete my EduApp account',
                    )}`,
                  ),
              },
            ]
          : [{ text: 'OK' }],
      );
      return;
    }
    Alert.alert(
      'Delete your account?',
      'This permanently deletes your account, profile and progress. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            runAction(
              'delete',
              deleteAccount,
              "We couldn't delete your account. Please try again.",
            ),
        },
      ],
    );
  };

  let details;
  if (profile) {
    details = [
      <Row
        key="board"
        icon="graduation"
        iconColor="indigo"
        title="Board"
        value={getBoardLabel(profile.educationBoard)}
        onPress={() => navigation.navigate('EditProfile')}
      />,
      <Row
        key="grade"
        icon="chart"
        iconColor="teal"
        title="Grade"
        value={profile.grade}
        onPress={() => navigation.navigate('EditProfile')}
      />,
      <Row
        key="edit"
        icon="pencil"
        iconColor="tint"
        title="Edit Details"
        onPress={() => navigation.navigate('EditProfile')}
      />,
    ];
  } else if (profileStatus === PROFILE_STATUS.ERROR) {
    details = (
      <View style={styles.status}>
        <Banner
          message={getErrorMessage(
            profileError,
            "We couldn't load your profile.",
          )}
        />
        <Button title="Try Again" size="medium" onPress={reloadProfile} />
      </View>
    );
  } else {
    details = (
      <View style={styles.status}>
        <ActivityIndicator />
        <AppText
          variant="subheadline"
          color="secondaryLabel"
          style={styles.loading}
        >
          Loading your profile...
        </AppText>
      </View>
    );
  }

  return (
    <Screen title="Profile" tabBar glow>
      <View style={styles.header}>
        <Avatar initial={initial} />
        <View style={styles.identity}>
          {name ? <AppText variant="title3">{name}</AppText> : null}
          <AppText variant="subheadline" color="secondaryLabel">
            {email}
          </AppText>
        </View>
      </View>

      <View style={styles.stats}>
        <Stat value={attemptedCount} label="Practised" />
        <View style={styles.statDivider} />
        <Stat value={knownCount} label="Mastered" />
        <View style={styles.statDivider} />
        <Stat value={bestStreak} label="Best streak" />
      </View>

      <Section title="Learning">{details}</Section>

      <Section
        title="Daily goal"
        footer="Questions to answer each day. The ring on Today fills as you go."
      >
        <View style={styles.goals}>
          {GOAL_OPTIONS.map(goal => (
            <Chip
              key={goal}
              label={String(goal)}
              selected={goal === dailyGoal}
              onPress={() => setDailyGoal(goal)}
              accessibilityLabel={`Daily goal: ${goal} questions`}
            />
          ))}
        </View>
      </Section>

      {config.privacyPolicyUrl || config.supportEmail ? (
        <Section title="Help">
          {config.privacyPolicyUrl ? (
            <Row
              icon="lock"
              iconColor="green"
              title="Privacy Policy"
              onPress={() => openLink(config.privacyPolicyUrl)}
            />
          ) : null}
          {config.supportEmail ? (
            <Row
              icon="envelope"
              iconColor="orange"
              title="Contact Support"
              onPress={() => openLink(`mailto:${config.supportEmail}`)}
            />
          ) : null}
        </Section>
      ) : null}

      <Banner message={actionError} />
      <Section>
        <Row
          title={busyAction === 'signOut' ? 'Signing Out...' : 'Sign Out'}
          destructive
          onPress={busyAction ? undefined : handleSignOut}
        />
        <Row
          title={
            busyAction === 'delete' ? 'Deleting Account...' : 'Delete Account'
          }
          destructive
          onPress={busyAction ? undefined : confirmDeleteAccount}
        />
      </Section>
    </Screen>
  );
};

const useStyles = makeStyles(theme => ({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identity: {
    flex: 1,
    marginLeft: 16,
  },
  stats: {
    ...continuous,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: radius.card,
    paddingVertical: 16,
    marginBottom: 28,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: theme.colors.separator,
  },
  status: {
    padding: 16,
    alignItems: 'center',
  },
  loading: {
    marginTop: 8,
  },
  goals: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
  },
}));

export default ProfileScreen;
