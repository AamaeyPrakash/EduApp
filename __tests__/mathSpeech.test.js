import { texToPlain, texToSpeech } from '../src/lib/mathSpeech';
import { courseQuestions } from '../src/content';
import { parseMathContent } from '../src/lib/mathContent';

describe('texToSpeech', () => {
  it.each([
    [
      'f(x)=\\frac{1}{x}, x\\neq 0',
      'f(x) equals 1 over x, x is not equal to 0',
    ],
    ['x^2 + y^3', 'x squared plus y cubed'],
    ['\\sqrt{1-x^2}', 'the square root of 1 minus x squared'],
    ['\\sqrt[3]{27}', 'the cube root of 27'],
    ['30^{\\circ}', '30 degrees'],
    ['\\sin^{-1} x', 'sine inverse x'],
    ['\\int_{-1}^{2}x\\,dx', 'the integral from minus 1 to 2 of x dx'],
    [
      '\\lim_{x \\to 0} \\frac{\\sin x}{x}',
      'the limit as x tends to 0 of sine x over x',
    ],
    ['P(A \\mid B)', 'P(A given B)'],
    ['\\vec{a} \\cdot \\vec{b}', 'vector a times vector b'],
    ['\\text{Area} = 4', 'Area equals 4'],
  ])('reads %s', (tex, spoken) => {
    expect(texToSpeech(tex)).toBe(spoken);
  });
});

describe('texToPlain', () => {
  it.each([
    ['\\int x \\cos x\\,dx', '∫ x cos x dx'],
    ['x\\leq 2', 'x ≤ 2'],
    ['\\frac{a+b}{2}', '(a+b)/2'],
    ['x^{n+1}', 'xⁿ⁺¹'],
    ['\\sin^{-1} x', 'sin⁻¹ x'],
    ['A = \\{1,2,3\\}', 'A = {1,2,3}'],
    ['\\mathbb{R}', 'ℝ'],
  ])('writes %s', (tex, plain) => {
    expect(texToPlain(tex)).toBe(plain);
  });

  it('turns every bundled formula into text without TeX commands', () => {
    const formulas = courseQuestions('cbse').flatMap(question =>
      [question.prompt, question.answer, question.solution]
        .filter(Boolean)
        .flatMap(content =>
          parseMathContent(content).flatMap(block =>
            block.type === 'display'
              ? [block.math]
              : block.tokens
                  .filter(token => token.type === 'math')
                  .map(token => token.value),
          ),
        ),
    );
    expect(formulas.length).toBeGreaterThan(1000);
    for (const formula of formulas) {
      expect(texToPlain(formula)).not.toMatch(/\\[A-Za-z]/);
      expect(texToSpeech(formula)).not.toMatch(/[\\^_{}]/);
    }
  });
});

describe('texToPlain spacing', () => {
  it('keeps function names apart from what comes before them', () => {
    expect(texToPlain('\\int x\\cos x\\,dx')).toBe('∫ x cos x dx');
    expect(texToPlain('\\int e^{x}\\sin x\\,dx')).toBe('∫ eˣ sin x dx');
  });
});
