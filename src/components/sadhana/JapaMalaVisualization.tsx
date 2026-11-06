import React from 'react';

/** Decorative only: acknowledged session counts remain the source of truth. */
export function JapaMalaVisualization({ count, target, active = false }: { count: number; target: number; active?: boolean }) {
  const fraction = Math.max(0, Math.min(1, count / Math.max(1, target)));
  return <div className={`sadhana-mala ${active ? 'is-active' : ''}`} aria-hidden="true">
    <svg viewBox="0 0 280 280"><circle cx="140" cy="135" r="112" fill="none" stroke="#947039" strokeWidth="1"/>
      <circle cx="140" cy="135" r="94" fill="none" stroke="#c49a4e33" strokeWidth="1" strokeDasharray="2 7"/>
      {Array.from({ length: 54 }, (_, i) => { const angle = (i / 54 * 360 - 90) * Math.PI / 180; return <circle key={i} cx={140 + Math.cos(angle) * 112} cy={135 + Math.sin(angle) * 112} r="4.7" className={i < Math.ceil(fraction * 54) ? 'mala-bead is-lit' : 'mala-bead'}/>; })}
      <path d="M140 247v18m-6-2 6 10 6-10" stroke="#e8bd73" fill="none"/>
      <circle cx="140" cy="247" r="8" fill="#c99343"/>
    </svg><span className="sadhana-mala-symbol">ॐ</span>
  </div>;
}
