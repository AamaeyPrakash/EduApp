// Turns TeX into words for screen readers ("x squared plus 1 over 2") or into
// readable plain text with Unicode symbols for previews ("x² + 1/2"). It covers the
// commands the bundled questions use; anything else keeps its name without the
// backslash.

const SYMBOLS = {
  alpha: ['alpha', 'α'],
  beta: ['beta', 'β'],
  gamma: ['gamma', 'γ'],
  Gamma: ['capital gamma', 'Γ'],
  delta: ['delta', 'δ'],
  Delta: ['capital delta', 'Δ'],
  epsilon: ['epsilon', 'ε'],
  varepsilon: ['epsilon', 'ε'],
  zeta: ['zeta', 'ζ'],
  eta: ['eta', 'η'],
  theta: ['theta', 'θ'],
  vartheta: ['theta', 'θ'],
  Theta: ['capital theta', 'Θ'],
  iota: ['iota', 'ι'],
  kappa: ['kappa', 'κ'],
  lambda: ['lambda', 'λ'],
  Lambda: ['capital lambda', 'Λ'],
  mu: ['mu', 'μ'],
  nu: ['nu', 'ν'],
  xi: ['xi', 'ξ'],
  pi: ['pi', 'π'],
  Pi: ['capital pi', 'Π'],
  rho: ['rho', 'ρ'],
  sigma: ['sigma', 'σ'],
  Sigma: ['capital sigma', 'Σ'],
  tau: ['tau', 'τ'],
  phi: ['phi', 'φ'],
  varphi: ['phi', 'φ'],
  Phi: ['capital phi', 'Φ'],
  chi: ['chi', 'χ'],
  psi: ['psi', 'ψ'],
  Psi: ['capital psi', 'Ψ'],
  omega: ['omega', 'ω'],
  Omega: ['capital omega', 'Ω'],
  times: ['times', '×'],
  cdot: ['times', '·'],
  div: ['divided by', '÷'],
  pm: ['plus or minus', '±'],
  mp: ['minus or plus', '∓'],
  le: ['is less than or equal to', '≤'],
  leq: ['is less than or equal to', '≤'],
  leqslant: ['is less than or equal to', '≤'],
  ge: ['is greater than or equal to', '≥'],
  geq: ['is greater than or equal to', '≥'],
  geqslant: ['is greater than or equal to', '≥'],
  ne: ['is not equal to', '≠'],
  neq: ['is not equal to', '≠'],
  approx: ['is approximately', '≈'],
  equiv: ['is equivalent to', '≡'],
  sim: ['is similar to', '∼'],
  cong: ['is congruent to', '≅'],
  propto: ['is proportional to', '∝'],
  infty: ['infinity', '∞'],
  int: ['the integral of', '∫'],
  iint: ['the double integral of', '∬'],
  oint: ['the contour integral of', '∮'],
  sum: ['the sum of', '∑'],
  prod: ['the product of', '∏'],
  partial: ['partial', '∂'],
  nabla: ['del', '∇'],
  to: ['tends to', '→'],
  rightarrow: ['tends to', '→'],
  longrightarrow: ['tends to', '→'],
  leftarrow: ['from', '←'],
  Rightarrow: ['implies', '⇒'],
  implies: ['implies', '⇒'],
  Leftarrow: ['is implied by', '⇐'],
  Leftrightarrow: ['if and only if', '⇔'],
  iff: ['if and only if', '⇔'],
  leftrightarrow: ['if and only if', '↔'],
  mapsto: ['maps to', '↦'],
  in: ['in', '∈'],
  notin: ['not in', '∉'],
  ni: ['contains', '∋'],
  subset: ['is a subset of', '⊂'],
  subseteq: ['is a subset of', '⊆'],
  supset: ['is a superset of', '⊃'],
  supseteq: ['is a superset of', '⊇'],
  cup: ['union', '∪'],
  cap: ['intersection', '∩'],
  setminus: ['minus', '∖'],
  emptyset: ['the empty set', '∅'],
  varnothing: ['the empty set', '∅'],
  forall: ['for all', '∀'],
  exists: ['there exists', '∃'],
  neg: ['not', '¬'],
  land: ['and', '∧'],
  wedge: ['and', '∧'],
  lor: ['or', '∨'],
  vee: ['or', '∨'],
  therefore: ['therefore', '∴'],
  because: ['because', '∵'],
  angle: ['angle', '∠'],
  triangle: ['triangle', '△'],
  perp: ['is perpendicular to', '⊥'],
  parallel: ['is parallel to', '∥'],
  circ: ['composed with', '∘'],
  degree: ['degrees', '°'],
  prime: ['prime', '′'],
  ldots: ['dot dot dot', '…'],
  cdots: ['dot dot dot', '⋯'],
  dots: ['dot dot dot', '…'],
  vdots: ['dot dot dot', '⋮'],
  ddots: ['dot dot dot', '⋱'],
  // The questions use \mid for conditional probability: P(A | B).
  mid: ['given', '|'],
  vert: ['vertical bar', '|'],
  lvert: ['vertical bar', '|'],
  rvert: ['vertical bar', '|'],
  langle: ['', '⟨'],
  rangle: ['', '⟩'],
  lfloor: ['floor of', '⌊'],
  rfloor: ['', '⌋'],
  lceil: ['ceiling of', '⌈'],
  rceil: ['', '⌉'],
  star: ['star', '⋆'],
  ast: ['star', '∗'],
  checkmark: ['tick', '✓'],
  N: ['the natural numbers', 'ℕ'],
  Z: ['the integers', 'ℤ'],
  Q: ['the rational numbers', 'ℚ'],
  R: ['the real numbers', 'ℝ'],
  C: ['the complex numbers', 'ℂ'],
};

const FUNCTIONS = {
  sin: 'sine',
  cos: 'cosine',
  tan: 'tangent',
  sec: 'secant',
  csc: 'cosecant',
  cosec: 'cosecant',
  cot: 'cotangent',
  arcsin: 'inverse sine',
  arccos: 'inverse cosine',
  arctan: 'inverse tangent',
  sinh: 'hyperbolic sine',
  cosh: 'hyperbolic cosine',
  tanh: 'hyperbolic tangent',
  log: 'log',
  ln: 'natural log',
  exp: 'exponential',
  lim: 'the limit',
  max: 'the maximum',
  min: 'the minimum',
  det: 'the determinant',
  gcd: 'the greatest common divisor',
  deg: 'degree',
};

// Commands whose argument is shown as it is.
const STYLES = new Set([
  'text',
  'textrm',
  'textit',
  'textbf',
  'mathrm',
  'mathbf',
  'mathit',
  'mathsf',
  'mathtt',
  'mathcal',
  'boldsymbol',
  'operatorname',
  'mbox',
  'displaystyle',
]);
const TEXT_STYLES = new Set(['text', 'textrm', 'textit', 'textbf', 'mbox']);
const BLACKBOARD = { N: 'N', Z: 'Z', Q: 'Q', R: 'R', C: 'C' };

// Accents: [spoken before, spoken after].
const ACCENTS = {
  vec: ['vector ', ''],
  overrightarrow: ['vector ', ''],
  overline: ['', ' bar'],
  bar: ['', ' bar'],
  hat: ['', ' hat'],
  widehat: ['', ' hat'],
  tilde: ['', ' tilde'],
  dot: ['', ' dot'],
  underline: ['', ''],
};

const IGNORED = new Set([
  'left',
  'right',
  'big',
  'Big',
  'bigg',
  'Bigg',
  'bigl',
  'bigr',
  'Bigl',
  'Bigr',
  'biggl',
  'biggr',
  'textstyle',
  'scriptstyle',
  'limits',
  'nolimits',
  'mathstrut',
  'strut',
  'displaystyle',
  'hline',
  'nonumber',
]);

const SPACES = new Set([',', ';', ':', '!', ' ', 'quad', 'qquad', 'enspace']);

const SUPERSCRIPTS = {
  0: '⁰',
  1: '¹',
  2: '²',
  3: '³',
  4: '⁴',
  5: '⁵',
  6: '⁶',
  7: '⁷',
  8: '⁸',
  9: '⁹',
  '+': '⁺',
  '-': '⁻',
  '=': '⁼',
  '(': '⁽',
  ')': '⁾',
  a: 'ᵃ',
  b: 'ᵇ',
  c: 'ᶜ',
  d: 'ᵈ',
  e: 'ᵉ',
  i: 'ⁱ',
  k: 'ᵏ',
  m: 'ᵐ',
  n: 'ⁿ',
  p: 'ᵖ',
  r: 'ʳ',
  t: 'ᵗ',
  x: 'ˣ',
  y: 'ʸ',
};
const SUBSCRIPTS = {
  0: '₀',
  1: '₁',
  2: '₂',
  3: '₃',
  4: '₄',
  5: '₅',
  6: '₆',
  7: '₇',
  8: '₈',
  9: '₉',
  '+': '₊',
  '-': '₋',
};

const OPERATORS = {
  '+': ' plus ',
  '-': ' minus ',
  '=': ' equals ',
  '<': ' is less than ',
  '>': ' is greater than ',
  '/': ' over ',
  "'": ' prime ',
  '|': ' ',
  '!': ' factorial ',
};

const ORDINALS = { 2: 'square', 3: 'cube', 4: 'fourth', 5: 'fifth' };

// Operators whose sub/superscripts are limits: "the integral from 0 to 1 of".
const LIMIT_OPERATORS = new Set(['int', 'iint', 'oint', 'sum', 'prod', 'lim']);

// Symbols that get spaces around them in plain text: "x ≤ 2", not "x≤2".
const SPACED = new Set([
  'times',
  'div',
  'pm',
  'mp',
  'to',
  'rightarrow',
  'longrightarrow',
  'leftarrow',
  'Rightarrow',
  'Leftarrow',
  'Leftrightarrow',
  'leftrightarrow',
  'implies',
  'iff',
  'mapsto',
  'in',
  'notin',
  'ni',
  'cup',
  'cap',
  'setminus',
  'land',
  'lor',
  'wedge',
  'vee',
  'mid',
]);

// `char` is undefined past the end of the string, which mustn't count as a letter.
const isLetter = char => typeof char === 'string' && /^[A-Za-z]$/.test(char);

// Reads a {group}, a \command or one character starting at `index`.
function readArgument(source, start) {
  let index = start;
  while (source[index] === ' ') {
    index += 1;
  }
  if (source[index] === '{') {
    let depth = 0;
    for (let end = index; end < source.length; end += 1) {
      if (source[end] === '\\') {
        end += 1;
      } else if (source[end] === '{') {
        depth += 1;
      } else if (source[end] === '}') {
        depth -= 1;
        if (depth === 0) {
          return [source.slice(index + 1, end), end + 1];
        }
      }
    }
    return [source.slice(index + 1), source.length];
  }
  if (source[index] === '\\') {
    let end = index + 1;
    if (isLetter(source[end])) {
      while (isLetter(source[end])) {
        end += 1;
      }
    } else {
      end += 1;
    }
    return [source.slice(index, end), end];
  }
  return [source[index] ?? '', index + 1];
}

// Reads an optional [argument], e.g. the 3 in \sqrt[3]{x}.
function readOptional(source, index) {
  if (source[index] !== '[') {
    return [null, index];
  }
  const end = source.indexOf(']', index);
  return end === -1 ? [null, index] : [source.slice(index + 1, end), end + 1];
}

const wrap = text => (/^[\w.′]+$/u.test(text) ? text : `(${text})`);

function script(text, map, marker) {
  const chars = [...text];
  if (chars.length > 0 && chars.every(char => map[char])) {
    return chars.map(char => map[char]).join('');
  }
  return `${marker}${chars.length === 1 ? text : `(${text})`}`;
}

function convert(source, speech) {
  let out = '';
  let index = 0;
  const say = (spoken, plain) => {
    out += speech ? ` ${spoken} ` : plain;
  };
  while (index < source.length) {
    const char = source[index];
    if (char === '\\') {
      const [command, next] = readArgument(source, index);
      index = next;
      const name = command.slice(1);
      if (name === 'frac' || name === 'dfrac' || name === 'tfrac') {
        const [top, afterTop] = readArgument(source, index);
        const [bottom, afterBottom] = readArgument(source, afterTop);
        index = afterBottom;
        const a = convert(top, speech).trim();
        const b = convert(bottom, speech).trim();
        say(`${a} over ${b},`, `${wrap(a)}/${wrap(b)}`);
      } else if (name === 'binom') {
        const [top, afterTop] = readArgument(source, index);
        const [bottom, afterBottom] = readArgument(source, afterTop);
        index = afterBottom;
        const a = convert(top, speech).trim();
        const b = convert(bottom, speech).trim();
        say(`${a} choose ${b}`, `C(${a}, ${b})`);
      } else if (name === 'sqrt') {
        const [degree, afterDegree] = readOptional(source, index);
        const [body, afterBody] = readArgument(source, afterDegree);
        index = afterBody;
        const inner = convert(body, speech).trim();
        if (degree) {
          const root = ORDINALS[degree] ?? `${degree}th`;
          say(`the ${root} root of ${inner},`, `${degree}√${wrap(inner)}`);
        } else {
          say(`the square root of ${inner},`, `√${wrap(inner)}`);
        }
      } else if (name === 'mathbb') {
        const [body, after] = readArgument(source, index);
        index = after;
        const symbol = SYMBOLS[BLACKBOARD[body]];
        say(symbol ? symbol[0] : body, symbol ? symbol[1] : body);
      } else if (STYLES.has(name)) {
        if (name === 'displaystyle') {
          continue;
        }
        const [body, after] = readArgument(source, index);
        index = after;
        out += TEXT_STYLES.has(name) ? body : convert(body, speech);
      } else if (ACCENTS[name]) {
        const [body, after] = readArgument(source, index);
        index = after;
        const inner = convert(body, speech).trim();
        const [before, behind] = ACCENTS[name];
        say(`${before}${inner}${behind}`, inner);
      } else if (name === 'begin' || name === 'end') {
        const [environment, after] = readArgument(source, index);
        index = after;
        // Column specs such as {array}{|c|c|} aren't content.
        if (name === 'begin' && environment === 'array') {
          index = readArgument(source, index)[1];
        }
        if (/matrix/.test(environment)) {
          say(name === 'begin' ? 'the matrix' : 'end matrix,', ' ');
        }
      } else if (name === '\\') {
        say(',', '; ');
      } else if (name === '{' || name === '}') {
        out += speech ? ' ' : name;
      } else if (['%', '$', '#', '&', '_'].includes(name)) {
        out += name;
      } else if (SPACES.has(name)) {
        out += ' ';
      } else if (IGNORED.has(name)) {
        // Sizing and layout only.
      } else if (LIMIT_OPERATORS.has(name)) {
        const limits = {};
        let cursor = index;
        while (source[cursor] === ' ') {
          cursor += 1;
        }
        while (
          (source[cursor] === '_' || source[cursor] === '^') &&
          !limits[source[cursor]]
        ) {
          const [body, after] = readArgument(source, cursor + 1);
          limits[source[cursor]] = convert(body, speech).trim();
          cursor = after;
        }
        index = cursor;
        const lower = limits._;
        const upper = limits['^'];
        if (name === 'lim') {
          say(
            lower ? `the limit as ${lower} of` : 'the limit of',
            lower ? `lim(${lower}) ` : 'lim ',
          );
        } else {
          const [spoken, symbol] = SYMBOLS[name];
          const range = [
            lower ? `from ${lower}` : '',
            upper ? `to ${upper}` : '',
          ].join(' ');
          const words = spoken.replace(/ of$/, '');
          say(
            lower || upper ? `${words} ${range} of` : spoken,
            `${symbol}${lower ? script(lower, SUBSCRIPTS, '_') : ''}${
              upper ? script(upper, SUPERSCRIPTS, '^') : ''
            } `,
          );
        }
      } else if (SYMBOLS[name]) {
        const [spoken, symbol] = SYMBOLS[name];
        const spaced = SPACED.has(name) || spoken.startsWith('is ');
        say(spoken, spaced ? ` ${symbol} ` : symbol);
      } else if (FUNCTIONS[name]) {
        // "x\cos x" reads "x cos x", not "xcos x".
        say(
          FUNCTIONS[name],
          `${/[^\s([{+\-=×÷·/]$/.test(out) ? ' ' : ''}${name} `,
        );
      } else {
        say(name, name);
      }
    } else if (char === '^' || char === '_') {
      const [body, after] = readArgument(source, index + 1);
      index = after;
      const isDegree = body === '\\circ' || body === '{\\circ}';
      const inner = convert(body, speech).trim();
      if (!speech) {
        // "sin⁻¹", not "sin ⁻¹".
        out = out.replace(/ +$/, '');
      }
      if (char === '_') {
        say(`sub ${inner},`, script(inner, SUBSCRIPTS, '_'));
      } else if (isDegree) {
        say('degrees', '°');
      } else if (inner === '2') {
        say('squared', '²');
      } else if (inner === '3') {
        say('cubed', '³');
      } else if (inner === 'minus 1' || inner === '-1') {
        say('inverse', '⁻¹');
      } else {
        say(`to the power ${inner},`, script(inner, SUPERSCRIPTS, '^'));
      }
    } else if (char === '{' || char === '}') {
      index += 1;
    } else if (char === '&' || char === '~') {
      out += ' ';
      index += 1;
    } else {
      out += speech && OPERATORS[char] ? OPERATORS[char] : char;
      index += 1;
    }
  }
  return out;
}

const tidy = text =>
  text
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:)])/g, '$1')
    .replace(/,+/g, ',')
    .replace(/,\s*$/, '')
    .trim();

export function texToSpeech(tex) {
  return tidy(convert(String(tex ?? ''), true));
}

export function texToPlain(tex) {
  return tidy(convert(String(tex ?? ''), false));
}
