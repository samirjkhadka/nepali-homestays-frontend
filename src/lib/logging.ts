/**
 * User journey and error logging for analytics and error tracking.
 * Sends events to backend /api/logs/journey and /api/logs/error.
 */
import { api } from './api';

const SESSION_KEY = 'nh_session_id';
const JOURNEY_BUFFER_MAX = 20;
const JOURNEY_FLUSH_MS = 5000;

function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

type JourneyEvent = {
  event_type: string;
  page_or_route?: string;
  payload?: Record<string, unknown> | string;
};

const journeyBuffer: JourneyEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function flushJourney(): void {
  if (journeyBuffer.length === 0) return;
  const events = journeyBuffer.splice(0, journeyBuffer.length);
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  api.post('/api/logs/journey', { session_id: getSessionId(), events }).catch(() => {
    // Re-queue on failure (optional: could drop or retry)
  });
}

/** Queue a user journey event; flushed in batch periodically or when buffer is full. */
export function logJourneyEvent(
  eventType: string,
  options?: { page_or_route?: string; payload?: Record<string, unknown> }
): void {
  journeyBuffer.push({
    event_type: eventType,
    page_or_route: options?.page_or_route,
    payload: options?.payload,
  });
  if (journeyBuffer.length >= JOURNEY_BUFFER_MAX) flushJourney();
  else if (!flushTimer) {
    flushTimer = setTimeout(flushJourney, JOURNEY_FLUSH_MS);
  }
}

/** Report an error to the backend (frontend error log). */
export function reportError(message: string, options?: { stack?: string; level?: 'error' | 'warn' }): void {
  api.post('/api/logs/error', {
    message,
    stack: options?.stack,
    level: options?.level ?? 'error',
  }).catch(() => {});
}

/** Call on page unload to send remaining journey events (e.g. beforeunload). */
export function flushJourneyOnUnload(): void {
  if (journeyBuffer.length === 0) return;
  const base = (api.defaults.baseURL as string) || '';
  const url = (base.startsWith('http') ? base : `${window.location.origin}${base}`) + '/api/logs/journey';
  const body = JSON.stringify({
    session_id: getSessionId(),
    events: journeyBuffer.splice(0, journeyBuffer.length),
  });
  if (navigator.sendBeacon) {
    navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
  }
}

export { getSessionId };
