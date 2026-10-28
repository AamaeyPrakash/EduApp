#!/usr/bin/env node
// Checks the bundled question data the way the app renders it:
//   - every question has the fields the screens need
//   - every $...$ / $$...$$ formula parses with MathJax (the renderer the app uses)
//   - no TeX or JSON-escape debris is left in the plain text around formulas
// Usage: npm run validate:content   (exits with code 1 when errors are found)

import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseMathContent } from '../src/lib/mathContent.js';

const require = createRequire(import.meta.url);
const { mathjax } = require('mathjax-full/js/mathjax.js');
const { TeX } = require('mathjax-full/js/input/tex.js');
const { SVG } = require('mathjax-full/js/output/svg.js');
const { liteAdaptor } = require('mathjax-full/js/adaptors/liteAdaptor.js');
const { RegisterHTMLHandler } = require('mathjax-full/js/handlers/html.js');
const { AllPackages } = require('mathjax-full/js/input/tex/AllPackages.js');

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const readJson = file =>
  JSON.parse(readFileSync(join(root, 'src/mathTopics', file), 'utf8'));

RegisterHTMLHandler(liteAdaptor());
let texError = null;
const tex = new TeX({
  packages: AllPackages,
  formatError: (jax, error) => {
    texError = error;
    return jax.formatError(error);
  },
});
const document = mathjax.document('', {
  InputJax: tex,
  OutputJax: new SVG({ fontCache: 'none' }),
});

function texProblem(math, display) {
  texError = null;
  try {
    document.convert(math, { display });
  } catch (error) {
    return error.message;
  }
  return texError ? texError.message : null;
}

const errors = [];
const warnings = [];
let formulaCount = 0;

// eslint-disable-next-line no-control-regex -- finding these is the point
const CONTROL_CHARACTERS = /[\x00-\x08\x0b\x0c\x0e-\x1f\r\t]/;
// UTF-8 text that was decoded as Windows-1252 somewhere along the way, e.g. "â‚¹" for "₹".
const MOJIBAKE = /â€|â‚|Ã.|Â./;
// The app shows plain text as is, so TeX written outside $...$ appears raw on screen.
const TEXT_DEBRIS = [
  [/\\\$/, 'escaped dollar sign'],
  [/^\s*\\\\\s*$/, 'stray "\\\\" line break'],
  [/\\[A-Za-z]+|\\[{}()[\]]|\\ /, 'TeX outside $...$'],
];
// "\\frac" inside a formula is a line break followed by the word "frac".
const DOUBLE_ESCAPED =
  /\\\\(?:frac|sqrt|left|right|cos|sin|tan|log|prime|cdot|times|int)\b/;
const INCOMPLETE_QUESTION = /(\.\.\.|…|:|\bgiven by)\s*$/;

function checkContent(where, content) {
  if (CONTROL_CHARACTERS.test(content)) {
    errors.push(`${where}: contains control characters (broken JSON escapes)`);
  }
  if (MOJIBAKE.test(content)) {
    errors.push(`${where}: contains garbled characters such as "â‚¹"`);
  }
  for (const block of parseMathContent(content)) {
    const formulas =
      block.type === 'display'
        ? [[block.math, true]]
        : block.tokens
            .filter(token => token.type === 'math')
            .map(token => [token.value, false]);
    for (const [math, display] of formulas) {
      formulaCount += 1;
      const problem = texProblem(math, display);
      if (problem) {
        errors.push(`${where}: ${problem} in "${math.slice(0, 80)}"`);
      }
      if (DOUBLE_ESCAPED.test(math)) {
        errors.push(`${where}: double-escaped TeX in "${math.slice(0, 80)}"`);
      }
    }
    if (block.type === 'line') {
      const text = block.tokens
        .filter(token => token.type === 'text')
        .map(token => token.value)
        .join(' ');
      for (const [pattern, label] of TEXT_DEBRIS) {
        if (pattern.test(text)) {
          errors.push(`${where}: ${label}: "${text.trim().slice(0, 80)}"`);
        }
      }
    }
  }
}

const cbse = readJson('CBSEMath12fc_fixed.json');
const seenQuestions = new Map();
cbse.forEach((question, index) => {
  const where = `CBSE #${index} (${question.Title})`;
  for (const field of ['Title', 'Example', 'Solution']) {
    if (typeof question[field] !== 'string' || !question[field].trim()) {
      errors.push(`${where}: missing ${field}`);
    }
  }
  if (INCOMPLETE_QUESTION.test(question.Example || '')) {
    warnings.push(`${where}: the question looks cut off`);
  }
  // The next NCERT example running on into this solution ("... Example 8 Show
  // that ..."); references like "(see Example 2)" are fine.
  if (
    /(?<![(]|see |In )\bExample\s+\d+\s+(?=[A-Z])/.test(question.Solution || '')
  ) {
    errors.push(`${where}: the solution runs on into another example`);
  }
  const key = `${question.Title}\n${question.Example}`;
  if (seenQuestions.has(key)) {
    warnings.push(`${where}: duplicate of #${seenQuestions.get(key)}`);
  } else {
    seenQuestions.set(key, index);
  }
  if ('FinalAnswer' in question) {
    errors.push(`${where}: use Final_answer instead of FinalAnswer`);
  }
  if (question.chapter !== undefined && question.chapter !== question.Title) {
    warnings.push(`${where}: chapter "${question.chapter}" differs from Title`);
  }
  for (const field of ['Example', 'Solution', 'Final_answer']) {
    if (typeof question[field] === 'string') {
      checkContent(`${where} ${field}`, question[field]);
    }
  }
});

for (const file of ['IBMathAATopicData.json', 'IBMathAITopicData.json']) {
  readJson(file).forEach((topic, topicIndex) => {
    const where = `${file} topic #${topicIndex}`;
    for (const field of ['topicNumber', 'topic', 'level']) {
      if (typeof topic[field] !== 'string' || !topic[field].trim()) {
        errors.push(`${where}: missing ${field}`);
      }
    }
    if (!Array.isArray(topic.questions) || topic.questions.length === 0) {
      errors.push(`${where}: has no questions`);
      return;
    }
    topic.questions.forEach((question, questionIndex) => {
      for (const field of ['question', 'answer', 'working']) {
        if (typeof question[field] !== 'string' || !question[field].trim()) {
          errors.push(`${where} question #${questionIndex}: missing ${field}`);
        }
      }
    });
  });
}

for (const warning of warnings) {
  console.warn(`warning  ${warning}`);
}
for (const error of errors) {
  console.error(`error    ${error}`);
}
console.log(
  `\nChecked ${cbse.length} CBSE questions and ${formulaCount} formulas: ` +
    `${errors.length} error(s), ${warnings.length} warning(s).`,
);
process.exitCode = errors.length > 0 ? 1 : 0;
