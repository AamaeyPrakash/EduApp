// Builds errors shaped like the Appwrite SDK's AppwriteException.
export function appwriteError(code, type, message = type) {
  return Object.assign(new Error(message), {
    name: 'AppwriteException',
    code,
    type,
  });
}

export const networkError = () =>
  Object.assign(new Error('Network request failed'), {
    name: 'AppwriteException',
    code: 0,
    type: '',
  });

export const unauthorized = () =>
  appwriteError(401, 'general_unauthorized_scope', 'missing scope (account)');

export const USER = {
  $id: 'user-1',
  email: 'sam@example.com',
  name: 'Sam Lee',
  prefs: {},
};

// A user who has agreed to AskGPT sending their messages to OpenAI.
export const CONSENTED_USER = {
  ...USER,
  prefs: { aiConsentAt: '2026-01-01T00:00:00.000Z' },
};

export const PROFILE = {
  $id: 'user-1',
  userId: 'user-1',
  email: 'sam@example.com',
  name: 'Sam Lee',
  age: '16',
  grade: '11',
  school: 'Springfield High',
  educationBoard: '5',
};

// Factory for jest.mock('../src/lib/appwrite', ...).
export function createAppwriteMock() {
  return {
    account: {
      get: jest.fn(),
      create: jest.fn(),
      createEmailPasswordSession: jest.fn(),
      deleteSession: jest.fn(),
      createRecovery: jest.fn(),
      updatePrefs: jest.fn(),
    },
    tablesDB: {
      getRow: jest.fn(),
      createRow: jest.fn(),
      updateRow: jest.fn(),
    },
    functions: {
      createExecution: jest.fn(),
    },
    ID: { unique: () => 'generated-id' },
    Permission: {
      read: role => `read("${role}")`,
      update: role => `update("${role}")`,
    },
    Role: { user: id => `user:${id}` },
  };
}

export const TEST_CONFIG = {
  appwriteEndpoint: 'https://appwrite.test/v1',
  appwriteProjectId: 'project',
  databaseId: 'db',
  userAccountsTableId: 'profiles',
  aiFunctionId: 'ask-ai',
  deleteAccountFunctionId: 'delete-account',
  passwordResetUrl: 'https://example.com/reset',
  privacyPolicyUrl: 'https://example.com/privacy',
  supportEmail: 'help@example.com',
};
