import React from 'react';
import { Text } from 'react-native';
import { render, renderHook, screen } from '@testing-library/react-native';
import Icon from '../src/components/Icon';
import { makeStyles, themes, useTheme } from '../src/theme';

let mockScheme = 'dark';
jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: () => mockScheme,
}));

describe('useTheme', () => {
  it('follows the phone appearance', async () => {
    mockScheme = 'light';
    const light = await renderHook(() => useTheme());
    expect(light.result.current).toBe(themes.light);

    mockScheme = 'dark';
    const dark = await renderHook(() => useTheme());
    expect(dark.result.current).toBe(themes.dark);
  });

  it('uses dark when the phone does not say', async () => {
    mockScheme = null;
    const { result } = await renderHook(() => useTheme());
    expect(result.current).toBe(themes.dark);
  });
});

describe('makeStyles', () => {
  it('builds styles once per appearance', async () => {
    const factory = jest.fn(theme => ({
      box: { backgroundColor: theme.colors.background },
    }));
    const useStyles = makeStyles(factory);

    mockScheme = 'light';
    const first = await renderHook(() => useStyles());
    const again = await renderHook(() => useStyles());
    expect(again.result.current).toBe(first.result.current);
    expect(first.result.current.box.backgroundColor).toBe('#F2F2F7');

    mockScheme = 'dark';
    const dark = await renderHook(() => useStyles());
    expect(dark.result.current.box.backgroundColor).toBe('#000000');
    expect(factory).toHaveBeenCalledTimes(2);
  });
});

describe('Icon', () => {
  it('draws nothing for an unknown name', async () => {
    await render(
      <>
        <Icon name="not-an-icon" />
        <Text>after</Text>
      </>,
    );
    expect(screen.getByText('after')).toBeOnTheScreen();
  });
});
