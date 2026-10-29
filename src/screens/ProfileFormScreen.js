import React, { useState } from 'react';
import { View } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import AppText from '../components/AppText';
import Banner from '../components/Banner';
import Button from '../components/Button';
import FormScreen, { formStyles } from '../components/FormScreen';
import ProfileFields from '../components/ProfileFields';
import { getErrorMessage } from '../lib/errors';
import { validateProfile } from '../lib/validation';

const asText = value =>
  value === null || value === undefined ? '' : String(value);

// mode "complete": signed in but no profile yet (e.g. sign-up was interrupted).
// mode "edit": opened from the Profile tab.
const ProfileFormScreen = ({ navigation, route }) => {
  const isEditing = route.params?.mode === 'edit';
  const {
    user,
    profile,
    profileError,
    pendingDetails,
    saveProfileDetails,
    signOut,
  } = useAuth();
  // After an interrupted sign-up, start from what the student had chosen.
  const draft = profile ?? pendingDetails;
  const [values, setValues] = useState(() => ({
    name: asText(draft?.name ?? user?.name),
    grade: asText(draft?.grade),
    educationBoard: asText(draft?.educationBoard),
  }));
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleChange = (field, value) => {
    setValues(current => ({ ...current, [field]: value }));
    setFormError(null);
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
      : 'Tell us your board and grade so we can show the right courses.';

  return (
    <FormScreen
      onBack={isEditing ? () => navigation.goBack() : undefined}
      backIcon="close"
      backLabel="Close"
    >
      <View style={formStyles.header}>
        <AppText variant="largeTitle" accessibilityRole="header">
          {isEditing ? 'Edit details' : 'Complete your profile'}
        </AppText>
        {user?.email ? (
          <AppText
            variant="body"
            color="secondaryLabel"
            style={formStyles.subtitle}
          >
            {user.email}
          </AppText>
        ) : null}
      </View>

      <Banner message={intro} tone={profileError ? 'error' : 'info'} />

      <ProfileFields
        values={values}
        errors={fieldErrors}
        onChange={handleChange}
      />

      <Banner message={formError} />

      <Button
        title={isEditing ? 'Save Changes' : 'Continue'}
        onPress={handleSave}
        loading={saving}
        style={formStyles.button}
      />

      {isEditing ? null : (
        <Button
          title={signingOut ? 'Signing Out...' : 'Not you? Sign out'}
          variant="plain"
          size="medium"
          onPress={handleSignOut}
          disabled={signingOut}
          style={formStyles.link}
        />
      )}
    </FormScreen>
  );
};

export default ProfileFormScreen;
