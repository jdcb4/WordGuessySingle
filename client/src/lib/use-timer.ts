import { useState, useEffect, useCallback } from 'react';

export function useTimer(duration: number) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isActive, setIsActive] = useState(false);

  const start = useCallback(() => {
    setTimeLeft(duration);
    setIsActive(true);
  }, [duration]);

  const stop = useCallback(() => {
    setIsActive(false);
  }, []);

  const reset = useCallback(() => {
    setTimeLeft(duration);
    setIsActive(false);
  }, [duration]);

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