import {
  currentStreak,
  dayNumber,
  dueIds,
  EMPTY_STUDY,
  fitToLimit,
  mistakeIds,
  normalizeStudy,
  progressFor,
  questionStatus,
  recordResult,
  REVIEW_INTERVALS,
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
    for (let day = 0; day < 10; day += 1) {
      study = recordResult(study, 'c1', true, DAY + 100 + day);
    }
    expect(study.q.c1[0]).toBe(REVIEW_INTERVALS.length - 1);
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
    });
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
