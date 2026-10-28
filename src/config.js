import {
  APPWRITE_ENDPOINT,
  APPWRITE_PROJECT_ID,
  APPWRITE_DATABASE_ID,
  APPWRITE_USER_ACCOUNTS_TABLE_ID,
  APPWRITE_AI_FUNCTION_ID,
  APPWRITE_DELETE_ACCOUNT_FUNCTION_ID,
  PASSWORD_RESET_URL,
  PRIVACY_POLICY_URL,
  SUPPORT_EMAIL,
} from '@env';

const clean = value => (typeof value === 'string' ? value.trim() : '');

// Values come from `.env` (see .env.example) and are compiled into the app.
const config = {
  appwriteEndpoint: clean(APPWRITE_ENDPOINT).replace(/\/+$/, ''),
  appwriteProjectId: clean(APPWRITE_PROJECT_ID),
  databaseId: clean(APPWRITE_DATABASE_ID),
  userAccountsTableId: clean(APPWRITE_USER_ACCOUNTS_TABLE_ID),
  aiFunctionId: clean(APPWRITE_AI_FUNCTION_ID),
  deleteAccountFunctionId: clean(APPWRITE_DELETE_ACCOUNT_FUNCTION_ID),
  passwordResetUrl: clean(PASSWORD_RESET_URL),
  privacyPolicyUrl: clean(PRIVACY_POLICY_URL),
  supportEmail: clean(SUPPORT_EMAIL),
};

// Settings the app cannot run without. Optional features (AI tutor, account deletion,
// password reset, privacy policy) degrade gracefully when their setting is missing.
const required = {
  APPWRITE_ENDPOINT: config.appwriteEndpoint,
  APPWRITE_PROJECT_ID: config.appwriteProjectId,
  APPWRITE_DATABASE_ID: config.databaseId,
  APPWRITE_USER_ACCOUNTS_TABLE_ID: config.userAccountsTableId,
};

export const missingConfigKeys = Object.keys(required).filter(
  key => !required[key],
);

export default config;
