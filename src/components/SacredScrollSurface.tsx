import React from 'react';

/** Shared manuscript structure; animation rules live in SacredScroll.css. */
export function SacredScrollSurface({ children, horizontal = false, label, language }: {
  children: React.ReactNode;
  horizontal?: boolean;
  label: string;
  language?: string;
}) {
  return (
    <article className={`sacred-scroll ${horizontal ? 'is-horizontal' : 'is-vertical'}`} aria-label={label}>
      <div className="sacred-paper" aria-hidden="true" />
      <div className="sacred-roller sacred-roller-start" aria-hidden="true" />
      <div className="sacred-roller sacred-roller-end" aria-hidden="true" />
      <div className="sacred-ink" lang={language}>{children}</div>
    </article>
  );
}
