import { courseQuestions } from '../content';
import { questionStatus } from './progress';

export const SESSION_SIZE = 10;
export const REVIEW_SESSION_SIZE = 20;
// About 1.5 minutes a question, close to exam pace for these courses.
export const TIMED_TEST_MINUTES = 15;

export function shuffle(items, random = Math.random) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

// A mixed set from across a course. Mixing topics makes students work out which method
// a question needs, which research on maths practice finds sticks better than doing one
// topic at a time. Questions the student hasn't mastered come first.
export function mixedPracticeIds(
  study,
  courseKey,
  { noCalculator = false, size = SESSION_SIZE, random = Math.random } = {},
) {
  const pool = courseQuestions(courseKey).filter(
    question => !noCalculator || question.calculator === false,
  );
  const isKnown = question => questionStatus(study, question.id) === 'known';
  return [
    ...shuffle(
      pool.filter(question => !isKnown(question)),
      random,
    ),
    ...shuffle(pool.filter(isKnown), random),
  ]
    .slice(0, size)
    .map(question => question.id);
}
