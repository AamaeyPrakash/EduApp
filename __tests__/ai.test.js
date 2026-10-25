import config from '../src/config';
import { functions } from '../src/lib/appwrite';
import {
  askTutor,
  MAX_HISTORY_MESSAGES,
  reportTutorReply,
} from '../src/services/ai';
import { TEST_CONFIG } from './helpers/appwrite';

jest.mock('../src/config', () => ({
  __esModule: true,
  default: { ...require('./helpers/appwrite').TEST_CONFIG },
  missingConfigKeys: [],
}));
jest.mock('../src/lib/appwrite', () =>
  require('./helpers/appwrite').createAppwriteMock(),
);

const messages = count =>
  Array.from({ length: count }, (_, index) => ({
    id: String(index),
    role: index % 2 === 0 ? 'user' : 'assistant',
    content: `message ${index}`,
  }));

beforeEach(() => {
  jest.resetAllMocks();
  Object.assign(config, TEST_CONFIG);
});

it('sends recent messages to the ask-ai function and returns the reply', async () => {
  functions.createExecution.mockResolvedValue({
    responseStatusCode: 200,
    responseBody: JSON.stringify({ reply: '  $x = 2$  ' }),
  });

  const reply = await askTutor({
    messages: messages(15),
    student: { board: 'IB', grade: '11' },
  });

  expect(reply).toBe('$x = 2$');
  const [functionId, body, async, path, method] =
    functions.createExecution.mock.calls[0];
  expect([functionId, async, path, method]).toEqual([
    'ask-ai',
    false,
    '/',
    'POST',
  ]);
  const payload = JSON.parse(body);
  expect(payload.student).toEqual({ board: 'IB', grade: '11' });
  expect(payload.messages).toHaveLength(MAX_HISTORY_MESSAGES);
  // Only the newest messages are sent, without the app's message ids.
  expect(payload.messages[0]).toEqual({
    role: 'assistant',
    content: 'message 3',
  });
  expect(payload.messages[MAX_HISTORY_MESSAGES - 1]).toEqual({
    role: 'user',
    content: 'message 14',
  });
});

it('uses the error message returned by the function', async () => {
  functions.createExecution.mockResolvedValue({
    responseStatusCode: 502,
    responseBody: JSON.stringify({ error: 'The tutor is very busy.' }),
  });

  await expect(askTutor({ messages: messages(1) })).rejects.toMatchObject({
    userMessage: 'The tutor is very busy.',
  });
});

it('handles an empty or broken response', async () => {
  functions.createExecution.mockResolvedValue({
    responseStatusCode: 500,
    responseBody: 'not json',
  });

  await expect(askTutor({ messages: messages(1) })).rejects.toMatchObject({
    userMessage: expect.stringContaining("couldn't answer"),
  });
});

it('explains when the tutor is not configured', async () => {
  config.aiFunctionId = '';

  await expect(askTutor({ messages: messages(1) })).rejects.toMatchObject({
    userMessage: expect.stringContaining('not set up'),
  });
  expect(functions.createExecution).not.toHaveBeenCalled();
});

describe('reportTutorReply', () => {
  it('sends the reply and question to the ask-ai function', async () => {
    functions.createExecution.mockResolvedValue({
      responseStatusCode: 200,
      responseBody: JSON.stringify({ reported: true }),
    });

    await reportTutorReply({ question: 'Q', reply: 'A' });

    expect(JSON.parse(functions.createExecution.mock.calls[0][1])).toEqual({
      report: { question: 'Q', reply: 'A' },
    });
  });

  it('rejects when the report was not accepted', async () => {
    functions.createExecution.mockResolvedValue({
      responseStatusCode: 400,
      responseBody: JSON.stringify({ error: 'Include the reply.' }),
    });

    await expect(
      reportTutorReply({ question: 'Q', reply: '' }),
    ).rejects.toMatchObject({ userMessage: 'Include the reply.' });
  });
});
