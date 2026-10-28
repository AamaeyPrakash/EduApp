// Turns errors thrown by the Appwrite SDK (and fetch) into messages people can act on.
// Error types: https://appwrite.io/docs/advanced/platform/response-codes

const SESSION_EXPIRED =
  'Your session has expired. Please sign in again to continue.';
const NETWORK =
  "Can't reach the server. Check your internet connection and try again.";
const GENERIC = 'Something went wrong. Please try again.';

const MESSAGES_BY_TYPE = {
  user_invalid_credentials: 'Incorrect email or password.',
  user_blocked:
    'This account has been disabled. Contact support if you think this is a mistake.',
  user_already_exists:
    'An account with this email already exists. Try signing in instead.',
  user_email_already_exists:
    'An account with this email already exists. Try signing in instead.',
  user_not_found: 'No account was found with those details.',
  user_invalid_token:
    'This link is invalid or has expired. Please request a new one.',
  user_password_reset_required:
    'You need to reset your password before signing in. Use "Forgot password?".',
  user_more_factors_required:
    'This account uses multi-factor sign-in, which this app does not support yet.',
  user_count_exceeded:
    'New sign-ups are paused right now. Please try again later.',
  user_email_disposable: 'Please use a permanent email address.',
  user_unauthorized: SESSION_EXPIRED,
  password_recently_used:
    "Choose a password you haven't used recently on this account.",
  password_personal_data:
    "Your password can't contain your name, email or other personal details.",
  password_pwned:
    'This password has appeared in a data breach. Please choose a different one.',
  general_rate_limit_exceeded:
    'Too many attempts. Please wait a few minutes and try again.',
  general_smtp_disabled:
    "Email sending isn't set up yet, so we can't send that email. Please contact support.",
  general_service_disabled: 'This feature is currently unavailable.',
  general_server_error: 'The server ran into a problem. Please try again.',
  row_invalid_structure:
    'Some of your details are too long or not valid. Please check them and try again.',
  project_not_found:
    'The app is pointing at an Appwrite project that does not exist. Check APPWRITE_PROJECT_ID.',
  database_not_found:
    'The app database is not set up correctly. Check APPWRITE_DATABASE_ID.',
  table_not_found:
    'The app database is not set up correctly. Check APPWRITE_USER_ACCOUNTS_TABLE_ID.',
  function_not_found: 'This feature is not set up on the server yet.',
  function_execute_permission_missing:
    'This feature is not set up on the server yet.',
  function_synchronous_timeout:
    'The server took too long to respond. Please try again.',
};

export function isNetworkError(error) {
  if (!error) {
    return false;
  }
  // The SDK wraps fetch failures in an AppwriteException with code 0 and no type.
  if (error.name === 'AppwriteException' && !error.code && !error.type) {
    return true;
  }
  return /network request failed|failed to fetch|network error/i.test(
    error.message || '',
  );
}

export function isUnauthorizedError(error) {
  return Boolean(error) && error.code === 401;
}

export function isNotFoundError(error) {
  return Boolean(error) && error.code === 404;
}

function describeInvalidArgument(message) {
  if (/`email`/.test(message)) {
    return 'Please enter a valid email address.';
  }
  if (/`password`/.test(message)) {
    return 'Passwords must be 8-256 characters and not a commonly used password.';
  }
  if (/`name`/.test(message)) {
    return 'Please enter a shorter name.';
  }
  return null;
}

export function getErrorMessage(error, fallback = GENERIC) {
  if (!error) {
    return fallback;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error.userMessage) {
    return error.userMessage;
  }
  if (error.type && MESSAGES_BY_TYPE[error.type]) {
    return MESSAGES_BY_TYPE[error.type];
  }
  if (error.type === 'general_argument_invalid') {
    return describeInvalidArgument(error.message || '') || fallback;
  }
  if (isNetworkError(error)) {
    return NETWORK;
  }
  if (error.code >= 500) {
    return MESSAGES_BY_TYPE.general_server_error;
  }
  return fallback;
}

// An error whose message is already written for the person using the app.
export class AppError extends Error {
  constructor(userMessage, cause) {
    super(userMessage);
    this.name = 'AppError';
    this.userMessage = userMessage;
    this.cause = cause;
  }
}
