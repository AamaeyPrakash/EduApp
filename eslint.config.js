const { fixupConfigRules } = require('@eslint/compat');
const globals = require('globals');
const reactNativeConfig = require('@react-native/eslint-config/flat');

module.exports = [
  {
    ignores: ['android/', 'ios/', 'vendor/', 'coverage/'],
  },
  // React Native's config includes plugins written for ESLint 8 (e.g. ft-flow);
  // fixupConfigRules gives them the APIs ESLint 9 removed.
  ...fixupConfigRules(reactNativeConfig),
  {
    // Jest setup and test helpers.
    files: ['jest.setup.js', '__tests__/**/*.js'],
    languageOptions: {
      globals: globals.jest,
    },
  },
  {
    // Plain Node.js code: Appwrite Functions and maintenance scripts.
    files: ['appwrite/functions/**/*.js', 'scripts/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node, ...globals.es2021 },
    },
  },
];
