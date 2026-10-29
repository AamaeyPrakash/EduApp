// MathJax reads navigator.appVersion and navigator.userAgent as soon as it loads,
// whenever there's a `window`. React Native has a window and a navigator but neither
// property, so MathJax would crash on start. Empty strings let it carry on (it then
// treats the platform as unknown, which only affects how it builds file paths).
// Imported by engine.js before any MathJax module.
const nav = typeof window !== 'undefined' ? window.navigator : undefined;
if (nav) {
  for (const name of ['appVersion', 'userAgent']) {
    if (typeof nav[name] !== 'string') {
      try {
        Object.defineProperty(nav, name, {
          value: '',
          configurable: true,
          enumerable: true,
        });
      } catch {
        // A read-only navigator already has real values.
      }
    }
  }
}
