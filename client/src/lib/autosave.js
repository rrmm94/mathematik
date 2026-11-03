import { useCallback, useEffect, useRef } from 'react';

// Zwischenspeichern von Eingaben: kurz nach der letzten Änderung wird gespeichert,
// spätestens aber beim Verlassen der Seite, beim Wechsel in einen anderen Tab
// oder beim Schließen des Browsers (fetch mit keepalive).
// send(payload, keepalive) führt das Speichern aus.
export function useAutosave(send, delay = 800) {
  const pending = useRef(null);
  const timer = useRef(null);
  const sendRef = useRef(send);
  sendRef.current = send;

  const flush = useCallback((keepalive = false) => {
    clearTimeout(timer.current);
    const payload = pending.current;
    if (!payload) return Promise.resolve();
    pending.current = null;
    return Promise.resolve(sendRef.current(payload, keepalive)).catch(() => {
      // Netzwerkfehler: beim nächsten Anlass erneut versuchen
      if (!pending.current) pending.current = payload;
    });
  }, []);

  const schedule = useCallback((payload) => {
    pending.current = payload;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => flush(false), delay);
  }, [delay, flush]);

  const cancel = useCallback(() => {
    clearTimeout(timer.current);
    pending.current = null;
  }, []);

  useEffect(() => {
    const onHide = () => flush(true);
    const onVis = () => { if (document.visibilityState === 'hidden') flush(true); };
    window.addEventListener('pagehide', onHide);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('pagehide', onHide);
      document.removeEventListener('visibilitychange', onVis);
      flush(true);
    };
  }, [flush]);

  return { schedule, flush, cancel };
}
