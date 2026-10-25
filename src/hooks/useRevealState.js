import { useCallback, useState } from 'react';

// Tracks which answers/solutions are revealed. In study mode everything starts open.
export default function useRevealState(startOpen) {
  const [overrides, setOverrides] = useState({});
  const isShown = useCallback(
    key => (key in overrides ? overrides[key] : startOpen),
    [overrides, startOpen],
  );
  const toggle = useCallback(
    key =>
      setOverrides(current => ({
        ...current,
        [key]: !(key in current ? current[key] : startOpen),
      })),
    [startOpen],
  );
  return { isShown, toggle };
}
