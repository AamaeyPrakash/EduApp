import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import Banner from '../components/Banner';
import FormScreen from '../components/FormScreen';
import PrimaryButton from '../components/PrimaryButton';
import ProfileFields from '../components/ProfileFields';
import ScreenHeader from '../components/ScreenHeader';
import { getErrorMessage } from '../lib/errors';
import { validateProfile } from '../lib/validation';
import { colors } from '../theme';

const asText = value =>
  value === null || value === undefined ? '' : String(value);

// mode "complete": signed in but no profile yet (e.g. sign-up was interrupted).
// mode "edit": opened from the Profile tab.
const ProfileFormScreen = ({ navigation, route }) => {
  const isEditing = route.params?.mode === 'edit';
  const { user, profile, profileError, saveProfileDetails, signOut } =
    useAuth();
  const [values, setValues] = useState(() => ({
    name: asText(profile?.name ?? user?.name),
    age: asText(profile?.age),
    grade: asText(profile?.grade),
    school: asText(profile?.school),
    educationBoard: asText(profile?.educationBoard),
  }));
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleChange = (field, value) => {
    setValues(current => ({ ...current, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors(current => ({ ...current, [field]: undefined }));
    }
  };

  const handleSave = async () => {
    if (saving) {
      return;
    }
    const errors = validateProfile(values);
    setFieldErrors(errors);
    setFormError(null);
    if (Object.keys(errors).length > 0) {
      return;
    }
    setSaving(true);
    try {
      await saveProfileDetails(values);
      if (isEditing) {
        navigation.goBack();
      }
    } catch (error) {
      setFormError(
        getErrorMessage(
          error,
          "We couldn't save your details. Please try again.",
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      setFormError(
        getErrorMessage(error, "We couldn't sign you out. Please try again."),
      );
      setSigningOut(false);
    }
  };

  const intro = isEditing
    ? null
    : profileError
    ? "We couldn't save your details when you signed up. Please check them and try again."
    : 'Tell us a little about yourself so we can tailor your practice.';

  return (
    <FormScreen>
      {isEditing ? (
        <ScreenHeader
          onClose={() => navigation.goBack()}
          style={styles.closeHeader}
        />
      ) : null}
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          {isEditing ? 'Edit Profile' : 'Complete Your Profile'}
        </Text>
        {user?.email ? <Text style={styles.subtitle}>{user.email}</Text> : null}
      </View>

      <Banner message={intro} tone={profileError ? 'error' : 'info'} />

      <ProfileFields
        values={values}
        errors={fieldErrors}
        onChange={handleChange}
      />

      <Banner message={formError} style={styles.banner} />

      <PrimaryButton
        title={isEditing ? 'Save Changes' : 'Continue'}
        onPress={handleSave}
        loading={saving}
        style={styles.button}
      />

      {isEditing ? null : (
        <TouchableOpacity
          onPress={handleSignOut}
          disabled={signingOut}
          style={styles.linkContainer}
          accessibilityRole="button"
        >
          <Text style={styles.linkText}>
            {signingOut ? 'Signing out...' : 'Not you? Sign out'}
          </Text>
        </TouchableOpacity>
      )}
    </FormScreen>
  );
};

const styles = StyleSheet.create({
  closeHeader: {
    paddingHorizontal: 0,
  },
  header: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
  },
  banner: {
    marginTop: 12,
  },
  button: {
    marginTop: 8,
    marginBottom: 16,
  },
  linkContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  linkText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ProfileFormScreen;
