import React, { useEffect, useRef, useState } from 'react';
import { Feather, X, Check } from 'lucide-react';

interface GratitudeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveGratitude: (blessing: string) => void | Promise<void>;
  entries?: Array<{date: string; blessing: string}>;
}
export const GratitudeModal: React.FC<GratitudeModalProps> = ({ isOpen, onClose, onSaveGratitude, entries = [] }) => {
  const [text, setText] = useState(''), [saving, setSaving] = useState(false), [saved, setSaved] = useState(false), [error, setError] = useState('');
  const dialog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isOpen) return;
    setSaved(false); setError('');
    const focused = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current?.focus();
    return () => { document.body.style.overflow = overflow; focused?.focus(); };
  }, [isOpen]);
  if (!isOpen) return null;
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving || !text.trim() || text.length > 2000) return;
    setSaving(true); setError('');
    try { await onSaveGratitude(text.trim()); setText(''); setSaved(true); }
    catch { setError('Your entry could not be saved. Your writing is still here; please retry.'); }
    finally { setSaving(false); }
  };
  return <div className="sadhana-journal-overlay"><div className="sadhana-journal" ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="journal-title" onKeyDown={event => {
    if (event.key === 'Escape' && !saving) onClose();
    if (event.key === 'Tab') {
      const focusable = Array.from(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled),textarea,summary') ?? []).filter(el => el.getClientRects().length);
      const first = focusable[0], last = focusable.at(-1);
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  }}>
    <header><div><span className="sadhana-eyebrow">A HEART OPEN TO GRACE</span><h2 id="journal-title">Gratitude Journal</h2></div><button aria-label="Close gratitude journal" disabled={saving} onClick={onClose}><X size={20}/></button></header>
    <p>Pause. Notice the blessings in the ordinary. Let your heart find the words.</p>
    <form onSubmit={save}>
      <div className="sadhana-parchment"><label htmlFor="gratitude-entry"><Feather size={22} aria-hidden="true"/>Today I am grateful for…</label><textarea id="gratitude-entry" value={text} onChange={e => { setText(e.target.value); setSaved(false); }} maxLength={2000} required placeholder="The people, the moments, the little things…" aria-describedby="gratitude-count"/><span id="gratitude-count" className="sadhana-character-count">{text.length.toLocaleString()} / 2,000 characters</span></div>
      {error && <p className="sadhana-notice" role="alert">{error}</p>}
      {saved && <p className="sadhana-notice" role="status"><Check size={16} style={{display:'inline',marginRight:8}}/>Your reflection is saved in this device's journal.</p>}
      <div className="sadhana-journal-actions"><button className="sadhana-primary" type="submit" disabled={saving || !text.trim()}>{saving ? 'Saving your reflection…' : 'Save my gratitude'}</button></div>
    </form>
    <details open={saved}><summary>My reflections · {entries.length}</summary>{entries.length ? [...entries].reverse().map((entry,index) => <article key={`${entry.date}-${index}`}><time>{entry.date}</time><p>{entry.blessing}</p></article>) : <p>Your first reflection is a beautiful place to begin.</p>}</details>
    <p className="sadhana-footnote">Your journal uses this app's existing device storage.</p>
  </div></div>;
};
