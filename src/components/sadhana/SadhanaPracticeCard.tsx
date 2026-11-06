import React from 'react';
import { Check, ChevronRight } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { getPracticeTarget, isSafePlayableUrl, type SadhanaPractice, type PracticeRuntimeState, isPracticeComplete } from '../../services/sadhana/practiceCatalog';
import { practiceImages } from './SadhanaVisuals';

export function SadhanaPracticeCard({ practice, runtime, onOpen, index }: { practice: SadhanaPractice; runtime?: PracticeRuntimeState; onOpen: () => void; index: number }) {
  const reduced = useReducedMotion(), target = getPracticeTarget(practice);
  const done = !!runtime && isPracticeComplete(practice, runtime);
  const amount = !runtime ? null : practice.target_type === 'duration' ? runtime.elapsedSeconds / (target?.unit.startsWith('sec') ? 1 : target?.unit.startsWith('hour') ? 3600 : 60) : practice.target_type === 'entries' ? runtime.submittedEntries : practice.target_type === 'repetitions' ? runtime.repetitions : null;
  const percent = done ? 100 : amount !== null && target ? Math.min(100, amount / target.value * 100) : 0;
  const art = isSafePlayableUrl(practice.cover_image_url) ? practice.cover_image_url : practiceImages[practice.category];
  return <motion.button className="sadhana-practice-card" onClick={onOpen} initial={reduced ? false : { opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .1 }} transition={{ duration: .35, delay: Math.min(index * .04, .16) }}>
    <span className="sadhana-practice-art"><img src={art} alt="" loading="lazy" onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = practiceImages[practice.category]; }}/></span>
    <span className="sadhana-practice-copy"><span className="sadhana-eyebrow">{practice.category.replace('_', ' ')}{practice.is_featured ? ' · FEATURED' : ''}</span><strong>{practice.name}</strong><span className="sadhana-practice-description">{practice.subtitle || practice.description || 'Make space for your daily practice.'}</span><span className="sadhana-practice-target">{done ? 'Completed this visit' : amount !== null && target ? `${Math.floor(amount)} / ${target.value} ${target.unit}` : target ? `Target · ${target.value} ${target.unit}` : 'Begin your practice'}</span><progress aria-label={`${practice.name} session progress`} value={percent} max={100}/></span>
    <span className="sadhana-practice-arrow">{done ? <Check size={18}/> : <ChevronRight size={18}/>}</span>
  </motion.button>;
}
