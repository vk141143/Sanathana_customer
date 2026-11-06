import React, { useEffect, useId, useRef, useState } from 'react';
import { Bookmark, BookOpen, Grid2X2, Headphones, Languages, Leaf, ScrollText } from 'lucide-react';

import { SacredScrollSurface } from './SacredScrollSurface';

type View = 'sloka' | 'meaning' | 'explanation' | 'example' | 'listen';
interface SacredScrollProps {
  verseLabel: string;
  sanskrit: string;
  transliteration: string;
  language: string;
  languageLabel: string;
  content: { translation?: string; meaning?: string; explanation?: string; example?: string };
  bookmarked: boolean;
  onBookmark: () => void;
  canListen: boolean;
  listenToSanskrit: boolean;
  onListen: () => void;
}

const labels: Record<View, string> = {
  sloka: 'Sanskrit sloka', meaning: 'Meaning', explanation: 'Explanation',
  example: 'Real-life Example', listen: 'Listen',
};

/** Visual state only. Audio controls stay mounted in the owning reader. */
export function SacredScroll(props: SacredScrollProps) {
  const [view, setView] = useState<View>('sloka');
  const [target, setTarget] = useState<View>('sloka');
  const [closing, setClosing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (view === target) { setClosing(false); return; }
    setClosing(true);
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(() => {
      setView(target);
      setClosing(false);
    }, reduced ? 0 : 220);
    return () => window.clearTimeout(timer);
  }, [target, view]);

  const closeMenu = () => { setMenuOpen(false); trigger.current?.focus(); };
  const select = (next: View) => { closeMenu(); setTarget(next); };
  const horizontal = view === 'sloka' || (view === 'listen' && props.listenToSanskrit);
  const text = view === 'meaning' || view === 'listen' ? props.content.translation
    : view === 'explanation' ? props.content.explanation : props.content.example;
  const actions = [
    { view: 'meaning' as const, Icon: Languages },
    { view: 'explanation' as const, Icon: BookOpen },
    { view: 'example' as const, Icon: Leaf },
  ];

  return (
    <section className="sacred-reader" aria-label="Scripture manuscript">
      <div className="sacred-caption"><span aria-hidden="true">✦</span> Sacred wisdom <span aria-hidden="true">✦</span></div>
      <div className={`sacred-stage ${closing ? 'is-closing' : ''}`}>
        <SacredScrollSurface key={`${view}:${horizontal ? 'sa' : props.language}`}
          horizontal={horizontal} label={`${props.verseLabel} — ${labels[view]}`}
          language={horizontal ? 'sa' : props.language}>
            <p className="sacred-eyebrow">{props.verseLabel} · {labels[view]}</p>
            {horizontal ? <>
              <div className="sacred-verse font-sanskrit">
                {props.sanskrit ? props.sanskrit.split(/\r?\n/).map((line, i) => (
                  <span className="sacred-line" key={i} style={{ '--line-delay': `${260 + i * 120}ms` } as React.CSSProperties}>{line || '\u00a0'}</span>
                )) : <p>Sanskrit text is not available for this verse.</p>}
              </div>
              {props.transliteration && <p className="sacred-transliteration" lang="sa-Latn">{props.transliteration}</p>}
            </> : <div className="sacred-prose">
              <p className="sacred-language">{props.languageLabel}</p>
              <p>{text || `${labels[view]} not available in ${props.languageLabel}.`}</p>
              {view === 'meaning' && props.content.meaning && props.content.meaning !== text &&
                <><h3>Meaning</h3><p>{props.content.meaning}</p></>}
            </div>}
            <div className="sacred-seal" aria-hidden="true">✧</div>
        </SacredScrollSurface>
      </div>
      <div className="sacred-tools" onKeyDown={event => {
        if (event.key === 'Escape' && menuOpen) { event.preventDefault(); closeMenu(); }
      }}>
        <button ref={trigger} type="button" className="sacred-menu-trigger" aria-label="Explore verse"
          aria-expanded={menuOpen} aria-controls={menuId} onClick={() => setMenuOpen(open => !open)}>
          <Grid2X2 size={19} aria-hidden="true" />
        </button>
        {view !== 'sloka' && <button type="button" className="sacred-return" onClick={() => select('sloka')}>
          <ScrollText size={16} aria-hidden="true" /> Return to sloka
        </button>}
        {menuOpen && <div id={menuId} className="sacred-actions" role="group" aria-label="Explore verse content">
          {actions.map(({ view: action, Icon }) => <button type="button" key={action}
            aria-pressed={target === action} onClick={() => select(action)}>
            <Icon size={20} aria-hidden="true" /><span>{labels[action]}</span>
          </button>)}
          <button type="button" disabled={!props.canListen} onClick={() => { select('listen'); props.onListen(); }}>
            <Headphones size={20} aria-hidden="true" /><span>Listen</span>
          </button>
          <button type="button" disabled title="Word-by-word content is not provided by this scripture source">
            <Languages size={20} aria-hidden="true" /><span>Word-by-word</span><small>Unavailable</small>
          </button>
          <button type="button" aria-pressed={props.bookmarked} onClick={() => { closeMenu(); props.onBookmark(); }}>
            <Bookmark size={20} fill={props.bookmarked ? 'currentColor' : 'none'} aria-hidden="true" />
            <span>{props.bookmarked ? 'Bookmarked' : 'Bookmark'}</span>
          </button>
        </div>}
      </div>
    </section>
  );
}
