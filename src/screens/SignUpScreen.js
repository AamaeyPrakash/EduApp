import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import Banner from '../components/Banner';
import FormScreen from '../components/FormScreen';
import PrimaryButton from '../components/PrimaryButton';
import ProfileFields from '../components/ProfileFields';
import TextField from '../components/TextField';
import config from '../config';
import { getErrorMessage } from '../lib/errors';
import { openLink } from '../lib/links';
import { LIMITS, validateSignUp } from '../lib/validation';
import { colors } from '../theme';

const EMPTY_FORM = {
  name: '',
  age: '',
  email: '',
  password: '',
  educationBoard: '',
  grade: '',
  school: '',
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
    <FormScreen>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          Join Our Community
        </Text>
        <Text style={styles.subtitle}>
          Create your account to start your learning journey
        </Text>
        <Text style={styles.welcomeText}>Master concepts at your own pace</Text>
      </View>

      <ProfileFields
        values={values}
        errors={fieldErrors}
        onChange={handleChange}
        accountFields={
          <>
            <TextField
              testID="signup-email"
              placeholder="Email Address"
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
              placeholder={`Password (min ${LIMITS.passwordMin} characters)`}
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

      <Banner message={formError} style={styles.banner} />

      {config.privacyPolicyUrl ? (
        <Text style={styles.legal}>
          By creating an account you agree to our{' '}
          <Text
            style={styles.legalLink}
            accessibilityRole="link"
            onPress={() => openLink(config.privacyPolicyUrl)}
          >
            Privacy Policy
          </Text>
          .
        </Text>
      ) : null}

      <PrimaryButton
        testID="signup-submit"
        title={loading ? 'Creating Account...' : 'Create Account'}
        onPress={handleSignUp}
        loading={loading}
        style={styles.button}
      />

      <TouchableOpacity
        onPress={() => navigation.popTo('SignIn')}
        style={styles.linkContainer}
        accessibilityRole="link"
      >
        <Text style={styles.linkText}>
          Already have an account?{' '}
          <Text style={styles.linkTextBold}>Sign In</Text>
        </Text>
      </TouchableOpacity>
    </FormScreen>
  );
};

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 20,
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
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 22,
  },
  welcomeText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
    textAlign: 'center',
  },
  banner: {
    marginTop: 12,
  },
  legal: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  legalLink: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  button: {
    marginTop: 8,
    marginBottom: 24,
  },
  linkContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  linkText: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
  linkTextBold: {
    color: colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default SignUpScreen;
