module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module:react-native-dotenv',
      {
        // Values from .env are inlined at build time. After editing .env, restart Metro
        // with `npm start -- --reset-cache` so the new values are picked up.
        moduleName: '@env',
        path: '.env',
        allowUndefined: true,
        quiet: true,
      },
    ],
  ],
};
