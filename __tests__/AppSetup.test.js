import React from 'react';
import { render, screen } from '@testing-library/react-native';
import App from '../App';
import { account } from '../src/lib/appwrite';

jest.mock('../src/config', () => ({
  __esModule: true,
  default: {},
  missingConfigKeys: ['APPWRITE_ENDPOINT', 'APPWRITE_PROJECT_ID'],
}));
jest.mock('../src/lib/appwrite', () =>
  require('./helpers/appwrite').createAppwriteMock(),
);

it('explains which settings are missing instead of calling the server', async () => {
  await render(<App />);

  expect(screen.getByText('App setup needed')).toBeOnTheScreen();
  expect(
    screen.getByText(/APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID/),
  ).toBeOnTheScreen();
  expect(account.get).not.toHaveBeenCalled();
});
