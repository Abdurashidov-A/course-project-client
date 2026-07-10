import { useCallback, useEffect, useRef } from "react";

export function useDebouncedCallback(callback, delay) {
  const callbackRef = useRef(callback);
  const timerRef = useRef(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const schedule = useCallback(
    (...args) => {
      cancel();

      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        callbackRef.current(...args);
      }, delay);
    },
    [cancel, delay],
  );

  useEffect(() => cancel, [cancel]);

  return { schedule, cancel };
}
