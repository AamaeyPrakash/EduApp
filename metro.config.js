const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

// MathJax 4's CommonJS build refers to some of its files through "#" subpath imports
// (e.g. "#default-font/svg/default.js"), declared in its cjs/package.json. Node and
// Jest understand them; Metro doesn't, so they're mapped here from MathJax's own table.
const MATHJAX_CJS = path.dirname(
  require.resolve('@mathjax/src/cjs/package.json'),
);
const MATHJAX_IMPORTS = Object.entries(
  require('@mathjax/src/cjs/package.json').imports,
).map(([from, to]) => [from.replace(/\*$/, ''), to.replace(/\*$/, '')]);

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    resolveRequest: (context, moduleName, platform) => {
      if (
        moduleName.startsWith('#') &&
        context.originModulePath.startsWith(MATHJAX_CJS)
      ) {
        const match = MATHJAX_IMPORTS.find(([from]) =>
          moduleName.startsWith(from),
        );
        if (match) {
          return context.resolveRequest(
            context,
            match[1] + moduleName.slice(match[0].length),
            platform,
          );
        }
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
