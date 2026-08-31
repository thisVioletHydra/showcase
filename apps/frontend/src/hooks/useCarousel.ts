import { useCallback, useEffect, useState } from 'react';

export function useCarousel(length: number, intervalMs = 5000) {
  const [index, setIndex] = useState(0);

  const goTo = useCallback((nextIndex: number) => {
    if (length === 0) {
      return;
    }

    const normalized = ((nextIndex % length) + length) % length;
    setIndex(normalized);
  }, [length]);

  const goNext = useCallback(() => {
    goTo(index + 1);
  }, [goTo, index]);

  const goPrev = useCallback(() => {
    goTo(index - 1);
  }, [goTo, index]);

  useEffect(() => {
    if (length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % length);
    }, intervalMs);

    return () => {
      window.clearInterval(timer);
    };
  }, [intervalMs, length]);

  return {
    index,
    goTo,
    goNext,
    goPrev,
  };
}
