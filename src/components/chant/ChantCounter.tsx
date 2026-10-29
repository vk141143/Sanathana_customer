import React from 'react';
import type { ChantSession } from '../../lib/chant';

export function ChantCounter({ session, busy, onCount }: {
  session: Pick<ChantSession, 'current_count' | 'target_count' | 'status'>;
  busy: boolean;
  onCount: () => void;
}) {
  return <button className="chant-counter" disabled={busy || session.status !== 'active'}
    onClick={onCount} aria-label={`Count one repetition. Current count ${session.current_count}`}>
    <span>{session.current_count}</span>
    <small>OF {session.target_count} · {session.status === 'active' ? 'TAP TO COUNT' : session.status.toUpperCase()}</small>
  </button>;
}
