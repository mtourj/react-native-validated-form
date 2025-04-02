/** useBufferedState()
 * Instead of setting state right away, we store our new state
 * in a ref object using commitStateFromBuffer and wait until no additional
 * state changes have been made for at least X milliseconds, and only then do we
 * actually update state and trigger a re-render */

import { useCallback, useRef, useState } from "react";

export default function useBufferedState<ValueT>(value: ValueT, delay = 50) {
  const [state, _setState] = useState<ValueT>(value);

  const stateBufferRef = useRef<ValueT>(state);
  const commitTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const commitStateFromBuffer = useCallback(() => {
    if (commitTimeoutRef.current) clearTimeout(commitTimeoutRef.current);

    commitTimeoutRef.current = setTimeout(() => {
      _setState(stateBufferRef.current);

      commitTimeoutRef.current = undefined;
    }, delay);
  }, [delay]);

  const setState = useCallback(
    (setStateAction: ValueT | ((prevState: ValueT) => ValueT)) => {
      if (typeof setStateAction === "function")
        stateBufferRef.current = (setStateAction as Function)(
          stateBufferRef.current
        );
      else stateBufferRef.current = setStateAction;

      commitStateFromBuffer();
    },
    [commitStateFromBuffer]
  );

  return [state, setState] as [ValueT, typeof setState];
}
