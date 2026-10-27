import React, { useState } from 'react';
import { View } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import AppText from '../components/AppText';
import Banner from '../components/Banner';
import Button from '../components/Button';
import FormScreen, { formStyles } from '../components/FormScreen';
import ProfileFields from '../components/ProfileFields';
import TextField from '../components/TextField';
import config from '../config';
import { getErrorMessage } from '../lib/errors';
import { openLink } from '../lib/links';
import { LIMITS, validateSignUp } from '../lib/validation';

const EMPTY_FORM = {
  name: '',
  email: '',
  password: '',
  educationBoard: '',
  grade: '',
};

const SignUpScreen = ({ navigation }) => {
  const { signUp } = useAuth();
  const [values, setValues] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setValues(current => ({ ...current, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors(current => ({ ...current, [field]: undefined }));
    }
  };

  const handleSignUp = async () => {
    if (loading) {
      return;
    }
    const errors = validateSignUp(values);
    setFieldErrors(errors);
    setFormError(null);
    if (Object.keys(errors).length > 0) {
      setFormError('Please fix the highlighted fields.');
      return;
    }
    setLoading(true);
    try {
      // Creates the account, signs in and saves the profile. On success the app
      // switches to the signed-in screens automatically.
      await signUp(values);
    } catch (error) {
      setFormError(
        getErrorMessage(
          error,
          "We couldn't create your account. Please try again.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormScreen onBack={() => navigation.popTo('SignIn')}>
      <View style={formStyles.header}>
        <AppText variant="largeTitle" accessibilityRole="header">
          Create account
        </AppText>
        <AppText
          variant="body"
          color="secondaryLabel"
          style={formStyles.subtitle}
        >
          Your board and grade pick the right courses and help the tutor pitch
          its answers.
        </AppText>
      </View>

      <ProfileFields
        values={values}
        errors={fieldErrors}
        onChange={handleChange}
        accountFields={
          <>
            <TextField
              testID="signup-email"
              placeholder="Email"
              value={values.email}
              onChangeText={text => handleChange('email', text)}
              error={fieldErrors.email}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              keyboardType="email-address"
            />
            <TextField
              testID="signup-password"
              placeholder={`Password (${LIMITS.passwordMin}+ characters)`}
              value={values.password}
              onChangeText={text => handleChange('password', text)}
              error={fieldErrors.password}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              textContentType="newPassword"
              maxLength={LIMITS.passwordMax}
            />
          </>
        }
      />

      <Banner message={formError} />

      {config.privacyPolicyUrl ? (
        <AppText variant="footnote" color="secondaryLabel" align="center">
          By creating an account you agree to our{' '}
          <AppText
            variant="footnote"
            color="tint"
            accessibilityRole="link"
            onPress={() => openLink(config.privacyPolicyUrl)}
          >
            Privacy Policy
          </AppText>
          .
        </AppText>
      ) : null}

      <Button
        testID="signup-submit"
        title={loading ? 'Creating Account...' : 'Create Account'}
        onPress={handleSignUp}
        loading={loading}
        style={formStyles.button}
      />

      <Button
        title="Already have an account? Sign in"
        variant="plain"
        size="medium"
        onPress={() => navigation.popTo('SignIn')}
        style={formStyles.link}
      />
    </FormScreen>
  );
};

export default SignUpScreen;
