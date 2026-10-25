import React, { useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import Banner from '../components/Banner';
import FormScreen from '../components/FormScreen';
import PrimaryButton from '../components/PrimaryButton';
import TextField from '../components/TextField';
import config from '../config';
import { getErrorMessage } from '../lib/errors';
import { validateEmail } from '../lib/validation';
import { colors } from '../theme';

const SignInScreen = ({ navigation }) => {
  const { signIn, notice, clearNotice } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef(null);

  const handleSignIn = async () => {
    if (loading) {
      return;
    }
    const errors = {};
    const emailError = validateEmail(email);
    if (emailError) {
      errors.email = emailError;
    }
    if (!password) {
      errors.password = 'Enter your password.';
    }
    setFieldErrors(errors);
    setFormError(null);
    if (Object.keys(errors).length > 0) {
      return;
    }
    clearNotice();
    setLoading(true);
    try {
      // On success the app switches to the signed-in screens automatically.
      await signIn(email, password);
    } catch (error) {
      setFormError(getErrorMessage(error, 'Sign in failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormScreen contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          Welcome Back
        </Text>
        <Text style={styles.subtitle}>Sign in to continue learning</Text>
      </View>

      <Banner message={notice} tone="info" />
      <Banner message={formError} />

      <TextField
        testID="signin-email"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        error={fieldErrors.email}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        keyboardType="email-address"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <TextField
        ref={passwordRef}
        testID="signin-password"
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        error={fieldErrors.password}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={handleSignIn}
      />

      {config.passwordResetUrl ? (
        <TouchableOpacity
          style={styles.forgotLink}
          onPress={() => navigation.navigate('ForgotPassword', { email })}
          accessibilityRole="link"
        >
          <Text style={styles.linkTextBold}>Forgot password?</Text>
        </TouchableOpacity>
      ) : null}

      <PrimaryButton
        testID="signin-submit"
        title={loading ? 'Signing In...' : 'Sign In'}
        onPress={handleSignIn}
        loading={loading}
        style={styles.button}
      />

      <TouchableOpacity
        onPress={() => navigation.navigate('SignUp')}
        style={styles.linkContainer}
        accessibilityRole="link"
      >
        <Text style={styles.linkText}>
          Don't have an account?{' '}
          <Text style={[styles.linkTextBold, styles.underline]}>Sign Up</Text>
        </Text>
      </TouchableOpacity>
    </FormScreen>
  );
};

const styles = StyleSheet.create({
  content: {
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
  },
  forgotLink: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    marginBottom: 8,
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
    fontSize: 14,
  },
  underline: {
    textDecorationLine: 'underline',
  },
});

export default SignInScreen;
