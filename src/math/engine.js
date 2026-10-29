// Turns TeX into drawing instructions with MathJax 4 (SVG output, New Computer Modern
// font). The app draws the result with react-native-svg (see components/MathView.js);
// the content scripts use the same engine, so what they check is what the app shows.
//
// A layout is { width, height, depth, viewBox, nodes }: sizes are in ems (depth is how
// far the formula reaches below the text baseline) and nodes are plain objects,
// { type, props, children, text }, for react-native-svg's G, Path, Rect, Line and Text.
// A "clip" node is a group cut to a rectangle (MathJax stretches brackets and arrows by
// cropping enlarged glyphs). Long display formulas are broken into lines to fit
// `widthEm`.
//
// The CommonJS build of MathJax is used everywhere (the `cjs` paths), so the font's
// on-demand files, which are CommonJS, extend the same font class the engine uses.

import './environment.js';
import { mathjax } from '@mathjax/src/cjs/mathjax.js';
import { TeX } from '@mathjax/src/cjs/input/tex.js';
import { SVG } from '@mathjax/src/cjs/output/svg.js';
import { liteAdaptor } from '@mathjax/src/cjs/adaptors/liteAdaptor.js';
import { RegisterHTMLHandler } from '@mathjax/src/cjs/handlers/html.js';
import { TEXCLASS } from '@mathjax/src/cjs/core/MmlTree/MmlNode.js';
import '@mathjax/src/cjs/input/tex/base/BaseConfiguration.js';
import '@mathjax/src/cjs/input/tex/ams/AmsConfiguration.js';
import '@mathjax/src/cjs/input/tex/newcommand/NewcommandConfiguration.js';
import '@mathjax/src/cjs/input/tex/configmacros/ConfigMacrosConfiguration.js';
import '@mathjax/src/cjs/input/tex/boldsymbol/BoldsymbolConfiguration.js';
import '@mathjax/src/cjs/input/tex/cancel/CancelConfiguration.js';
import '@mathjax/src/cjs/input/tex/color/ColorConfiguration.js';
import '@mathjax/src/cjs/input/tex/mathtools/MathtoolsConfiguration.js';
import '@mathjax/src/cjs/input/tex/cases/CasesConfiguration.js';
import '@mathjax/src/cjs/input/tex/gensymb/GensymbConfiguration.js';
import '@mathjax/src/cjs/input/tex/textmacros/TextMacrosConfiguration.js';
import '@mathjax/src/cjs/input/tex/braket/BraketConfiguration.js';
import '@mathjax/src/cjs/input/tex/upgreek/UpgreekConfiguration.js';
import { MathJaxNewcmFont } from '@mathjax/mathjax-newcm-font/cjs/svg.js';
import { hashText } from '../lib/hash.js';

export const TEX_PACKAGES = [
  'base',
  'ams',
  'newcommand',
  'configmacros',
  'boldsymbol',
  'cancel',
  'color',
  'mathtools',
  'cases',
  'gensymb',
  'textmacros',
  'braket',
  'upgreek',
];

// MathJax gives sizes in exes of its font (whose x-height is 0.442 em) and draws in
// thousandths of an em. Formulas are drawn with that ex as half an em of the text,
// about the x-height of the app's font, so letters in maths and in words look the same
// size (as MathJax's matchFontHeight does on the web); that makes maths 1.13 times the
// text size. The metrics given to MathJax (an em of 16 px, an ex of 8 px) say the same.
const EM_PX = 16;
const EX_PX = 8;
const TEXT_EX = EX_PX / EM_PX;
const X_HEIGHT = MathJaxNewcmFont.defaultParams.x_height;
const MATH_SCALE = TEXT_EX / X_HEIGHT;
const UNITS_PER_EM = 1000;
const exToEm = value => parseFloat(value) * TEXT_EX;
const toUnits = value =>
  String(value).endsWith('ex')
    ? parseFloat(value) * X_HEIGHT * UNITS_PER_EM
    : parseFloat(value);

// The transform that maps a nested <svg>'s viewBox onto its viewport, as SVG's
// preserveAspectRatio ("xMidYMid meet" by default, or "none") would.
function viewportTransform({ x, y, width, height }, viewBox, aspect) {
  const [vx, vy, vw, vh] = viewBox.split(/[\s,]+/).map(Number);
  let sx = width / vw;
  let sy = height / vh;
  if (aspect !== 'none') {
    sx = sy = Math.min(sx, sy);
  }
  const alignX = /xMin/.test(aspect || '')
    ? 0
    : /xMax/.test(aspect || '')
      ? 1
      : 0.5;
  const alignY = /YMin/.test(aspect || '')
    ? 0
    : /YMax/.test(aspect || '')
      ? 1
      : 0.5;
  const tx = x + (width - vw * sx) * alignX - vx * sx;
  const ty = y + (height - vh * sy) * alignY - vy * sy;
  return `translate(${tx},${ty}) scale(${sx},${sy})`;
}

// Table rules, frames and dashes are styled by MathJax's CSS, which React Native
// doesn't have, so those styles are applied to the elements themselves.
const TABLE_STROKE = 70;
// The space (in ems of the maths font) at an inline line-break point, by its size
// attribute; from MathJax's CSS for <mjx-break>. Other sizes are given as the letter
// spacing of a one-em space.
const THIN_SPACE = 0.167;
const BREAK_SPACES = {
  0: 0.001,
  1: 0.111,
  2: 0.167,
  3: 0.222,
  4: 0.278,
  5: 0.333,
};

// Shorthands that are common in notes and tutor replies but aren't standard LaTeX.
export const MACROS = {
  R: '\\mathbb{R}',
  N: '\\mathbb{N}',
  Z: '\\mathbb{Z}',
  Q: '\\mathbb{Q}',
  C: '\\mathbb{C}',
  abs: ['\\left\\lvert #1 \\right\\rvert', 1],
  norm: ['\\left\\lVert #1 \\right\\rVert', 1],
};

export class MathError extends Error {}

const COMMA_BREAK = 'data-comma-break';
const isMo = (node, texClass) =>
  node?.isKind('mo') && node.texClass === texClass;
const isComma = node => isMo(node, TEXCLASS.PUNCT) && node.getText() === ',';
// |x| and ‖x‖ bars, which TeX treats as ordinary symbols, not brackets.
const isBar = node =>
  node.isKind('mo') && ['|', '\u2016', '\u2225'].includes(node.getText());
const isWords = node => node.isKind('mtext') && /\s/.test(node.getText());
// Something multiplied by what follows it, as ½ in ½∫...
const isOperand = node =>
  Boolean(node) &&
  !node.isKind('mspace') &&
  !(node.isKind('mtext') && /\s$/.test(node.getText())) &&
  !(
    node.isKind('mo') &&
    [TEXCLASS.REL, TEXCLASS.BIN, TEXCLASS.OPEN, TEXCLASS.PUNCT].includes(
      node.texClass,
    )
  );
// The width of a space in ems, if it's given in ems.
const spaceWidth = node => {
  const width = node.isKind('mspace') ? node.attributes.get('width') : null;
  return /^\s*-?\d*\.?\d+em\s*$/.test(width || '') ? parseFloat(width) : null;
};
// A space of at least \quad.
const isWideSpace = node => spaceWidth(node) >= 0.9;
// A thin space, as in "x\,dx", which is part of an expression.
const isThinSpace = node =>
  spaceWidth(node) !== null && spaceWidth(node) < 0.25;

// MathJax breaks lines at relations and operators, and (in display maths) at any comma
// or closing bracket. This steers line breaks in a formula's rows to where a reader
// would expect them:
//   - between the items of a list: after a comma that separates bracketed items, as in
//     {(1,2), (2,1)}, or top-level items that are more than a single number or letter,
//     as in "x = 1, y = 2" (but not inside "1, 2, 3")
//   - not inside brackets: never for inline maths (a formula that can only break there
//     is set on lines of its own, as display maths), and only as a last resort for
//     display maths; never inside or next to |x| bars
//   - in a row of clauses, such as "x = 1, \quad y + 2 = 3", between the clauses
//     rather than inside one: never for inline maths, and for display maths only if
//     `strict` is false (convert tries that when the clauses alone don't fit)
//   - never between a closing bracket and the punctuation after it, at a thin space,
//     or inside a product such as ½∫...
function markBreaks(row, inline, strict) {
  const children = row.childNodes;
  const depths = [];
  const inBars = [];
  let depth = 0;
  let bars = false;
  for (const child of children) {
    if (isMo(child, TEXCLASS.OPEN)) {
      depth++;
    } else if (isMo(child, TEXCLASS.CLOSE)) {
      depth = Math.max(0, depth - 1);
    } else if (isBar(child)) {
      bars = !bars;
    }
    depths.push(depth + (bars ? 1 : 0));
    inBars.push(bars);
  }
  // The top-level list item next to a comma, going backwards or forwards from `index`.
  const separates = index =>
    (depths[index] === 0 && isComma(children[index])) ||
    isWords(children[index]);
  const item = (index, step) => {
    const nodes = [];
    for (; children[index] && !separates(index); index += step) {
      nodes.push(children[index]);
    }
    return nodes;
  };
  const setBreak = (node, linebreak) => {
    if (node.attributes.get('linebreak') === 'auto') {
      node.attributes.set('linebreak', linebreak);
    }
  };
  // Whether the comma at `index` separates list items.
  const betweenItems = index => {
    if (
      isMo(children[index - 1], TEXCLASS.CLOSE) &&
      isMo(children[index + 1], TEXCLASS.OPEN)
    ) {
      return true;
    }
    if (depths[index] > 0) {
      return false;
    }
    const before = item(index - 1, -1);
    const after = item(index + 1, 1);
    return (
      after.some(node => isMo(node, TEXCLASS.REL)) ||
      (before.length > 1 && after.length > 1)
    );
  };
  // Separate clauses: list items, \quad spaces or words between them.
  const clauses = children.some(
    (child, index) =>
      depths[index] === 0 &&
      ((isComma(child) && betweenItems(index)) ||
        isWideSpace(child) ||
        isWords(child)),
  );

  children.forEach((child, index) => {
    const next = children[index + 1];
    if (
      inline &&
      child.isKind('mstyle') &&
      child.childNodes.length === 1 &&
      !child.attributes.get('style')
    ) {
      markBreaks(child.childNodes[0], inline, strict);
    } else if (
      child.isEmbellished &&
      child.coreMO().texClass === TEXCLASS.OP &&
      isOperand(children[index - 1])
    ) {
      // A product such as ½∫...: not between the factors.
      setBreak(child.coreMO(), 'nobreak');
      if (!inline && !child.isToken) {
        markRows(child, strict);
      }
    } else if (!inline && !child.isToken) {
      // Display maths may break inside \left( ... \right), the cells of aligned
      // equations and arrays, and so on.
      markRows(child, strict);
    } else if (isBar(child) || isThinSpace(child)) {
      setBreak(child, 'nobreak');
    } else if (isMo(child, TEXCLASS.CLOSE)) {
      if (isMo(next, TEXCLASS.PUNCT)) {
        setBreak(child, 'nobreak');
      }
    } else if (isComma(child)) {
      const between = betweenItems(index);
      if (between && next && inline) {
        if (
          next.isKind('mspace') ||
          isMo(next, TEXCLASS.BIN) ||
          isMo(next, TEXCLASS.REL)
        ) {
          // MathJax breaks before these anyway.
          return;
        }
        // MathJax only breaks inline maths at a comma it is told to break after. The
        // mark finds the comma in the drawing (see convert).
        child.attributes.set('linebreakstyle', 'after');
        child.setProperty('forcebreak', true);
        child.attributes.set(COMMA_BREAK, true);
      } else if (between && next) {
        setBreak(child, 'goodbreak');
      } else if (!inline) {
        setBreak(child, 'badbreak');
      }
    } else if (
      (depths[index] > 0 || clauses) &&
      (isMo(child, TEXCLASS.REL) || isMo(child, TEXCLASS.BIN))
    ) {
      // MathJax itself makes breaks inside brackets (but not bars) less likely.
      const lastResort = depths[index] > 0 ? !inBars[index] : !strict;
      setBreak(child, !inline && lastResort ? 'badbreak' : 'nobreak');
    }
  });
}

// Marks the breaks in every row of a display formula.
function markRows(node, strict) {
  if (node.isKind('mrow') || node.isInferred) {
    markBreaks(node, false, strict);
  } else if (!node.isToken) {
    node.childNodes.forEach(child => child && markRows(child, strict));
  }
}

// Identifies a formula in the prepared sizes (src/math/sizes.json).
export const sizeKey = (tex, display) =>
  hashText(`${display ? 'D' : 'I'}|${tex}`);

// A character whose font file isn't available has no shape: MathJax draws it as
// plain text. (MathJax itself would look it up again and again: the placeholder it
// deletes before loading the file is inherited from another variant, so it stays.)
const getChar = MathJaxNewcmFont.prototype.getChar;
MathJaxNewcmFont.prototype.getChar = function (name, n) {
  const chars = this.variant[name].chars;
  const char = chars[n];
  if (char && !Array.isArray(char) && char.failed) {
    chars[n] = undefined;
    return undefined;
  }
  return getChar.call(this, name, n);
};

// `loadFontFile(name)` synchronously loads one of the font's on-demand files (e.g.
// "arrows"), if it's available.
export function createMathEngine({ loadFontFile }) {
  let document = null;
  let adaptor = null;
  let input = null;
  // Whether display maths may only break between clauses (see markBreaks).
  let strictClauses = true;

  const setup = () => {
    mathjax.asyncLoad = path => {
      const name = path.split('/').pop().replace(/\.js$/, '');
      // MathJax marks a file that isn't available as failed (see getChar above).
      loadFontFile(name);
    };
    mathjax.asyncIsSynchronous = true;
    adaptor = liteAdaptor();
    RegisterHTMLHandler(adaptor);
    input = new TeX({
      packages: TEX_PACKAGES,
      macros: MACROS,
      formatError: (jax, error) => {
        throw new MathError(error.message);
      },
    });
    input.postFilters.add(({ math, data }) => {
      const row = data.root.childNodes[0];
      if (row?.isInferred) {
        markBreaks(row, !math.display, strictClauses);
      }
      if (!math.display) {
        // Have the output split inline maths even where only commas break it.
        data.root.setProperty('process-breaks', true);
      }
    });
    document = mathjax.document('', {
      InputJax: input,
      OutputJax: new SVG({
        fontData: MathJaxNewcmFont,
        fontCache: 'local',
        displayOverflow: 'linebreak',
        linebreaks: { inline: true },
      }),
    });
  };

  // Groups without attributes (MathJax adds one per maths element) are dropped and
  // their contents kept, so fewer elements get drawn.
  const readChildren = (node, glyphs) =>
    adaptor
      .childNodes(node)
      .flatMap(child => {
        const read = readNode(child, glyphs);
        return read?.type === 'g' && Object.keys(read.props).length === 0
          ? read.children
          : [read];
      })
      .filter(child => child !== null && child !== '');

  function readNode(node, glyphs) {
    const kind = adaptor.kind(node);
    if (kind === '#text') {
      return adaptor.value(node);
    }
    if (kind === 'defs' || kind === 'title') {
      return null;
    }
    const attribute = name => adaptor.getAttribute(node, name);
    const props = {};
    const children = readChildren(node, glyphs);
    const transform = attribute('transform');
    if (transform) {
      props.transform = transform;
    }
    const strokeWidth = (attribute('style') || '').match(
      /stroke-width:\s*([\d.]+)/,
    )?.[1];
    const classes = attribute('class') || '';
    const dashes = classes.includes('mjx-dashed')
      ? { strokeDasharray: '140' }
      : classes.includes('mjx-dotted')
        ? { strokeDasharray: '0,140', strokeLinecap: 'round' }
        : null;

    switch (kind) {
      case 'g':
        for (const [name, key] of [
          ['fill', 'fill'],
          ['stroke', 'stroke'],
          ['stroke-width', 'strokeWidth'],
        ]) {
          if (attribute(name) !== undefined && attribute(name) !== null) {
            props[key] = attribute(name);
          }
        }
        return { type: 'g', props, children };
      case 'use': {
        const id = (attribute('xlink:href') || attribute('href') || '').slice(
          1,
        );
        props.d = glyphs[id] || '';
        const x = attribute('x');
        const y = attribute('y');
        if (x || y) {
          props.transform = `translate(${x || 0},${y || 0}) ${
            props.transform || ''
          }`.trim();
        }
        return { type: 'path', props, children: [] };
      }
      case 'path':
        props.d = attribute('d');
        return { type: 'path', props, children: [] };
      case 'rect': {
        for (const name of ['x', 'y', 'width', 'height']) {
          props[name] = parseFloat(attribute(name) || 0);
        }
        if (attribute('data-frame') !== undefined && attribute('data-frame')) {
          Object.assign(props, {
            fill: 'none',
            stroke: 'currentColor',
            strokeWidth: TABLE_STROKE,
          });
        }
        if (strokeWidth) {
          Object.assign(props, { fill: 'none', strokeWidth });
        }
        return { type: 'rect', props: { ...props, ...dashes }, children: [] };
      }
      case 'line':
        for (const name of ['x1', 'y1', 'x2', 'y2']) {
          props[name] = parseFloat(attribute(name) || 0);
        }
        Object.assign(props, {
          stroke: 'currentColor',
          strokeWidth: strokeWidth || TABLE_STROKE,
          ...dashes,
        });
        return { type: 'line', props, children: [] };
      case 'svg': {
        const viewport = {};
        for (const name of ['x', 'y', 'width', 'height']) {
          viewport[name] = attribute(name) ? toUnits(attribute(name)) : null;
        }
        const viewBox = attribute('viewBox');
        if (viewport.width === null || viewport.height === null || !viewBox) {
          // No viewport of its own: just place the contents.
          return {
            type: 'g',
            props: {
              transform: `translate(${viewport.x || 0},${viewport.y || 0})`,
            },
            children,
          };
        }
        viewport.x = viewport.x || 0;
        viewport.y = viewport.y || 0;
        return {
          type: 'clip',
          props: viewport,
          children: [
            {
              type: 'g',
              props: {
                transform: viewportTransform(
                  viewport,
                  viewBox,
                  attribute('preserveAspectRatio'),
                ),
              },
              children,
            },
          ],
        };
      }
      case 'text':
        for (const [name, key] of [
          ['x', 'x'],
          ['y', 'y'],
          ['font-family', 'fontFamily'],
          ['font-size', 'fontSize'],
          ['font-style', 'fontStyle'],
          ['font-weight', 'fontWeight'],
        ]) {
          if (attribute(name)) {
            props[key] = attribute(name);
          }
        }
        return {
          type: 'text',
          props,
          children: [],
          text: children.filter(child => typeof child === 'string').join(''),
        };
      default:
        // Grouping elements MathJax may add (links, annotations): keep the contents.
        return { type: 'g', props, children };
    }
  }

  function readSvg(svg, glyphs) {
    const depth = exToEm(
      -(
        (adaptor.getAttribute(svg, 'style') || '').match(
          /vertical-align:\s*(-?[\d.]+)ex/,
        )?.[1] || 0
      ),
    );
    return {
      width: exToEm(adaptor.getAttribute(svg, 'width')),
      height: exToEm(adaptor.getAttribute(svg, 'height')),
      depth,
      viewBox: adaptor.getAttribute(svg, 'viewBox'),
      nodes: readChildren(svg, glyphs),
    };
  }

  function breakSpace(node) {
    const size = adaptor.getAttribute(node, 'size');
    if (size in BREAK_SPACES) {
      return BREAK_SPACES[size];
    }
    const spacing = (adaptor.getAttribute(node, 'style') || '').match(
      /letter-spacing:\s*(-?[\d.]+)em/,
    )?.[1];
    return spacing ? Math.max(0, 1 + parseFloat(spacing)) : 0;
  }

  // Display maths (and `block` maths) is one drawing, broken into lines to fit
  // `widthEm`. Inline maths comes in pieces split where a line may break (after
  // relations and operators), each with the space that follows it, so the pieces can
  // wrap with the surrounding words: { width, height, depth, pieces }. `block` sets
  // inline maths on lines of its own at text size, for formulas whose pieces don't fit
  // on a line. Throws MathError for TeX that doesn't parse.
  function convert(tex, options = {}) {
    if (!document) {
      setup();
    }
    const layout = convertOnce(tex, options);
    const { display, block, widthEm } = options;
    if ((display || block) && widthEm && layout.width > widthEm) {
      // The clauses don't fit on lines of their own: let them break inside too.
      strictClauses = false;
      try {
        const relaxed = convertOnce(tex, options);
        return relaxed.width < layout.width ? relaxed : layout;
      } finally {
        strictClauses = true;
      }
    }
    return layout;
  }

  function convertOnce(tex, { display = false, widthEm, block = false }) {
    const asDisplay = display || block;
    // Each formula stands alone: \label names and equation numbers don't carry over.
    input.reset();
    const container = document.convert(
      block ? `\\textstyle ${tex}` : String(tex),
      {
        display: asDisplay,
        em: EM_PX,
        ex: EX_PX,
        containerWidth: widthEm ? widthEm * EM_PX : 100000,
      },
    );
    // Glyph shapes are defined once, in the first piece, and used by all of them.
    const glyphs = {};
    for (const path of adaptor.tags(container, 'path')) {
      const id = adaptor.getAttribute(path, 'id');
      if (id) {
        glyphs[id] = adaptor.getAttribute(path, 'd');
      }
    }
    const pieces = [];
    for (const child of adaptor.childNodes(container)) {
      const kind = adaptor.kind(child);
      if (kind === 'svg') {
        // MathJax leaves out the thin space after a comma it breaks after.
        const endsWithComma = adaptor
          .tags(child, 'g')
          .some(g => adaptor.getAttribute(g, COMMA_BREAK));
        pieces.push({
          ...readSvg(child, glyphs),
          gap: endsWithComma ? THIN_SPACE * MATH_SCALE : 0,
        });
      } else if (kind === 'mjx-break' && pieces.length > 0) {
        const piece = pieces[pieces.length - 1];
        piece.gap = Math.max(piece.gap, breakSpace(child) * MATH_SCALE);
      }
    }
    if (pieces.length === 0) {
      throw new MathError('MathJax produced no drawing');
    }
    if (asDisplay) {
      const { gap, ...layout } = pieces[0];
      return layout;
    }
    return {
      width: pieces.reduce((sum, piece) => sum + piece.width + piece.gap, 0),
      height:
        Math.max(...pieces.map(piece => piece.height - piece.depth)) +
        Math.max(...pieces.map(piece => piece.depth)),
      depth: Math.max(...pieces.map(piece => piece.depth)),
      pieces,
    };
  }

  return { convert };
}
