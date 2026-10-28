import React, { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import AppMark from '../components/AppMark';
import AppText from '../components/AppText';
import Banner from '../components/Banner';
import Button from '../components/Button';
import FormScreen, { formStyles } from '../components/FormScreen';
import TextField from '../components/TextField';
import config from '../config';
import { getErrorMessage } from '../lib/errors';
import { validateEmail } from '../lib/validation';

const SignInScreen = ({ navigation, route }) => {
  const { signIn, notice, clearNotice } = useAuth();
  const [email, setEmail] = useState(route.params?.email ?? '');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef(null);

  // Messages about the old input go away as soon as it changes.
  const edit = (field, setValue) => text => {
    setValue(text);
    setFormError(null);
    if (fieldErrors[field]) {
      setFieldErrors(current => ({ ...current, [field]: undefined }));
    }
  };

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
    <FormScreen glow>
      <View style={formStyles.header}>
        <AppMark />
        <AppText
          variant="largeTitle"
          accessibilityRole="header"
          style={styles.title}
        >
          Welcome back
        </AppText>
        <AppText
          variant="body"
          color="secondaryLabel"
          style={formStyles.subtitle}
        >
          Sign in to keep practising where you left off.
        </AppText>
      </View>

      <Banner message={notice} tone="info" />
      <Banner message={formError} />

      <TextField
        testID="signin-email"
        label="Email"
        placeholder="you@example.com"
        value={email}
        onChangeText={edit('email', setEmail)}
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
        label="Password"
        value={password}
        onChangeText={edit('password', setPassword)}
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
        <Button
          title="Forgot password?"
          variant="plain"
          size="small"
          onPress={() => navigation.navigate('ForgotPassword', { email })}
          style={styles.forgot}
        />
      ) : null}

      <Button
        testID="signin-submit"
        title={loading ? 'Signing In...' : 'Sign In'}
        onPress={handleSignIn}
        loading={loading}
        style={formStyles.button}
      />

      <Button
        title="New here? Create an account"
        variant="plain"
        size="medium"
        onPress={() => navigation.navigate('SignUp')}
        style={formStyles.link}
      />
    </FormScreen>
  );
};

const styles = StyleSheet.create({
  title: {
    marginTop: 20,
  },
  forgot: {
    alignSelf: 'flex-end',
    marginBottom: 8,
  },
});

export default SignInScreen;
