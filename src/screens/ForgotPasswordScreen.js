import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import Banner from '../components/Banner';
import FormScreen from '../components/FormScreen';
import PrimaryButton from '../components/PrimaryButton';
import TextField from '../components/TextField';
import { getErrorMessage } from '../lib/errors';
import { validateEmail } from '../lib/validation';
import { colors } from '../theme';

const ForgotPasswordScreen = ({ navigation, route }) => {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState(route.params?.email ?? '');
  const [emailError, setEmailError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [sentTo, setSentTo] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (loading) {
      return;
    }
    const error = validateEmail(email);
    setEmailError(error);
    setFormError(null);
    if (error) {
      return;
    }
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setSentTo(email.trim());
    } catch (requestError) {
      setFormError(
        getErrorMessage(
          requestError,
          "We couldn't send the email. Please try again.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormScreen contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          Reset Password
        </Text>
        <Text style={styles.subtitle}>
          Enter the email you signed up with and we'll send you a link to choose
          a new password.
        </Text>
      </View>

      {sentTo ? (
        <Banner
          tone="success"
          message={`If an account exists for ${sentTo}, a reset link is on its way. Check your inbox and spam folder, then sign in with your new password.`}
        />
      ) : null}
      <Banner message={formError} />

      <TextField
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        error={emailError}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        keyboardType="email-address"
        returnKeyType="send"
        onSubmitEditing={handleSubmit}
      />

      <PrimaryButton
        title={sentTo ? 'Send Again' : 'Send Reset Link'}
        onPress={handleSubmit}
        loading={loading}
        style={styles.button}
      />

      <TouchableOpacity
        onPress={() => navigation.popTo('SignIn')}
        style={styles.linkContainer}
        accessibilityRole="link"
      >
        <Text style={styles.linkText}>Back to Sign In</Text>
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
    marginBottom: 32,
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
    lineHeight: 22,
    color: colors.textMuted,
    textAlign: 'center',
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
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ForgotPasswordScreen;
