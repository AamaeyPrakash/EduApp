module.exports = {
  dependencies: {
    // The app renders math with react-native-math-view's JS/SVG renderer on both
    // platforms (see src/components/MathText.js). Its Android native view relies on
    // legacy-architecture shadow nodes that the New Architecture cannot run, so the
    // native code is excluded from autolinking.
    'react-native-math-view': {
      platforms: {
        android: null,
        ios: null,
      },
    },
  },
};
