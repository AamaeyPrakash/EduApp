import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import MathText from '../src/components/MathText';
import { texToPlain } from '../src/lib/mathSpeech';
import { preparedSize, setSynchronousMath } from '../src/math';

// Use the real renderer (MathJax → SVG) instead of the global test mock, converting
// formulas straight away.
jest.unmock('../src/components/MathView');
beforeAll(() => setSynchronousMath(true));
afterAll(() => setSynchronousMath(false));

const svgs = container =>
  container.queryAll(node => node.type === 'RNSVGSvgView');
const flatStyle = node =>
  [node.props.style]
    .flat(Infinity)
    .reduce((all, style) => ({ ...all, ...style }), {});
// MathText measures its width to fit display formulas; this reports a width.
const giveWidth = (container, width) =>
  fireEvent(
    container.queryAll(node => typeof node.props.onLayout === 'function')[0],
    'layout',
    { nativeEvent: { layout: { width } } },
  );

it('draws inline and display formulas as SVG next to the text', async () => {
  const { container } = await render(
    <MathText content={'Solve $x^2 = 4$.\n$$\\frac{1}{2}$$'} />,
  );

  expect(screen.getByText('Solve ')).toBeOnTheScreen();
  // x² and "= 4" are separate pieces so the line can wrap between them.
  expect(svgs(container)).toHaveLength(3);
  const paths = container.queryAll(node => node.type === 'RNSVGPath');
  expect(paths.length).toBeGreaterThan(3);
  expect(paths.every(path => path.props.d)).toBe(true);
});

it('puts inline formulas on the text baseline', async () => {
  const { container } = await render(<MathText content="Find $\frac{a}{b}$" />);

  const [drawing] = svgs(container);
  const [box] = container.queryAll(
    node => node.type === 'View' && flatStyle(node).marginBottom > 0,
  );
  const { height, marginBottom } = flatStyle(box);
  // The box covers the part above the baseline; the rest is a bottom margin.
  expect(height + marginBottom).toBeCloseTo(Number(drawing.props.bbHeight), 0);
  expect(marginBottom).toBeLessThan(height);
});

it('keeps a little space around inline formulas taller than the text', async () => {
  const { container } = await render(
    <MathText content={'So $x$ and $\\dfrac{7}{12}$'} />,
  );

  const boxes = container.queryAll(
    node => node.type === 'View' && flatStyle(node).marginBottom !== undefined,
  );
  const [small, tall] = boxes.map(flatStyle);
  expect(small.marginTop).toBe(0);
  expect(tall.marginTop).toBeGreaterThan(0);
  expect(tall.marginBottom).toBeGreaterThan(tall.marginTop);
});

// Views that keep formula pieces (and punctuation) together on one line.
const together = container =>
  container.queryAll(
    node =>
      node.type === 'View' &&
      flatStyle(node).flexDirection === 'row' &&
      flatStyle(node).alignItems === 'baseline' &&
      flatStyle(node).flexWrap !== 'wrap',
  );

it('moves a formula that fits on a line to the next line whole', async () => {
  const { container } = await render(
    <MathText content="Therefore $y - 2 = 1$ and so on" />,
  );
  await giveWidth(container, 340);

  expect(svgs(container).length).toBeGreaterThan(1);
  expect(together(container)).toHaveLength(1);
});

it('lets a formula wider than a line wrap between its pieces', async () => {
  const { container } = await render(
    <MathText
      content={
        'So $S = \\{(1,1), (1,2), (1,3), (2,1), (2,2), (2,3), (3,1), (3,2), (3,3)\\}$ here'
      }
    />,
  );
  await giveWidth(container, 200);

  expect(svgs(container).length).toBeGreaterThan(4);
  expect(together(container)).toHaveLength(0);
  expect(container.queryAll(node => node.type === 'RCTScrollView')).toEqual([]);
});

const LONG =
  '\\int_0^{\\pi/2} \\frac{\\sin^2 x}{\\sin x + \\cos x}\\,dx = \\frac{1}{2}\\int_0^{\\pi/2} \\frac{dx}{\\sin x+\\cos x} = \\frac{1}{2\\sqrt{2}}\\log\\left|\\frac{\\sqrt2+1}{\\sqrt2-1}\\right|';

it('breaks a long display formula into lines to fit the space it is given', async () => {
  const { container } = await render(<MathText content={`$$${LONG}$$`} />);
  const [whole] = svgs(container);
  const wholeHeight = Number(whole.props.bbHeight);
  await giveWidth(container, 340);

  const [drawing] = svgs(container);
  expect(Number(drawing.props.bbWidth)).toBeLessThanOrEqual(340);
  expect(Number(drawing.props.bbHeight)).toBeGreaterThan(wholeHeight * 2);
  expect(container.queryAll(node => node.type === 'RCTScrollView')).toEqual([]);
});

it('lets a part that cannot be broken any narrower scroll sideways', async () => {
  const { container } = await render(<MathText content={`$$${LONG}$$`} />);
  await giveWidth(container, 200);

  const [scroller] = container.queryAll(node => node.type === 'RCTScrollView');
  expect(flatStyle(scroller).width).toBe(200);
});

it('shows a formula that cannot be parsed as readable text', async () => {
  const { container } = await render(
    <MathText content={'Broken $\\frac{1}{$ here'} />,
  );

  expect(screen.getByText(texToPlain('\\frac{1}{'))).toBeOnTheScreen();
  expect(svgs(container)).toHaveLength(0);
});

it('knows the size of bundled formulas before drawing them', () => {
  // From the CBSE Sets chapter.
  const inline = preparedSize('A \\cup B', false);
  expect(inline.pieces.length).toBeGreaterThan(1);
  expect(inline.pieces[0].width).toBeGreaterThan(0.5);
  expect(inline.pieces[0].gap).toBeGreaterThan(0);
  expect(preparedSize('A \\cup B', true)).toBeNull();
});
