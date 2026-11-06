import React, { useEffect, useMemo, useState } from 'react';
import { UserProfile, SadhanaTask } from '../types';
import { chantApi, type ChantMe, type ChantSession } from '../lib/chant';
import { meditationApi, type MeditationSession } from '../services/meditationApi';
import { auth } from '../lib/firebase';
import { PRACTICE_WEIGHTS } from '../services/sadhana/progressConfig';
import { useSadhanaOverview } from './sadhana/useSadhanaOverview';
import { currentStreak, dateBefore, completionThreshold } from './sadhana/overview';
import { SadhanaHeading } from './sadhana/SadhanaVisuals';

const localDate = (date: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(date);
type Period = 'Weekly' | 'Monthly' | 'Yearly';
export const JourneyView: React.FC<{user: UserProfile; tasks: SadhanaTask[]; onBack: () => void}> = ({ onBack }) => {
  const overview = useSadhanaOverview();
  const [period, setPeriod] = useState<Period>('Weekly');
  const [records, setRecords] = useState<{meditation: MeditationSession[]; japa: ChantSession[]} | null>(null);
  const [loading, setLoading] = useState(true), [error, setError] = useState(''), [revision, setRevision] = useState(0);
  const today = localDate(new Date()), length = period === 'Weekly' ? 7 : period === 'Monthly' ? 30 : 365;
  const start = dateBefore(today, length - 1);
  useEffect(() => {
    let alive = true;
    setLoading(true); setRecords(null); setError('');
    if (!overview.uid) { setLoading(false); return; }
    async function loadMeditation() {
      const rows: MeditationSession[] = [];
      for (let page = 0; alive; page++) {
        const result = await meditationApi.getHistory(page);
        rows.push(...result.sessions);
        if (result.sessions.length < 20 || result.sessions.at(-1)!.started_at.slice(0, 10) < dateBefore(start)) break;
      }
      return rows;
    }
    async function loadJapa() {
      const rows: ChantSession[] = [];
      for (let page = 0; alive; page++) {
        const result = await chantApi<ChantMe>(`/me?page=${page}`);
        rows.push(...result.sessions);
        if (result.sessions.length < 20 || result.sessions.at(-1)!.started_at.slice(0, 10) < dateBefore(start)) break;
      }
      return rows;
    }
    Promise.all([loadMeditation(), loadJapa()]).then(([meditation, japa]) => {
      if (alive && auth.currentUser?.uid === overview.uid) setRecords({ meditation, japa });
    }).catch(() => { if (alive) setError('Could not load the selected period. Please retry.'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [start, overview.uid, revision]);
  const days = useMemo(() => {
    const result = Array.from({length}, (_, i) => ({ date: dateBefore(today, length - i - 1), meditation: false, japa: false, minutes: 0, percent: 0 }));
    const byDate = new Map(result.map(day => [day.date, day]));
    for (const session of records?.meditation ?? []) {
      const day = byDate.get(localDate(new Date((session as MeditationSession & { completed_at?: string }).completed_at || session.started_at)));
      if (day && session.status === 'completed') { day.meditation = true; day.minutes += session.active_duration_seconds / 60; }
    }
    for (const session of records?.japa ?? []) {
      const day = byDate.get(localDate(new Date(session.completed_at || session.started_at)));
      if (day && session.status === 'completed') { day.japa = true; day.minutes += session.duration_seconds / 60; }
    }
    for (const day of result) day.percent = Math.round((Number(day.meditation) * PRACTICE_WEIGHTS.meditation + Number(day.japa) * PRACTICE_WEIGHTS.japa) * 100);
    return result;
  }, [records, length, today]);
  const chart = period === 'Yearly' ? Array.from({ length: 12 }, (_, i) => {
    const subset = days.slice(Math.floor(i * days.length / 12), Math.floor((i + 1) * days.length / 12));
    return { date: subset[0].date, percent: subset.reduce((sum, day) => sum + day.percent, 0) / subset.length };
  }) : days;
  const completed = days.filter(day => day.percent >= completionThreshold).length;
  const minutes = Math.round(days.reduce((sum, day) => sum + day.minutes, 0));
  return <main className="sadhana-page sadhana-inner-page">
    <SadhanaHeading title="My Progress" subtitle="A little devotion, day after day." onBack={onBack}/>
    <div className="sadhana-segments" aria-label="Progress period">{(['Weekly','Monthly','Yearly'] as const).map(value => <button key={value} aria-pressed={period === value} onClick={() => setPeriod(value)}>{value}</button>)}</div>
    <section className="sadhana-panel sadhana-chart-card"><span className="sadhana-eyebrow">YOUR PRACTICE, OVER TIME</span><h2>Daily completion</h2><p>{start} — {today}</p>
      {loading ? <p className="sadhana-chart-empty" role="status">Gathering your practice history…</p> : error ? <div className="sadhana-notice" role="alert">{error}<button onClick={() => setRevision(v => v + 1)}>Retry</button></div> : records ? <>
      <svg className="sadhana-chart" viewBox="0 0 340 190" role="img" aria-label={`${period} recorded meditation and Japa completion. Values are available in the daily records below.`}>
        {[0,50,100].map(n => <g key={n}><line x1="30" x2="334" y1={155-n*1.2} y2={155-n*1.2} stroke="#c4a15a22"/><text x="2" y={159-n*1.2}>{n}%</text></g>)}
        <line x1="30" x2="334" y1={155-completionThreshold*1.2} y2={155-completionThreshold*1.2} stroke="#d3ae7366" strokeDasharray="3 4"/>
        {chart.map((day,i) => { const width=298/chart.length, x=33+i*width; return <g key={day.date}><rect x={x} y={155-day.percent*1.2} width={Math.max(3,width-4)} height={Math.max(day.percent ? 2 : 0,day.percent*1.2)} rx="2" fill="#d6b174"/><title>{day.date}: {Math.round(day.percent)}%</title>{(chart.length <= 12 || i%5===0) && <text x={x+width/2-2} y="176" textAnchor="middle">{period==='Weekly' ? new Date(day.date+'T12:00:00').toLocaleDateString('en',{weekday:'short'}).slice(0,1) : day.date.slice(5)}</text>}</g>; })}
      </svg>{!minutes && <p className="sadhana-footnote">No completed sessions in the selected period.</p>}</> : <p className="sadhana-chart-empty">Sign in to view your saved history.</p>}
      <p className="sadhana-footnote">Saved Meditation and Japa sessions only. Mantra, journal and reading history are not linked to this progress record. {period==='Yearly' ? 'Yearly bars show average completion in twelve equal periods.' : 'The dotted line marks the 60% daily threshold.'}</p>
    </section>
    <div className="sadhana-metrics">{[
      ['Completed days',records ? completed : '—'], ['Practice minutes',records ? minutes : '—'],
      ['Current streak',currentStreak(overview.progress) ?? '—'], ['XP in this period','—'],
    ].map(([label,value]) => <article className="sadhana-panel" key={label}><span>{label}</span><strong>{loading && label!=='Current streak' ? '—' : value}</strong></article>)}</div>
    <p className="sadhana-footnote">XP by period and previous-period comparisons are unavailable in the existing history API. Completed days shown here are those confirmed by the available sessions.</p>
    {records && <details className="sadhana-chart-table"><summary>View daily records</summary><table><thead><tr><th>Date</th><th>Completion</th><th>Minutes</th></tr></thead><tbody>{days.map(day => <tr key={day.date}><td>{day.date}</td><td>{day.percent}%</td><td>{Math.round(day.minutes)}</td></tr>)}</tbody></table></details>}
    <p className="sadhana-closing">Growth is found in returning.</p>
  </main>;
};
