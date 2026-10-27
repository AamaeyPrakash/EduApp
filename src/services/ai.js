import config from '../config';
import { functions } from '../lib/appwrite';
import { AppError } from '../lib/errors';
import { readExecution } from '../lib/executions';

// Only the most recent messages are sent, which keeps requests small and fast.
export const MAX_HISTORY_MESSAGES = 12;
export const MAX_MESSAGE_LENGTH = 1000;
// Matches the limits in the ask-ai function.
export const QUESTION_LIMITS = {
  course: 80,
  topic: 120,
  text: 4000,
  answer: 2000,
  solution: 8000,
};

export function isTutorConfigured() {
  return Boolean(config.aiFunctionId);
}

function callTutorFunction(payload) {
  if (!isTutorConfigured()) {
    throw new AppError(
      'The AI tutor is not set up yet. Please try again later.',
    );
  }
  return functions
    .createExecution(
      config.aiFunctionId,
      JSON.stringify(payload),
      false,
      '/',
      'POST',
      { 'content-type': 'application/json' },
    )
    .then(readExecution);
}

// The practice question the student is asking about, cut to the function's limits.
function questionContext(question) {
  return Object.fromEntries(
    Object.entries(QUESTION_LIMITS).map(([field, limit]) => [
      field,
      String(question[field] ?? '').slice(0, limit),
    ]),
  );
}

// Sends the conversation to the `ask-ai` Appwrite Function, which calls OpenAI with
// a server-side key. `messages` are `{ role: 'user' | 'assistant', content }`;
// `question` ({ course, topic, text, answer, solution }) is the practice question the
// student is asking about, if any.
export async function askTutor({ messages, student, question }) {
  const history = messages
    .slice(-MAX_HISTORY_MESSAGES)
    .map(({ role, content }) => ({ role, content }));
  const { statusCode, body } = await callTutorFunction({
    messages: history,
    student,
    ...(question ? { question: questionContext(question) } : {}),
  });
  const reply = typeof body.reply === 'string' ? body.reply.trim() : '';
  if (statusCode === 200 && reply) {
    return reply;
  }
  throw new AppError(
    body.error || "The tutor couldn't answer right now. Please try again.",
  );
}

// Flags an AI reply as inappropriate or wrong. Google Play requires apps that
// generate AI content to let people report it without leaving the app.
export async function reportTutorReply({ question, reply }) {
  const { statusCode, body } = await callTutorFunction({
    report: { question, reply },
  });
  if (statusCode !== 200 || !body.reported) {
    throw new AppError(
      body.error || "We couldn't send your report. Please try again.",
    );
  }
}
