import { useEffect, useReducer } from 'react';
import { createMathEngine, sizeKey } from './engine';
import { loadFontFile } from './fontFiles';
import preparedSizes from './sizes.json';

// Converting a formula takes a few milliseconds, so formulas are converted a moment
// after they first appear, a few at a time, and the results are kept for reuse.

const engine = createMathEngine({ loadFontFile });

const cache = new Map(); // key → layout, or { error }
const MAX_CACHED = 2000;
const waiting = new Map(); // key → listeners
const queue = [];
// Each round of conversions stops after this long so the app stays responsive.
const BUDGET_MS = 12;
let scheduled = false;
let synchronous = false;

// Tests convert formulas straight away instead of a moment later.
export function setSynchronousMath(value) {
  synchronous = value;
}

const mathKey = (tex, { display = false, widthEm, block = false } = {}) =>
  `${display ? 'D' : block ? 'B' : 'I'}${widthEm ? `@${widthEm}` : ''}|${tex}`;

// The size of a bundled formula, worked out when the app was built (see
// scripts/prepare-math.mjs), so space can be kept for it before it's drawn: in ems,
// { width, height, depth }, and for inline maths also the size of each of its pieces,
// { pieces: [{ width, height, depth, gap }] }. Null for other formulas.
export function preparedSize(tex, display) {
  const size = preparedSizes[sizeKey(tex, display)];
  if (!size) {
    return null;
  }
  if (display) {
    return { width: size[0], height: size[1], depth: size[2] };
  }
  const pieces = size.map(([width, height, depth, gap]) => ({
    width,
    height,
    depth,
    gap,
  }));
  const depth = Math.max(...pieces.map(piece => piece.depth));
  return {
    width: pieces.reduce((sum, piece) => sum + piece.width + piece.gap, 0),
    height: Math.max(...pieces.map(piece => piece.height - piece.depth)) + depth,
    depth,
    pieces,
  };
}

// A layout that has already been converted, without converting it.
export function cachedLayout(tex, options) {
  const layout = cache.get(mathKey(tex, options));
  return layout && !layout.error ? layout : undefined;
}

function convert({ key, tex, options }) {
  let result;
  try {
    result = engine.convert(tex, options);
  } catch (error) {
    result = { error };
  }
  if (cache.size >= MAX_CACHED) {
    cache.delete(cache.keys().next().value);
  }
  cache.set(key, result);
  return result;
}

function work() {
  scheduled = false;
  const start = Date.now();
  while (queue.length > 0 && Date.now() - start < BUDGET_MS) {
    const job = queue.shift();
    const listeners = waiting.get(job.key);
    // Skip formulas nobody is showing any more.
    if (!listeners) {
      continue;
    }
    if (!cache.has(job.key)) {
      convert(job);
    }
    waiting.delete(job.key);
    listeners.forEach(listener => listener());
  }
  if (queue.length > 0) {
    schedule();
  }
}

function schedule() {
  if (!scheduled) {
    scheduled = true;
    setTimeout(work, 0);
  }
}

// The layout for a formula (see engine.js), or { error } when the TeX doesn't parse,
// or undefined while it's being converted. Options are the engine's: `display`,
// `block` and `widthEm` (to break display or block maths into lines to fit).
export function useMathLayout(
  tex,
  { display = false, widthEm, block = false } = {},
) {
  const options = { display, widthEm, block };
  const key = mathKey(tex, options);
  const [, rerender] = useReducer(count => count + 1, 0);
  if (!cache.has(key) && synchronous) {
    convert({ key, tex, options });
  }
  useEffect(() => {
    if (cache.has(key)) {
      return undefined;
    }
    let listeners = waiting.get(key);
    if (!listeners) {
      listeners = new Set();
      waiting.set(key, listeners);
      queue.push({ key, tex, options: { display, widthEm, block } });
      schedule();
    }
    listeners.add(rerender);
    return () => {
      listeners.delete(rerender);
      if (listeners.size === 0 && waiting.get(key) === listeners) {
        waiting.delete(key);
      }
    };
  }, [key, tex, display, widthEm, block]);
  return cache.get(key);
}
