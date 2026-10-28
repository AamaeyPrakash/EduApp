// A student's study progress, saved in their Appwrite account preferences (`prefs.study`)
// so it follows them to other devices. Kept compact because prefs are limited to 64 kB:
//   q: { [questionId]: [box, dueDay] }  box 0 = "not yet"; 1+ = got it, the higher the
//                                       box, the longer until it comes back for review
//   b: [questionId, ...]                bookmarked questions, newest first
//   s: [streak, bestStreak, lastDay]    days in a row with at least one answer marked
//   t: [day, count]                     questions marked on that day
//   d: [questionId, ...]                the questions counted in t (each counts once)
//   g: number                           daily goal (questions a day)
//   l: [courseKey, topicKey] | null     the topic studied most recently
// Days are whole days since 1970-01-01 on the device's calendar (see dayNumber).

const DAY_MS = 24 * 60 * 60 * 1000;

// Days until a question comes back, by box. Spacing reviews out like this helps
// students remember for exams rather than just for tomorrow.
export const REVIEW_INTERVALS = [1, 3, 7, 16, 35, 90];
// A question answered correctly the first time comes back after a week.
const FIRST_CORRECT_BOX = 2;
export const DAILY_GOAL = 10;
export const GOAL_OPTIONS = [5, 10, 20, 30];
// Leaves room in the 64 kB prefs for everything else stored there.
export const MAX_SAVED_BYTES = 56000;

export const EMPTY_STUDY = Object.freeze({
  q: {},
  b: [],
  s: [0, 0, -1],
  t: [-1, 0],
  d: [],
  g: DAILY_GOAL,
  l: null,
});

export function dayNumber(date = new Date()) {
  return Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS,
  );
}

const isWholeNumber = value => Number.isInteger(value) && value >= -1;

// Accepts whatever is stored in prefs and returns a valid study object.
export function normalizeStudy(raw) {
  if (!raw || typeof raw !== 'object') {
    return EMPTY_STUDY;
  }
  const q = {};
  if (raw.q && typeof raw.q === 'object') {
    for (const [id, entry] of Object.entries(raw.q)) {
      if (
        Array.isArray(entry) &&
        entry.length === 2 &&
        entry.every(isWholeNumber) &&
        entry[0] < REVIEW_INTERVALS.length
      ) {
        q[id] = entry;
      }
    }
  }
  const b = Array.isArray(raw.b)
    ? [...new Set(raw.b.filter(id => typeof id === 'string'))]
    : [];
  const s =
    Array.isArray(raw.s) && raw.s.length === 3 && raw.s.every(isWholeNumber)
      ? raw.s
      : EMPTY_STUDY.s;
  const t =
    Array.isArray(raw.t) && raw.t.length === 2 && raw.t.every(isWholeNumber)
      ? raw.t
      : EMPTY_STUDY.t;
  const d =
    t !== EMPTY_STUDY.t && Array.isArray(raw.d)
      ? [...new Set(raw.d.filter(id => typeof id === 'string'))]
      : [];
  const g = GOAL_OPTIONS.includes(raw.g) ? raw.g : DAILY_GOAL;
  const l =
    Array.isArray(raw.l) &&
    raw.l.length === 2 &&
    raw.l.every(part => typeof part === 'string')
      ? raw.l
      : null;
  return { q, b, s, t, d, g, l };
}

// The [box, dueDay] a question gets for "Got it" or "Not yet". Only a correct answer
// on a review that's due moves it to a longer interval; getting it right again
// before then (say, straight after reading the solution) keeps the schedule.
export function nextReview(study, id, gotIt, today) {
  const previous = study.q[id];
  if (!gotIt) {
    return [0, today + REVIEW_INTERVALS[0]];
  }
  if (!previous) {
    return [FIRST_CORRECT_BOX, today + REVIEW_INTERVALS[FIRST_CORRECT_BOX]];
  }
  if (previous[1] > today) {
    return previous;
  }
  const box = Math.min(previous[0] + 1, REVIEW_INTERVALS.length - 1);
  return [box, today + REVIEW_INTERVALS[box]];
}

// Records whether the student got a question right ("Got it") or not ("Not yet"),
// schedules its next review and updates the streak and today's count.
export function recordResult(study, id, gotIt, today) {
  const [streak, best, lastDay] = study.s;
  let nextStreak = 1;
  // A clock that moved backwards (time zones, a corrected date) keeps the streak.
  if (lastDay >= today) {
    nextStreak = streak;
  } else if (lastDay === today - 1) {
    nextStreak = streak + 1;
  }
  // Each question counts once a day towards the daily goal.
  const sameDay = study.t[0] === today;
  const counted = sameDay ? study.d : [];
  const isNew = !counted.includes(id);
  return {
    ...study,
    q: { ...study.q, [id]: nextReview(study, id, gotIt, today) },
    s: [nextStreak, Math.max(best, nextStreak), Math.max(lastDay, today)],
    t: [today, (sameDay ? study.t[1] : 0) + (isNew ? 1 : 0)],
    d: isNew ? [...counted, id] : counted,
  };
}

// "tomorrow", "in 3 days", "in 2 weeks", "in 3 months".
export function reviewDelay(dueDay, today) {
  const days = dueDay - today;
  if (days <= 1) {
    return 'tomorrow';
  }
  if (days < 14) {
    return `in ${days} days`;
  }
  if (days < 60) {
    return `in ${Math.round(days / 7)} weeks`;
  }
  return `in ${Math.round(days / 30)} months`;
}

export function setGoal(study, goal) {
  return GOAL_OPTIONS.includes(goal) ? { ...study, g: goal } : study;
}

export function noteTopic(study, courseKey, topicKey) {
  const same = study.l && study.l[0] === courseKey && study.l[1] === topicKey;
  return same ? study : { ...study, l: [courseKey, topicKey] };
}

export function toggleBookmark(study, id) {
  return {
    ...study,
    b: study.b.includes(id)
      ? study.b.filter(saved => saved !== id)
      : [id, ...study.b],
  };
}

// The streak still counts today if the student practised yesterday.
export function currentStreak(study, today) {
  return study.s[2] >= today - 1 ? study.s[0] : 0;
}

export function todayCount(study, today) {
  return study.t[0] === today ? study.t[1] : 0;
}

// Questions due for review, the most overdue (then the least known) first.
export function dueIds(study, today) {
  return Object.entries(study.q)
    .filter(([, [, due]]) => due <= today)
    .sort(([, a], [, b]) => a[1] - b[1] || a[0] - b[0])
    .map(([id]) => id);
}

// Questions whose last answer was "Not yet".
export function mistakeIds(study) {
  return Object.entries(study.q)
    .filter(([, [box]]) => box === 0)
    .map(([id]) => id);
}

export function questionStatus(study, id) {
  const entry = study.q[id];
  if (!entry) {
    return 'new';
  }
  return entry[0] === 0 ? 'review' : 'known';
}

// { total, attempted, known, review } for a list of question ids.
export function progressFor(study, ids) {
  let attempted = 0;
  let known = 0;
  for (const id of ids) {
    const entry = study.q[id];
    if (entry) {
      attempted += 1;
      if (entry[0] > 0) {
        known += 1;
      }
    }
  }
  return {
    total: ids.length,
    attempted,
    known,
    review: attempted - known,
  };
}

// Keeps the saved progress under the prefs size limit by forgetting the questions
// the student knows best (they are the least useful to review).
export function fitToLimit(study, maxBytes = MAX_SAVED_BYTES) {
  let excess = JSON.stringify(study).length - maxBytes;
  if (excess <= 0) {
    return study;
  }
  const q = { ...study.q };
  const byStrength = Object.entries(q).sort(
    ([, a], [, b]) => b[0] - a[0] || b[1] - a[1],
  );
  for (const [id, entry] of byStrength) {
    if (excess <= 0) {
      break;
    }
    delete q[id];
    // "id":[box,due], — the quotes, colon and comma are 4 more characters.
    excess -= id.length + JSON.stringify(entry).length + 4;
  }
  return { ...study, q };
}
