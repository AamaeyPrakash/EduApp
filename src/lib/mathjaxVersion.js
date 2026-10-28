// mathjax-full (used by react-native-math-view) works out its own version with
// eval('require') unless a global PACKAGE_VERSION is defined. React Native has no global
// require, so that throws at startup. Defining the global first skips the Node-only path,
// so this must be imported before react-native-math-view.
global.PACKAGE_VERSION = require('mathjax-full/package.json').version;
