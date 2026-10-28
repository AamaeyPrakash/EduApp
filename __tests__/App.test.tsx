/**
 * End-to-end flows through the real navigation and screens, with Appwrite mocked.
 * @format
 */

import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import App from '../App';
import { getTopic } from '../src/content';
import { account, functions, tablesDB } from '../src/lib/appwrite';
import { dayNumber } from '../src/study/progress';
import {
  appwriteError,
  CONSENTED_USER,
  networkError,
  PROFILE,
  unauthorized,
  USER,
} from './helpers/appwrite';

jest.mock('../src/config', () => ({
  __esModule: true,
  default: { ...require('./helpers/appwrite').TEST_CONFIG },
  missingConfigKeys: [],
}));
jest.mock('../src/lib/appwrite', () =>
  require('./helpers/appwrite').createAppwriteMock(),
);

const mocked = (fn: unknown) => fn as jest.Mock;

function startSignedOut() {
  mocked(account.get).mockRejectedValueOnce(unauthorized());
}

function startSignedIn(user = USER) {
  mocked(account.get).mockResolvedValue(user);
  mocked(tablesDB.getRow).mockResolvedValue(PROFILE);
}

async function pressAlertButton(alert: jest.SpyInstance, text: string) {
  const buttons = alert.mock.calls[alert.mock.calls.length - 1][2] ?? [];
  const button = buttons.find((item: { text: string }) => item.text === text);
  await act(async () => {
    await button?.onPress?.();
  });
}

beforeEach(() => {
  jest.resetAllMocks();
});

describe('signing in', () => {
  it('shows the sign-in screen when there is no session', async () => {
    startSignedOut();
    await render(<App />);
    expect(await screen.findByText('Welcome Back')).toBeOnTheScreen();
    expect(screen.getByText('Forgot password?')).toBeOnTheScreen();
  });

  it('checks the form before contacting the server', async () => {
    startSignedOut();
    await render(<App />);
    await fireEvent.press(await screen.findByTestId('signin-submit'));

    expect(screen.getByText('Enter your email address.')).toBeOnTheScreen();
    expect(screen.getByText('Enter your password.')).toBeOnTheScreen();
    expect(account.createEmailPasswordSession).not.toHaveBeenCalled();
  });

  it('signs in and greets the student by name', async () => {
    startSignedOut();
    mocked(account.get).mockResolvedValue(USER);
    mocked(account.createEmailPasswordSession).mockResolvedValue({});
    mocked(tablesDB.getRow).mockResolvedValue(PROFILE);
    await render(<App />);

    await fireEvent.changeText(
      await screen.findByTestId('signin-email'),
      'Sam@Example.com',
    );
    await fireEvent.changeText(
      screen.getByTestId('signin-password'),
      'secret123',
    );
    await fireEvent.press(screen.getByTestId('signin-submit'));

    expect(await screen.findByText(/, Sam$/)).toBeOnTheScreen();
    expect(screen.getByText('Mathematics AA')).toBeOnTheScreen();
    expect(account.createEmailPasswordSession).toHaveBeenCalledWith(
      'sam@example.com',
      'secret123',
    );
  });

  it('explains a wrong password', async () => {
    startSignedOut();
    mocked(account.createEmailPasswordSession).mockRejectedValue(
      appwriteError(401, 'user_invalid_credentials'),
    );
    await render(<App />);

    await fireEvent.changeText(
      await screen.findByTestId('signin-email'),
      'sam@example.com',
    );
    await fireEvent.changeText(
      screen.getByTestId('signin-password'),
      'nope1234',
    );
    await fireEvent.press(screen.getByTestId('signin-submit'));

    expect(
      await screen.findByText('Incorrect email or password.'),
    ).toBeOnTheScreen();
  });

  it('offers a retry instead of the sign-in screen when offline', async () => {
    mocked(account.get).mockRejectedValueOnce(
      Object.assign(new Error('Network request failed'), {
        name: 'AppwriteException',
        code: 0,
        type: '',
      }),
    );
    await render(<App />);

    expect(await screen.findByText("Can't connect")).toBeOnTheScreen();
    startSignedIn();
    await fireEvent.press(screen.getByText('Try Again'));
    expect(await screen.findByText('Mathematics AI')).toBeOnTheScreen();
  });
});

describe('studying', () => {
  const probability = getTopic('cbse', 'Probability')!;
  const sets = getTopic('cbse', 'Sets')!;

  it('opens CBSE revision with solutions already shown', async () => {
    startSignedIn();
    await render(<App />);

    await fireEvent.press(await screen.findByText('CBSE Maths'));
    await fireEvent.press(await screen.findByLabelText('Revise Sets'));

    expect(await screen.findByText('Revision')).toBeOnTheScreen();
    expect(screen.getAllByText('Hide Solution').length).toBeGreaterThan(0);
  });

  it('quizzes one question at a time and saves the results', async () => {
    startSignedIn();
    mocked(account.updatePrefs).mockImplementation(async prefs => ({
      ...USER,
      prefs,
    }));
    mocked(account.deleteSession).mockResolvedValue({});
    await render(<App />);

    await fireEvent.press(await screen.findByText('CBSE Maths'));
    await fireEvent.press(await screen.findByLabelText('Quiz on Sets'));
    expect(
      await screen.findByText(`1 / ${sets.questions.length}`),
    ).toBeOnTheScreen();
    expect(screen.queryByText('Got it')).toBeNull();

    await fireEvent.press(screen.getByText('Show answer'));
    expect(screen.getByText('Solution')).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Got it'));
    expect(
      await screen.findByText(`2 / ${sets.questions.length}`),
    ).toBeOnTheScreen();

    await fireEvent.press(screen.getByText('Show answer'));
    await fireEvent.press(screen.getByText('Not yet'));
    expect(
      await screen.findByText(`3 / ${sets.questions.length}`),
    ).toBeOnTheScreen();

    // Leave the quiz and log out: the answers are saved first.
    await fireEvent.press(screen.getByLabelText('Close'));
    await fireEvent.press(screen.getByLabelText('Close'));
    expect(await screen.findByLabelText('2/10 done today')).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Profile'));
    await fireEvent.press(await screen.findByText('Logout'));

    expect(
      await screen.findByText('You have been logged out.'),
    ).toBeOnTheScreen();
    const [first, second] = sets.questions;
    const saved = mocked(account.updatePrefs).mock.calls.at(-1)[0];
    expect(saved.study.q[first.id][0]).toBeGreaterThan(0);
    expect(saved.study.q[second.id][0]).toBe(0);
    expect(account.updatePrefs.mock.invocationCallOrder[0]).toBeLessThan(
      mocked(account.deleteSession).mock.invocationCallOrder[0],
    );
  });

  it('shows a summary at the end and offers the missed questions again', async () => {
    startSignedIn();
    await render(<App />);
    await fireEvent.press(await screen.findByText('Mathematics AA'));
    await fireEvent.press(
      await screen.findByLabelText('Quiz on Number and Algebra'),
    );

    for (const result of ['Got it', 'Not yet', 'Got it']) {
      await fireEvent.press(await screen.findByText('Show answer'));
      await fireEvent.press(screen.getByText(result));
    }

    expect(await screen.findByText('Session complete')).toBeOnTheScreen();
    expect(screen.getByText('2 / 3')).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Try the 1 I missed again'));
    expect(await screen.findByText('1 / 1')).toBeOnTheScreen();
  });

  it('opens an IB topic quiz with the calculator rule shown', async () => {
    startSignedIn();
    await render(<App />);

    await fireEvent.press(await screen.findByText('Mathematics AA'));
    await fireEvent.press(
      await screen.findByLabelText('Quiz on Number and Algebra'),
    );

    expect(
      await screen.findByText('Mathematics AA · Number and Algebra'),
    ).toBeOnTheScreen();
    expect(
      screen.getByLabelText(/^(Calculator allowed|No calculator)$/),
    ).toBeOnTheScreen();
  });

  it('brings back saved progress: reviews due and the streak', async () => {
    const [question] = probability.questions;
    const yesterday = dayNumber() - 1;
    startSignedIn({
      ...USER,
      prefs: {
        study: {
          q: { [question.id]: [0, yesterday] },
          b: [question.id],
          s: [3, 5, yesterday],
          t: [yesterday, 4],
        },
      },
    });
    await render(<App />);

    expect(await screen.findByLabelText('3 day streak')).toBeOnTheScreen();
    expect(screen.getByLabelText('1 to review')).toBeOnTheScreen();
    expect(screen.getByText('Saved (1)')).toBeOnTheScreen();
    expect(screen.getByText('Mistakes (1)')).toBeOnTheScreen();

    await fireEvent.press(screen.getByText('Review 1 question'));
    expect(await screen.findByText('1 / 1')).toBeOnTheScreen();
    expect(screen.getByText('CBSE Maths · Probability')).toBeOnTheScreen();
  });

  it('finds questions by search and saves one for later', async () => {
    startSignedIn();
    await render(<App />);

    await fireEvent.press(await screen.findByLabelText('Search questions'));
    await fireEvent.changeText(
      await screen.findByLabelText('Search questions'),
      'bayes',
    );
    const [first] = await screen.findAllByText('CBSE Maths · Probability');
    await fireEvent.press(first);

    expect(await screen.findByText('1 / 1')).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText('Save question'));
    expect(screen.getByLabelText('Remove from saved')).toBeOnTheScreen();

    await fireEvent.press(screen.getByLabelText('Close'));
    await fireEvent.press(screen.getByLabelText('Close'));
    expect(await screen.findByText('Saved (1)')).toBeOnTheScreen();
  });
});

describe('AI tutor', () => {
  it('asks for permission before sending anything to OpenAI', async () => {
    startSignedIn();
    mocked(account.updatePrefs).mockResolvedValue(CONSENTED_USER);
    await render(<App />);

    await fireEvent.press(await screen.findByText('AskGPT'));
    expect(await screen.findByText('Before you start')).toBeOnTheScreen();
    expect(screen.queryByLabelText('Message')).toBeNull();

    await fireEvent.press(screen.getByText('I Agree'));

    expect(await screen.findByLabelText('Message')).toBeOnTheScreen();
    expect(account.updatePrefs).toHaveBeenCalledWith({
      aiConsentAt: expect.any(String),
    });
    expect(functions.createExecution).not.toHaveBeenCalled();
  });

  it("sends the question with the student's board and shows the reply", async () => {
    startSignedIn(CONSENTED_USER);
    mocked(functions.createExecution).mockResolvedValue({
      responseStatusCode: 200,
      responseBody: JSON.stringify({ reply: 'Two plus two is four.' }),
    });
    await render(<App />);

    await fireEvent.press(await screen.findByText('AskGPT'));
    await fireEvent.changeText(
      await screen.findByLabelText('Message'),
      'What is 2+2?',
    );
    await fireEvent.press(screen.getByLabelText('Send message'));

    expect(await screen.findByText('Two plus two is four.')).toBeOnTheScreen();
    const [functionId, body] = mocked(functions.createExecution).mock.calls[0];
    expect(functionId).toBe('ask-ai');
    expect(JSON.parse(body)).toEqual({
      messages: [{ role: 'user', content: 'What is 2+2?' }],
      student: { board: 'IB', grade: '11' },
    });
  });

  it('lets the student report an answer', async () => {
    startSignedIn(CONSENTED_USER);
    mocked(functions.createExecution)
      .mockResolvedValueOnce({
        responseStatusCode: 200,
        responseBody: JSON.stringify({ reply: 'A strange answer.' }),
      })
      .mockResolvedValueOnce({
        responseStatusCode: 200,
        responseBody: JSON.stringify({ reported: true }),
      });
    const alert = jest.spyOn(Alert, 'alert');
    await render(<App />);

    await fireEvent.press(await screen.findByText('AskGPT'));
    await fireEvent.changeText(await screen.findByLabelText('Message'), 'Hi');
    await fireEvent.press(screen.getByLabelText('Send message'));
    await fireEvent.press(await screen.findByLabelText('Report this answer'));
    await pressAlertButton(alert, 'Report');

    expect(await screen.findByText('Reported - thank you')).toBeOnTheScreen();
    expect(
      JSON.parse(mocked(functions.createExecution).mock.calls[1][1]),
    ).toEqual({ report: { question: 'Hi', reply: 'A strange answer.' } });
  });

  it('coaches through a practice question using its official solution', async () => {
    startSignedIn(CONSENTED_USER);
    mocked(functions.createExecution).mockResolvedValue({
      responseStatusCode: 200,
      responseBody: JSON.stringify({ reply: 'Start by substituting S.' }),
    });
    const [question] = getTopic('ib-aa', 'Topic 1')!.questions;
    await render(<App />);

    await fireEvent.press(await screen.findByText('Mathematics AA'));
    await fireEvent.press(
      await screen.findByLabelText('Quiz on Number and Algebra'),
    );
    await fireEvent.press(
      await screen.findByText('Stuck? Ask the tutor about this'),
    );
    expect(
      await screen.findByText('Stuck on this question?'),
    ).toBeOnTheScreen();

    await fireEvent.press(screen.getByText('Check my answer'));
    expect(screen.getByLabelText('Message').props.value).toBe('My answer is: ');
    await fireEvent.press(screen.getByText('Give me a hint'));

    expect(
      await screen.findByText('Start by substituting S.'),
    ).toBeOnTheScreen();
    const body = JSON.parse(mocked(functions.createExecution).mock.calls[0][1]);
    expect(body.messages).toEqual([
      {
        role: 'user',
        content: 'Give me a hint for the next step, not the whole answer.',
      },
    ]);
    expect(body.question).toEqual({
      course: 'Mathematics AA',
      topic: 'Number and Algebra',
      text: question.prompt,
      answer: question.answer,
      solution: question.solution,
    });
  });

  it('lets the student try again after a failed message', async () => {
    startSignedIn(CONSENTED_USER);
    mocked(functions.createExecution)
      .mockRejectedValueOnce(networkError())
      .mockResolvedValueOnce({
        responseStatusCode: 200,
        responseBody: JSON.stringify({ reply: 'Back online.' }),
      });
    await render(<App />);

    await fireEvent.press(await screen.findByText('AskGPT'));
    await fireEvent.changeText(await screen.findByLabelText('Message'), 'Hi');
    await fireEvent.press(screen.getByLabelText('Send message'));
    await fireEvent.press(await screen.findByText('Try again'));

    expect(await screen.findByText('Back online.')).toBeOnTheScreen();
    expect(screen.queryByText('Try again')).toBeNull();
    const calls = mocked(functions.createExecution).mock.calls;
    expect(calls).toHaveLength(2);
    expect(JSON.parse(calls[1][1]).messages).toEqual([
      { role: 'user', content: 'Hi' },
    ]);
  });

  it('returns to sign-in when the session has expired', async () => {
    startSignedIn(CONSENTED_USER);
    mocked(functions.createExecution).mockRejectedValue(
      appwriteError(401, 'user_unauthorized'),
    );
    await render(<App />);
    await fireEvent.press(await screen.findByText('AskGPT'));

    mocked(account.get).mockRejectedValue(unauthorized());
    await fireEvent.changeText(await screen.findByLabelText('Message'), 'Hi');
    await fireEvent.press(screen.getByLabelText('Send message'));

    expect(
      await screen.findByText(
        'Your session has expired. Please sign in again.',
      ),
    ).toBeOnTheScreen();
  });
});

describe('profile', () => {
  it('shows the profile and logs out', async () => {
    startSignedIn();
    mocked(account.deleteSession).mockResolvedValue({});
    await render(<App />);

    await fireEvent.press(await screen.findByText('Profile'));
    expect(await screen.findByText('Springfield High')).toBeOnTheScreen();
    expect(screen.getByText('IB')).toBeOnTheScreen();

    await fireEvent.press(screen.getByText('Logout'));
    expect(
      await screen.findByText('You have been logged out.'),
    ).toBeOnTheScreen();
  });

  it('deletes the account after confirmation', async () => {
    startSignedIn();
    mocked(functions.createExecution).mockResolvedValue({
      responseStatusCode: 200,
      responseBody: JSON.stringify({ deleted: true }),
    });
    const alert = jest.spyOn(Alert, 'alert');
    await render(<App />);

    await fireEvent.press(await screen.findByText('Profile'));
    await fireEvent.press(await screen.findByText('Delete Account'));
    await pressAlertButton(alert, 'Delete');

    expect(
      await screen.findByText('Your account and its data have been deleted.'),
    ).toBeOnTheScreen();
    expect(functions.createExecution).toHaveBeenCalledWith(
      'delete-account',
      '',
      false,
      '/',
      'POST',
      { 'content-type': 'application/json' },
    );
  });

  it('asks for missing details before entering the app', async () => {
    mocked(account.get).mockResolvedValue(USER);
    mocked(tablesDB.getRow).mockRejectedValue(
      appwriteError(404, 'row_not_found'),
    );
    mocked(tablesDB.createRow).mockResolvedValue(PROFILE);
    await render(<App />);

    expect(await screen.findByText('Complete Your Profile')).toBeOnTheScreen();
  });
});
