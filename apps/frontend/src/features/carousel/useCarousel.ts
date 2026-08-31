import { useCallback, useEffect, useRef, useState } from 'react';

export function useCarousel(length: number, intervalMs = 5000, controlIdleMs = 234) {
  const [index, setIndex] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const resumeRef = useRef<number | null>(null);

  const clearAutoPlay = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const clearResume = useCallback(() => {
    if (resumeRef.current !== null) {
      window.clearTimeout(resumeRef.current);
      resumeRef.current = null;
    }
  }, []);

  const startAutoPlay = useCallback(() => {
    if (length <= 1) {
      return;
    }

    clearAutoPlay();
    intervalRef.current = window.setInterval(() => {
      setIndex((current) => (current + 1) % length);
    }, intervalMs);
  }, [clearAutoPlay, intervalMs, length]);

  const pauseAutoPlayForControl = useCallback(() => {
    clearAutoPlay();
    clearResume();
    resumeRef.current = window.setTimeout(() => {
      resumeRef.current = null;
      startAutoPlay();
    }, controlIdleMs);
  }, [clearAutoPlay, clearResume, controlIdleMs, startAutoPlay]);

  const goTo = useCallback((nextIndex: number) => {
    if (length === 0) {
      return;
    }

    const normalized = ((nextIndex % length) + length) % length;
    setIndex(normalized);
  }, [length]);

  const goNext = useCallback(() => {
    if (length === 0) {
      return;
    }

    setIndex((current) => (current + 1) % length);
    pauseAutoPlayForControl();
  }, [length, pauseAutoPlayForControl]);

  const goPrev = useCallback(() => {
    if (length === 0) {
      return;
    }

    setIndex((current) => ((current - 1) % length + length) % length);
    pauseAutoPlayForControl();
  }, [length, pauseAutoPlayForControl]);

  useEffect(() => {
    startAutoPlay();

    return () => {
      clearAutoPlay();
      clearResume();
    };
  }, [clearAutoPlay, clearResume, startAutoPlay]);

  return {
    index,
    goTo,
    goNext,
    goPrev,
  };
}
