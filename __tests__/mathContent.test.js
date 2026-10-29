import { parseMathContent } from '../src/lib/mathContent';

const text = value => ({ type: 'text', value });
const math = value => ({ type: 'math', value });
const line = (...tokens) => ({ type: 'line', tokens });

describe('parseMathContent', () => {
  it('keeps plain text as one line', () => {
    expect(parseMathContent('Find the mean.')).toEqual([
      line(text('Find the mean.')),
    ]);
  });

  it('splits inline formulas out of the text', () => {
    expect(parseMathContent('Solve $x^2 = 4$ for $x$.')).toEqual([
      line(
        text('Solve '),
        math('x^2 = 4'),
        text(' for '),
        math('x'),
        text('.'),
      ),
    ]);
  });

  it("also reads LaTeX's \\(inline\\) and \\[display\\] delimiters", () => {
    expect(
      parseMathContent(
        'Use \\(x^2\\) here:\n\\[\\int_0^1 x\\,dx\\]\nDone, \\(y\\).',
      ),
    ).toEqual([
      line(text('Use '), math('x^2'), text(' here:')),
      { type: 'display', math: '\\int_0^1 x\\,dx' },
      line(text('Done, '), math('y'), text('.')),
    ]);
  });

  it('puts display formulas on their own block without extra gaps', () => {
    expect(
      parseMathContent(
        'We get\n$$\\int_0^1 x\\,dx$$\nso the area is $\\frac{1}{2}$.',
      ),
    ).toEqual([
      line(text('We get')),
      { type: 'display', math: '\\int_0^1 x\\,dx' },
      line(text('so the area is '), math('\\frac{1}{2}'), text('.')),
    ]);
  });

  it('allows inline formulas that span several lines', () => {
    expect(parseMathContent('Sum $\n1+2+\\ldots\n$ is')).toEqual([
      line(text('Sum '), math('1+2+\\ldots'), text(' is')),
    ]);
  });

  it('marks blank lines as paragraph gaps', () => {
    expect(parseMathContent('First\n\nSecond')).toEqual([
      line(text('First')),
      line(),
      line(text('Second')),
    ]);
  });

  it('leaves an unmatched dollar sign as text', () => {
    expect(parseMathContent('Costs $5 each')).toEqual([
      line(text('Costs $5 each')),
    ]);
  });

  it('handles empty content', () => {
    expect(parseMathContent('')).toEqual([]);
    expect(parseMathContent(undefined)).toEqual([]);
  });
});
