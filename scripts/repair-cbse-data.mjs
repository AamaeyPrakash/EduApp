#!/usr/bin/env node
// Repairs src/mathTopics/CBSEMath12fc_fixed.json in place. It undoes damage left by
// earlier conversions (PDF extraction, JSON escaping and a bulk `$$` → `$$\displaystyle`
// replacement): broken escapes and delimiters, TeX left outside $...$, and questions
// that lost their statement or carried another question's solution (restored from the
// NCERT textbook examples they come from). Safe to run more than once; check the result
// with `npm run validate:content`.
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
  // UTF-8 "₹" that was decoded as Windows-1252.
  return result.replace(/â‚¹/g, '₹');
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
  {
    index: 51,
    field: 'Solution',
    from: '$\nx^{2}=4ay\\;\\Longrightarrow\\;x^{2}=8y.\n\\]',
    to: '$$x^{2}=4ay\\;\\Longrightarrow\\;x^{2}=8y.$$',
  },
  {
    // Part (ii) had lost its "= 5/3"; the solution solves n/(n-4) = 5/3.
    index: 71,
    field: 'Example',
    replace:
      'Find the value of $n$ such that\n(i) $^nP_{5} = 42 \\cdot {}^nP_{3},\\ n>4$\n(ii) $\\frac{^nP_{4}}{^{n-1}P_{4}} = \\frac{5}{3},\\ n>4$',
  },
  {
    index: 71,
    field: 'Solution',
    from: '\\(ii)\\From the equation $\\frac{^nP_{4}}{^(n-1)P_{4}}$, we derive',
    to: '\n(ii) From the equation $\\frac{^nP_{4}}{^{n-1}P_{4}} = \\frac{5}{3}$, we derive',
  },
  {
    index: 121,
    field: 'Example',
    from: '\\{$\\displaystyle \\frac{1}{2},\\frac{2}{3},\\frac{3}{4},\\frac{4}{5},\\frac{5}{6},\\frac{6}{7}$\\}',
    to: '$\\left\\{\\frac{1}{2},\\frac{2}{3},\\frac{3}{4},\\frac{4}{5},\\frac{5}{6},\\frac{6}{7}\\right\\}$',
  },
  {
    // "\le" had lost its "l", and the upper limit is 6 (the last member is 6/7).
    index: 121,
    field: 'Solution',
    from: '\\{$x:x = \\frac{n}{n+1} $ , where n is a natural number and $1 \\e n \\e 7$\\}.',
    to: '$\\{x : x = \\frac{n}{n+1}$, where $n$ is a natural number and $1 \\le n \\le 6\\}$.',
  },
  {
    index: 121,
    field: 'Final_answer',
    replace:
      '$\\left\\{\\frac{1}{2},\\frac{2}{3},\\frac{3}{4},\\frac{4}{5},\\frac{5}{6},\\frac{6}{7}\\right\\} = \\{x : x = \\frac{n}{n+1}$, where $n$ is a natural number and $1 \\le n \\le 6\\}$',
  },
  { index: 122, field: 'Example', from: '$x: x$is', to: '$x: x$ is' },
  {
    index: 124,
    field: 'Solution',
    from: 'Since B = \\phi but',
    to: 'Since $B = \\phi$ but',
  },
  { index: 125, field: 'Example', from: 'n^2 \\eq 4', to: 'n^2 \\leq 4' },
  {
    index: 132,
    field: 'Example',
    from: 'X =\n{Ram, Geeta, Akbar\n}',
    to: 'X = {Ram, Geeta, Akbar}',
  },
  {
    index: 132,
    field: 'Example',
    from: 'Y =\n{Geeta, David, Ashok\n}',
    to: 'Y = {Geeta, David, Ashok}',
  },
  {
    index: 132,
    field: 'Example',
    from: '\\(X\ncap Y\\)',
    to: '$X \\cap Y$',
  },
  {
    index: 132,
    field: 'Solution',
    all: true,
    from: '\\(X\ncap Y\\)',
    to: '$X \\cap Y$',
  },
  {
    index: 132,
    field: 'Solution',
    from: '$X \\cap Y$ =\n{Geeta\n}.',
    to: '$X \\cap Y$ = {Geeta}.',
  },
  {
    index: 257,
    field: 'Final_answer',
    from: '(iii) \\frac{2^{x+1} \\log 2}{1+4^x}',
    to: '(iii) $\\frac{2^{x+1} \\log 2}{1+4^x}$',
  },
  {
    // The function was missing from the question.
    index: 292,
    field: 'Example',
    replace:
      'Find all the points of local maxima and local minima of the function $f$ given by $f(x)=2 x^{3}-6 x^{2}+6 x+5$.',
  },
  {
    // Drop the textbook's lead-in to the next section.
    index: 292,
    field: 'Solution',
    apply: text =>
      text.replace(
        /\nRemark One may note[\s\S]*$/,
        '\nSince $f^{\\prime}(x)$ never changes its sign on $\\mathbf{R}$, the graph of $f$ has no turning points, so $f$ has no point of local maxima or local minima.',
      ),
  },
  {
    index: 292,
    field: 'Final_answer',
    replace:
      '$f$ has no point of local maxima or local minima: its only critical point, $x=1$, is a point of inflexion.',
  },
  {
    // The combined-sales matrix was an image that didn't survive the conversion.
    index: 314,
    field: 'Solution',
    from: '\\includegraphics[max width=\\textwidth]{2023_09_18_e86d7ec88ca930f59221g-09}',
    to: '$${A}+{B}=\\left[\\begin{array}{ccc}\n\\text { Basmati } & \\text { Permal } & \\text { Naura } \\\\\n15,000 & 30,000 & 36,000 \\\\\n70,000 & 40,000 & 20,000\n\\end{array}\\right] \\begin{aligned}\n& \\text { Ramkishan } \\\\\n& \\text { Gurcharan Singh }\n\\end{aligned}$$',
  },
  {
    // 2% of Ramkishan's ₹5000 Basmati sales is ₹100, as the text below the matrix says.
    index: 314,
    field: 'Solution',
    from: '400 & 200 & 120',
    to: '100 & 200 & 120',
  },
  {
    index: 314,
    field: 'Final_answer',
    replace:
      'Profit in October: Ramkishan ₹100, ₹200 and ₹120; Gurcharan Singh ₹400, ₹200 and ₹200 (Basmati, Permal and Naura respectively).',
  },
  // Linear programming: the objective functions and constraints were lost (they were
  // laid out as images). Restored from NCERT; the corner points in each solution match.
  {
    index: 324,
    field: 'Example',
    replace:
      'Solve the following linear programming problem graphically:\nMinimise $Z = 200x + 500y \\quad (1)$\nsubject to the constraints:\n$x + 2y \\geq 10 \\quad (2)$\n$3x + 4y \\leq 24 \\quad (3)$\n$x \\geq 0,\\ y \\geq 0 \\quad (4)$',
  },
  {
    index: 324,
    field: 'Solution',
    from: 'The shaded region in Fig 12.3 is the feasible region ABC',
    to: 'The feasible region is ABC,',
  },
  {
    index: 324,
    field: 'Solution',
    from: 'Now we evaluate Z = 200x + 500y at these points.\n',
    to: 'Now we evaluate $Z = 200x + 500y$ at these points: Z = 2500 at A(0, 5), Z = 2300 at B(4, 3) and Z = 3000 at C(0, 6).\n',
  },
  {
    index: 325,
    field: 'Example',
    replace:
      'Solve the following problem graphically:\nMinimise and Maximise $Z = 3x + 9y \\quad (1)$\nsubject to the constraints:\n$x + 3y \\leq 60 \\quad (2)$\n$x + y \\geq 10 \\quad (3)$\n$x \\leq y \\quad (4)$\n$x \\geq 0,\\ y \\geq 0 \\quad (5)$',
  },
  {
    index: 325,
    field: 'Solution',
    from: 'The feasible region ABCD is shown in Fig 12.4. Note that the region is bounded.',
    to: 'The feasible region ABCD is bounded.',
  },
  {
    index: 325,
    field: 'Solution',
    from: '\nFrom the table, we find that the minimum',
    to: '\nEvaluating $Z = 3x + 9y$ at the corner points gives Z = 90 at A(0, 10), Z = 60 at B(5, 5), Z = 180 at C(15, 15) and Z = 180 at D(0, 20).\nSo the minimum',
  },
  {
    index: 326,
    field: 'Example',
    replace:
      'Determine graphically the minimum value of the objective function\n$Z = -50x + 20y \\quad (1)$\nsubject to the constraints:\n$2x - y \\geq -5 \\quad (2)$\n$3x + y \\geq 3 \\quad (3)$\n$2x - 3y \\leq 12 \\quad (4)$\n$x \\geq 0,\\ y \\geq 0 \\quad (5)$',
  },
  {
    index: 326,
    field: 'Solution',
    from: 'The feasible region is shown in Fig 12.5. Observe that the feasible region is unbounded. We evaluate Z at the corner points and find that -300 is the smallest value of Z at the corner point (6,0).',
    to: 'Observe that the feasible region is unbounded. Evaluating Z at the corner points gives Z = 100 at (0, 5), Z = 60 at (0, 3), Z = -50 at (1, 0) and Z = -300 at (6, 0), so -300 is the smallest value of Z at a corner point.',
  },
  {
    index: 327,
    field: 'Example',
    replace:
      'Minimise $Z = 3x + 2y$\nsubject to the constraints:\n$x + y \\geq 8 \\quad (1)$\n$3x + 5y \\leq 15 \\quad (2)$\n$x \\geq 0,\\ y \\geq 0 \\quad (3)$',
  },
  {
    index: 337,
    field: 'Final_answer',
    replace: 'A and B are independent events.',
  },
  // These three questions were cut off at "...", and #345 carried the solution of
  // another question. Restored from NCERT (Class 12, Chapter 13).
  {
    index: 345,
    field: 'Example',
    replace:
      'A doctor is to visit a patient. From past experience, it is known that the probabilities that he will come by train, bus, scooter or by other means of transport are respectively $\\frac{3}{10}$, $\\frac{1}{5}$, $\\frac{1}{10}$ and $\\frac{2}{5}$. The probabilities that he will be late are $\\frac{1}{4}$, $\\frac{1}{3}$ and $\\frac{1}{12}$ if he comes by train, bus and scooter respectively, but if he comes by other means of transport, then he will not be late. When he arrives, he is late. What is the probability that he comes by train?',
  },
  {
    index: 345,
    field: 'Solution',
    replace:
      "Let $E$ be the event that the doctor visits the patient late, and let $T_1, T_2, T_3, T_4$ be the events that he comes by train, bus, scooter and other means of transport respectively.\nThen $P(T_1)=\\frac{3}{10}$, $P(T_2)=\\frac{1}{5}$, $P(T_3)=\\frac{1}{10}$ and $P(T_4)=\\frac{2}{5}$.\nAlso $P(E \\mid T_1)=\\frac{1}{4}$, $P(E \\mid T_2)=\\frac{1}{3}$, $P(E \\mid T_3)=\\frac{1}{12}$ and $P(E \\mid T_4)=0$.\nBy Bayes' theorem,\n$$P(T_1 \\mid E)=\\frac{P(T_1) P(E \\mid T_1)}{\\sum_{i=1}^{4} P(T_i) P(E \\mid T_i)}=\\frac{\\frac{3}{10} \\cdot \\frac{1}{4}}{\\frac{3}{10} \\cdot \\frac{1}{4}+\\frac{1}{5} \\cdot \\frac{1}{3}+\\frac{1}{10} \\cdot \\frac{1}{12}+\\frac{2}{5} \\cdot 0}$$\n$$=\\frac{\\frac{9}{120}}{\\frac{9}{120}+\\frac{8}{120}+\\frac{1}{120}}=\\frac{9}{18}=\\frac{1}{2}$$\nHence, the probability that the doctor comes by train, given that he is late, is $\\frac{1}{2}$.",
  },
  { index: 345, field: 'Final_answer', replace: '$\\frac{1}{2}$' },
  {
    index: 346,
    field: 'Example',
    replace:
      "A and B throw a die alternately till one of them gets a '6' and wins the game. Find their respective probabilities of winning, if A starts first.",
  },
  {
    index: 346,
    field: 'Solution',
    replace:
      "Let $S$ denote a success (getting a '6') and $F$ a failure. Then $P(S)=\\frac{1}{6}$ and $P(F)=\\frac{5}{6}$.\nA wins if the first '6' comes on the 1st, 3rd, 5th, ... throw, so\n$$P(A \\text{ wins}) = \\frac{1}{6} + \\left(\\frac{5}{6}\\right)^{2} \\frac{1}{6} + \\left(\\frac{5}{6}\\right)^{4} \\frac{1}{6} + \\cdots = \\frac{\\frac{1}{6}}{1-\\frac{25}{36}} = \\frac{6}{11}$$\n$$P(B \\text{ wins}) = 1 - \\frac{6}{11} = \\frac{5}{11}$$\nHence, the probability that A wins is $\\frac{6}{11}$ and the probability that B wins is $\\frac{5}{11}$.",
  },
  {
    index: 347,
    field: 'Example',
    replace:
      'If a machine is correctly set up, it produces 90% acceptable items. If it is incorrectly set up, it produces only 40% acceptable items. Past experience shows that 80% of the set ups are correctly done. If after a certain set up, the machine produces 2 acceptable items, find the probability that the machine is correctly set up.',
  },
  {
    index: 347,
    field: 'Solution',
    replace:
      "Let $E_1$ be the event that the machine is correctly set up, $E_2$ the event that it is incorrectly set up, and $A$ the event that the machine produces 2 acceptable items.\nThen $P(E_1)=0.8$ and $P(E_2)=0.2$.\nThe two items are produced independently, so $P(A \\mid E_1)=0.9 \\times 0.9=0.81$ and $P(A \\mid E_2)=0.4 \\times 0.4=0.16$.\nBy Bayes' theorem,\n$$P(E_1 \\mid A)=\\frac{P(E_1) P(A \\mid E_1)}{P(E_1) P(A \\mid E_1)+P(E_2) P(A \\mid E_2)}=\\frac{0.8 \\times 0.81}{0.8 \\times 0.81+0.2 \\times 0.16}=\\frac{0.648}{0.68} \\approx 0.95$$\nHence, the probability that the machine is correctly set up is about $0.95$.",
  },
  {
    // The equations were stored in the solution as a Python list with doubled backslashes.
    index: 358,
    field: 'Example',
    replace:
      'Find the order and degree, if defined, of each of the following differential equations:\n(i) $\\frac{d y}{d x}-\\cos x=0$\n(ii) $x y \\frac{d^{2} y}{d x^{2}}+x\\left(\\frac{d y}{d x}\\right)^{2}-y \\frac{d y}{d x}=0$\n(iii) $y^{\\prime \\prime \\prime}+y^{2}+e^{y^{\\prime}}=0$',
  },
  {
    index: 358,
    field: 'Solution',
    replace:
      '(i) The highest order derivative present is $\\frac{d y}{d x}$, so the order is 1. The equation is a polynomial in $y^{\\prime}$ and the highest power of $\\frac{d y}{d x}$ is 1, so the degree is 1.\n(ii) The highest order derivative present is $\\frac{d^{2} y}{d x^{2}}$, so the order is 2. The equation is a polynomial in $\\frac{d^{2} y}{d x^{2}}$ and $\\frac{d y}{d x}$, and the highest power of $\\frac{d^{2} y}{d x^{2}}$ is 1, so the degree is 1.\n(iii) The highest order derivative present is $y^{\\prime \\prime \\prime}$, so the order is 3. The equation is not a polynomial in its derivatives (it contains $e^{y^{\\prime}}$), so its degree is not defined.',
  },
  {
    index: 358,
    field: 'Final_answer',
    replace:
      '(i) order 1, degree 1 (ii) order 2, degree 1 (iii) order 3, degree not defined',
  },
  // Probability solutions written as bare TeX between sentences.
  ...[331, 332, 333, 334, 335, 336, 337, 338].flatMap(index =>
    ['Solution', 'Final_answer'].map(field => ({
      index,
      field,
      apply: wrapProbabilityLines,
    })),
  ),
];

// Wraps lines such as "P(F) = \frac{430}{1000} = 0.43 and P(E \cap F) = ..." in $...$,
// leaving the joining words as text. Lines that already contain $ are left alone.
function wrapProbabilityLines(text) {
  const separator =
    /(^Hence,\s+|,?\s+and\s+|,\s+(?=P\()|\s+\(Why\?\)|[.,]\s*$|\s+is\s+(?=\\frac))/;
  const toMath = formula =>
    `$${formula
      .replace(/∩/g, '\\cap ')
      .replace(/≠/g, '\\neq ')
      .replace(/\s\*\s/g, ' \\times ')
      .replace(
        /P\(odd number on both throws\)/,
        'P(\\text{odd number on both throws})',
      )
      .replace(/\(\{\(/g, '(\\{(')
      .replace(/\)\}\)/g, ')\\})')}$`;
  return text
    .split('\n')
    .map(line => {
      if (line.includes('$') || !/^(Hence, )?P\(|\\frac/.test(line)) {
        return line;
      }
      return line
        .split(separator)
        .map(part =>
          !part || separator.test(part) || !/[=≠\\]/.test(part)
            ? part
            : part.replace(/^(.*\S)(\s*)$/, (match, formula, space) =>
                formula.startsWith('The ')
                  ? match
                  : `${toMath(formula)}${space}`,
              ),
        )
        .join('');
    })
    .join('\n');
}

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

// \( \) and \[ \] are TeX's other math delimiters; the app only understands $ and $$.
// Also closes a display formula whose final "$$" was lost at the end of the text.
function repairDelimiters(text) {
  const displayMarkers = (text.match(/\$\$/g) || []).length;
  const closed =
    displayMarkers % 2 === 1 && /\$\$[^$]+$/.test(text)
      ? `${text.trimEnd()}$$`
      : text;
  return closed
    .replace(/\\\[([\s\S]+?)\\\]/g, (match, math) => `$$${math.trim()}$$`)
    .replace(/\\\(([\s\S]+?)\\\)/g, (match, math) => `$${math.trim()}$`);
}

// Set braces typed as \{ \} in plain text. Sets of symbols, like \{1, 2, 3\} or
// \{x : x - 5 = 0\}, become formulas; sets of words, like \{Geeta\}, plain braces.
function repairSetBraces(value) {
  const SET = /(\\\{(?:[^{}$\n\\]|\\[A-Za-z]+|\{[^{}$\n]*\})*?\\\})/;
  return value
    .split(SET)
    .map((piece, index) => {
      // split() puts the matched sets at odd indexes. Any other "\{" or "\}" is a
      // lone brace in a sentence.
      if (index % 2 === 0) {
        return piece.replace(/\\([{}])/g, '$1');
      }
      const inner = piece.slice(2, -2);
      return /\\[A-Za-z]/.test(inner) || !/[A-Za-z]{2}/.test(inner)
        ? `$\\{${inner}\\}$`
        : `{${inner.trim()}}`;
    })
    .join('');
}

function repairPlainText(value) {
  return repairSetBraces(
    value
      .replace(/\\displaystyle\s*/g, '')
      .replace(/\\(?:begin|end)\{(?:center|itemize)\}/g, '')
      .replace(/\\item\s*/g, '')
      .replace(/\\section\*?\{[^}]*\}/g, '')
      .replace(/[ \t]*\\\\[ \t]*/g, '\n')
      // A lone "\ " is what is left of a "\\" line break.
      .replace(/[ \t]*\\ [ \t]*/g, '\n'),
  );
}

// A whole line of TeX with no $ around it, e.g. a final answer "\\frac{200}{27} {~m}^3".
// Lines that also contain words (outside \\text{...}) are left for a manual fix.
function wrapBareFormula(line) {
  if (line.includes('$') || !/\\[A-Za-z]/.test(line)) {
    return line;
  }
  const withoutCommands = line
    .replace(/\\text\s*\{[^}]*\}/g, '')
    .replace(/\\[A-Za-z]+/g, '');
  return /[A-Za-z]{3,}/.test(withoutCommands) ? line : `$${line.trim()}$`;
}

// Applies wrapBareFormula to the lines of a text part that have no formula on them,
// i.e. not the parts of a line that continue before or after a $...$.
function wrapBareLines(part, index, parts) {
  const lines = part.value.split('\n');
  return {
    ...part,
    value: lines
      .map((line, lineIndex) =>
        (lineIndex > 0 || index === 0) &&
        (lineIndex < lines.length - 1 || index === parts.length - 1)
          ? wrapBareFormula(line)
          : line,
      )
      .join('\n'),
  };
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
  // "\\frac" with a doubled backslash is a line break followed by the word "frac".
  const value = part.value.replace(
    /(?<!\\)\\\\(?=(?:frac|sqrt|cap|cup|left|right|times|cdot)\b)/g,
    '\\',
  );
  if (/\\begin\{/.test(value) && value.includes('&')) {
    return { ...part, value: value.replace(/(?<!\\)\\ (?=\S)/g, '\\\\ ') };
  }
  return { ...part, value };
}

function repairText(text) {
  let result = repairTables(
    repairDisplayOpenings(repairDelimiters(repairEscapes(text))),
  );
  result = joinMath(
    splitMath(result)
      .map(part =>
        part.type === 'text'
          ? { ...part, value: repairPlainText(part.value) }
          : repairMath(part),
      )
      .map((part, index, parts) =>
        part.type === 'text' ? wrapBareLines(part, index, parts) : part,
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
  } else if (fix.apply) {
    entry[fix.field] = fix.apply(current);
  } else if (current.includes(fix.from)) {
    entry[fix.field] = fix.all
      ? current.split(fix.from).join(fix.to)
      : // A replacer function keeps "$$" literal (in a replacement string it means "$").
        current.replace(fix.from, () => fix.to);
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

// --- 7. Exact duplicates (the last question repeated an earlier Sets example) -------
// Removed last, so the indexes used above stay valid on later runs.
const seen = new Set();
const unique = data.filter(entry => {
  const key = JSON.stringify(entry);
  if (seen.has(key)) {
    return false;
  }
  seen.add(key);
  return true;
});

writeFileSync(FILE, `${JSON.stringify(unique, null, 2)}\n`);
console.log(
  `Repaired ${unique.length} questions in ${FILE}` +
    (unique.length < data.length
      ? ` (removed ${data.length - unique.length} duplicate)`
      : ''),
);
