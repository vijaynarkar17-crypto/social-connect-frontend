import { useRef, useCallback, useState } from 'react';

const MIN_DRAG = 55;
const THRESHOLD = 0.22;
const LEFT_EDGE = 48;

export function useSwipeLeftAction(onTrigger: () => void, enabled = true) {
  const startX = useRef(0);
  const startY = useRef(0);
  const tracking = useRef(false);
  const [progress, setProgress] = useState(0);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled) return;
      startX.current = e.touches[0].clientX;
      startY.current = e.touches[0].clientY;
      tracking.current = true;
    },
    [enabled]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!tracking.current || !enabled) return;
      const dx = e.touches[0].clientX - startX.current;
      const dy = e.touches[0].clientY - startY.current;
      if (startX.current <= LEFT_EDGE && dx > 0) return;
      if (Math.abs(dy) > Math.abs(dx) * 1.2 && Math.abs(dx) < MIN_DRAG) return;
      if (dx < 0) {
        setProgress(Math.min(Math.abs(dx) / (window.innerWidth * 0.75), 1));
      }
    },
    [enabled]
  );

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!tracking.current || !enabled) return;
      tracking.current = false;
      const dx = e.changedTouches[0].clientX - startX.current;
      const dy = e.changedTouches[0].clientY - startY.current;
      if (dx < -MIN_DRAG && Math.abs(dy) < Math.abs(dx) * 0.85 && progress >= THRESHOLD) {
        onTrigger();
      }
      setProgress(0);
    },
    [enabled, onTrigger, progress]
  );

  return { progress, onTouchStart, onTouchMove, onTouchEnd };
}

export function useSwipeRightAction(onTrigger: () => void, enabled = true, fromLeftEdgeOnly = false) {
  const startX = useRef(0);
  const startY = useRef(0);
  const tracking = useRef(false);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled) return;
      const x = e.touches[0].clientX;
      if (fromLeftEdgeOnly && x > LEFT_EDGE) return;
      startX.current = x;
      startY.current = e.touches[0].clientY;
      tracking.current = true;
    },
    [enabled, fromLeftEdgeOnly]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!tracking.current || !enabled) return;
      const dx = e.touches[0].clientX - startX.current;
      const dy = e.touches[0].clientY - startY.current;
      if (Math.abs(dy) > Math.abs(dx) * 1.2) tracking.current = false;
    },
    [enabled]
  );

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!tracking.current || !enabled) return;
      tracking.current = false;
      const dx = e.changedTouches[0].clientX - startX.current;
      const dy = e.changedTouches[0].clientY - startY.current;
      if (dx > MIN_DRAG && Math.abs(dy) < Math.abs(dx) * 0.85) {
        onTrigger();
      }
    },
    [enabled, onTrigger]
  );

  return { onTouchStart, onTouchMove, onTouchEnd };
}
