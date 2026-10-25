module.exports = {
  preset: '@react-native/jest-preset',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    // Packages that ship untranspiled code: React Native libraries, React Navigation
    // and the ESM-only helpers react-native-math-view depends on.
    'node_modules/(?!((jest-)?react-native(-[a-z-]+)?|@react-native(-community)?|@react-navigation|hast-util-[a-z-]+|hastscript|comma-separated-tokens|space-separated-tokens|property-information|css-selector-parser)/)',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/android/',
    '/ios/',
    '/__tests__/helpers/',
  ],
};
