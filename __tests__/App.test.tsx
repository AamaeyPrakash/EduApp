/**
 * End-to-end flows through the real navigation and screens, with Appwrite mocked.
 * @format
 */

import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import App from '../App';
import { getTopic } from '../src/content';
import { account, databases, functions } from '../src/lib/appwrite';
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
  mocked(databases.getDocument).mockResolvedValue(PROFILE);
}

// Practice ignores a second tap within moments of the first (a double tap), so
// practice tests run on a clock that moves on between taps.
let clock = 0;
function startTestClock() {
  clock = Date.now();
  return jest.spyOn(Date, 'now').mockImplementation(() => clock);
}
async function tap(element: Parameters<typeof fireEvent.press>[0]) {
  clock += 1000;
  await fireEvent.press(element);
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
    expect(await screen.findByText('Welcome back')).toBeOnTheScreen();
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
    mocked(databases.getDocument).mockResolvedValue(PROFILE);
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

// Navigates from Home to a topic of a course.
async function openTopic(course: string, topic: string) {
  await fireEvent.press(await screen.findByText(course));
  // Topic rows are labelled "<title>, <class>, <n> questions, <k> of <n> mastered".
  await fireEvent.press(
    await screen.findByLabelText(new RegExp(`^${topic}, `)),
  );
}

describe('studying', () => {
  const probability = getTopic('cbse', 'Probability')!;
  const sets = getTopic('cbse', 'Sets')!;

  it('opens a topic with solutions hidden until asked, or all at once', async () => {
    startSignedIn();
    await render(<App />);
    await openTopic('CBSE Maths', 'Sets');

    expect(await screen.findByText('Questions')).toBeOnTheScreen();
    expect(screen.queryByLabelText('Hide Solution')).toBeNull();
    await fireEvent.press(screen.getAllByLabelText('Show Solution')[0]);
    expect(screen.getAllByLabelText('Hide Solution')).toHaveLength(1);

    await fireEvent(
      screen.getByLabelText('Show all solutions'),
      'valueChange',
      true,
    );
    expect(screen.getAllByLabelText('Hide Solution').length).toBeGreaterThan(1);
    expect(screen.queryByLabelText('Show Solution')).toBeNull();
  });

  let restoreClock: () => void;
  beforeEach(() => {
    const spy = startTestClock();
    restoreClock = () => spy.mockRestore();
  });
  afterEach(() => restoreClock());

  it('quizzes one question at a time and saves the results', async () => {
    startSignedIn();
    mocked(account.updatePrefs).mockImplementation(async prefs => ({
      ...USER,
      prefs,
    }));
    mocked(account.deleteSession).mockResolvedValue({});
    await render(<App />);
    await openTopic('CBSE Maths', 'Sets');
    await fireEvent.press(await screen.findByText('Practise'));

    const total = sets.questions.length;
    expect(await screen.findByText(`1 / ${total}`)).toBeOnTheScreen();
    expect(screen.queryByText('Got it')).toBeNull();

    await tap(screen.getByText('Show answer'));
    expect(screen.getByText('SOLUTION')).toBeOnTheScreen();
    expect(screen.getByText('Back in 7 days')).toBeOnTheScreen();
    expect(screen.getByText('Back tomorrow')).toBeOnTheScreen();
    await tap(screen.getByText('Got it'));
    expect(await screen.findByText(`2 / ${total}`)).toBeOnTheScreen();

    await tap(screen.getByText('Show answer'));
    await tap(screen.getByText('Not yet'));
    expect(await screen.findByText(`3 / ${total}`)).toBeOnTheScreen();

    // Leaving part-way shows what was done, then the answers are saved on sign-out.
    await tap(screen.getByLabelText('Close'));
    expect(await screen.findByText('Session ended')).toBeOnTheScreen();
    expect(screen.getByText('1 right · 1 not yet')).toBeOnTheScreen();
    await tap(screen.getByText('Done'));
    await fireEvent.press(screen.getAllByLabelText('Back').at(-1)!);
    await fireEvent.press(screen.getAllByLabelText('Back').at(-1)!);
    expect(
      await screen.findByLabelText('2 of 10 questions today'),
    ).toBeOnTheScreen();
    expect(screen.getByText('Continue: Sets')).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText('Profile'));
    await fireEvent.press(await screen.findByText('Sign Out'));

    expect(
      await screen.findByText('You have been signed out.'),
    ).toBeOnTheScreen();
    const [first, second] = sets.questions;
    const saved = mocked(account.updatePrefs).mock.calls.at(-1)[0];
    expect(saved.study.q[first.id][0]).toBeGreaterThan(0);
    expect(saved.study.q[second.id][0]).toBe(0);
    expect(saved.study.l).toEqual(['cbse', 'Sets']);
    expect(account.updatePrefs.mock.invocationCallOrder[0]).toBeLessThan(
      mocked(account.deleteSession).mock.invocationCallOrder[0],
    );
  });

  it('shows a summary at the end and offers the missed questions again', async () => {
    startSignedIn();
    await render(<App />);
    await openTopic('Mathematics AA', 'Number and Algebra');
    await fireEvent.press(await screen.findByText('Practise'));

    for (const result of ['Got it', 'Not yet', 'Got it']) {
      await tap(await screen.findByText('Show answer'));
      await tap(screen.getByText(result));
    }

    expect(await screen.findByText('Session complete')).toBeOnTheScreen();
    expect(screen.getByText('2 / 3')).toBeOnTheScreen();
    expect(screen.getByText('2 right · 1 not yet')).toBeOnTheScreen();
    expect(screen.getByText('1-day streak')).toBeOnTheScreen();
    await tap(screen.getByText('Retry the missed question'));
    expect(await screen.findByText('1 / 1')).toBeOnTheScreen();
  });

  it('ignores the second tap of a double tap', async () => {
    startSignedIn();
    await render(<App />);
    await openTopic('Mathematics AA', 'Number and Algebra');
    await fireEvent.press(await screen.findByText('Practise'));

    // Both taps land at once: the second hits "Got it", which replaced "Show answer".
    await tap(await screen.findByText('Show answer'));
    await fireEvent.press(screen.getByText('Got it'));
    expect(screen.getByText('1 / 3')).toBeOnTheScreen();
    expect(screen.getByText('ANSWER')).toBeOnTheScreen();
  });

  it('runs a timed test that ends when time is up', async () => {
    startSignedIn();
    await render(<App />);
    await fireEvent.press(await screen.findByText('CBSE Maths'));
    await fireEvent.press(await screen.findByLabelText('Timed test'));

    expect(await screen.findByLabelText('15 minutes left')).toBeOnTheScreen();
    expect(screen.getByText('15:00')).toBeOnTheScreen();
    // A timed test is a mock exam: no tutor until it's over.
    expect(
      screen.queryByLabelText('Ask the tutor about this question'),
    ).toBeNull();
    await tap(screen.getByText('Show answer'));
    await tap(screen.getByText('Got it'));

    // Jump the clock past the 15 minutes; the countdown checks it every second.
    clock += 16 * 60 * 1000;
    expect(
      await screen.findByText("Time's up", {}, { timeout: 3000 }),
    ).toBeOnTheScreen();
    expect(screen.getByText(/You answered 1 of 10/)).toBeOnTheScreen();
  });

  it('opens an IB topic quiz with the calculator rule shown', async () => {
    startSignedIn();
    await render(<App />);
    await fireEvent.press(await screen.findByText('Mathematics AA'));
    // The course has fewer questions than a full session, and says so.
    expect(
      await screen.findByText('7 questions mixed across topics'),
    ).toBeOnTheScreen();
    expect(screen.getByText('7 questions in 11 minutes')).toBeOnTheScreen();
    await fireEvent.press(
      await screen.findByLabelText(/^Number and Algebra, /),
    );
    await fireEvent.press(await screen.findByText('Practise'));

    expect(
      await screen.findByText('Mathematics AA · Number and Algebra'),
    ).toBeOnTheScreen();
    expect(
      screen.getByLabelText(/^(Calculator allowed|No calculator)$/),
    ).toBeOnTheScreen();
  });

  it('brings back saved progress: reviews due, the streak and the goal', async () => {
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
          g: 20,
          l: ['cbse', 'Probability'],
        },
      },
    });
    await render(<App />);

    expect(await screen.findByLabelText('3 day streak')).toBeOnTheScreen();
    expect(screen.getByLabelText('1 to review')).toBeOnTheScreen();
    expect(screen.getByLabelText('0 of 20 questions today')).toBeOnTheScreen();
    expect(screen.getByLabelText('Saved (1)')).toBeOnTheScreen();
    expect(screen.getByLabelText('Mistakes (1)')).toBeOnTheScreen();
    expect(screen.getByText('Continue: Probability')).toBeOnTheScreen();

    await fireEvent.press(screen.getByText('Review 1 question'));
    expect(await screen.findByText('1 / 1')).toBeOnTheScreen();
    expect(screen.getByText('CBSE Maths · Probability')).toBeOnTheScreen();
  });

  it('finds questions by search and saves one for later', async () => {
    startSignedIn();
    await render(<App />);

    await fireEvent.press(await screen.findByLabelText('Search questions'));
    await fireEvent.changeText(
      await screen.findByPlaceholderText('Topics and questions'),
      'bayes',
    );
    const [first] = await screen.findAllByText('CBSE Maths · Probability');
    await fireEvent.press(first);

    expect(await screen.findByText('1 / 1')).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText('Save question'));
    expect(screen.getByLabelText('Remove from saved')).toBeOnTheScreen();

    await fireEvent.press(screen.getByLabelText('Close'));
    await fireEvent.press(screen.getAllByLabelText('Back').at(-1)!);
    expect(await screen.findByLabelText('Saved (1)')).toBeOnTheScreen();
  });

  it('lets the student change their daily goal', async () => {
    startSignedIn();
    await render(<App />);

    await fireEvent.press(await screen.findByLabelText('Profile'));
    await fireEvent.press(
      await screen.findByLabelText('Daily goal: 20 questions'),
    );
    await fireEvent.press(screen.getByLabelText('Home'));

    expect(
      await screen.findByLabelText('0 of 20 questions today'),
    ).toBeOnTheScreen();
  });
});

describe('AI tutor', () => {
  it('asks for permission before sending anything to OpenAI', async () => {
    startSignedIn();
    mocked(account.updatePrefs).mockResolvedValue(CONSENTED_USER);
    await render(<App />);

    await fireEvent.press(await screen.findByLabelText('Tutor'));
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

    await fireEvent.press(await screen.findByLabelText('Tutor'));
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

    await fireEvent.press(await screen.findByLabelText('Tutor'));
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

    await openTopic('Mathematics AA', 'Number and Algebra');
    await fireEvent.press(await screen.findByText('Practise'));
    await fireEvent.press(
      await screen.findByLabelText('Ask the tutor about this question'),
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

  it('opens a topic overview over the topic and closes back to it', async () => {
    startSignedIn(CONSENTED_USER);
    mocked(functions.createExecution).mockResolvedValue({
      responseStatusCode: 200,
      responseBody: JSON.stringify({ reply: 'Sets are collections.' }),
    });
    await render(<App />);
    await openTopic('CBSE Maths', 'Sets');
    await fireEvent.press(
      await screen.findByLabelText('Ask the tutor about this topic'),
    );

    expect(await screen.findByText('Sets are collections.')).toBeOnTheScreen();
    const body = JSON.parse(mocked(functions.createExecution).mock.calls[0][1]);
    expect(body.messages[0].content).toMatch(
      /^Give me a short overview of Sets \(CBSE Maths\)/,
    );
    expect(screen.getByText('Common mistakes')).toBeOnTheScreen();

    await fireEvent.press(screen.getByLabelText('Close'));
    expect(await screen.findByText('Practise')).toBeOnTheScreen();
    expect(mocked(functions.createExecution)).toHaveBeenCalledTimes(1);
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

    await fireEvent.press(await screen.findByLabelText('Tutor'));
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
    await fireEvent.press(await screen.findByLabelText('Tutor'));

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

    await fireEvent.press(await screen.findByLabelText('Profile'));
    expect(await screen.findByText('sam@example.com')).toBeOnTheScreen();
    expect(screen.getByText('IB')).toBeOnTheScreen();

    await fireEvent.press(screen.getByText('Sign Out'));
    expect(
      await screen.findByText('You have been signed out.'),
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

    await fireEvent.press(await screen.findByLabelText('Profile'));
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
    mocked(databases.getDocument).mockRejectedValue(
      appwriteError(404, 'document_not_found'),
    );
    mocked(databases.createDocument).mockResolvedValue(PROFILE);
    await render(<App />);

    expect(await screen.findByText('Complete your profile')).toBeOnTheScreen();
  });
});
