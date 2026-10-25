import React from 'react';
import { render, screen } from '@testing-library/react-native';
import MathText from '../src/components/MathText';

// Use the real renderer (MathJax → SVG) instead of the global test mock.
jest.unmock('../src/components/MathView');

const svgCount = container =>
  container.queryAll(node => node.type === 'RNSVGSvgView').length;

it('draws inline and display formulas as SVG next to the text', async () => {
  const { container } = await render(
    <MathText content={'Solve $x^2 = 4$.\n$$\\frac{1}{2}$$'} />,
  );

  expect(screen.getByText('Solve ')).toBeOnTheScreen();
  expect(svgCount(container)).toBe(2);
});

it('shows the raw TeX when a formula cannot be parsed', async () => {
  const { container } = await render(
    <MathText content={'Broken $\\frac{1}{$ here'} />,
  );

  expect(screen.getByText('\\frac{1}{')).toBeOnTheScreen();
  expect(svgCount(container)).toBe(0);
});
