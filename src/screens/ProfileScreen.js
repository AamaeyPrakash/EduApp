import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PROFILE_STATUS, useAuth } from '../auth/AuthContext';
import Banner from '../components/Banner';
import PrimaryButton from '../components/PrimaryButton';
import config from '../config';
import { getBoardLabel } from '../constants/educationBoards';
import { getErrorMessage } from '../lib/errors';
import { openLink } from '../lib/links';
import { colors } from '../theme';

const ProfileScreen = ({ navigation }) => {
  const {
    user,
    profile,
    profileStatus,
    profileError,
    reloadProfile,
    signOut,
    deleteAccount,
  } = useAuth();
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

  const handleLogout = () =>
    runAction(
      'logout',
      signOut,
      "We couldn't log you out. Check your connection and try again.",
    );

  const confirmDeleteAccount = () =>
    Alert.alert(
      'Delete your account?',
      'This permanently deletes your account and profile details. This cannot be undone.',
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

  const renderDetails = () => {
    if (profile) {
      return (
        <>
          <View style={styles.infoGrid}>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Grade</Text>
              <Text style={styles.infoValue}>{profile.grade}</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Board</Text>
              <Text style={styles.infoValue}>
                {getBoardLabel(profile.educationBoard)}
              </Text>
            </View>
          </View>
          <View style={styles.schoolCard}>
            <Text style={styles.infoLabel}>School</Text>
            <Text style={styles.schoolValue}>{profile.school}</Text>
          </View>
          <PrimaryButton
            title="Edit Profile"
            variant="secondary"
            onPress={() => navigation.navigate('EditProfile')}
            style={styles.wideButton}
          />
        </>
      );
    }
    if (profileStatus === PROFILE_STATUS.ERROR) {
      return (
        <View style={styles.statusCard}>
          <Text style={styles.statusText}>
            {getErrorMessage(profileError, "We couldn't load your profile.")}
          </Text>
          <PrimaryButton
            title="Try Again"
            onPress={reloadProfile}
            style={styles.retryButton}
          />
        </View>
      );
    }
    return (
      <View style={styles.statusCard}>
        <ActivityIndicator color={colors.primary} />
        <Text style={[styles.statusText, styles.loadingText]}>
          Loading your profile...
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title} accessibilityRole="header">
          Profile
        </Text>

        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          {name ? <Text style={styles.nameText}>{name}</Text> : null}
          <Text style={styles.emailText}>{email}</Text>
        </View>

        {renderDetails()}

        <Banner message={actionError} style={styles.wideBanner} />

        <TouchableOpacity
          style={[styles.logoutButton, busyAction && styles.disabled]}
          onPress={handleLogout}
          disabled={Boolean(busyAction)}
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          {busyAction === 'logout' ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <Text style={styles.logoutButtonText}>Logout</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={confirmDeleteAccount}
          disabled={Boolean(busyAction)}
          accessibilityRole="button"
        >
          <Text style={styles.deleteText}>
            {busyAction === 'delete' ? 'Deleting account...' : 'Delete Account'}
          </Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          {config.privacyPolicyUrl ? (
            <Text
              style={styles.footerLink}
              accessibilityRole="link"
              onPress={() => openLink(config.privacyPolicyUrl)}
            >
              Privacy Policy
            </Text>
          ) : null}
          {config.supportEmail ? (
            <Text
              style={styles.footerLink}
              accessibilityRole="link"
              onPress={() => openLink(`mailto:${config.supportEmail}`)}
            >
              Contact Support
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const card = {
  backgroundColor: colors.surface,
  borderWidth: 1,
  borderColor: colors.surfaceBorder,
  width: '100%',
  maxWidth: 400,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 32,
    textAlign: 'center',
    letterSpacing: -0.34,
  },
  profileCard: {
    ...card,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    backgroundColor: 'rgba(10, 132, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(10, 132, 255, 0.4)',
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarText: {
    fontSize: 42,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.42,
  },
  nameText: {
    fontSize: 28,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.28,
  },
  emailText: {
    fontSize: 16,
    color: colors.textSecondary,
    opacity: 0.8,
    textAlign: 'center',
    letterSpacing: -0.16,
  },
  infoGrid: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 400,
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 20,
    padding: 20,
    flex: 0.48,
    alignItems: 'center',
  },
  schoolCard: {
    ...card,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    opacity: 0.7,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.14,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  schoolValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: -0.18,
  },
  wideButton: {
    width: '100%',
    maxWidth: 400,
    marginBottom: 24,
  },
  statusCard: {
    ...card,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  statusText: {
    fontSize: 16,
    color: colors.textSecondary,
    opacity: 0.8,
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 12,
  },
  retryButton: {
    marginTop: 16,
    alignSelf: 'stretch',
  },
  wideBanner: {
    width: '100%',
    maxWidth: 400,
  },
  logoutButton: {
    backgroundColor: colors.dangerStrong,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 60,
    minWidth: 200,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    borderLeftColor: 'rgba(255, 255, 255, 0.3)',
    borderRightColor: 'rgba(255, 69, 58, 0.4)',
    borderBottomColor: 'rgba(255, 69, 58, 0.4)',
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  disabled: {
    opacity: 0.6,
  },
  logoutButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.16,
  },
  deleteButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  deleteText: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 24,
  },
  footerLink: {
    color: colors.textMuted,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

export default ProfileScreen;
