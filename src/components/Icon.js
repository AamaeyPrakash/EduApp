import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useTheme } from '../theme';

// Line icons in the style of SF Symbols, drawn on a 24-point grid. Each icon is a list
// of shapes; `filled` icons are solid instead of outlined.
const ICONS = {
  home: [
    ['path', 'M3.5 10.5 12 3.5l8.5 7'],
    ['path', 'M5.5 9v10.5a1 1 0 0 0 1 1h3.5v-6h4v6h3.5a1 1 0 0 0 1-1V9'],
  ],
  sparkles: {
    filled: true,
    shapes: [
      [
        'path',
        'M10.5 3c.6 4.2 2.6 6.2 6.8 6.8-4.2.6-6.2 2.6-6.8 6.8-.6-4.2-2.6-6.2-6.8-6.8C7.9 9.2 9.9 7.2 10.5 3Z',
      ],
      [
        'path',
        'M18 14.5c.3 1.9 1.2 2.8 3 3-1.8.3-2.7 1.2-3 3-.3-1.8-1.2-2.7-3-3 1.8-.2 2.7-1.1 3-3Z',
      ],
    ],
  },
  person: [
    ['circle', 12, 8, 4],
    ['path', 'M4.5 20.5c0-3.9 3.4-6.3 7.5-6.3s7.5 2.4 7.5 6.3'],
  ],
  search: [
    ['circle', 10.5, 10.5, 6.5],
    ['path', 'm15.5 15.5 5 5'],
  ],
  bookmark: [
    [
      'path',
      'M6.5 3.5h11a1 1 0 0 1 1 1v16l-6.5-4.2-6.5 4.2v-16a1 1 0 0 1 1-1Z',
    ],
  ],
  bookmarkFill: {
    filled: true,
    shapes: [
      [
        'path',
        'M6.5 3.5h11a1 1 0 0 1 1 1v16l-6.5-4.2-6.5 4.2v-16a1 1 0 0 1 1-1Z',
      ],
    ],
  },
  flame: {
    filled: true,
    shapes: [
      [
        'path',
        'M12.3 2.5c.4 3.1 4.7 5.2 4.7 10.2a5 5 0 0 1-10 0c0-2.3 1.1-3.9 2.3-5 .1 1.6.9 2.7 2.1 3.2-.2-3.5.4-5.9.9-8.4Z',
      ],
    ],
  },
  check: [['path', 'm5 12.5 4.5 4.5L19 7.5']],
  close: [['path', 'M6.5 6.5l11 11M17.5 6.5l-11 11']],
  chevronRight: [['path', 'm9.5 5.5 6.5 6.5-6.5 6.5']],
  chevronLeft: [['path', 'M14.5 5.5 8 12l6.5 6.5']],
  chevronDown: [['path', 'm5.5 9.5 6.5 6.5 6.5-6.5']],
  chevronUp: [['path', 'm5.5 14.5 6.5-6.5 6.5 6.5']],
  arrowUp: [['path', 'M12 19.5v-15M5.5 11 12 4.5l6.5 6.5']],
  retry: [
    ['path', 'M19.5 12a7.5 7.5 0 1 1-2.2-5.3'],
    ['path', 'M19.5 4v4h-4'],
  ],
  lightbulb: [
    ['path', 'M9.5 18h5M10.5 21h3'],
    [
      'path',
      'M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.1v.1h5v-.1c0-.8.4-1.6 1.1-2.1A6 6 0 0 0 12 3Z',
    ],
  ],
  calculator: [
    ['rect', 5, 2.5, 14, 19, 2.5],
    ['rect', 8, 5.5, 8, 3.5, 1],
    ['dot', 8.8, 12.5],
    ['dot', 12, 12.5],
    ['dot', 15.2, 12.5],
    ['dot', 8.8, 16.5],
    ['dot', 12, 16.5],
    ['dot', 15.2, 16.5],
  ],
  noCalculator: [
    ['rect', 5, 2.5, 14, 19, 2.5],
    ['rect', 8, 5.5, 8, 3.5, 1],
    ['path', 'M3 3l18 18'],
  ],
  shuffle: [
    ['path', 'M3 7h3.5c2 0 3.2 1 4.3 2.8l2.4 4.4C14.3 16 15.5 17 17.5 17H21'],
    [
      'path',
      'M3 17h3.5c1.3 0 2.3-.4 3.1-1.2M14.4 8.2c.8-.8 1.8-1.2 3.1-1.2H21',
    ],
    ['path', 'm18.5 4.5 2.5 2.5-2.5 2.5M18.5 14.5l2.5 2.5-2.5 2.5'],
  ],
  timer: [
    ['circle', 12, 13.5, 7.5],
    ['path', 'M12 10v3.5l2.3 2.3M9.5 2.5h5'],
  ],
  book: [
    [
      'path',
      'M3.5 5.5c0-.8.7-1.5 1.5-1.5h4.5A2.5 2.5 0 0 1 12 6.5V20a2 2 0 0 0-2-2H5a1.5 1.5 0 0 1-1.5-1.5Z',
    ],
    [
      'path',
      'M20.5 5.5c0-.8-.7-1.5-1.5-1.5h-4.5A2.5 2.5 0 0 0 12 6.5V20a2 2 0 0 1 2-2h5a1.5 1.5 0 0 0 1.5-1.5Z',
    ],
  ],
  clock: [
    ['circle', 12, 12, 8.5],
    ['path', 'M12 7.5V12l3 2'],
  ],
  mistake: [
    ['circle', 12, 12, 8.5],
    ['path', 'm9.2 9.2 5.6 5.6M14.8 9.2l-5.6 5.6'],
  ],
  pencil: [
    ['path', 'M4.5 19.5h4l10-10a2.1 2.1 0 0 0-4-4l-10 10Z'],
    ['path', 'm13.5 7 3.5 3.5'],
  ],
  logout: [
    ['path', 'M10 4.5H6.5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2H10'],
    ['path', 'M15.5 16l4-4-4-4M19.5 12H9.5'],
  ],
  trash: [
    ['path', 'M4.5 7h15M10 11v6M14 11v6'],
    [
      'path',
      'M6.5 7l.9 12.1a1 1 0 0 0 1 .9h7.2a1 1 0 0 0 1-.9L17.5 7M9 7V4.5h6V7',
    ],
  ],
  lock: [
    ['rect', 5, 10.5, 14, 10, 2.5],
    ['path', 'M8 10.5v-3a4 4 0 0 1 8 0v3'],
  ],
  envelope: [
    ['rect', 3, 5, 18, 14, 2.5],
    ['path', 'm3.8 6.5 8.2 6.3 8.2-6.3'],
  ],
  compose: [
    ['path', 'M12 4.5H6.5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V12'],
    ['path', 'M18.2 3.3a1.8 1.8 0 0 1 2.5 2.5L13 13.5l-3.3.8.8-3.3Z'],
  ],
  target: [
    ['circle', 12, 12, 8.5],
    ['circle', 12, 12, 4.5],
    ['dot', 12, 12],
  ],
  play: {
    filled: true,
    shapes: [
      [
        'path',
        'M8 5.2v13.6a.8.8 0 0 0 1.2.7l10.6-6.8a.8.8 0 0 0 0-1.4L9.2 4.5A.8.8 0 0 0 8 5.2Z',
      ],
    ],
  },
  graduation: [
    ['path', 'M2.5 9 12 4.5 21.5 9 12 13.5Z'],
    ['path', 'M6.5 11v4.5c0 1.4 2.5 3 5.5 3s5.5-1.6 5.5-3V11M21.5 9v5'],
  ],
  chart: [['path', 'M5 20v-7M10 20V9M15 20v-5M20 20V4']],
  info: [
    ['circle', 12, 12, 8.5],
    ['path', 'M12 11v5.5'],
    ['dot', 12, 7.8],
  ],
};

// `color` is a theme colour name or any colour.
export default function Icon({
  name,
  size = 22,
  color = 'label',
  strokeWidth = 1.8,
}) {
  const { colors } = useTheme();
  const definition = ICONS[name];
  if (!definition) {
    return null;
  }
  const { filled = false, shapes } = Array.isArray(definition)
    ? { shapes: definition }
    : definition;
  const paint = colors[color] ?? color;
  const stroke = filled
    ? { fill: paint }
    : {
        fill: 'none',
        stroke: paint,
        strokeWidth,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {shapes.map(([kind, ...args], index) => {
        if (kind === 'path') {
          return <Path key={index} d={args[0]} {...stroke} />;
        }
        if (kind === 'circle') {
          return (
            <Circle
              key={index}
              cx={args[0]}
              cy={args[1]}
              r={args[2]}
              {...stroke}
            />
          );
        }
        if (kind === 'rect') {
          return (
            <Rect
              key={index}
              x={args[0]}
              y={args[1]}
              width={args[2]}
              height={args[3]}
              rx={args[4]}
              {...stroke}
            />
          );
        }
        // A small solid dot, e.g. calculator keys.
        return (
          <Circle key={index} cx={args[0]} cy={args[1]} r={1.1} fill={paint} />
        );
      })}
    </Svg>
  );
}

export const ICON_NAMES = Object.keys(ICONS);
