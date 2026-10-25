// `$$display$$` is matched before `$inline$`; both may span several lines.
const MATH_SPANS = /(\$\$[\s\S]+?\$\$|\$[^$]+?\$)/;

const isWrapped = (value, marker) =>
  value.length > marker.length * 2 &&
  value.startsWith(marker) &&
  value.endsWith(marker);

// Splits text containing `$inline$` and `$$display$$` TeX into renderable lines.
// Returns blocks of `{ type: 'display', math }` or `{ type: 'line', tokens }`, where
// tokens are `{ type: 'text' | 'math', value }`. An empty line marks a paragraph gap.
export function parseMathContent(content) {
  const blocks = [];
  let tokens = [];
  let afterDisplay = false;
  const endLine = () => {
    blocks.push({ type: 'line', tokens });
    tokens = [];
  };

  String(content ?? '')
    .split(MATH_SPANS)
    .forEach(part => {
      if (!part) {
        return;
      }
      if (isWrapped(part, '$$')) {
        if (tokens.length > 0) {
          endLine();
        }
        blocks.push({ type: 'display', math: part.slice(2, -2).trim() });
        afterDisplay = true;
        return;
      }
      if (isWrapped(part, '$')) {
        // Line breaks inside a formula are just spacing to TeX.
        const math = part.slice(1, -1).replace(/\s+/g, ' ').trim();
        if (math) {
          tokens.push({ type: 'math', value: math });
        }
        afterDisplay = false;
        return;
      }
      // The line break right after display math is covered by its spacing.
      const text = afterDisplay ? part.replace(/^\n/, '') : part;
      afterDisplay = false;
      text.split('\n').forEach((piece, index) => {
        if (index > 0) {
          endLine();
        }
        if (piece) {
          tokens.push({ type: 'text', value: piece });
        }
      });
    });
  if (tokens.length > 0) {
    endLine();
  }
  return blocks;
}
