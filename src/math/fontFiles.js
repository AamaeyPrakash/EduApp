// The font's on-demand files that the app bundles: maths symbols, arrows, accents and
// maths alphabets (script, fraktur, double-struck, sans-serif, monospace...), which
// tutor replies may use. The bundled questions only need the font's base set. Other
// scripts (Greek and Latin text letters, Cyrillic...) and bold or italic sans-serif
// are left out to keep the app small; their characters are drawn as plain text in the
// system font. Each require is written out so the bundler can find it.
const FILES = {
  accents: () =>
    require('@mathjax/mathjax-newcm-font/cjs/svg/dynamic/accents.js'),
  arrows: () =>
    require('@mathjax/mathjax-newcm-font/cjs/svg/dynamic/arrows.js'),
  calligraphic: () =>
    require('@mathjax/mathjax-newcm-font/cjs/svg/dynamic/calligraphic.js'),
  'double-struck': () =>
    require('@mathjax/mathjax-newcm-font/cjs/svg/dynamic/double-struck.js'),
  fraktur: () =>
    require('@mathjax/mathjax-newcm-font/cjs/svg/dynamic/fraktur.js'),
  marrows: () =>
    require('@mathjax/mathjax-newcm-font/cjs/svg/dynamic/marrows.js'),
  math: () => require('@mathjax/mathjax-newcm-font/cjs/svg/dynamic/math.js'),
  monospace: () =>
    require('@mathjax/mathjax-newcm-font/cjs/svg/dynamic/monospace.js'),
  mshapes: () =>
    require('@mathjax/mathjax-newcm-font/cjs/svg/dynamic/mshapes.js'),
  'sans-serif': () =>
    require('@mathjax/mathjax-newcm-font/cjs/svg/dynamic/sans-serif.js'),
  script: () =>
    require('@mathjax/mathjax-newcm-font/cjs/svg/dynamic/script.js'),
  shapes: () =>
    require('@mathjax/mathjax-newcm-font/cjs/svg/dynamic/shapes.js'),
  symbols: () =>
    require('@mathjax/mathjax-newcm-font/cjs/svg/dynamic/symbols.js'),
  variants: () =>
    require('@mathjax/mathjax-newcm-font/cjs/svg/dynamic/variants.js'),
};

export const BUNDLED_FONT_FILES = Object.keys(FILES);

export function loadFontFile(name) {
  const load = FILES[name];
  if (!load) {
    return false;
  }
  load();
  return true;
}
