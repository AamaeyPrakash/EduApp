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
  normalizeStudy,
  recordResult,
  todayCount,
  toggleBookmark,
} from './progress';

// Waits for a pause in marking answers, so a quiz saves once rather than per tap.
const SAVE_DELAY_MS = 2000;

const StudyContext = createContext(null);

// Ids that still match a bundled question (an edited question gets a new id).
const existing = ids => ids.filter(id => getQuestion(id));

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
      studyRef.current = change(studyRef.current);
      setStudy(studyRef.current);
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

  const value = useMemo(() => {
    const due = existing(dueIds(study, today));
    const mistakes = existing(mistakeIds(study));
    const saved = existing(study.b);
    return {
      study,
      today,
      dueIds: due,
      mistakeIds: mistakes,
      savedIds: saved,
      streak: currentStreak(study, today),
      bestStreak: study.s[1],
      todayCount: todayCount(study, today),
      attemptedCount: Object.keys(study.q).length,
      knownCount: Object.values(study.q).filter(([box]) => box > 0).length,
      saveFailed,
      record: (id, gotIt) =>
        update(current => recordResult(current, id, gotIt, dayNumber())),
      toggleBookmark: id => update(current => toggleBookmark(current, id)),
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
