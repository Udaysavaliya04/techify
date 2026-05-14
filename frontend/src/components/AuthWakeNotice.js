import React, { useEffect, useState } from 'react';

const messages = [
  'Waking the secure server',
  'Keeping your session request alive',
  'Almost there'
];

export default function AuthWakeNotice({ active, delay = 2500 }) {
  const [showHostingNote, setShowHostingNote] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (!active) {
      setShowHostingNote(false);
      setMessageIndex(0);
      return undefined;
    }

    const timer = window.setTimeout(() => setShowHostingNote(true), delay);
    return () => window.clearTimeout(timer);
  }, [active, delay]);

  useEffect(() => {
    if (!active) return undefined;

    const interval = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % messages.length);
    }, 3200);

    return () => window.clearInterval(interval);
  }, [active]);

  if (!active) return null;

  return (
    <div className="auth-wake-notice" role="status" aria-live="polite">
      <span className="auth-wake-notice__pulse" aria-hidden="true" />
      <span className="auth-wake-notice__text">
        <strong>{messages[messageIndex]}</strong>
        <span>
          {showHostingNote
            ? 'Free hosting may need a few extra seconds on the first login or signup.'
            : 'Please keep this tab open while we connect.'}
        </span>
      </span>
    </div>
  );
}
