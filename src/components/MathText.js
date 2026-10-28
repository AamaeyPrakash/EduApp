import React, { Component, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { type, useTheme } from '../theme';
import { parseMathContent } from '../lib/mathContent';
import { texToSpeech } from '../lib/mathSpeech';
import MathView from './MathView';

// Words keep their trailing space so they can wrap around inline formulas.
const splitWords = value => value.match(/\S+\s*|\s+/g) || [];

// Punctuation straight after a formula stays on its line: "$x$, where" never puts
// the comma at the start of the next line.
const LEADING_PUNCTUATION = /^[,.;:!?)\]]+\s*/;

// What a screen reader says for a line: its text, with formulas read out in words.
const spokenLine = tokens =>
  tokens
    .map(token =>
      token.type === 'math' ? texToSpeech(token.value) : token.value,
    )
    .join('');

// If anything goes wrong while drawing formulas, show the raw text instead of crashing
// the whole screen.
class MathErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    if (__DEV__) {
      console.warn('MathText failed to render', error);
    }
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function Line({ tokens, textStyle, color }) {
  if (tokens.length === 0) {
    return <View style={styles.paragraphGap} />;
  }
  if (!tokens.some(token => token.type === 'math')) {
    return (
      <Text style={[styles.text, { color }, textStyle]}>
        {tokens.map(token => token.value).join('')}
      </Text>
    );
  }
  const items = [];
  let carried = '';
  tokens.forEach((token, tokenIndex) => {
    if (token.type === 'math') {
      const next = tokens[tokenIndex + 1];
      const punctuation =
        next?.type === 'text'
          ? next.value.match(LEADING_PUNCTUATION)?.[0]
          : null;
      const formula = (
        <MathView
          key={`math-${tokenIndex}`}
          math={token.value}
          style={styles.inlineMath}
        />
      );
      if (punctuation) {
        carried = punctuation;
        items.push(
          <View key={`math-${tokenIndex}`} style={styles.attached}>
            {formula}
            <Text style={[styles.text, { color }, textStyle]}>
              {punctuation}
            </Text>
          </View>,
        );
      } else {
        items.push(formula);
      }
      return;
    }
    const text = token.value.slice(carried.length);
    carried = '';
    splitWords(text).forEach((word, wordIndex) =>
      items.push(
        <Text
          key={`text-${tokenIndex}-${wordIndex}`}
          style={[styles.text, { color }, textStyle]}
        >
          {word}
        </Text>,
      ),
    );
  });
  return (
    <View
      style={styles.inlineRow}
      accessible
      accessibilityLabel={spokenLine(tokens)}
    >
      {items}
    </View>
  );
}

// Text with TeX formulas, e.g. "Solve $x^2 = 4$" or "$$\int_0^1 x\,dx$$".
export default function MathText({ content, style, textStyle }) {
  const { colors } = useTheme();
  const blocks = useMemo(() => parseMathContent(content), [content]);
  return (
    <MathErrorBoundary
      fallback={
        <Text style={[styles.text, { color: colors.label }, textStyle]}>
          {content}
        </Text>
      }
    >
      <View style={[styles.container, style]}>
        {blocks.map((block, index) =>
          block.type === 'display' ? (
            <View
              key={index}
              style={styles.displayRow}
              accessible
              accessibilityLabel={texToSpeech(block.math)}
            >
              <MathView math={block.math} display />
            </View>
          ) : (
            <Line
              key={index}
              tokens={block.tokens}
              textStyle={textStyle}
              color={colors.label}
            />
          ),
        )}
      </View>
    </MathErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  text: {
    ...type.body,
    lineHeight: 25,
  },
  inlineRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  inlineMath: {
    marginHorizontal: 2,
  },
  attached: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '100%',
  },
  displayRow: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 10,
  },
  paragraphGap: {
    height: 8,
  },
});
