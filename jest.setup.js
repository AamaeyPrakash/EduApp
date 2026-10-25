/* eslint-env jest */

jest.mock('react-native-safe-area-context', () => {
  const { useContext } = require('react');
  const mock = require('react-native-safe-area-context/jest/mock').default;
  const { insets, frame } = mock.initialWindowMetrics;
  // Plain functions rather than the library's jest.fn()s, so tests can call
  // jest.resetAllMocks() without wiping the hooks React Navigation relies on.
  return {
    ...mock,
    useSafeAreaInsets: () => useContext(mock.SafeAreaInsetsContext) ?? insets,
    useSafeAreaFrame: () => useContext(mock.SafeAreaFrameContext) ?? frame,
  };
});

// Formulas are drawn as SVG by react-native-math-view; tests only need the TeX.
jest.mock('./src/components/MathView', () => {
  const { Text } = require('react-native');
  return function MockMathView({ math }) {
    return <Text testID="math">{math}</Text>;
  };
});
