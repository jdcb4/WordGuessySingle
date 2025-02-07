import { useState, useEffect, useCallback } from 'react';

export const TURN_DURATION = 60;

export function useTimer() {
  const [timeLeft, setTimeLeft] = useState(TURN_DURATION);
  const [isActive, setIsActive] = useState(false);

  const start = useCallback(() => {
    setTimeLeft(TURN_DURATION);
    setIsActive(true);
  }, []);

  const stop = useCallback(() => {
    setIsActive(false);
  }, []);

  const reset = useCallback(() => {
    setTimeLeft(TURN_DURATION);
    setIsActive(false);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => {
          if (time <= 1) {
            setIsActive(false);
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  return {
    timeLeft,
    isActive,
    start,
    stop,
    reset,
    isFinished: timeLeft === 0
  };
}
