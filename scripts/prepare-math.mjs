#!/usr/bin/env node
// Works out the size of every formula in the bundled questions and saves them to
// src/math/sizes.json, so the app can keep the right amount of space for a formula
// before it has drawn it (text doesn't jump around as maths appears). Run it after
// editing questions; `npm run validate:content` says when it's out of date.
//
// Usage: npm run prepare:math
import { writeFileSync } from 'node:fs';
import {
  computeSizes,
  createNodeMathEngine,
  SIZES_FILE,
} from './math-tools.mjs';

const { engine } = createNodeMathEngine();
const sizes = computeSizes(engine);
writeFileSync(SIZES_FILE, `${JSON.stringify(sizes)}\n`);
console.log(
  `Saved the sizes of ${Object.keys(sizes).length} formulas to ${SIZES_FILE}`,
);
