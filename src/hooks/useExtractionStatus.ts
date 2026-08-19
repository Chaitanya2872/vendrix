import { useCallback, useEffect, useRef, useState } from "react";
import {
  getProcessingStatus,
  isTerminal,
  type ProcessingStatusPayload,
} from "@/api/invoiceExtraction";

/**
 * Polls a document's processing status until it reaches a terminal state.
 *
 * Three things here are load-bearing:
 *
 * **Polling stops.** Once the status is terminal nothing further will change
 * without a reprocess, and a timer that kept running would hammer the API
 * for the rest of the session — one request per second per open tab, for
 * documents that finished ten minutes ago.
 *
 * **The interval backs off.** Extraction takes minutes on a scanned invoice.
 * A fixed one-second poll spends most of that time asking a question whose
 * answer has not changed, so the gap widens as the job runs long.
 *
 * **A failed poll does not kill the loop.** A dropped request during a
 * multi-minute job is ordinary; giving up on it would strand the UI on a
 * stale progress bar with no way back.
 */

const INITIAL_INTERVAL_MS = 1_000;
const MAX_INTERVAL_MS = 5_000;
const BACKOFF_FACTOR = 1.25;
// Consecutive failures tolerated before the hook reports the poll itself as
// broken. Three keeps a transient blip invisible while still surfacing a
// server that has actually gone away.
const MAX_CONSECUTIVE_FAILURES = 3;

export type ExtractionStatusState = {
  status: ProcessingStatusPayload | null;
  loading: boolean;
  /** Set when polling itself is failing, not when extraction failed — those
   * are different problems and want different messages. */
  pollError: string | null;
  finished: boolean;
  refresh: () => Promise<void>;
};

export function useExtractionStatus(
  documentId: string | null,
  options: { enabled?: boolean; onFinished?: (status: ProcessingStatusPayload) => void } = {},
): ExtractionStatusState {
  const { enabled = true, onFinished } = options;

  const [status, setStatus] = useState<ProcessingStatusPayload | null>(null);
  const [pollError, setPollError] = useState<string | null>(null);
  // Derived rather than stored: "loading" here means only "we have not heard
  // back yet", which the presence of a status already answers. Keeping it as
  // its own state meant setting it synchronously inside the polling effect,
  // which triggers a cascading render on every tick.
  const loading = enabled && Boolean(documentId) && status === null && pollError === null;

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelled = useRef(false);
  const failures = useRef(0);
  const interval = useRef(INITIAL_INTERVAL_MS);
  // Held in a ref so a caller passing an inline arrow does not restart
  // polling on every render. Updated in an effect rather than during render:
  // a render can be discarded, and a ref written during one would then hold a
  // callback from a render that never committed.
  const onFinishedRef = useRef(onFinished);
  useEffect(() => {
    onFinishedRef.current = onFinished;
  });

  const fetchOnce = useCallback(async (): Promise<ProcessingStatusPayload | null> => {
    if (!documentId) return null;
    const next = await getProcessingStatus(documentId);
    if (cancelled.current) return null;
    setStatus(next);
    setPollError(null);
    failures.current = 0;
    return next;
  }, [documentId]);

  const refresh = useCallback(async () => {
    try {
      await fetchOnce();
    } catch {
      setPollError("Could not reach the server.");
    }
  }, [fetchOnce]);

  useEffect(() => {
    if (!documentId || !enabled) return;

    cancelled.current = false;
    failures.current = 0;
    interval.current = INITIAL_INTERVAL_MS;

    const tick = async () => {
      try {
        const next = await fetchOnce();
        if (cancelled.current) return;

        if (next && isTerminal(next.status)) {
          onFinishedRef.current?.(next);
          return; // terminal: stop polling entirely
        }
        interval.current = Math.min(interval.current * BACKOFF_FACTOR, MAX_INTERVAL_MS);
      } catch {
        if (cancelled.current) return;
        failures.current += 1;
        if (failures.current >= MAX_CONSECUTIVE_FAILURES) {
          setPollError("Lost contact with the server. Retrying…");
        }
        // Keep going regardless: a dropped request during a multi-minute job
        // is ordinary, and stopping would strand the UI on a stale bar.
        interval.current = Math.min(interval.current * BACKOFF_FACTOR, MAX_INTERVAL_MS);
      }
      if (!cancelled.current) {
        timer.current = setTimeout(tick, interval.current);
      }
    };

    void tick();

    return () => {
      cancelled.current = true;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [documentId, enabled, fetchOnce]);

  return {
    status,
    loading,
    pollError,
    finished: status ? isTerminal(status.status) : false,
    refresh,
  };
}
