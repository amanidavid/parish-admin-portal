'use client';
import { useEffect, useState } from 'react';
import AppLoader from './AppLoader';
import useUiLoaderStore from '@/store/uiLoaderStore';

const VISIBILITY_DELAY = 50;

export default function GlobalLoadingOverlay() {
  // FIXED: subscribe to boolean instead of raw count.
  // Component only re-renders when crossing the 0 threshold (0→1 or 1→0),
  // not on every increment/decrement of pendingCount.
  const isLoading = useUiLoaderStore((state) => state.pendingCount > 0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setVisible(false);
      return;
    }

    const timer = window.setTimeout(() => setVisible(true), VISIBILITY_DELAY);
    return () => window.clearTimeout(timer);
  }, [isLoading]);

  if (!visible || !isLoading) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/8">
      <AppLoader
        label="Loading"
        hint=""
        size="sm"
        className="min-h-0"
      />
    </div>
  );
}
