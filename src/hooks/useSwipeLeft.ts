import { useRef, useCallback } from 'react';

interface SwipeOptions {
  onSwipeLeft?: () => void;
  threshold?: number;
}

export function useSwipeLeft({ onSwipeLeft, threshold = 70 }: SwipeOptions) {
  const startX = useRef(0);
  const startY = useRef(0);
  const tracking = useRef(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    tracking.current = true;
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!tracking.current || !onSwipeLeft) return;
      tracking.current = false;
      const dx = e.changedTouches[0].clientX - startX.current;
      const dy = e.changedTouches[0].clientY - startY.current;
      if (dx < -threshold && Math.abs(dy) < Math.abs(dx) * 0.8) {
        onSwipeLeft();
      }
    },
    [onSwipeLeft, threshold]
  );

  return { onTouchStart, onTouchEnd };
}
