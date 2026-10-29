import React, { useId, useMemo, useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Svg, {
  ClipPath,
  Defs,
  G,
  Line,
  Path,
  Rect,
  Text as SvgText,
} from 'react-native-svg';
import { texToPlain } from '../lib/mathSpeech';
import { cachedLayout, preparedSize, useMathLayout } from '../math';
import { type, useTheme } from '../theme';

// Formulas are sized to the body text (17 pt) and follow the system text size.
const EM = 17;
const MAX_FONT_SCALE = 3;
// A display formula a little too wide for the space is drawn smaller, down to this
// scale, rather than broken into lines; one that is still too wide when broken, such
// as a table, down to the second, rather than scrolled.
const MIN_SCALE = 0.85;
const MIN_SCALE_BROKEN = 0.8;
// Inline maths that reaches beyond the line of text it sits in (in ems above and
// below the baseline) gets a little space on that side, so it doesn't touch the
// lines next to it, as TeX's \lineskip does.
const LINE_ABOVE = 1.1;
const LINE_BELOW = 0.45;
const LINE_SKIP = 0.15;

// Draws the engine's nodes (see math/engine.js) with react-native-svg. Clip rectangles
// are collected into `clips` for the drawing's <Defs>.
function draw(nodes, idPrefix, clips) {
  return nodes.map((node, index) => {
    switch (node.type) {
      case 'g':
        return (
          <G key={index} {...node.props}>
            {draw(node.children, idPrefix, clips)}
          </G>
        );
      case 'path':
        return <Path key={index} {...node.props} />;
      case 'rect':
        return <Rect key={index} {...node.props} />;
      case 'line':
        return <Line key={index} {...node.props} />;
      case 'text':
        return (
          <SvgText key={index} {...node.props}>
            {node.text}
          </SvgText>
        );
      case 'clip': {
        const id = `${idPrefix}c${clips.length}`;
        clips.push(
          <ClipPath key={id} id={id}>
            <Rect {...node.props} />
          </ClipPath>,
        );
        return (
          <G key={index} clipPath={`url(#${id})`}>
            {draw(node.children, idPrefix, clips)}
          </G>
        );
      }
      default:
        return null;
    }
  });
}

function Drawing({ layout, width, height, color }) {
  // Clip ids must be unique on the screen (the web shares one document).
  const idPrefix = `m${useId().replace(/[^A-Za-z0-9]/g, '')}`;
  const content = useMemo(() => {
    const clips = [];
    const body = draw(layout.nodes, idPrefix, clips);
    return (
      <>
        {clips.length > 0 ? <Defs>{clips}</Defs> : null}
        {body}
      </>
    );
  }, [layout, idPrefix]);
  return (
    <Svg width={width} height={height} viewBox={layout.viewBox} color={color}>
      {content}
    </Svg>
  );
}

// Draws one piece of maths, sized in pixels. Inline pieces sit on the text baseline
// (lay them out in a row with alignItems: 'baseline'): the box is only as tall as the
// part above the baseline, and the part below is kept free with a margin. Anything
// wider than `maxWidth`, such as a large matrix, scrolls sideways.
function Piece({ layout, size, em, maxWidth, color, inline, style }) {
  const width = size.width * em;
  const height = size.height * em;
  const depth = size.depth * em;
  const scrolls = Boolean(maxWidth) && width > maxWidth + 0.5;
  let drawing = layout ? (
    <Drawing layout={layout} width={width} height={height} color={color} />
  ) : null;
  if (drawing && scrolls) {
    drawing = (
      <ScrollView
        horizontal
        style={{ width: maxWidth, height }}
        showsHorizontalScrollIndicator
        persistentScrollbar
      >
        {drawing}
      </ScrollView>
    );
  }
  const boxWidth = scrolls ? maxWidth : width;
  if (!inline) {
    return <View style={[{ width: boxWidth, height }, style]}>{drawing}</View>;
  }
  const skip = LINE_SKIP * em;
  const skipAbove = size.height - size.depth > LINE_ABOVE ? skip : 0;
  const skipBelow = size.depth > LINE_BELOW ? skip : 0;
  return (
    <View
      style={[
        {
          width: boxWidth,
          height: height - depth,
          marginTop: skipAbove,
          marginBottom: depth + skipBelow,
        },
        style,
      ]}
    >
      <View style={styles.overflow}>{drawing}</View>
    </View>
  );
}

const fits = (size, em, maxWidth) => !maxWidth || size.width * em <= maxWidth;
const fitsSmaller = (size, em, maxWidth, minScale = MIN_SCALE) =>
  fits(size, em * minScale, maxWidth);

// One TeX formula. Display formulas are drawn smaller or broken into lines to fit
// `maxWidth`. An inline
// formula moves to the next line as a whole, like a word, when it doesn't fit at the
// end of a line; one wider than a line comes in pieces that wrap with the words around
// them, and one with a piece too wide for a line is set on lines of its own instead.
// `after` is text (e.g. punctuation) that must stay on the same line as the formula's
// end. While a formula is being converted, the space it will take is kept free.
export default function MathView({
  math,
  display = false,
  maxWidth,
  color,
  style,
  after,
}) {
  const { colors } = useTheme();
  const { fontScale } = useWindowDimensions();
  const em = EM * Math.min(fontScale || 1, MAX_FONT_SCALE);
  const ink = color ?? colors.label;

  const prepared = preparedSize(math, display);
  const natural = prepared ?? cachedLayout(math, { display });
  const widthEm = maxWidth ? Math.floor((maxWidth / em) * 4) / 4 : undefined;
  let options = { display };
  if (display && natural && !fitsSmaller(natural, em, maxWidth)) {
    options = { display, widthEm };
  } else if (
    !display &&
    natural &&
    natural.pieces.some(piece => !fits(piece, em, maxWidth))
  ) {
    options = { block: true, widthEm };
  }
  const converted = useMathLayout(math, options);

  // Keep showing the previous drawing while a narrower version is converted.
  const last = useRef(null);
  if (converted && last.current?.math !== math) {
    last.current = null;
  }
  if (converted) {
    last.current = { math, layout: converted };
  }
  const layout = converted ?? last.current?.layout;

  if (layout?.error) {
    return (
      <Text
        style={[
          styles.fallback,
          display && styles.fallbackDisplay,
          { color: ink },
          style,
        ]}
      >
        {texToPlain(math)}
        {after}
      </Text>
    );
  }

  // While a block version is converted, the inline pieces keep showing.
  const blockReady = options.block && layout && !layout.pieces;
  if (display || blockReady || (options.block && !layout)) {
    // One drawing: display maths, or inline maths set on lines of its own.
    const drawn = layout && !layout.pieces ? layout : null;
    const size = drawn ??
      (display ? prepared : null) ?? { width: 1, height: 1.2, depth: 0.3 };
    const minScale = options.widthEm ? MIN_SCALE_BROKEN : MIN_SCALE;
    const scale =
      !fits(size, em, maxWidth) && fitsSmaller(size, em, maxWidth, minScale)
        ? maxWidth / (size.width * em)
        : 1;
    const piece = (
      <Piece
        layout={drawn}
        size={size}
        em={em * scale}
        maxWidth={maxWidth}
        color={ink}
        inline={!display}
        style={style}
      />
    );
    return after ? (
      <View style={styles.together}>
        {piece}
        {after}
      </View>
    ) : (
      piece
    );
  }

  // Inline maths in pieces; before it's converted, boxes of the prepared sizes (or
  // one small box) keep its place.
  const pieces = layout?.pieces ??
    prepared?.pieces ?? [{ width: 1, height: 1, depth: 0.25, gap: 0 }];
  const drawn = pieces.map((piece, index) => (
    <Piece
      key={index}
      layout={layout ? piece : null}
      size={piece}
      em={em}
      maxWidth={maxWidth}
      color={ink}
      inline
      style={[
        style,
        index > 0 && styles.noMarginLeft,
        index < pieces.length - 1 && { marginRight: piece.gap * em },
      ]}
    />
  ));
  const whole = !natural || fits(natural, em, maxWidth);
  if (whole || pieces.length === 1) {
    return drawn.length === 1 && !after ? (
      drawn[0]
    ) : (
      <View style={styles.together}>
        {drawn}
        {after}
      </View>
    );
  }
  // The last piece keeps `after` with it.
  return after
    ? [
        ...drawn.slice(0, -1),
        <View key="last" style={styles.together}>
          {drawn[drawn.length - 1]}
          {after}
        </View>,
      ]
    : drawn;
}

const styles = StyleSheet.create({
  overflow: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  fallback: {
    ...type.body,
    fontStyle: 'italic',
  },
  fallbackDisplay: {
    textAlign: 'center',
  },
  together: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  noMarginLeft: {
    marginLeft: 0,
  },
});
