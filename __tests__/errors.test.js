import {
  AppError,
  getErrorMessage,
  isNetworkError,
  isUnauthorizedError,
} from '../src/lib/errors';
import { appwriteError, networkError } from './helpers/appwrite';

describe('getErrorMessage', () => {
  it('explains known Appwrite errors', () => {
    expect(
      getErrorMessage(appwriteError(401, 'user_invalid_credentials')),
    ).toBe('Incorrect email or password.');
    expect(getErrorMessage(appwriteError(409, 'user_already_exists'))).toMatch(
      /already exists/,
    );
    expect(
      getErrorMessage(appwriteError(429, 'general_rate_limit_exceeded')),
    ).toMatch(/Too many attempts/);
  });

  it('turns invalid-argument errors into field hints', () => {
    const error = appwriteError(
      400,
      'general_argument_invalid',
      'Invalid `email` param: Value must be a valid email address',
    );
    expect(getErrorMessage(error)).toBe('Please enter a valid email address.');
  });

  it('describes connection problems', () => {
    expect(getErrorMessage(networkError())).toMatch(/Check your internet/);
  });

  it('prefers messages written for people', () => {
    expect(getErrorMessage(new AppError('Try again tomorrow.'))).toBe(
      'Try again tomorrow.',
    );
  });

  it('falls back to a generic or given message', () => {
    expect(getErrorMessage(new TypeError('x is undefined'))).toBe(
      'Something went wrong. Please try again.',
    );
    expect(getErrorMessage(null, 'Custom fallback')).toBe('Custom fallback');
    expect(getErrorMessage(appwriteError(503, 'something_new'))).toMatch(
      /server ran into a problem/,
    );
  });
});

describe('error checks', () => {
  it('detects network failures without misreading code bugs', () => {
    expect(isNetworkError(networkError())).toBe(true);
    expect(isNetworkError(new TypeError('Cannot read properties'))).toBe(false);
    expect(isNetworkError(appwriteError(401, 'user_unauthorized'))).toBe(false);
  });

  it('detects unauthorized responses', () => {
    expect(isUnauthorizedError(appwriteError(401, 'user_unauthorized'))).toBe(
      true,
    );
    expect(isUnauthorizedError(networkError())).toBe(false);
  });
});
