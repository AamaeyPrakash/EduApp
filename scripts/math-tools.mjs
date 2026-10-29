// Helpers shared by the content scripts: the app's maths engine running in Node, and
// every piece of text in the bundled questions.
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createMathEngine, sizeKey } from '../src/math/engine.js';
import { BUNDLED_FONT_FILES } from '../src/math/fontFiles.js';
import { parseMathContent } from '../src/lib/mathContent.js';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const SIZES_FILE = join(ROOT, 'src/math/sizes.json');
const require = createRequire(import.meta.url);

export const readJson = file =>
  JSON.parse(readFileSync(join(ROOT, 'src/mathTopics', file), 'utf8'));

// The same engine as the app, with the same font files available, so a formula that
// passes here draws the same way on a phone. `missingFontFiles` collects files a
// formula needed that the app doesn't bundle.
export function createNodeMathEngine() {
  const missingFontFiles = new Set();
  const engine = createMathEngine({
    loadFontFile: name => {
      if (!BUNDLED_FONT_FILES.includes(name)) {
        missingFontFiles.add(name);
        return false;
      }
      require(`@mathjax/mathjax-newcm-font/cjs/svg/dynamic/${name}.js`);
      return true;
    },
  });
  return { engine, missingFontFiles };
}

// Every text field of every bundled question: { where, content }.
export function contentFields() {
  const fields = [];
  readJson('CBSEMath12fc_fixed.json').forEach((question, index) => {
    for (const field of ['Example', 'Solution', 'Final_answer']) {
      if (typeof question[field] === 'string') {
        fields.push({
          where: `CBSE #${index} (${question.Title}) ${field}`,
          content: question[field],
        });
      }
    }
  });
  for (const file of ['IBMathAATopicData.json', 'IBMathAITopicData.json']) {
    readJson(file).forEach((topic, topicIndex) => {
      (topic.questions || []).forEach((question, questionIndex) => {
        for (const field of ['question', 'answer', 'working']) {
          if (typeof question[field] === 'string') {
            fields.push({
              where: `${file} topic #${topicIndex} question #${questionIndex} ${field}`,
              content: question[field],
            });
          }
        }
      });
    });
  }
  return fields;
}

// The formulas in some text: [{ tex, display }].
export function formulasIn(content) {
  return parseMathContent(content).flatMap(block =>
    block.type === 'display'
      ? [{ tex: block.math, display: true }]
      : block.tokens
          .filter(token => token.type === 'math')
          .map(token => ({ tex: token.value, display: false })),
  );
}

const round = value => Math.round(value * 1000) / 1000;

// The size in ems of every formula in the questions, by sizeKey: [width, height,
// depth] for display maths, and [[width, height, depth, gap], ...] for the pieces of
// inline maths. Sorted so the file changes only where the content does.
export function computeSizes(engine) {
  const sizes = {};
  for (const { content } of contentFields()) {
    for (const { tex, display } of formulasIn(content)) {
      const key = sizeKey(tex, display);
      if (!(key in sizes)) {
        try {
          const layout = engine.convert(tex, { display });
          sizes[key] = display
            ? [round(layout.width), round(layout.height), round(layout.depth)]
            : layout.pieces.map(piece => [
                round(piece.width),
                round(piece.height),
                round(piece.depth),
                round(piece.gap),
              ]);
        } catch {
          // Reported by the content check.
        }
      }
    }
  }
  return Object.fromEntries(
    Object.keys(sizes)
      .sort()
      .map(key => [key, sizes[key]]),
  );
}
