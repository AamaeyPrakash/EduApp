// Client-side checks so people get instant feedback. Appwrite validates again on the server.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const LIMITS = {
  nameMax: 80,
  passwordMin: 8,
  passwordMax: 256,
  gradeMin: 1,
  gradeMax: 13,
};

export function normalizeEmail(email) {
  return (email || '').trim().toLowerCase();
}

export function validateEmail(email) {
  const value = normalizeEmail(email);
  if (!value) {
    return 'Enter your email address.';
  }
  if (!EMAIL_PATTERN.test(value)) {
    return 'Enter a valid email address.';
  }
  return null;
}

export function validatePassword(password) {
  if (!password) {
    return 'Enter a password.';
  }
  if (password.length < LIMITS.passwordMin) {
    return `Password must be at least ${LIMITS.passwordMin} characters.`;
  }
  if (password.length > LIMITS.passwordMax) {
    return `Password must be at most ${LIMITS.passwordMax} characters.`;
  }
  return null;
}

function validateWholeNumber(value, min, max, label) {
  const text = String(value ?? '').trim();
  if (!text) {
    return `Enter your ${label}.`;
  }
  const number = Number(text);
  if (!/^\d+$/.test(text) || number < min || number > max) {
    return `Enter a ${label} between ${min} and ${max}.`;
  }
  return null;
}

// Profile fields shared by sign-up and the "complete your profile" screen. Only what
// the app uses is asked for: a name for greetings, and the board and grade that pick
// courses and pitch the tutor's answers.
export function validateProfile({ name, grade, educationBoard }) {
  const errors = {};
  const trimmedName = (name || '').trim();
  if (!trimmedName) {
    errors.name = 'Enter your name.';
  } else if (trimmedName.length > LIMITS.nameMax) {
    errors.name = `Name must be at most ${LIMITS.nameMax} characters.`;
  }
  const gradeError = validateWholeNumber(
    grade,
    LIMITS.gradeMin,
    LIMITS.gradeMax,
    'grade',
  );
  if (gradeError) {
    errors.grade = gradeError;
  }
  if (!educationBoard) {
    errors.educationBoard = 'Select your education board.';
  }
  return errors;
}

export function validateSignUp(values) {
  const errors = validateProfile(values);
  const emailError = validateEmail(values.email);
  if (emailError) {
    errors.email = emailError;
  }
  const passwordError = validatePassword(values.password);
  if (passwordError) {
    errors.password = passwordError;
  }
  return errors;
}
