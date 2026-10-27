import React, { useState } from 'react';
import { View } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import AppText from '../components/AppText';
import Banner from '../components/Banner';
import Button from '../components/Button';
import FormScreen, { formStyles } from '../components/FormScreen';
import TextField from '../components/TextField';
import { getErrorMessage } from '../lib/errors';
import { validateEmail } from '../lib/validation';

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
    <FormScreen onBack={() => navigation.popTo('SignIn')}>
      <View style={formStyles.header}>
        <AppText variant="largeTitle" accessibilityRole="header">
          Reset password
        </AppText>
        <AppText
          variant="body"
          color="secondaryLabel"
          style={formStyles.subtitle}
        >
          Enter the email you signed up with and we'll send you a link to choose
          a new password.
        </AppText>
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

      <Button
        title={sentTo ? 'Send Again' : 'Send Reset Link'}
        onPress={handleSubmit}
        loading={loading}
        style={formStyles.button}
      />
    </FormScreen>
  );
};

export default ForgotPasswordScreen;
