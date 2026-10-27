import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import config, { missingConfigKeys } from '../config';
import { account, functions, ID } from '../lib/appwrite';
import { AppError, isNotFoundError, isUnauthorizedError } from '../lib/errors';
import { readExecution } from '../lib/executions';
import { normalizeEmail } from '../lib/validation';
import { fetchProfile, saveProfile } from '../services/profile';

export const AUTH_STATUS = {
  // Checking for an existing session when the app starts.
  LOADING: 'loading',
  SIGNED_OUT: 'signedOut',
  SIGNED_IN: 'signedIn',
  // The session could not be checked because the server was unreachable.
  UNREACHABLE: 'unreachable',
  // Required settings are missing from .env.
  MISCONFIGURED: 'misconfigured',
};

export const PROFILE_STATUS = {
  LOADING: 'loading',
  READY: 'ready',
  // Signed in, but no profile document exists yet (e.g. sign-up was interrupted).
  MISSING: 'missing',
  ERROR: 'error',
};

export const NOTICES = {
  signedOut: 'You have been logged out.',
  sessionExpired: 'Your session has expired. Please sign in again.',
  accountDeleted: 'Your account and its data have been deleted.',
};

function signedOutState(notice = null) {
  return {
    status: AUTH_STATUS.SIGNED_OUT,
    user: null,
    profile: null,
    profileStatus: null,
    profileError: null,
    error: null,
    notice,
  };
}

function signedInState(user) {
  return {
    status: AUTH_STATUS.SIGNED_IN,
    user,
    profile: null,
    profileStatus: PROFILE_STATUS.LOADING,
    profileError: null,
    error: null,
    notice: null,
  };
}

function initialState() {
  if (missingConfigKeys.length > 0) {
    return { ...signedOutState(), status: AUTH_STATUS.MISCONFIGURED };
  }
  return { ...signedOutState(), status: AUTH_STATUS.LOADING };
}

// Creates an email/password session, replacing any session still active on the device.
async function createSession(email, password) {
  try {
    await account.createEmailPasswordSession(email, password);
  } catch (error) {
    if (error?.type !== 'user_session_already_exists') {
      throw error;
    }
    await account.deleteSession('current');
    await account.createEmailPasswordSession(email, password);
  }
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [state, setState] = useState(initialState);

  // Applies a profile update only if the same user is still signed in, so a slow
  // request can't overwrite the state after a sign-out or account switch.
  const updateForUser = useCallback((userId, changes) => {
    setState(current =>
      current.user && current.user.$id === userId
        ? { ...current, ...changes }
        : current,
    );
  }, []);

  // Returns false (and signs out locally) when the server says the session is gone.
  // Network problems don't end the session, so they return true.
  const verifySession = useCallback(async () => {
    try {
      await account.get();
      return true;
    } catch (error) {
      if (isUnauthorizedError(error)) {
        setState(signedOutState(NOTICES.sessionExpired));
        return false;
      }
      return true;
    }
  }, []);

  const loadProfile = useCallback(
    async user => {
      updateForUser(user.$id, {
        profileStatus: PROFILE_STATUS.LOADING,
        profileError: null,
      });
      try {
        const profile = await fetchProfile(user.$id);
        updateForUser(user.$id, {
          profile,
          profileStatus: PROFILE_STATUS.READY,
        });
      } catch (error) {
        if (isNotFoundError(error) && error.type === 'document_not_found') {
          updateForUser(user.$id, {
            profile: null,
            profileStatus: PROFILE_STATUS.MISSING,
          });
          return;
        }
        if (isUnauthorizedError(error) && !(await verifySession())) {
          return;
        }
        updateForUser(user.$id, {
          profileStatus: PROFILE_STATUS.ERROR,
          profileError: error,
        });
      }
    },
    [updateForUser, verifySession],
  );

  const restoreSession = useCallback(async () => {
    if (missingConfigKeys.length > 0) {
      return;
    }
    setState(current => ({ ...current, status: AUTH_STATUS.LOADING }));
    let user;
    try {
      user = await account.get();
    } catch (error) {
      if (isUnauthorizedError(error)) {
        setState(signedOutState());
      } else {
        setState({
          ...signedOutState(),
          status: AUTH_STATUS.UNREACHABLE,
          error,
        });
      }
      return;
    }
    setState(signedInState(user));
    await loadProfile(user);
  }, [loadProfile]);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const signIn = useCallback(
    async (email, password) => {
      await createSession(normalizeEmail(email), password);
      const user = await account.get();
      setState(signedInState(user));
      await loadProfile(user);
    },
    [loadProfile],
  );

  const signUp = useCallback(
    async ({ email, password, ...details }) => {
      const normalizedEmail = normalizeEmail(email);
      await account.create(
        ID.unique(),
        normalizedEmail,
        password,
        details.name.trim(),
      );
      let user;
      try {
        await createSession(normalizedEmail, password);
        user = await account.get();
      } catch (error) {
        throw new AppError(
          "Your account was created, but we couldn't sign you in. Please sign in with your new email and password.",
          error,
        );
      }
      setState(signedInState(user));
      try {
        const profile = await saveProfile(user, details);
        updateForUser(user.$id, {
          profile,
          profileStatus: PROFILE_STATUS.READY,
        });
      } catch (error) {
        // The account exists, so keep the person signed in and let the
        // "complete your profile" screen retry saving their details.
        updateForUser(user.$id, {
          profileStatus: PROFILE_STATUS.MISSING,
          profileError: error,
        });
      }
    },
    [updateForUser],
  );

  const { user: currentUser } = state;

  const saveProfileDetails = useCallback(
    async details => {
      const user = currentUser;
      if (!user) {
        throw new AppError('Please sign in again.');
      }
      try {
        const profile = await saveProfile(user, details);
        updateForUser(user.$id, {
          profile,
          profileStatus: PROFILE_STATUS.READY,
          profileError: null,
        });
        return profile;
      } catch (error) {
        if (isUnauthorizedError(error)) {
          await verifySession();
        }
        throw error;
      }
    },
    [currentUser, updateForUser, verifySession],
  );

  const reloadProfile = useCallback(async () => {
    if (currentUser) {
      await loadProfile(currentUser);
    }
  }, [currentUser, loadProfile]);

  const signOut = useCallback(async () => {
    try {
      await account.deleteSession('current');
    } catch (error) {
      // 401 means the server had already ended the session; anything else
      // (e.g. no connection) means we couldn't sign out, so let the caller know.
      if (!isUnauthorizedError(error)) {
        throw error;
      }
    }
    setState(signedOutState(NOTICES.signedOut));
  }, []);

  const deleteAccount = useCallback(async () => {
    if (!config.deleteAccountFunctionId) {
      throw new AppError(
        config.supportEmail
          ? `Account deletion isn't available in the app yet. Email ${config.supportEmail} and we'll delete your account.`
          : "Account deletion isn't available in the app yet. Please contact support.",
      );
    }
    let execution;
    try {
      execution = await functions.createExecution(
        config.deleteAccountFunctionId,
        '',
        false,
        '/',
        'POST',
        { 'content-type': 'application/json' },
      );
    } catch (error) {
      if (isUnauthorizedError(error)) {
        await verifySession();
      }
      throw error;
    }
    const { statusCode, body } = readExecution(execution);
    if (statusCode !== 200 || !body.deleted) {
      throw new AppError(
        body.error ||
          "We couldn't delete your account right now. Please try again.",
      );
    }
    setState(signedOutState(NOTICES.accountDeleted));
  }, [verifySession]);

  const requestPasswordReset = useCallback(async email => {
    if (!config.passwordResetUrl) {
      throw new AppError(
        "Password reset isn't available yet. Please contact support.",
      );
    }
    try {
      await account.createRecovery(
        normalizeEmail(email),
        config.passwordResetUrl,
      );
    } catch (error) {
      // Respond the same way whether or not the email has an account, so the
      // form can't be used to find out who is registered.
      if (error?.type === 'user_not_found') {
        return;
      }
      throw error;
    }
  }, []);

  const clearNotice = useCallback(() => {
    setState(current => ({ ...current, notice: null }));
  }, []);

  // Appwrite replaces the whole prefs object on every update, so updates run one at a
  // time and each merges its changes into the prefs saved by the one before.
  const userRef = useRef(currentUser);
  const prefsQueue = useRef(Promise.resolve());
  useEffect(() => {
    userRef.current = currentUser;
  }, [currentUser]);

  const updatePrefs = useCallback(
    changes => {
      const run = prefsQueue.current.then(async () => {
        const user = userRef.current;
        if (!user) {
          throw new AppError('Please sign in again.');
        }
        try {
          const updated = await account.updatePrefs({
            ...(user.prefs || {}),
            ...changes,
          });
          if (userRef.current?.$id === user.$id) {
            userRef.current = updated;
          }
          updateForUser(user.$id, { user: updated });
          return updated;
        } catch (error) {
          if (isUnauthorizedError(error)) {
            await verifySession();
          }
          throw error;
        }
      });
      prefsQueue.current = run.catch(() => {});
      return run;
    },
    [updateForUser, verifySession],
  );

  // Records (in the user's Appwrite account preferences) that they agreed to their
  // tutor messages being sent to OpenAI. App Store guideline 5.1.2(i) requires this
  // permission before any personal data goes to a third-party AI service.
  const grantAiConsent = useCallback(async () => {
    await updatePrefs({ aiConsentAt: new Date().toISOString() });
  }, [updatePrefs]);

  const value = useMemo(
    () => ({
      ...state,
      hasAiConsent: Boolean(state.user?.prefs?.aiConsentAt),
      signIn,
      signUp,
      signOut,
      deleteAccount,
      requestPasswordReset,
      saveProfileDetails,
      reloadProfile,
      restoreSession,
      verifySession,
      clearNotice,
      grantAiConsent,
      updatePrefs,
    }),
    [
      state,
      signIn,
      signUp,
      signOut,
      deleteAccount,
      requestPasswordReset,
      saveProfileDetails,
      reloadProfile,
      restoreSession,
      verifySession,
      clearNotice,
      grantAiConsent,
      updatePrefs,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>.');
  }
  return context;
}
