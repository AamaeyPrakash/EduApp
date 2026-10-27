import React, { useEffect, useRef, useState } from 'react';
import { Animated, Keyboard, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { continuous, radius, useTheme } from '../theme';
import AppText from './AppText';
import Glass from './Glass';
import Icon from './Icon';

const BAR_HEIGHT = 64;
const BAR_WIDTH = 300;
const ITEM_INSET = 5;

// Distance from the bottom of the screen to the top of the floating bar.
export function useTabBarTop() {
  const insets = useSafeAreaInsets();
  return BAR_HEIGHT + Math.max(insets.bottom, 12);
}

// Room to leave below scrolling content so the last item clears the floating bar.
export function useTabBarSpace() {
  return useTabBarTop() + 24;
}

function useKeyboardShown() {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const showing = Keyboard.addListener('keyboardDidShow', () =>
      setShown(true),
    );
    const hiding = Keyboard.addListener('keyboardDidHide', () =>
      setShown(false),
    );
    return () => {
      showing.remove();
      hiding.remove();
    };
  }, []);
  return shown;
}

// The tab bar as a floating glass capsule (iOS 26). A lighter "lens" slides to the
// selected tab. Each tab's icon comes from its `tabBarIcon` option (an icon name).
export default function TabBar({ state, descriptors, navigation }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const keyboardShown = useKeyboardShown();
  const itemWidth = (BAR_WIDTH - ITEM_INSET * 2) / state.routes.length;
  const position = useRef(new Animated.Value(state.index)).current;

  useEffect(() => {
    Animated.spring(position, {
      toValue: state.index,
      useNativeDriver: true,
      speed: 18,
      bounciness: 8,
    }).start();
  }, [position, state.index]);

  if (keyboardShown) {
    return null;
  }

  return (
    <View
      pointerEvents="box-none"
      style={[styles.container, { bottom: Math.max(insets.bottom, 12) }]}
    >
      <Glass style={styles.bar} accessibilityRole="tablist">
        <Animated.View
          pointerEvents="none"
          style={[
            styles.lens,
            {
              width: itemWidth,
              backgroundColor: colors.fill,
              transform: [
                {
                  translateX: position.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, itemWidth],
                  }),
                },
              ],
            },
          ]}
        />
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.title ?? route.name;
          const focused = state.index === index;
          const color = focused ? 'tint' : 'label';
          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };
          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={[styles.item, { width: itemWidth }]}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
              testID={`tab-${route.name}`}
            >
              <Icon name={options.tabBarIcon} size={24} color={color} />
              <AppText variant="caption2" color={color} style={styles.label}>
                {label}
              </AppText>
            </Pressable>
          );
        })}
      </Glass>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  bar: {
    width: BAR_WIDTH,
    height: BAR_HEIGHT,
    borderRadius: radius.capsule,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ITEM_INSET,
  },
  lens: {
    ...continuous,
    position: 'absolute',
    left: ITEM_INSET,
    top: ITEM_INSET,
    bottom: ITEM_INSET,
    borderRadius: radius.capsule,
  },
  item: {
    height: BAR_HEIGHT - ITEM_INSET * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginTop: 2,
  },
});
