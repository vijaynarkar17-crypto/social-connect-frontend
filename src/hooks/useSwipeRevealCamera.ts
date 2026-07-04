import { useRef, useCallback, useState } from 'react';

const EDGE_ZONE = 48;
const OPEN_THRESHOLD = 0.28;
const MIN_DRAG = 60;

interface Options {
  onOpen: () => void;
  onClose?: () => void;
  enabled?: boolean;
}

export function useSwipeRevealCamera({ onOpen, onClose, enabled = true }: Options) {
  const startX = useRef(0);
  const startY = useRef(0);
  const tracking = useRef(false);
  const fromEdge = useRef(false);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);

  const reset = useCallback(() => {
    setProgress(0);
    setDragging(false);
    tracking.current = false;
  }, []);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled) return;
      const x = e.touches[0].clientX;
      const y = e.touches[0].clientY;
      startX.current = x;
      startY.current = y;
      fromEdge.current = x <= EDGE_ZONE;
      tracking.current = true;
    },
    [enabled]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!tracking.current || !enabled) return;
      const dx = e.touches[0].clientX - startX.current;
      const dy = e.touches[0].clientY - startY.current;
      if (Math.abs(dy) > Math.abs(dx) * 1.2 && dx < MIN_DRAG) return;

      if (dx > 0 && (fromEdge.current || dx > MIN_DRAG)) {
        setDragging(true);
        const p = Math.min(dx / (window.innerWidth * 0.85), 1);
        setProgress(p);
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

      if (dx > MIN_DRAG && Math.abs(dy) < Math.abs(dx) * 0.85) {
        if (progress >= OPEN_THRESHOLD || dx > window.innerWidth * 0.2) {
          setProgress(1);
          onOpen();
        } else {
          reset();
        }
      } else {
        reset();
      }
    },
    [enabled, onOpen, progress, reset]
  );

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!enabled || e.button !== 0) return;
      if (e.clientX > EDGE_ZONE) return;
      startX.current = e.clientX;
      startY.current = e.clientY;
      fromEdge.current = true;
      tracking.current = true;

      const onMove = (ev: MouseEvent) => {
        if (!tracking.current) return;
        const dx = ev.clientX - startX.current;
        if (dx > 0) {
          setDragging(true);
          setProgress(Math.min(dx / (window.innerWidth * 0.85), 1));
        }
      };

      const onUp = (ev: MouseEvent) => {
        tracking.current = false;
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        const dx = ev.clientX - startX.current;
        if (dx > MIN_DRAG) {
          setProgress(1);
          onOpen();
        } else {
          reset();
        }
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [enabled, onOpen, reset]
  );

  const snapBack = useCallback(() => {
    reset();
    onClose?.();
  }, [onClose, reset]);

  const snapOpen = useCallback(() => {
    setProgress(1);
    setDragging(false);
  }, []);

  return {
    progress,
    dragging,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onMouseDown,
    snapBack,
    snapOpen,
    reset,
  };
}
