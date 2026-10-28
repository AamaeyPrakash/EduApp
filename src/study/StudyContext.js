import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { getQuestion } from '../content';
import {
  currentStreak,
  dayNumber,
  dueIds,
  fitToLimit,
  mistakeIds,
  nextReview,
  normalizeStudy,
  noteTopic,
  recordResult,
  reviewDelay,
  setGoal,
  todayCount,
  toggleBookmark,
} from './progress';

// Waits for a pause in marking answers, so a quiz saves once rather than per tap.
const SAVE_DELAY_MS = 2000;

const StudyContext = createContext(null);

// Ids that still match a bundled question (an edited question gets a new id).
const existing = ids => ids.filter(id => getQuestion(id));

function msUntilTomorrow() {
  const now = new Date();
  const tomorrow = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
  );
  return tomorrow - now + 1000;
}

function StudyStore({ userId, initialStudy, updatePrefs, children }) {
  const [study, setStudy] = useState(() => normalizeStudy(initialStudy));
  const [today, setToday] = useState(dayNumber);
  const [saveFailed, setSaveFailed] = useState(false);
  const studyRef = useRef(study);
  const unsaved = useRef(false);
  const timer = useRef(null);

  const save = useCallback(async () => {
    clearTimeout(timer.current);
    if (!userId || !unsaved.current) {
      return;
    }
    unsaved.current = false;
    try {
      await updatePrefs({ study: fitToLimit(studyRef.current) });
      setSaveFailed(false);
    } catch {
      // Keep the changes and try again with the next answer or app resume.
      unsaved.current = true;
      setSaveFailed(true);
    }
  }, [updatePrefs, userId]);

  const update = useCallback(
    change => {
      const next = change(studyRef.current);
      if (next === studyRef.current) {
        return;
      }
      studyRef.current = next;
      setStudy(next);
      unsaved.current = true;
      clearTimeout(timer.current);
      timer.current = setTimeout(save, SAVE_DELAY_MS);
    },
    [save],
  );

  // Save before the app is suspended; check the date and retry failed saves on return.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        setToday(dayNumber());
      }
      save();
    });
    return () => {
      subscription.remove();
      clearTimeout(timer.current);
    };
  }, [save]);

  // The date also changes while the app is open (revising past midnight).
  useEffect(() => {
    const midnight = setTimeout(() => setToday(dayNumber()), msUntilTomorrow());
    return () => clearTimeout(midnight);
  }, [today]);

  const value = useMemo(() => {
    const due = existing(dueIds(study, today));
    const mistakes = existing(mistakeIds(study));
    const saved = existing(study.b);
    const attempted = existing(Object.keys(study.q));
    return {
      study,
      today,
      dueIds: due,
      mistakeIds: mistakes,
      savedIds: saved,
      streak: currentStreak(study, today),
      bestStreak: study.s[1],
      todayCount: todayCount(study, today),
      attemptedCount: attempted.length,
      knownCount: attempted.filter(id => study.q[id][0] > 0).length,
      saveFailed,
      record: (id, gotIt) => {
        const day = dayNumber();
        setToday(day);
        update(current => recordResult(current, id, gotIt, day));
      },
      // When a question would come back after "Got it" / "Not yet", e.g. "in 7 days".
      reviewAfter: (id, gotIt) =>
        reviewDelay(nextReview(study, id, gotIt, today)[1], today),
      toggleBookmark: id => update(current => toggleBookmark(current, id)),
      dailyGoal: study.g,
      setDailyGoal: goal => update(current => setGoal(current, goal)),
      lastTopic: study.l,
      noteTopic: (courseKey, topicKey) =>
        update(current => noteTopic(current, courseKey, topicKey)),
      isBookmarked: id => study.b.includes(id),
      // Call before signing out so the last answers aren't lost.
      flush: save,
    };
  }, [study, today, saveFailed, update, save]);

  return (
    <StudyContext.Provider value={value}>{children}</StudyContext.Provider>
  );
}

// Progress belongs to the signed-in student; switching accounts starts a fresh store.
export function StudyProvider({ children }) {
  const { user, updatePrefs } = useAuth();
  return (
    <StudyStore
      key={user?.$id ?? 'signed-out'}
      userId={user?.$id ?? null}
      initialStudy={user?.prefs?.study}
      updatePrefs={updatePrefs}
    >
      {children}
    </StudyStore>
  );
}

export function useStudy() {
  const context = useContext(StudyContext);
  if (!context) {
    throw new Error('useStudy must be used inside <StudyProvider>.');
  }
  return context;
}
