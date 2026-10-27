import { courseQuestions } from '../../src/content';
import { EMPTY_STUDY, recordResult } from '../../src/study/progress';
import { mixedPracticeIds, shuffle } from '../../src/study/sessions';

describe('shuffle', () => {
  it('returns the same items in a new array', () => {
    const items = [1, 2, 3, 4, 5];
    const shuffled = shuffle(items);
    expect(shuffled).not.toBe(items);
    expect([...shuffled].sort()).toEqual(items);
  });
});

describe('mixedPracticeIds', () => {
  const cbse = courseQuestions('cbse');

  it('picks ten questions from across the course', () => {
    const ids = mixedPracticeIds(EMPTY_STUDY, 'cbse');
    expect(ids).toHaveLength(10);
    expect(new Set(ids).size).toBe(10);
    const topics = new Set(
      ids.map(id => cbse.find(question => question.id === id).topicKey),
    );
    expect(topics.size).toBeGreaterThan(1);
  });

  it('puts questions the student already knows last', () => {
    let study = EMPTY_STUDY;
    for (const question of cbse.slice(5)) {
      study = recordResult(study, question.id, true, 20000);
    }
    const ids = mixedPracticeIds(study, 'cbse');
    expect(ids.slice(0, 5).sort()).toEqual(
      cbse
        .slice(0, 5)
        .map(question => question.id)
        .sort(),
    );
  });

  it('can limit an IB set to non-calculator questions', () => {
    const ids = mixedPracticeIds(EMPTY_STUDY, 'ib-aa', { noCalculator: true });
    const questions = courseQuestions('ib-aa');
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) {
      expect(questions.find(question => question.id === id).calculator).toBe(
        false,
      );
    }
  });
});
