/**
 * End-to-end flows through the real navigation and screens, with Appwrite mocked.
 * @format
 */

import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import App from '../App';
import { account, databases, functions } from '../src/lib/appwrite';
import {
  appwriteError,
  CONSENTED_USER,
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

describe('studying', () => {
  it('opens CBSE revision with solutions already shown', async () => {
    startSignedIn();
    await render(<App />);

    await fireEvent.press(await screen.findByText('Grade 12 CBSE'));
    await fireEvent.press(await screen.findByLabelText('Revise Probability'));

    expect(await screen.findByText('Revision')).toBeOnTheScreen();
    expect(screen.getAllByText('Hide Solution').length).toBeGreaterThan(0);
  });

  it('keeps quiz solutions hidden until asked', async () => {
    startSignedIn();
    await render(<App />);

    await fireEvent.press(await screen.findByText('Grade 12 CBSE'));
    await fireEvent.press(await screen.findByLabelText('Quiz on Probability'));
    const [firstButton] = await screen.findAllByText('Show Solution');
    expect(screen.queryByText('Hide Solution')).toBeNull();

    await fireEvent.press(firstButton);
    expect(screen.getByText('Hide Solution')).toBeOnTheScreen();
  });

  it('opens an IB topic quiz', async () => {
    startSignedIn();
    await render(<App />);

    await fireEvent.press(await screen.findByText('Mathematics AA'));
    await fireEvent.press(
      await screen.findByLabelText('Quiz on Topic 1 - Number and Algebra'),
    );

    expect(await screen.findByText('Number and Algebra')).toBeOnTheScreen();
    expect(screen.getAllByText('Show Answer').length).toBeGreaterThan(0);
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
    mocked(databases.getDocument).mockRejectedValue(
      appwriteError(404, 'document_not_found'),
    );
    mocked(databases.createDocument).mockResolvedValue(PROFILE);
    await render(<App />);

    expect(await screen.findByText('Complete Your Profile')).toBeOnTheScreen();
  });
});
