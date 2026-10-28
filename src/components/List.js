import React, { Children, Fragment, isValidElement } from 'react';
import { StyleSheet, View } from 'react-native';
import { continuous, gutter, makeStyles, radius, useTheme } from '../theme';
import AppText from './AppText';
import Icon from './Icon';
import PressableScale from './PressableScale';

// An inset grouped list section, as in iOS Settings: an optional header, rows on a
// rounded surface separated by hairlines, and an optional footer.
export function Section({ title, footer, children, style }) {
  const styles = useStyles();
  const rows = Children.toArray(children).filter(isValidElement);
  return (
    <View style={[styles.section, style]}>
      {title ? (
        <AppText
          variant="title3"
          weight="700"
          style={styles.title}
          accessibilityRole="header"
        >
          {title}
        </AppText>
      ) : null}
      {rows.length > 0 ? (
        <View style={styles.group}>
          {rows.map((row, index) => (
            <Fragment key={row.key ?? index}>
              {index > 0 ? <View style={styles.separator} /> : null}
              {row}
            </Fragment>
          ))}
        </View>
      ) : null}
      {footer ? (
        <AppText
          variant="footnote"
          color="secondaryLabel"
          style={styles.footer}
        >
          {footer}
        </AppText>
      ) : null}
    </View>
  );
}

// A row with an optional coloured icon tile (or any `leading` element), a title and
// subtitle, and a trailing value, custom accessory or chevron. Rows with onPress are
// buttons.
export function Row({
  title,
  subtitle,
  icon,
  iconColor = 'tint',
  leading,
  value,
  accessory,
  chevron,
  onPress,
  destructive = false,
  accessibilityLabel,
  testID,
}) {
  const styles = useStyles();
  const showChevron = chevron ?? Boolean(onPress && !destructive);
  const content = (
    <View style={styles.row}>
      {icon || leading ? (
        <View style={styles.iconTile}>
          {leading ?? <IconTile name={icon} color={iconColor} />}
        </View>
      ) : null}
      <View style={styles.text}>
        <AppText
          variant="body"
          color={destructive ? 'red' : 'label'}
          numberOfLines={2}
        >
          {title}
        </AppText>
        {subtitle ? (
          <AppText
            variant="footnote"
            color="secondaryLabel"
            style={styles.subtitle}
          >
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {value !== undefined && value !== null ? (
        <AppText variant="body" color="secondaryLabel" style={styles.value}>
          {value}
        </AppText>
      ) : null}
      {accessory}
      {showChevron ? (
        <View style={styles.chevron}>
          <Icon
            name="chevronRight"
            size={16}
            color="tertiaryLabel"
            strokeWidth={2.4}
          />
        </View>
      ) : null}
    </View>
  );
  if (!onPress) {
    return content;
  }
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.98}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      {content}
    </PressableScale>
  );
}

// A small rounded square with a white icon on a coloured background (Settings style).
export function IconTile({ name, color = 'tint', size = 30 }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.tile,
        {
          width: size,
          height: size,
          borderRadius: size * 0.26,
          backgroundColor: colors[color] ?? color,
        },
      ]}
    >
      <Icon name={name} size={size * 0.62} color="#FFFFFF" strokeWidth={2} />
    </View>
  );
}

const useStyles = makeStyles(theme => ({
  section: {
    marginBottom: 28,
  },
  title: {
    marginBottom: 10,
    marginLeft: 4,
  },
  group: {
    ...continuous,
    backgroundColor: theme.colors.surface,
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.separator,
    marginLeft: gutter,
  },
  footer: {
    marginTop: 8,
    marginHorizontal: gutter,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingHorizontal: gutter,
    paddingVertical: 11,
  },
  iconTile: {
    marginRight: 12,
  },
  tile: {
    ...continuous,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
  },
  subtitle: {
    marginTop: 2,
  },
  value: {
    marginLeft: 8,
  },
  chevron: {
    marginLeft: 8,
  },
}));
