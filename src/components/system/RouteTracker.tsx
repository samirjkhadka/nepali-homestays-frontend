import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { logJourneyEvent } from '@/lib/logging';

const CLICK_THROTTLE_MS = 1000;
let lastClickLog = 0;

/** Logs page_view on route change and throttled click events for heat map. */
export default function RouteTracker() {
  const location = useLocation();
  const prevPathRef = useRef<string | null>(null);

  useEffect(() => {
    const path = location.pathname || '/';
    if (prevPathRef.current !== path) {
      prevPathRef.current = path;
      logJourneyEvent('page_view', { page_or_route: path });
    }
  }, [location.pathname]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastClickLog < CLICK_THROTTLE_MS) return;
      const target = e.target as HTMLElement;
      const tag = target.tagName?.toLowerCase();
      const id = target.id || undefined;
      const className = (target.className && typeof target.className === 'string') ? target.className.slice(0, 100) : undefined;
      const path = location.pathname || '/';
      lastClickLog = now;
      logJourneyEvent('click', {
        page_or_route: path,
        payload: { x: e.clientX, y: e.clientY, tag, id, class: className },
      });
    };
    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [location.pathname]);

  return null;
}
