import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

// True when the student has turned on Reduce Motion (iOS) or removed animations
// (Android), so movement can be swapped for an instant change.
export default function useReduceMotion() {
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    let active = true;
    Promise.resolve(AccessibilityInfo.isReduceMotionEnabled?.())
      .then(enabled => {
        if (active) {
          setReduceMotion(Boolean(enabled));
        }
      })
      .catch(() => {});
    const subscription = AccessibilityInfo.addEventListener?.(
      'reduceMotionChanged',
      enabled => setReduceMotion(Boolean(enabled)),
    );
    return () => {
      active = false;
      subscription?.remove();
    };
  }, []);
  return reduceMotion;
}
