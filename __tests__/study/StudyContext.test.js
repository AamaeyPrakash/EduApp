import React from 'react';
import { AppState } from 'react-native';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import {
  AuthProvider,
  PROFILE_STATUS,
  useAuth,
} from '../../src/auth/AuthContext';
import { courseQuestions } from '../../src/content';
import { account, databases } from '../../src/lib/appwrite';
import { StudyProvider, useStudy } from '../../src/study/StudyContext';
import { networkError, PROFILE, USER } from '../helpers/appwrite';

jest.mock('../../src/config', () => ({
  __esModule: true,
  default: { ...require('../helpers/appwrite').TEST_CONFIG },
  missingConfigKeys: [],
}));
jest.mock('../../src/lib/appwrite', () =>
  require('../helpers/appwrite').createAppwriteMock(),
);

const [first, second] = courseQuestions('cbse');

const wrapper = ({ children }) => (
  <AuthProvider>
    <StudyProvider>{children}</StudyProvider>
  </AuthProvider>
);

let appStateListener;

beforeEach(() => {
  jest.resetAllMocks();
  jest.useFakeTimers();
  jest
    .spyOn(AppState, 'addEventListener')
    .mockImplementation((type, listener) => {
      appStateListener = listener;
      return { remove() {} };
    });
  account.get.mockResolvedValue(USER);
  databases.getDocument.mockResolvedValue(PROFILE);
  account.updatePrefs.mockImplementation(async prefs => ({ ...USER, prefs }));
});

afterEach(() => {
  jest.useRealTimers();
});

async function renderStudy() {
  const hook = await renderHook(
    () => ({ auth: useAuth(), study: useStudy() }),
    { wrapper },
  );
  await waitFor(() =>
    expect(hook.result.current.auth.profileStatus).toBe(PROFILE_STATUS.READY),
  );
  return hook.result;
}

it('saves answers once marking pauses, not on every tap', async () => {
  const result = await renderStudy();

  await act(async () => {
    result.current.study.record(first.id, true);
    result.current.study.record(second.id, false);
    result.current.study.toggleBookmark(second.id);
  });
  expect(account.updatePrefs).not.toHaveBeenCalled();
  expect(result.current.study.todayCount).toBe(2);
  expect(result.current.study.mistakeIds).toEqual([second.id]);
  expect(result.current.study.savedIds).toEqual([second.id]);

  await act(async () => {
    jest.advanceTimersByTime(2000);
  });

  expect(account.updatePrefs).toHaveBeenCalledTimes(1);
  const { study } = account.updatePrefs.mock.calls[0][0];
  expect(Object.keys(study.q).sort()).toEqual([first.id, second.id].sort());
  expect(study.b).toEqual([second.id]);
});

it('saves straight away when the app goes to the background', async () => {
  const result = await renderStudy();
  await act(async () => {
    result.current.study.record(first.id, true);
  });

  await act(async () => {
    appStateListener('background');
  });

  expect(account.updatePrefs).toHaveBeenCalledTimes(1);
});

it('keeps unsaved answers after a failed save and retries later', async () => {
  const result = await renderStudy();
  account.updatePrefs.mockRejectedValueOnce(networkError());

  await act(async () => {
    result.current.study.record(first.id, true);
    jest.advanceTimersByTime(2000);
  });
  expect(result.current.study.saveFailed).toBe(true);

  await act(async () => {
    appStateListener('active');
  });

  expect(account.updatePrefs).toHaveBeenCalledTimes(2);
  expect(result.current.study.saveFailed).toBe(false);
  expect(account.updatePrefs.mock.calls[1][0].study.q[first.id]).toBeDefined();
});

it('flush saves pending answers immediately (used before logging out)', async () => {
  const result = await renderStudy();
  await act(async () => {
    result.current.study.record(first.id, false);
  });

  await act(() => result.current.study.flush());

  expect(account.updatePrefs).toHaveBeenCalledTimes(1);
  await act(() => result.current.study.flush());
  expect(account.updatePrefs).toHaveBeenCalledTimes(1);
});

it('loads saved progress and ignores questions that no longer exist', async () => {
  account.get.mockResolvedValue({
    ...USER,
    prefs: {
      study: { q: { [first.id]: [0, 0], gone: [0, 0] }, b: ['gone'] },
    },
  });
  const result = await renderStudy();

  expect(result.current.study.dueIds).toEqual([first.id]);
  expect(result.current.study.savedIds).toEqual([]);
});

it('moves to the new day at midnight while the app stays open', async () => {
  jest.setSystemTime(new Date(2026, 9, 27, 23, 58));
  const result = await renderStudy();
  await act(async () => {
    result.current.study.record(first.id, true);
  });
  expect(result.current.study.todayCount).toBe(1);

  await act(async () => {
    jest.advanceTimersByTime(3 * 60 * 1000);
  });
  expect(result.current.study.todayCount).toBe(0);
  expect(result.current.study.streak).toBe(1);
});

it('leaves out progress on questions that no longer exist', async () => {
  account.get.mockResolvedValue({
    ...USER,
    prefs: { study: { q: { [first.id]: [2, 1], gone: [3, 1] } } },
  });
  const result = await renderStudy();
  expect(result.current.study.attemptedCount).toBe(1);
  expect(result.current.study.knownCount).toBe(1);
});
