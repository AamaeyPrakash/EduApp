import {
  normalizeEmail,
  validateEmail,
  validatePassword,
  validateProfile,
  validateSignUp,
} from '../src/lib/validation';

const VALID_PROFILE = {
  name: 'Sam Lee',
  age: '16',
  grade: '11',
  school: 'Springfield High',
  educationBoard: '5',
};

describe('email', () => {
  it('normalizes spaces and capitals', () => {
    expect(normalizeEmail('  Sam@Example.COM ')).toBe('sam@example.com');
  });

  it.each([
    ['', 'Enter your email address.'],
    ['sam', 'Enter a valid email address.'],
    ['sam@example', 'Enter a valid email address.'],
    ['sam @example.com', 'Enter a valid email address.'],
  ])('rejects %p', (email, message) => {
    expect(validateEmail(email)).toBe(message);
  });

  it('accepts a normal address', () => {
    expect(validateEmail(' sam@example.com ')).toBeNull();
  });
});

describe('password', () => {
  it('requires 8 to 256 characters', () => {
    expect(validatePassword('')).toBe('Enter a password.');
    expect(validatePassword('1234567')).toMatch(/at least 8/);
    expect(validatePassword('x'.repeat(257))).toMatch(/at most 256/);
    expect(validatePassword('12345678')).toBeNull();
  });
});

describe('profile', () => {
  it('accepts a complete profile', () => {
    expect(validateProfile(VALID_PROFILE)).toEqual({});
  });

  it('reports every missing field', () => {
    expect(Object.keys(validateProfile({}))).toEqual([
      'name',
      'age',
      'grade',
      'school',
      'educationBoard',
    ]);
  });

  it.each(['4', '100', 'abc', '1.5', '-3'])('rejects the age %p', age => {
    expect(validateProfile({ ...VALID_PROFILE, age }).age).toMatch(
      /between 5 and 99/,
    );
  });

  it.each(['0', '14'])('rejects the grade %p', grade => {
    expect(validateProfile({ ...VALID_PROFILE, grade }).grade).toMatch(
      /between 1 and 13/,
    );
  });

  it('rejects names that are only spaces', () => {
    expect(validateProfile({ ...VALID_PROFILE, name: '   ' }).name).toBe(
      'Enter your name.',
    );
  });
});

describe('sign-up', () => {
  it('adds email and password checks to the profile checks', () => {
    const errors = validateSignUp({
      ...VALID_PROFILE,
      email: 'nope',
      password: 'short',
    });
    expect(Object.keys(errors)).toEqual(['email', 'password']);
  });
});
