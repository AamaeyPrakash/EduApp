import React, { useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { gutter, makeStyles, type } from '../theme';
import AmbientGlow from './AmbientGlow';
import AppText from './AppText';
import { GlassIconButton } from './Glass';
import { useTabBarSpace } from './TabBar';

const BAR_HEIGHT = 56;

// The bar along the top of a screen: a round glass back/close button on the left, a
// small title in the middle and optional buttons on the right. `titleOpacity` lets a
// scrolling screen fade the small title in once the large title has scrolled away.
export function TopBar({
  title,
  onBack,
  backIcon = 'chevronLeft',
  backLabel = 'Back',
  right,
  titleOpacity,
  backgroundOpacity,
}) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.bar,
        { paddingTop: insets.top, height: insets.top + BAR_HEIGHT },
      ]}
      pointerEvents="box-none"
    >
      {backgroundOpacity ? (
        <Animated.View
          pointerEvents="none"
          style={[styles.barBackground, { opacity: backgroundOpacity }]}
        />
      ) : null}
      <View style={styles.barRow} pointerEvents="box-none">
        <View style={styles.side}>
          {onBack ? (
            <GlassIconButton
              icon={backIcon}
              onPress={onBack}
              accessibilityLabel={backLabel}
            />
          ) : null}
        </View>
        <Animated.Text
          style={[
            styles.barTitle,
            titleOpacity ? { opacity: titleOpacity } : null,
          ]}
          numberOfLines={1}
          accessibilityRole="header"
        >
          {title || ''}
        </Animated.Text>
        <View style={[styles.side, styles.sideRight]}>{right}</View>
      </View>
    </View>
  );
}

// A scrolling screen with an iOS large title. When the title scrolls away it shows up
// small in the top bar, which gains a background so content doesn't clash with it.
// `tabBar` leaves room for the floating tab bar; `glow` adds the ambient colour wash.
// With `list` ({ data, renderItem, keyExtractor }) the screen is a virtualised list
// and `children` go above its items.
export default function Screen({
  title,
  eyebrow,
  subtitle,
  onBack,
  backIcon,
  backLabel,
  right,
  glow = false,
  tabBar = false,
  children,
  contentStyle,
  keyboardShouldPersistTaps = 'handled',
  list,
}) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const tabBarSpace = useTabBarSpace();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [titleHeight, setTitleHeight] = useState(60);
  const showBar = onBack || right;

  const backgroundOpacity = scrollY.interpolate({
    inputRange: [0, 20],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const titleOpacity = scrollY.interpolate({
    inputRange: [titleHeight * 0.6, titleHeight],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const header = (
    <>
      {title ? (
        <View
          style={styles.titleBlock}
          onLayout={event => setTitleHeight(event.nativeEvent.layout.height)}
        >
          {eyebrow ? (
            <AppText variant="subheadline" color="secondaryLabel" weight="600">
              {eyebrow}
            </AppText>
          ) : null}
          <AppText variant="largeTitle" accessibilityRole="header">
            {title}
          </AppText>
          {subtitle ? (
            <AppText
              variant="subheadline"
              color="secondaryLabel"
              style={styles.subtitle}
            >
              {subtitle}
            </AppText>
          ) : null}
        </View>
      ) : null}
      {children}
    </>
  );
  const scrollProps = {
    contentContainerStyle: [
      styles.content,
      {
        paddingTop: insets.top + (showBar ? BAR_HEIGHT : 16),
        paddingBottom: tabBar ? tabBarSpace : insets.bottom + 32,
      },
      contentStyle,
    ],
    keyboardShouldPersistTaps,
    showsVerticalScrollIndicator: false,
    scrollEventThrottle: 16,
    onScroll: Animated.event(
      [{ nativeEvent: { contentOffset: { y: scrollY } } }],
      { useNativeDriver: true },
    ),
  };

  return (
    <View style={styles.screen}>
      {glow ? <AmbientGlow /> : null}
      {list ? (
        <Animated.FlatList
          {...scrollProps}
          {...list}
          ListHeaderComponent={header}
          initialNumToRender={4}
          maxToRenderPerBatch={4}
          windowSize={7}
        />
      ) : (
        <Animated.ScrollView {...scrollProps}>{header}</Animated.ScrollView>
      )}
      {showBar ? (
        <TopBar
          title={title}
          onBack={onBack}
          backIcon={backIcon}
          backLabel={backLabel}
          right={right}
          titleOpacity={titleOpacity}
          backgroundOpacity={backgroundOpacity}
        />
      ) : (
        // The status bar area still gets a background once content scrolls under it.
        <Animated.View
          pointerEvents="none"
          style={[
            styles.statusBackground,
            { height: insets.top, opacity: backgroundOpacity },
          ]}
        />
      )}
    </View>
  );
}

const useStyles = makeStyles(theme => ({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    paddingHorizontal: gutter,
  },
  titleBlock: {
    paddingHorizontal: 4,
    paddingBottom: 20,
  },
  subtitle: {
    marginTop: 4,
  },
  bar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  barBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.separator,
  },
  barRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: gutter,
  },
  side: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  sideRight: {
    justifyContent: 'flex-end',
  },
  barTitle: {
    ...type.headline,
    flex: 2,
    textAlign: 'center',
    marginHorizontal: 8,
    color: theme.colors.label,
  },
  statusBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.background,
  },
}));
