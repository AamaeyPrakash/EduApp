#!/usr/bin/env node
// Repairs src/mathTopics/CBSEMath12fc_fixed.json in place. It undoes damage left by
// earlier conversions (PDF extraction, JSON escaping and a bulk `$$` → `$$\displaystyle`
// replacement) without rewording any content. Safe to run more than once; check the
// result with `npm run validate:content`.
//
// Usage: node scripts/repair-cbse-data.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const FILE = join(
  dirname(fileURLToPath(import.meta.url)),
  '../src/mathTopics/CBSEMath12fc_fixed.json',
);
const TEXT_FIELDS = ['Example', 'Solution', 'Final_answer'];

// --- 1. JSON escapes that swallowed TeX commands ---------------------------------
// e.g. "\frac" written into JSON unescaped became a form feed followed by "rac".
const CONTROL_CHARACTERS = [
  // eslint-disable-next-line no-control-regex -- finding these is the point
  [/\x08/g, '\\b'],
  [/\f/g, '\\f'],
  [/\r/g, '\\r'],
  [/\t/g, '\\t'],
  [/\v/g, '\\v'],
];
// ...and "\neq" became a line break followed by "eq".
const NEWLINE_COMMANDS = [
  /\n(?=eq(?![A-Za-z]))/g,
  /\n(?=otin(?![A-Za-z]))/g,
  /\n(?=ot\\)/g,
  /(?<=\{d)\n(?=u\})/g,
];

function repairEscapes(text) {
  let result = text;
  for (const [pattern, replacement] of CONTROL_CHARACTERS) {
    result = result.replace(pattern, replacement);
  }
  for (const pattern of NEWLINE_COMMANDS) {
    result = result.replace(pattern, '\\n');
  }
  return result;
}

// --- 2. One-off fixes, checked so they never apply silently to changed data -------
const MANUAL_FIXES = [
  {
    index: 71,
    field: 'Solution',
    from: '(i)\\Using the given relation $^nP_{5} =42 $ $^nP_{3}$, we derive:\\$\\displaystyle n(n - 1)',
    to: '(i) Using the given relation $^nP_{5} = 42 \\cdot {}^nP_{3}$, we derive: $\\displaystyle n(n - 1)',
  },
  {
    index: 248,
    field: 'Solution',
    from: '\\end{aligned}\n$$\\$\\$\n\\text{So}\n\\$\\$\nAgain\n',
    to: '\\end{aligned}\n$$\nAgain\n',
  },
  {
    index: 294,
    field: 'Solution',
    from: '+6 x+5\n$\\left{\\begin{array}{l}',
    to: '+6 x+5$\n$$\\left\\{\\begin{array}{l}',
  },
  {
    index: 294,
    field: 'Solution',
    from: '\\end{array}\n\\]\\textbackslash right.\n\\$\\$\n',
    to: '\\end{array}\\right.\n$$\n',
  },
  {
    index: 303,
    field: 'Solution',
    from: '\\left\\{\\begin{array}{l}}',
    to: '\\left\\{\\begin{array}{l}',
  },
  {
    index: 269,
    field: 'Final_answer',
    from: '\\end{array}\\right]\\end{aligned}$$',
    to: '\\end{array}\\right]$$',
  },
  {
    // This "final answer" was a copy of the second half of the solution.
    index: 297,
    field: 'Final_answer',
    replace: 'The distance of ${R}$ from ${A}$ on ${AB}$ is ${AR}=x=10 {~m}$.',
  },
];

// --- 3. Display-math delimiters --------------------------------------------------
// The bulk replacement turned an opening "$$" into "$\displaystyle $" in places, and
// left "\displaystyle" in plain text after closing delimiters.
function repairDisplayOpenings(text) {
  return text.replace(/\$\\displaystyle\s*\$/g, '$$$$\\displaystyle ');
}

// Splits text into plain text and $inline$ / $$display$$ math, the way TeX reads it.
function splitMath(text) {
  const parts = [];
  let mode = 'text';
  let start = 0;
  let i = 0;
  const push = (type, end) =>
    parts.push({ type, value: text.slice(start, end) });
  while (i < text.length) {
    const char = text[i];
    if (char === '\\') {
      i += 2;
      continue;
    }
    if (char === '$') {
      const double = text[i + 1] === '$';
      if (mode === 'text') {
        push('text', i);
        mode = double ? 'display' : 'inline';
        i += double ? 2 : 1;
        start = i;
        continue;
      }
      if (mode === 'display' && double) {
        push('display', i);
        mode = 'text';
        i += 2;
        start = i;
        continue;
      }
      if (mode === 'inline') {
        push('inline', i);
        mode = 'text';
        i += 1;
        start = i;
        continue;
      }
    }
    i += 1;
  }
  if (mode === 'text') {
    push('text', text.length);
  } else {
    // Unterminated formula: keep it exactly as written.
    const opener = mode === 'display' ? '$$' : '$';
    parts.push({ type: 'text', value: opener + text.slice(start) });
  }
  return parts;
}

function joinMath(parts) {
  return parts
    .map(({ type, value }) =>
      type === 'display'
        ? `$$${value}$$`
        : type === 'inline'
        ? `$${value}$`
        : value,
    )
    .join('');
}

// --- 4. LaTeX layout commands in plain text --------------------------------------
// Tables were extracted as text-mode `tabular`, which the math renderer can't draw.
// Rewrite them as display-math arrays (cell text wrapped in \text{}).
function tableCell(cell) {
  return splitMath(cell.trim())
    .map(({ type, value }) => {
      if (type !== 'text') {
        return value.trim();
      }
      // Spaces stay inside \text{} because math mode drops spaces between parts.
      const words = value.replace(/\s+/g, ' ');
      return words.trim()
        ? `\\text{${words.replace(/([%#&_{}])/g, '\\$1')}}`
        : '';
    })
    .filter(Boolean)
    .join(' ');
}

function repairTables(text) {
  return text.replace(
    /(?:\\begin\{center\}\s*)?\\begin\{tabular\}\{([^}]*)\}([\s\S]*?)\\end\{tabular\}(?:\s*\\end\{center\})?/g,
    (match, columns, body) => {
      const rows = body
        .split(/\\\\/)
        .map(row => row.trim())
        .filter(Boolean)
        .map(row => {
          const lines = row.split('\n').map(line => line.trim());
          return lines
            .map(line =>
              line === '\\hline'
                ? line
                : line.split('&').map(tableCell).join(' & '),
            )
            .join(' ');
        });
      return `$$\\begin{array}{${columns}}\n${rows.join(
        ' \\\\\n',
      )}\n\\end{array}$$`;
    },
  );
}

function repairPlainText(value) {
  return value
    .replace(/\\displaystyle\s*/g, '')
    .replace(/\\(?:begin|end)\{(?:center|itemize)\}/g, '')
    .replace(/\\item\s*/g, '')
    .replace(/\\section\*?\{[^}]*\}/g, '')
    .replace(/[ \t]*\\\\[ \t]*/g, '\n');
}

// Inside matrices and aligned equations, a lone "\ " is a row break that lost one of
// its two backslashes.
function repairMath(part) {
  if (part.type === 'inline') {
    // MathJax can't typeset ₹ in math mode; amounts like "$₹ 120$" become plain text.
    const amount = part.value.match(/^\s*₹\s*([\d,.]+)\s*$/);
    if (amount) {
      return { type: 'text', value: `₹${amount[1]}` };
    }
  }
  if (/\\begin\{/.test(part.value) && part.value.includes('&')) {
    return { ...part, value: part.value.replace(/(?<!\\)\\ (?=\S)/g, '\\\\ ') };
  }
  return part;
}

function repairText(text) {
  let result = repairTables(repairDisplayOpenings(repairEscapes(text)));
  result = joinMath(
    splitMath(result).map(part =>
      part.type === 'text'
        ? { ...part, value: repairPlainText(part.value) }
        : repairMath(part),
    ),
  );
  return result
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// --- 5. Questions whose worked solution was merged into the question text ---------
const SPLITS = {
  217: {
    question: /^([\s\S]*?is both one-one and onto\.)[\s\S]*?Fig 1\.4 Solution /,
  },
  309: { question: /^([\s\S]*?find \$A\+B\$)\n(?=Since)/ },
  317: { question: /^([\s\S]*?\{AB\}\s*\\neq \{BA\} \.\n\$\$)\n(?=Thus)/ },
};

function splitQuestion(entry, index) {
  if (entry.Solution.trim()) {
    return;
  }
  if (index === 447 && entry.Example.startsWith('Solve $5 x-3<3 x+1$ when')) {
    entry.Solution = entry.Example.slice(
      entry.Example.indexOf('We have, $5 x-3<3 x+1$'),
    )
      .replace('\nor\n(ii) $x$ is a real number.\n', '\nor\n')
      .trim();
    entry.Example =
      'Solve $5 x-3<3 x+1$ when\n(i) $x$ is an integer,\n(ii) $x$ is a real number.';
    return;
  }
  const special = SPLITS[index];
  if (special) {
    const match = entry.Example.match(special.question);
    if (!match) {
      throw new Error(`Could not split question #${index}`);
    }
    entry.Solution = entry.Example.slice(match[0].length).trim();
    entry.Example = match[1].trim();
    return;
  }
  const marker = entry.Example.match(
    /\s*(?:\\section\{Solution\}|\bSolution\b)\s*/,
  );
  if (!marker) {
    throw new Error(
      `Question #${index} has no solution and no "Solution" marker`,
    );
  }
  entry.Solution = entry.Example.slice(marker.index + marker[0].length).trim();
  entry.Example = entry.Example.slice(0, marker.index).trim();
}

// --- 6. Final answers stored as numbers or objects under "FinalAnswer" ------------
function finalAnswerText(value) {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  if (typeof value === 'object') {
    return Object.entries(value)
      .map(([key, part]) => `${key}: $${String(part).replace(/^\/\//, '\\')}$`)
      .join(', ');
  }
  return String(value);
}

// --- Run --------------------------------------------------------------------------
const data = JSON.parse(readFileSync(FILE, 'utf8'));

// Escape damage is repaired first, so the manual fixes below can be written (and
// re-checked on later runs) against clean text.
data.forEach(entry => {
  if ('FinalAnswer' in entry) {
    entry.Final_answer =
      entry.Final_answer || finalAnswerText(entry.FinalAnswer);
    delete entry.FinalAnswer;
  }
  for (const field of TEXT_FIELDS) {
    entry[field] = repairEscapes(entry[field] || '');
  }
});

for (const fix of MANUAL_FIXES) {
  const entry = data[fix.index];
  const current = entry[fix.field];
  if (fix.replace !== undefined) {
    entry[fix.field] = fix.replace;
  } else if (current.includes(fix.from)) {
    // A replacer function keeps "$$" literal (in a replacement string it means "$").
    entry[fix.field] = current.replace(fix.from, () => fix.to);
  } else if (!current.includes(fix.to)) {
    throw new Error(
      `Manual fix for #${fix.index} ${fix.field} no longer matches`,
    );
  }
}

data.forEach((entry, index) => {
  splitQuestion(entry, index);
  for (const field of TEXT_FIELDS) {
    entry[field] = repairText(entry[field] || '');
  }
  if (typeof entry.chapter === 'string') {
    entry.chapter = entry.Title;
  }
});

writeFileSync(FILE, `${JSON.stringify(data, null, 2)}\n`);
console.log(`Repaired ${data.length} questions in ${FILE}`);
