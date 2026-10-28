import {
  currentStreak,
  DAILY_GOAL,
  dayNumber,
  dueIds,
  EMPTY_STUDY,
  fitToLimit,
  mistakeIds,
  nextReview,
  normalizeStudy,
  noteTopic,
  progressFor,
  questionStatus,
  recordResult,
  REVIEW_INTERVALS,
  reviewDelay,
  setGoal,
  todayCount,
  toggleBookmark,
} from '../../src/study/progress';

const DAY = 20000;

describe('dayNumber', () => {
  it('counts calendar days on the device clock', () => {
    const morning = new Date(2026, 9, 27, 0, 5);
    const night = new Date(2026, 9, 27, 23, 55);
    expect(dayNumber(morning)).toBe(dayNumber(night));
    expect(dayNumber(new Date(2026, 9, 28, 0, 1))).toBe(dayNumber(night) + 1);
  });
});

describe('recordResult', () => {
  it('brings back a missed question tomorrow', () => {
    const study = recordResult(EMPTY_STUDY, 'c1', false, DAY);
    expect(study.q.c1).toEqual([0, DAY + 1]);
    expect(questionStatus(study, 'c1')).toBe('review');
  });

  it('waits a week after a first correct answer, then longer each time', () => {
    let study = recordResult(EMPTY_STUDY, 'c1', true, DAY);
    expect(study.q.c1).toEqual([2, DAY + REVIEW_INTERVALS[2]]);
    study = recordResult(study, 'c1', true, DAY + 7);
    expect(study.q.c1).toEqual([3, DAY + 7 + REVIEW_INTERVALS[3]]);
    for (let round = 0; round < 10; round += 1) {
      study = recordResult(study, 'c1', true, study.q.c1[1]);
    }
    expect(study.q.c1[0]).toBe(REVIEW_INTERVALS.length - 1);
  });

  it('keeps the schedule when a question is answered again before it is due', () => {
    let study = recordResult(EMPTY_STUDY, 'c1', true, DAY);
    const scheduled = study.q.c1;
    study = recordResult(study, 'c1', true, DAY + 1);
    expect(study.q.c1).toEqual(scheduled);

    // Getting a missed question right straight after reading its solution
    // still brings it back tomorrow.
    study = recordResult(study, 'c2', false, DAY);
    study = recordResult(study, 'c2', true, DAY);
    expect(study.q.c2).toEqual([0, DAY + 1]);
    expect(nextReview(study, 'c2', true, DAY + 1)).toEqual([
      1,
      DAY + 1 + REVIEW_INTERVALS[1],
    ]);
  });

  it('counts each question once a day towards the goal', () => {
    let study = recordResult(EMPTY_STUDY, 'a', true, DAY);
    study = recordResult(study, 'a', true, DAY);
    study = recordResult(study, 'b', false, DAY);
    expect(todayCount(study, DAY)).toBe(2);
    study = recordResult(study, 'a', true, DAY + 1);
    expect(todayCount(study, DAY + 1)).toBe(1);
    expect(study.d).toEqual(['a']);
  });

  it("carries on today's count saved before questions were tracked", () => {
    const study = recordResult({ ...EMPTY_STUDY, t: [DAY, 5] }, 'a', true, DAY);
    expect(todayCount(study, DAY)).toBe(6);
  });

  it('keeps the streak if the clock moves backwards', () => {
    let study = recordResult(EMPTY_STUDY, 'a', true, DAY);
    study = recordResult(study, 'b', true, DAY + 1);
    study = recordResult(study, 'c', true, DAY);
    expect(study.s).toEqual([2, 2, DAY + 1]);
    expect(currentStreak(study, DAY)).toBe(2);
  });

  it('starts again from the first box after a miss', () => {
    let study = recordResult(EMPTY_STUDY, 'c1', true, DAY);
    study = recordResult(study, 'c1', false, DAY + 7);
    study = recordResult(study, 'c1', true, DAY + 8);
    expect(study.q.c1).toEqual([1, DAY + 8 + REVIEW_INTERVALS[1]]);
  });

  it('counts the streak by days practised in a row', () => {
    let study = recordResult(EMPTY_STUDY, 'a', true, DAY);
    study = recordResult(study, 'b', true, DAY);
    expect(study.s).toEqual([1, 1, DAY]);
    expect(todayCount(study, DAY)).toBe(2);

    study = recordResult(study, 'c', false, DAY + 1);
    study = recordResult(study, 'd', true, DAY + 2);
    expect(study.s).toEqual([3, 3, DAY + 2]);
    expect(currentStreak(study, DAY + 3)).toBe(3);
    expect(currentStreak(study, DAY + 4)).toBe(0);
    expect(todayCount(study, DAY + 3)).toBe(0);

    study = recordResult(study, 'e', true, DAY + 10);
    expect(study.s).toEqual([1, 3, DAY + 10]);
  });

  it("doesn't change the study object it was given", () => {
    const before = JSON.stringify(EMPTY_STUDY);
    recordResult(EMPTY_STUDY, 'a', true, DAY);
    expect(JSON.stringify(EMPTY_STUDY)).toBe(before);
  });
});

describe('lists', () => {
  const study = {
    ...EMPTY_STUDY,
    q: {
      late: [3, DAY - 5],
      missed: [0, DAY],
      known: [2, DAY + 4],
      missedEarlier: [0, DAY - 1],
    },
  };

  it('lists due questions, most overdue first', () => {
    expect(dueIds(study, DAY)).toEqual(['late', 'missedEarlier', 'missed']);
  });

  it('lists questions whose last answer was "Not yet"', () => {
    expect(mistakeIds(study).sort()).toEqual(['missed', 'missedEarlier']);
  });

  it('summarises progress for a topic', () => {
    expect(progressFor(study, ['late', 'missed', 'new1', 'new2'])).toEqual({
      total: 4,
      attempted: 2,
      known: 1,
      review: 1,
    });
  });

  it('adds bookmarks to the front and removes them again', () => {
    let saved = toggleBookmark(EMPTY_STUDY, 'a');
    saved = toggleBookmark(saved, 'b');
    expect(saved.b).toEqual(['b', 'a']);
    expect(toggleBookmark(saved, 'a').b).toEqual(['b']);
  });
});

describe('normalizeStudy', () => {
  it('starts empty for missing or invalid data', () => {
    expect(normalizeStudy(undefined)).toEqual(EMPTY_STUDY);
    expect(normalizeStudy('nonsense')).toEqual(EMPTY_STUDY);
  });

  it('drops malformed entries and keeps the rest', () => {
    expect(
      normalizeStudy({
        q: { good: [1, DAY], bad: 'x', short: [1], tooHigh: [99, DAY] },
        b: ['a', 'a', 3, 'b'],
        s: [2, 4, DAY],
        t: 'x',
      }),
    ).toEqual({
      q: { good: [1, DAY] },
      b: ['a', 'b'],
      s: [2, 4, DAY],
      t: EMPTY_STUDY.t,
      d: [],
      g: DAILY_GOAL,
      l: null,
    });
  });

  it("keeps today's counted questions only with a valid day", () => {
    expect(normalizeStudy({ t: [DAY, 2], d: ['a', 'a', 'b', 4] }).d).toEqual([
      'a',
      'b',
    ]);
    expect(normalizeStudy({ t: 'x', d: ['a'] }).d).toEqual([]);
  });

  it('keeps a valid daily goal and last topic', () => {
    const study = normalizeStudy({ g: 20, l: ['cbse', 'Sets'] });
    expect(study.g).toBe(20);
    expect(study.l).toEqual(['cbse', 'Sets']);
    expect(normalizeStudy({ g: 7, l: ['cbse'] })).toMatchObject({
      g: DAILY_GOAL,
      l: null,
    });
  });
});

describe('reviewDelay', () => {
  it('describes when a question comes back', () => {
    expect(reviewDelay(DAY + 1, DAY)).toBe('tomorrow');
    expect(reviewDelay(DAY + 7, DAY)).toBe('in 7 days');
    expect(reviewDelay(DAY + 16, DAY)).toBe('in 2 weeks');
    expect(reviewDelay(DAY + 90, DAY)).toBe('in 3 months');
  });
});

describe('goal and last topic', () => {
  it('only accepts the offered daily goals', () => {
    expect(setGoal(EMPTY_STUDY, 30).g).toBe(30);
    expect(setGoal(EMPTY_STUDY, 7)).toBe(EMPTY_STUDY);
  });

  it('remembers the last topic without changing anything else', () => {
    const study = noteTopic(EMPTY_STUDY, 'cbse', 'Sets');
    expect(study.l).toEqual(['cbse', 'Sets']);
    expect(noteTopic(study, 'cbse', 'Sets')).toBe(study);
  });
});

describe('fitToLimit', () => {
  it('leaves small progress alone', () => {
    const study = recordResult(EMPTY_STUDY, 'a', true, DAY);
    expect(fitToLimit(study)).toBe(study);
  });

  it('forgets the best-known questions first to stay under the size limit', () => {
    const q = {};
    for (let index = 0; index < 400; index += 1) {
      q[`known${index}`] = [5, DAY + 90];
      q[`missed${index}`] = [0, DAY];
    }
    const trimmed = fitToLimit({ ...EMPTY_STUDY, q }, 10000);
    expect(JSON.stringify(trimmed).length).toBeLessThanOrEqual(10000);
    const kept = Object.keys(trimmed.q);
    expect(kept.filter(id => id.startsWith('missed'))).toHaveLength(400);
    expect(kept.length).toBeGreaterThan(400);
  });
});
