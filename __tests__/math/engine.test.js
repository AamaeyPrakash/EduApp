import { createMathEngine, MathError, sizeKey } from '../../src/math/engine';
import { BUNDLED_FONT_FILES, loadFontFile } from '../../src/math/fontFiles';

const loaded = [];
const engine = createMathEngine({
  loadFontFile: name => {
    loaded.push(name);
    return loadFontFile(name);
  },
});

const findAll = (nodes, type) =>
  nodes.flatMap(node => [
    ...(node.type === type ? [node] : []),
    ...findAll(node.children || [], type),
  ]);

it('measures a formula in ems, including how far it drops below the baseline', () => {
  const layout = engine.convert('\\frac{1}{2}', { display: true });
  expect(layout.width).toBeGreaterThan(0.4);
  expect(layout.height).toBeGreaterThan(1);
  expect(layout.depth).toBeGreaterThan(0.2);
  expect(layout.viewBox.split(' ')).toHaveLength(4);
  expect(findAll(layout.nodes, 'path').length).toBeGreaterThan(1);
});

it('splits inline maths into pieces that can wrap like words', () => {
  const layout = engine.convert('(A \\times B) \\cap C = \\{1, 2\\}');
  expect(layout.pieces.length).toBeGreaterThan(2);
  // Every piece is drawn, including those whose glyphs were defined earlier.
  for (const piece of layout.pieces) {
    const paths = findAll(piece.nodes, 'path');
    expect(paths.length).toBeGreaterThan(0);
    expect(paths.every(path => path.props.d)).toBe(true);
  }
  expect(layout.pieces[0].gap).toBeGreaterThan(0);
  expect(layout.width).toBeCloseTo(
    layout.pieces.reduce((sum, piece) => sum + piece.width + piece.gap, 0),
  );
});

it('breaks inline lists between their items, not inside them', () => {
  const pieces = tex =>
    engine.convert(tex).pieces.map(piece => Math.round(piece.width * 10));
  // {(1,1), | (1,2), | (1,3)}: the pieces are alike, with the brace on the ends.
  const list = pieces('\\{(1,1),(1,2),(1,3)\\}');
  expect(list).toHaveLength(3);
  const [first, middle, last] = list;
  expect(middle).toBeLessThan(first);
  expect(middle).toBeLessThan(last);
  expect(pieces('(x, y)')).toHaveLength(1);
  expect(pieces('\\{1, 2, 3\\}')).toHaveLength(1);
});

it('breaks a row of clauses between them, not inside one', () => {
  const pieces = tex => engine.convert(tex).pieces.length;
  expect(pieces('x = 2, y = 3')).toBe(2);
  expect(pieces('x+3=0, \\quad z+4=6, \\quad 2y-7=3y-2')).toBe(3);
  // Not at the thin space of "\\,dx".
  expect(pieces('x\\,dx + y')).toBe(2);
});

it('breaks inside a clause when the clause alone is too wide', () => {
  const tex =
    '\\int_0^1 \\frac{\\sin^2 x}{\\sin x + \\cos x}\\,dx = \\frac{1}{2}\\int_0^1 \\frac{dx}{\\sin x+\\cos x}, \\quad x \\neq 0';
  const layout = engine.convert(tex, { display: true, widthEm: 14 });
  expect(layout.width).toBeLessThanOrEqual(14);
});

it('sets inline maths on lines of its own when asked (block)', () => {
  const tex = 'y = \\left(a+b+c+d+e+f+g+h+i+j+k+l+m+n+o+p+q\\right)';
  const inline = engine.convert(tex);
  const block = engine.convert(tex, { block: true, widthEm: 12 });
  expect(Math.max(...inline.pieces.map(piece => piece.width))).toBeGreaterThan(
    12,
  );
  expect(block.pieces).toBeUndefined();
  expect(block.width).toBeLessThanOrEqual(12);
  expect(block.height).toBeGreaterThan(inline.height * 1.5);
});

it('breaks a long display formula into lines to fit the width', () => {
  const tex =
    '\\int_0^{\\pi/2} \\frac{\\sin^2 x}{\\sin x + \\cos x}\\,dx = \\frac{1}{2}\\int_0^{\\pi/2} \\frac{dx}{\\sin x+\\cos x} = \\frac{1}{2\\sqrt{2}}\\log\\left|\\frac{\\sqrt2+1}{\\sqrt2-1}\\right|';
  const whole = engine.convert(tex, { display: true });
  const broken = engine.convert(tex, { display: true, widthEm: 17 });
  expect(whole.width).toBeGreaterThan(17);
  expect(broken.width).toBeLessThanOrEqual(17);
  expect(broken.height).toBeGreaterThan(whole.height * 2);
});

it('draws table frames as outlines, not filled boxes', () => {
  const layout = engine.convert(
    '\\begin{array}{|c|c|}\\hline x & y \\\\ \\hline\\end{array}',
    { display: true },
  );
  const frame = findAll(layout.nodes, 'rect').find(
    rect => rect.props.fill === 'none',
  );
  expect(frame.props).toMatchObject({
    stroke: 'currentColor',
    strokeWidth: 70,
  });
  expect(findAll(layout.nodes, 'line').length).toBeGreaterThan(0);
});

it('crops stretched arrows and brackets to their space', () => {
  const layout = engine.convert('\\overrightarrow{ABCDEF}', { display: true });
  const [clip] = findAll(layout.nodes, 'clip');
  expect(clip.props.width).toBeGreaterThan(0);
  expect(clip.children[0].props.transform).toMatch(/^translate\(.*\) scale\(/);
});

it('loads extra font files only when a character needs them', () => {
  engine.convert('x + 1');
  expect(loaded).toEqual([]);
  const layout = engine.convert('x \\in \\mathbb{R}', { display: true });
  expect(loaded).toContain('double-struck');
  expect(findAll(layout.nodes, 'text')).toEqual([]);
  expect(BUNDLED_FONT_FILES).toContain('double-struck');
});

it('throws a MathError for TeX that does not parse', () => {
  expect(() => engine.convert('\\frac{1}{')).toThrow(MathError);
  expect(() => engine.convert('\\notacommand x')).toThrow(
    'Undefined control sequence',
  );
});

it('keys sizes by the formula and whether it is displayed', () => {
  expect(sizeKey('x', true)).not.toBe(sizeKey('x', false));
  expect(sizeKey('x', true)).toBe(sizeKey('x', true));
});
