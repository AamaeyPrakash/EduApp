import { act, renderHook, waitFor } from '@testing-library/react-native';
import {
  AUTH_STATUS,
  AuthProvider,
  NOTICES,
  PROFILE_STATUS,
  useAuth,
} from '../src/auth/AuthContext';
import config from '../src/config';
import { account, databases, functions } from '../src/lib/appwrite';
import {
  appwriteError,
  networkError,
  PROFILE,
  TEST_CONFIG,
  unauthorized,
  USER,
} from './helpers/appwrite';

jest.mock('../src/config', () => ({
  __esModule: true,
  default: { ...require('./helpers/appwrite').TEST_CONFIG },
  missingConfigKeys: [],
}));
jest.mock('../src/lib/appwrite', () =>
  require('./helpers/appwrite').createAppwriteMock(),
);

const SIGN_UP_DETAILS = {
  name: ' Sam Lee ',
  grade: '11',
  educationBoard: '5',
  email: ' Sam@Example.com ',
  password: 'secret123',
};

async function renderAuth() {
  const hook = await renderHook(() => useAuth(), { wrapper: AuthProvider });
  return hook.result;
}

async function renderSignedOut() {
  account.get.mockRejectedValueOnce(unauthorized());
  const result = await renderAuth();
  await waitFor(() =>
    expect(result.current.status).toBe(AUTH_STATUS.SIGNED_OUT),
  );
  return result;
}

async function renderSignedIn() {
  account.get.mockResolvedValue(USER);
  databases.getDocument.mockResolvedValue(PROFILE);
  const result = await renderAuth();
  await waitFor(() =>
    expect(result.current.profileStatus).toBe(PROFILE_STATUS.READY),
  );
  return result;
}

beforeEach(() => {
  jest.resetAllMocks();
  Object.assign(config, TEST_CONFIG);
});

describe('restoring the session on launch', () => {
  it('signs out when there is no session', async () => {
    const result = await renderSignedOut();
    expect(result.current.user).toBeNull();
    expect(result.current.notice).toBeNull();
  });

  it('shows the connection screen instead of signing out when offline', async () => {
    account.get.mockRejectedValueOnce(networkError());
    const result = await renderAuth();
    await waitFor(() =>
      expect(result.current.status).toBe(AUTH_STATUS.UNREACHABLE),
    );

    account.get.mockResolvedValue(USER);
    databases.getDocument.mockResolvedValue(PROFILE);
    await act(() => result.current.restoreSession());
    expect(result.current.status).toBe(AUTH_STATUS.SIGNED_IN);
    expect(result.current.profile).toEqual(PROFILE);
  });

  it('restores an existing session and loads the profile', async () => {
    const result = await renderSignedIn();
    expect(result.current.status).toBe(AUTH_STATUS.SIGNED_IN);
    expect(result.current.user).toEqual(USER);
    expect(databases.getDocument).toHaveBeenCalledWith(
      'db',
      'profiles',
      'user-1',
    );
  });

  it('asks for profile details when the profile document is missing', async () => {
    account.get.mockResolvedValue(USER);
    databases.getDocument.mockRejectedValue(
      appwriteError(404, 'document_not_found'),
    );
    const result = await renderAuth();
    await waitFor(() =>
      expect(result.current.profileStatus).toBe(PROFILE_STATUS.MISSING),
    );
    expect(result.current.status).toBe(AUTH_STATUS.SIGNED_IN);
  });

  it('keeps the user signed in when the profile fails to load', async () => {
    account.get.mockResolvedValue(USER);
    databases.getDocument.mockRejectedValue(networkError());
    const result = await renderAuth();
    await waitFor(() =>
      expect(result.current.profileStatus).toBe(PROFILE_STATUS.ERROR),
    );
    expect(result.current.status).toBe(AUTH_STATUS.SIGNED_IN);

    // While retrying, the last error stays so the app doesn't swap to its loader.
    let finishLoading;
    databases.getDocument.mockReturnValue(
      new Promise(resolve => {
        finishLoading = () => resolve(PROFILE);
      }),
    );
    let retry;
    await act(async () => {
      retry = result.current.reloadProfile();
    });
    expect(result.current.profileStatus).toBe(PROFILE_STATUS.LOADING);
    expect(result.current.profileError).toBeTruthy();

    await act(async () => {
      finishLoading();
      await retry;
    });
    expect(result.current.profileStatus).toBe(PROFILE_STATUS.READY);
    expect(result.current.profileError).toBeNull();
  });
});

describe('signIn', () => {
  it('creates a session with a normalized email and loads the user', async () => {
    const result = await renderSignedOut();
    account.createEmailPasswordSession.mockResolvedValue({});
    account.get.mockResolvedValue(USER);
    databases.getDocument.mockResolvedValue(PROFILE);

    await act(() => result.current.signIn('  Sam@Example.com ', 'secret123'));

    expect(account.createEmailPasswordSession).toHaveBeenCalledWith(
      'sam@example.com',
      'secret123',
    );
    expect(result.current.status).toBe(AUTH_STATUS.SIGNED_IN);
    expect(result.current.profile).toEqual(PROFILE);
  });

  it('replaces a session that is still active on the device', async () => {
    const result = await renderSignedOut();
    account.createEmailPasswordSession
      .mockRejectedValueOnce(appwriteError(401, 'user_session_already_exists'))
      .mockResolvedValueOnce({});
    account.deleteSession.mockResolvedValue({});
    account.get.mockResolvedValue(USER);
    databases.getDocument.mockResolvedValue(PROFILE);

    await act(() => result.current.signIn('sam@example.com', 'secret123'));

    expect(account.deleteSession).toHaveBeenCalledWith('current');
    expect(account.createEmailPasswordSession).toHaveBeenCalledTimes(2);
    expect(result.current.status).toBe(AUTH_STATUS.SIGNED_IN);
  });

  it('rejects with the Appwrite error for wrong credentials', async () => {
    const result = await renderSignedOut();
    account.createEmailPasswordSession.mockRejectedValue(
      appwriteError(401, 'user_invalid_credentials'),
    );

    await expect(
      result.current.signIn('sam@example.com', 'wrong-password'),
    ).rejects.toMatchObject({ type: 'user_invalid_credentials' });
    expect(result.current.status).toBe(AUTH_STATUS.SIGNED_OUT);
  });
});

describe('signUp', () => {
  it('creates the account, signs in and saves an owner-only profile', async () => {
    const result = await renderSignedOut();
    account.create.mockResolvedValue(USER);
    account.createEmailPasswordSession.mockResolvedValue({});
    account.get.mockResolvedValue(USER);
    databases.createDocument.mockResolvedValue(PROFILE);

    await act(() => result.current.signUp(SIGN_UP_DETAILS));

    expect(account.create).toHaveBeenCalledWith(
      'generated-id',
      'sam@example.com',
      'secret123',
      'Sam Lee',
    );
    expect(account.createEmailPasswordSession).toHaveBeenCalledWith(
      'sam@example.com',
      'secret123',
    );
    expect(databases.createDocument).toHaveBeenCalledWith(
      'db',
      'profiles',
      'user-1',
      {
        userId: 'user-1',
        email: 'sam@example.com',
        name: 'Sam Lee',
        // No longer asked for; saved empty so older collections keep working.
        age: '',
        grade: '11',
        school: '',
        educationBoard: '5',
      },
      ['read("user:user-1")', 'update("user:user-1")'],
    );
    expect(result.current.status).toBe(AUTH_STATUS.SIGNED_IN);
    expect(result.current.profileStatus).toBe(PROFILE_STATUS.READY);
  });

  it('keeps the new user signed in when saving the profile fails', async () => {
    const result = await renderSignedOut();
    account.create.mockResolvedValue(USER);
    account.createEmailPasswordSession.mockResolvedValue({});
    account.get.mockResolvedValue(USER);
    databases.createDocument.mockRejectedValue(networkError());

    await act(() => result.current.signUp(SIGN_UP_DETAILS));

    expect(result.current.status).toBe(AUTH_STATUS.SIGNED_IN);
    expect(result.current.profileStatus).toBe(PROFILE_STATUS.MISSING);
    expect(result.current.profileError).toBeTruthy();
    // Kept so the "complete your profile" form can start from them.
    expect(result.current.pendingDetails).toMatchObject({
      grade: SIGN_UP_DETAILS.grade,
      educationBoard: SIGN_UP_DETAILS.educationBoard,
    });
  });

  it('explains when the account was created but signing in failed', async () => {
    const result = await renderSignedOut();
    account.create.mockResolvedValue(USER);
    account.createEmailPasswordSession.mockRejectedValue(
      appwriteError(429, 'general_rate_limit_exceeded'),
    );

    await expect(result.current.signUp(SIGN_UP_DETAILS)).rejects.toMatchObject({
      userMessage: expect.stringContaining('Your account was created'),
    });
    expect(result.current.status).toBe(AUTH_STATUS.SIGNED_OUT);
  });

  it('rejects when the email is already registered', async () => {
    const result = await renderSignedOut();
    account.create.mockRejectedValue(appwriteError(409, 'user_already_exists'));

    await expect(result.current.signUp(SIGN_UP_DETAILS)).rejects.toMatchObject({
      type: 'user_already_exists',
    });
    expect(account.createEmailPasswordSession).not.toHaveBeenCalled();
  });
});

describe('saveProfileDetails', () => {
  it('updates the profile document when it already exists', async () => {
    const result = await renderSignedIn();
    databases.createDocument.mockRejectedValue(
      appwriteError(409, 'document_already_exists'),
    );
    const updated = { ...PROFILE, grade: '12' };
    databases.updateDocument.mockResolvedValue(updated);

    await act(() =>
      result.current.saveProfileDetails({ ...PROFILE, grade: '12' }),
    );

    expect(databases.updateDocument).toHaveBeenCalledWith(
      'db',
      'profiles',
      'user-1',
      expect.objectContaining({ grade: '12' }),
    );
    expect(result.current.profile).toEqual(updated);
  });

  it('clears the age and school that older versions stored', async () => {
    const result = await renderSignedIn();
    databases.createDocument.mockRejectedValue(
      appwriteError(409, 'document_already_exists'),
    );
    databases.updateDocument.mockResolvedValue(PROFILE);

    await act(() => result.current.saveProfileDetails(PROFILE));

    expect(databases.updateDocument).toHaveBeenCalledWith(
      'db',
      'profiles',
      'user-1',
      expect.objectContaining({ age: '', school: '' }),
    );
  });
});

describe('signOut', () => {
  it('ends the session', async () => {
    const result = await renderSignedIn();
    account.deleteSession.mockResolvedValue({});

    await act(() => result.current.signOut());

    expect(account.deleteSession).toHaveBeenCalledWith('current');
    expect(result.current.status).toBe(AUTH_STATUS.SIGNED_OUT);
    expect(result.current.notice).toBe(NOTICES.signedOut);
  });

  it('treats a session the server already ended as signed out', async () => {
    const result = await renderSignedIn();
    account.deleteSession.mockRejectedValue(unauthorized());

    await act(() => result.current.signOut());

    expect(result.current.status).toBe(AUTH_STATUS.SIGNED_OUT);
  });

  it('stays signed in and reports the problem when offline', async () => {
    const result = await renderSignedIn();
    account.deleteSession.mockRejectedValue(networkError());

    await expect(result.current.signOut()).rejects.toMatchObject({
      message: 'Network request failed',
    });
    expect(result.current.status).toBe(AUTH_STATUS.SIGNED_IN);
  });
});

describe('deleteAccount', () => {
  it('runs the delete-account function and signs out', async () => {
    const result = await renderSignedIn();
    functions.createExecution.mockResolvedValue({
      responseStatusCode: 200,
      responseBody: JSON.stringify({ deleted: true }),
    });

    await act(() => result.current.deleteAccount());

    expect(functions.createExecution).toHaveBeenCalledWith(
      'delete-account',
      '',
      false,
      '/',
      'POST',
      { 'content-type': 'application/json' },
    );
    expect(result.current.status).toBe(AUTH_STATUS.SIGNED_OUT);
    expect(result.current.notice).toBe(NOTICES.accountDeleted);
  });

  it('keeps the account and reports the error when deletion fails', async () => {
    const result = await renderSignedIn();
    functions.createExecution.mockResolvedValue({
      responseStatusCode: 502,
      responseBody: JSON.stringify({ error: 'Please try again later.' }),
    });

    await expect(result.current.deleteAccount()).rejects.toMatchObject({
      userMessage: 'Please try again later.',
    });
    expect(result.current.status).toBe(AUTH_STATUS.SIGNED_IN);
  });

  it('points to support when the function is not configured', async () => {
    const result = await renderSignedIn();
    config.deleteAccountFunctionId = '';

    await expect(result.current.deleteAccount()).rejects.toMatchObject({
      userMessage: expect.stringContaining('help@example.com'),
    });
    expect(functions.createExecution).not.toHaveBeenCalled();
  });
});

describe('requestPasswordReset', () => {
  it('sends the recovery email to the reset page', async () => {
    const result = await renderSignedOut();
    account.createRecovery.mockResolvedValue({});

    await act(() => result.current.requestPasswordReset(' Sam@Example.com'));

    expect(account.createRecovery).toHaveBeenCalledWith(
      'sam@example.com',
      'https://example.com/reset',
    );
  });

  it('does not reveal whether an email is registered', async () => {
    const result = await renderSignedOut();
    account.createRecovery.mockRejectedValue(
      appwriteError(404, 'user_not_found'),
    );

    await expect(
      result.current.requestPasswordReset('nobody@example.com'),
    ).resolves.toBeUndefined();
  });

  it('reports other errors such as rate limits', async () => {
    const result = await renderSignedOut();
    account.createRecovery.mockRejectedValue(
      appwriteError(429, 'general_rate_limit_exceeded'),
    );

    await expect(
      result.current.requestPasswordReset('sam@example.com'),
    ).rejects.toMatchObject({ type: 'general_rate_limit_exceeded' });
  });
});

describe('verifySession', () => {
  it('signs out with an explanation when the session has expired', async () => {
    const result = await renderSignedIn();
    account.get.mockRejectedValue(unauthorized());

    let stillValid;
    await act(async () => {
      stillValid = await result.current.verifySession();
    });

    expect(stillValid).toBe(false);
    expect(result.current.status).toBe(AUTH_STATUS.SIGNED_OUT);
    expect(result.current.notice).toBe(NOTICES.sessionExpired);
  });

  it('does not sign out because of a network problem', async () => {
    const result = await renderSignedIn();
    account.get.mockRejectedValue(networkError());

    let stillValid;
    await act(async () => {
      stillValid = await result.current.verifySession();
    });

    expect(stillValid).toBe(true);
    expect(result.current.status).toBe(AUTH_STATUS.SIGNED_IN);
  });
});

describe('grantAiConsent', () => {
  it('stores the consent in the account preferences', async () => {
    const result = await renderSignedIn();
    expect(result.current.hasAiConsent).toBe(false);
    account.updatePrefs.mockImplementation(async prefs => ({ ...USER, prefs }));

    await act(() => result.current.grantAiConsent());

    expect(account.updatePrefs).toHaveBeenCalledWith({
      aiConsentAt: expect.any(String),
    });
    expect(result.current.hasAiConsent).toBe(true);
  });

  it('keeps other preferences when saving consent', async () => {
    account.get.mockResolvedValue({ ...USER, prefs: { theme: 'dark' } });
    databases.getDocument.mockResolvedValue(PROFILE);
    const result = await renderAuth();
    await waitFor(() =>
      expect(result.current.profileStatus).toBe(PROFILE_STATUS.READY),
    );
    account.updatePrefs.mockImplementation(async prefs => ({ ...USER, prefs }));

    await act(() => result.current.grantAiConsent());

    expect(account.updatePrefs).toHaveBeenCalledWith({
      theme: 'dark',
      aiConsentAt: expect.any(String),
    });
  });
});

describe('updatePrefs', () => {
  it('runs overlapping updates one after another without losing either', async () => {
    const result = await renderSignedIn();
    const resolvers = [];
    account.updatePrefs.mockImplementation(
      prefs =>
        new Promise(resolve =>
          resolvers.push(() => resolve({ ...USER, prefs })),
        ),
    );

    let first;
    let second;
    await act(async () => {
      first = result.current.updatePrefs({ study: { b: ['a1'] } });
      second = result.current.updatePrefs({ aiConsentAt: 'now' });
    });
    // The second update waits for the first to finish.
    expect(account.updatePrefs).toHaveBeenCalledTimes(1);
    await act(async () => {
      resolvers[0]();
      await first;
    });
    await act(async () => {
      resolvers[1]();
      await second;
    });

    expect(account.updatePrefs).toHaveBeenLastCalledWith({
      study: { b: ['a1'] },
      aiConsentAt: 'now',
    });
    expect(result.current.user.prefs).toEqual({
      study: { b: ['a1'] },
      aiConsentAt: 'now',
    });
  });

  it('keeps going after a failed update', async () => {
    const result = await renderSignedIn();
    account.updatePrefs
      .mockRejectedValueOnce(networkError())
      .mockImplementation(async prefs => ({ ...USER, prefs }));

    await act(async () => {
      await expect(result.current.updatePrefs({ a: 1 })).rejects.toThrow();
    });
    await act(() => result.current.updatePrefs({ b: 2 }));

    expect(account.updatePrefs).toHaveBeenLastCalledWith({ b: 2 });
  });
});
