module.exports = {
  root: true,
  extends: '@react-native',
  overrides: [
    {
      // Plain Node.js code: Appwrite Functions and maintenance scripts.
      files: ['appwrite/functions/**/*.js', 'scripts/**/*.mjs'],
      env: { node: true, es2022: true },
      parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
    },
  ],
};
